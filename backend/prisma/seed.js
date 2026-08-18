import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
import dotenv from 'dotenv';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Delete existing data
  await prisma.activityLog.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.visitor.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.admin.deleteMany({});

  // Create default Admin
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.create({
    data: {
      name: 'School Principal',
      email: 'admin@school.com',
      passwordHash,
      phone: '+919876543210',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      schoolName: 'Greenwood High School',
      schoolAddress: '123 Education Lane, School Ville',
      schoolPhone: '+91 80 1234 5678',
      signatoryName: 'Dr. Jane Doe, Principal'
    }
  });
  console.log('✅ Default admin account created: admin@school.com / admin123');

  // Seed 2 sample students under this admin
  const dob1 = new Date('2010-05-14');
  const dob2 = new Date('2011-11-30');

  const student1 = await prisma.student.create({
    data: {
      adminId: admin.id,
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice.smith@example.com',
      phone: '555-0101',
      dateOfBirth: dob1,
      gender: 'Female',
      rollNumber: 'A001',
      className: 'Grade 10-A',
      parentName: 'Robert Smith',
      parentPhone: '555-0199',
      address: '456 Maple St'
    }
  });

  const student2 = await prisma.student.create({
    data: {
      adminId: admin.id,
      firstName: 'Diana',
      lastName: 'Brown',
      email: 'diana.brown@example.com',
      phone: '555-0104',
      dateOfBirth: dob2,
      gender: 'Female',
      rollNumber: 'D004',
      className: 'Grade 9-A',
      parentName: 'Linda Brown',
      parentPhone: '555-0299',
      address: '789 Oak Ave'
    }
  });
  console.log('✅ Seeded 2 sample students: Alice Smith and Diana Brown');

  // Seed sample notices
  await prisma.notice.create({
    data: {
      title: 'School Reopening & Timing Adjustments',
      content: 'The school will resume classes from next Monday. Timings have been adjusted to 8:30 AM - 2:30 PM due to seasonal changes.',
      category: 'General',
      pinned: true,
      createdBy: admin.id
    }
  });

  console.log('🌱 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
