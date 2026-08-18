import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client, Pool } = pg;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

export async function initializeDatabase() {
  console.log('Connecting to PostgreSQL to check database...');
  
  // Connect to default 'postgres' database first to check/create the target database
  const client = new Client({
    ...dbConfig,
    database: 'postgres'
  });

  try {
    await client.connect();
    
    const dbName = process.env.DB_NAME || 'school_manager';
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      // CREATE DATABASE cannot run inside a transaction block, using simple client query
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error('Error checking/creating database:', error.message);
    throw error;
  } finally {
    await client.end();
  }

  // Now connect to the school_manager database and create tables
  const pool = new Pool({
    ...dbConfig,
    database: process.env.DB_NAME || 'school_manager'
  });

  try {
    console.log('Creating tables if they do not exist...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        class_name VARCHAR(50) NOT NULL,
        roll_number VARCHAR(50) UNIQUE NOT NULL,
        date_of_birth DATE NOT NULL,
        gender VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tables verified/created successfully.');

    // Seed sample data if empty
    const countRes = await pool.query('SELECT COUNT(*) FROM students');
    const count = parseInt(countRes.rows[0].count);
    
    if (count === 0) {
      console.log('Seeding sample student data...');
      const sampleStudents = [
        ['Alice', 'Smith', 'alice.smith@example.com', '555-0101', 'Grade 10-A', 'A001', '2010-05-14', 'Female'],
        ['Bob', 'Johnson', 'bob.johnson@example.com', '555-0102', 'Grade 10-B', 'B002', '2010-09-22', 'Male'],
        ['Charlie', 'Williams', 'charlie.williams@example.com', '555-0103', 'Grade 11-A', 'C003', '2009-02-10', 'Male'],
        ['Diana', 'Brown', 'diana.brown@example.com', '555-0104', 'Grade 9-A', 'D004', '2011-11-30', 'Female'],
        ['Ethan', 'Davis', 'ethan.davis@example.com', '555-0105', 'Grade 12-A', 'E005', '2008-07-04', 'Male'],
        ['Fiona', 'Miller', 'fiona.miller@example.com', '555-0106', 'Grade 10-A', 'F006', '2010-03-18', 'Female'],
        ['George', 'Wilson', 'george.wilson@example.com', '555-0107', 'Grade 11-B', 'G007', '2009-12-05', 'Male'],
        ['Hannah', 'Moore', 'hannah.moore@example.com', '555-0108', 'Grade 9-B', 'H008', '2011-06-25', 'Female']
      ];

      for (const student of sampleStudents) {
        await pool.query(
          `INSERT INTO students (first_name, last_name, email, phone, class_name, roll_number, date_of_birth, gender)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          student
        );
      }
      console.log('Sample data seeded successfully.');
    }
  } catch (error) {
    console.error('Error during table setup or seeding:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}
