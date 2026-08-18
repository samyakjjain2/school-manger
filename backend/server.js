import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import { initializeDatabase } from './initDb.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database on Startup
try {
  await initializeDatabase();
  console.log('Database initialization completed.');
} catch (error) {
  console.error('CRITICAL: Failed to initialize database on startup:', error.message);
}

// REST Endpoints

// 1. Get all students with search & filter
app.get('/api/students', async (req, res) => {
  const { search, gender, className } = req.query;
  try {
    let query = 'SELECT * FROM students';
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length} OR roll_number ILIKE $${params.length})`);
    }

    if (gender) {
      params.push(gender);
      conditions.push(`gender = $${params.length}`);
    }

    if (className) {
      params.push(className);
      conditions.push(`class_name = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error.message);
    res.status(500).json({ error: 'Server error fetching students' });
  }
});

// 2. Add a new student
app.post('/api/students', async (req, res) => {
  const { first_name, last_name, email, phone, class_name, roll_number, date_of_birth, gender } = req.body;

  // Basic validation
  if (!first_name || !last_name || !email || !phone || !class_name || !roll_number || !date_of_birth || !gender) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if email or roll number already exists
    const duplicateCheck = await pool.query(
      'SELECT id, email, roll_number FROM students WHERE email = $1 OR roll_number = $2',
      [email, roll_number]
    );

    if (duplicateCheck.rowCount > 0) {
      const existing = duplicateCheck.rows[0];
      if (existing.email.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({ error: 'A student with this email address already exists' });
      }
      if (existing.roll_number.toLowerCase() === roll_number.toLowerCase()) {
        return res.status(400).json({ error: 'A student with this roll number already exists' });
      }
    }

    const query = `
      INSERT INTO students (first_name, last_name, email, phone, class_name, roll_number, date_of_birth, gender)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await pool.query(query, [
      first_name,
      last_name,
      email,
      phone,
      class_name,
      roll_number,
      date_of_birth,
      gender
    ]);

    res.status(201).json({
      message: 'Student successfully registered',
      student: result.rows[0]
    });
  } catch (error) {
    console.error('Error inserting student:', error.message);
    res.status(500).json({ error: 'Server error saving student details' });
  }
});

// 3. Delete a student
app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student successfully deleted', student: result.rows[0] });
  } catch (error) {
    console.error('Error deleting student:', error.message);
    res.status(500).json({ error: 'Server error deleting student' });
  }
});

// 4. Get stats for dashboard
app.get('/api/stats', async (req, res) => {
  try {
    // Total students
    const totalStudentsRes = await pool.query('SELECT COUNT(*) FROM students');
    const totalStudents = parseInt(totalStudentsRes.rows[0].count);

    // Gender breakdown
    const genderBreakdownRes = await pool.query('SELECT gender, COUNT(*) as count FROM students GROUP BY gender');
    const genderBreakdown = genderBreakdownRes.rows.reduce((acc, curr) => {
      acc[curr.gender.toLowerCase()] = parseInt(curr.count);
      return acc;
    }, { male: 0, female: 0, other: 0 });

    // Class distribution
    const classDistributionRes = await pool.query('SELECT class_name, COUNT(*) as count FROM students GROUP BY class_name ORDER BY count DESC LIMIT 5');
    const classDistribution = classDistributionRes.rows.map(row => ({
      className: row.class_name,
      count: parseInt(row.count)
    }));

    // Recent activity (last 5 added students)
    const recentStudentsRes = await pool.query('SELECT id, first_name, last_name, class_name, created_at FROM students ORDER BY created_at DESC LIMIT 5');
    const recentStudents = recentStudentsRes.rows;

    res.json({
      totalStudents,
      genderBreakdown,
      classDistribution,
      recentStudents
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error.message);
    res.status(500).json({ error: 'Server error fetching statistics' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
