import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
    {
        name: 'Python',
        slug: 'python',
        description: 'Python programming language interview questions',
        icon: 'Code',
        sortOrder: 1,
        isActive: true,
    },
    {
        name: 'Java',
        slug: 'java',
        description: 'Java programming language interview questions',
        icon: 'Code',
        sortOrder: 2,
        isActive: true,
    },
    {
        name: 'JavaScript',
        slug: 'javascript',
        description: 'JavaScript programming language interview questions',
        icon: 'Code',
        sortOrder: 3,
        isActive: true,
    },
    {
        name: 'DevOps',
        slug: 'devops',
        description: 'DevOps and CI/CD interview questions',
        icon: 'GitBranch',
        sortOrder: 4,
        isActive: true,
    },
    {
        name: 'Database',
        slug: 'database',
        description: 'SQL, NoSQL and database interview questions',
        icon: 'Database',
        sortOrder: 5,
        isActive: true,
    },
    {
        name: 'AWS',
        slug: 'aws',
        description: 'Amazon Web Services interview questions',
        icon: 'Cloud',
        sortOrder: 6,
        isActive: true,
    },
    {
        name: 'UI/UX',
        slug: 'ui-ux',
        description: 'UI/UX design and frontend interview questions',
        icon: 'Layout',
        sortOrder: 7,
        isActive: true,
    },
    {
        name: 'HR',
        slug: 'hr',
        description: 'HR and behavioral interview questions',
        icon: 'Users',
        sortOrder: 8,
        isActive: true,
    },
];

async function seedInterviewCategories() {
    console.log('🌱 Seeding interview categories...');

    for (const category of defaultCategories) {
        const existing = await prisma.interviewCategory.findUnique({
            where: { slug: category.slug },
        });

        if (!existing) {
            await prisma.interviewCategory.create({
                data: category,
            });
            console.log(`✅ Created category: ${category.name}`);
        } else {
            console.log(`⏭️  Category already exists: ${category.name}`);
        }
    }

    console.log('✅ Interview categories seeded successfully!');
}

seedInterviewCategories()
    .catch((e) => {
        console.error('❌ Error seeding interview categories:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
