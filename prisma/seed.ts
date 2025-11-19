import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create password hash for all users (123456)
  const passwordHash = await bcrypt.hash('123456', 12);

  // Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@tecnobrain-dental.com' },
    update: {},
    create: {
      email: 'admin@tecnobrain-dental.com',
      name: 'Admin User',
      passwordHash: passwordHash,
      userType: 'ADMIN',
    },
  });
  console.log('✅ Created Admin User');

  // Create Clinic User
  const clinicUser = await prisma.user.upsert({
    where: { email: 'mfmujic@gmail.com' },
    update: {},
    create: {
      email: 'clinic@tecnobrain-dental.com',
      name: 'Marcelo Mujica',
      passwordHash: passwordHash,
      userType: 'CLINIC',
    },
  });
  console.log('✅ Created Clinic User');

  // Create Sample Patients
  const patient1 = await prisma.user.upsert({
    where: { email: 'alexanderaltuna2689@gmail.com' },
    update: {},
    create: {
      email: 'patient1@example.com',
      name: 'Anthony Altuna',
      passwordHash: passwordHash,
      userType: 'PATIENT',
      clinicId: clinicUser.id,
    },
  });
  console.log('✅ Created Patient: Anthony Altuna');

  const patient2 = await prisma.user.upsert({
    where: { email: 'patient2@example.com' },
    update: {},
    create: {
      email: 'patient2@example.com',
      name: 'Michael Brown',
      passwordHash: passwordHash,
      userType: 'PATIENT',
      clinicId: clinicUser.id,
    },
  });
  console.log('✅ Created Patient: Michael Brown');

  const patient3 = await prisma.user.upsert({
    where: { email: 'patient3@example.com' },
    update: {},
    create: {
      email: 'patient3@example.com',
      name: 'Emma Wilson',
      passwordHash: passwordHash,
      userType: 'PATIENT',
      clinicId: clinicUser.id,
    },
  });
  console.log('✅ Created Patient: Emma Wilson');

  // Create Sample Visits
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const visit1 = await prisma.visit.create({
    data: {
      title: 'Sarah Johnson - Limpieza',
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hour later
      type: 'LIMPIEZA',
      status: 'PROGRAMADA',
      notes: 'Regular cleaning appointment',
      patientId: patient1.id,
      clinicId: clinicUser.id,
    },
  });
  console.log('✅ Created Visit: Sarah Johnson - Limpieza');

  const visit2 = await prisma.visit.create({
    data: {
      title: 'Michael Brown - Consulta',
      startTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      endTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
      type: 'CONSULTA',
      status: 'PROGRAMADA',
      notes: 'Initial consultation for tooth pain',
      patientId: patient2.id,
      clinicId: clinicUser.id,
    },
  });
  console.log('✅ Created Visit: Michael Brown - Consulta');

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(10, 0, 0, 0);

  const visit3 = await prisma.visit.create({
    data: {
      title: 'Emma Wilson - Empaste',
      startTime: nextWeek,
      endTime: new Date(nextWeek.getTime() + 90 * 60 * 1000), // 1.5 hours later
      type: 'EMPASTE',
      status: 'PROGRAMADA',
      notes: 'Filling procedure for cavity',
      patientId: patient3.id,
      clinicId: clinicUser.id,
    },
  });
  console.log('✅ Created Visit: Emma Wilson - Empaste');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📊 Seeded Data Summary:');
  console.log('👥 Users: 5 (1 Admin, 1 Clinic, 3 Patients)');
  console.log('🏥 Visits: 3 (sample appointments)');
  console.log('\n🔑 Login Credentials:');
  console.log('Admin: admin@tecnobrain-dental.com / 123456');
  console.log('Clinic: clinic@tecnobrain-dental.com / 123456');
  console.log('Patient 1: patient1@example.com / 123456');
  console.log('Patient 2: patient2@example.com / 123456');
  console.log('Patient 3: patient3@example.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
