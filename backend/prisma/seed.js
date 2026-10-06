/**
 * Creates (or recreates) a demo account with sample projects and tasks.
 * Test data only. Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const DEMO_USER = {
  fullName: 'Demo User',
  email: 'demo@orbit.test',
  password: 'DemoPass123',
};

const prisma = new PrismaClient();

function daysFromToday(days) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

const projects = [
  {
    name: 'Website Redesign',
    description: 'Refresh the marketing site with the new brand system.',
    status: 'IN_PROGRESS',
    startDate: daysFromToday(-14),
    endDate: daysFromToday(30),
    tasks: [
      { name: 'Audit current pages', priority: 'HIGH', status: 'COMPLETED', dueDate: daysFromToday(-10) },
      { name: 'Design new homepage', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: daysFromToday(3) },
      { name: 'Write product copy', priority: 'MEDIUM', status: 'PENDING', dueDate: daysFromToday(7) },
      { name: 'Set up analytics events', priority: 'LOW', status: 'PENDING', dueDate: daysFromToday(12) },
    ],
  },
  {
    name: 'Mobile App Launch',
    description: 'Prepare the Android release and the first beta cohort.',
    status: 'IN_PROGRESS',
    startDate: daysFromToday(-7),
    endDate: daysFromToday(45),
    tasks: [
      { name: 'Finalize onboarding flow', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: daysFromToday(2) },
      { name: 'Prepare Play Store listing', priority: 'MEDIUM', status: 'PENDING', dueDate: daysFromToday(10) },
      { name: 'Run beta with 20 testers', priority: 'HIGH', status: 'PENDING', dueDate: daysFromToday(18) },
      { name: 'Set up crash reporting', priority: 'MEDIUM', status: 'COMPLETED', dueDate: daysFromToday(-2) },
    ],
  },
  {
    name: 'Q4 Planning',
    description: 'Agree on goals and staffing for next quarter.',
    status: 'NOT_STARTED',
    startDate: daysFromToday(5),
    endDate: daysFromToday(20),
    tasks: [{ name: 'Collect team goals', priority: 'MEDIUM', status: 'PENDING', dueDate: daysFromToday(6) }],
  },
  {
    name: 'API Hardening',
    description: 'Security review follow-ups for the public API.',
    status: 'COMPLETED',
    startDate: daysFromToday(-40),
    endDate: daysFromToday(-5),
    tasks: [
      { name: 'Add rate limiting', priority: 'HIGH', status: 'COMPLETED', dueDate: daysFromToday(-20) },
      { name: 'Fix pen-test findings', priority: 'HIGH', status: 'COMPLETED', dueDate: daysFromToday(-8) },
    ],
  },
];

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO_USER.email } });

  const user = await prisma.user.create({
    data: {
      fullName: DEMO_USER.fullName,
      email: DEMO_USER.email,
      passwordHash: await bcrypt.hash(DEMO_USER.password, 12),
    },
  });

  for (const { tasks, ...project } of projects) {
    const created = await prisma.project.create({ data: { ...project, userId: user.id } });
    await prisma.task.createMany({
      data: tasks.map((task) => ({ ...task, projectId: created.id, userId: user.id })),
    });
  }

  console.log(`Seeded ${projects.length} projects for ${DEMO_USER.email} (password: ${DEMO_USER.password})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
