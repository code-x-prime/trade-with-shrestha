import { PrismaClient } from '@prisma/client';
import { generateSlug } from './slugGenerator.js';

const prisma = new PrismaClient();

const defaultCategories = [
    'Stock Market',
    'Forex',
    'Option Trading',
    'Technical Analysis',
    'Trading Strategies',
    'Stock Market Investing',
    'Fundamental Analysis',
    'Risk Management',
    'Day Trading',
    'Swing Trading',
];

async function seedCategories() {
    try {
        console.log('Seeding default categories...');

        for (const categoryName of defaultCategories) {
            const slug = generateSlug(categoryName);

            // Check if category already exists
            const existing = await prisma.courseCategory.findUnique({
                where: { slug },
            });

            if (!existing) {
                await prisma.courseCategory.create({
                    data: {
                        name: categoryName,
                        slug,
                        isDefault: true,
                        isActive: true,
                    },
                });
                console.log(`✓ Created category: ${categoryName}`);
            } else {
                console.log(`- Category already exists: ${categoryName}`);
            }
        }

        console.log('Categories seeded successfully!');
    } catch (error) {
        console.error('Error seeding categories:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedCategories();

