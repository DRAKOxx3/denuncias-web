import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.timelineEvent.deleteMany();
  await prisma.document.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.case.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'super_admin'
    }
  });

  const caseOne = await prisma.case.create({
    data: {
      caseNumber: 'EXP-2024-0001',
      trackingCode: 'ABC123',
      citizenName: 'Juan Pérez',
      citizenIdNumber: '12345678',
      status: 'En revisión',
      assignedDepartment: 'Fiscalía Local',
      createdByAdminId: admin.id,
      timelineEvents: {
        create: [
          {
            date: new Date('2024-01-05'),
            type: 'CREACIÓN',
            description: 'Denuncia creada'
          },
          {
            date: new Date('2024-01-10'),
            type: 'ACTUALIZACIÓN',
            description: 'Caso asignado a investigador'
          }
        ]
      },
      documents: {
        create: [
          {
            title: 'Constancia inicial',
            type: 'PDF',
            filePath: '/docs/constancia.pdf',
            isPublic: true
          }
        ]
      },
      payments: {
        create: [
          {
            concept: 'Tasa administrativa',
            amount: 50,
            status: 'pendiente',
            dueDate: new Date('2024-02-01')
          }
        ]
      }
    },
    include: { timelineEvents: true }
  });

  await prisma.case.create({
    data: {
      caseNumber: 'EXP-2024-0002',
      trackingCode: 'XYZ789',
      citizenName: 'Maria Gomez',
      citizenIdNumber: '87654321',
      status: 'En investigación',
      assignedDepartment: 'Unidad de Fraude',
      createdByAdminId: admin.id,
      timelineEvents: {
        create: [
          {
            date: new Date('2024-03-01'),
            type: 'CREACIÓN',
            description: 'Denuncia recibida'
          }
        ]
      }
    }
  });

  console.log('Seed data created', { admin: admin.email, caseOne: caseOne.caseNumber });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
