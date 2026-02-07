import { prisma } from "../config/db.js";

// ==================== PUBLIC ====================

// Get all active trainings (Public)
export const getAllTrainings = async (req, res) => {
    try {
        const trainings = await prisma.corporateTraining.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
        res.status(200).json({ success: true, data: { trainings } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get training by slug (Public)
export const getTrainingBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const training = await prisma.corporateTraining.findUnique({
            where: { slug, isActive: true },
        });

        if (!training) {
            return res.status(404).json({ success: false, message: 'Training program not found' });
        }

        res.status(200).json({ success: true, data: { training } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Submit inquiry (Public)
export const createInquiry = async (req, res) => {
    try {
        const { name, email, phone, companyName, message, trainingId } = req.body;

        // Validate
        if (!name || !email || !phone) {
            return res.status(400).json({ success: false, message: 'Name, email and phone are required' });
        }

        const inquiry = await prisma.corporateTrainingInquiry.create({
            data: {
                name,
                email,
                phone,
                companyName,
                message,
                trainingId: trainingId || null,
            },
        });

        // TODO: Send email notification to admin

        res.status(201).json({ success: true, message: 'Inquiry submitted successfully', data: { inquiry } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== ADMIN ====================

// Get all trainings (Admin)
export const getAdminTrainings = async (req, res) => {
    try {
        const trainings = await prisma.corporateTraining.findMany({
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: {
                    select: { inquiries: true }
                }
            }
        });
        res.status(200).json({ success: true, data: { trainings } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get training by ID (Admin)
export const getAdminTrainingById = async (req, res) => {
    try {
        const { id } = req.params;
        const training = await prisma.corporateTraining.findUnique({
            where: { id },
        });

        if (!training) {
            return res.status(404).json({ success: false, message: 'Training not found' });
        }

        res.status(200).json({ success: true, data: { training } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create training (Admin)
export const createTraining = async (req, res) => {
    try {
        const { title, slug, description, image, curriculum, features, duration, mode, price, isActive, sortOrder } = req.body;

        // Validation
        if (!title || !slug || !description) {
            return res.status(400).json({ success: false, message: 'Title, slug and description are required' });
        }

        // Check slug uniqueness
        const existing = await prisma.corporateTraining.findUnique({ where: { slug } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Slug already exists' });
        }

        const training = await prisma.corporateTraining.create({
            data: {
                title,
                slug,
                description,
                image,
                curriculum: curriculum || [],
                features: features || [],
                duration,
                mode,
                price: price ? parseFloat(price) : null,
                isActive: isActive !== undefined ? isActive : true,
                sortOrder: sortOrder ? parseInt(sortOrder) : 0,
            },
        });

        res.status(201).json({ success: true, message: 'Training program created', data: { training } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update training (Admin)
export const updateTraining = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, description, image, curriculum, features, duration, mode, price, isActive, sortOrder } = req.body;

        // Check if exists
        const existing = await prisma.corporateTraining.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Training not found' });
        }

        // Check slug uniqueness if changed
        if (slug && slug !== existing.slug) {
            const slugCheck = await prisma.corporateTraining.findUnique({ where: { slug } });
            if (slugCheck) {
                return res.status(400).json({ success: false, message: 'Slug already exists' });
            }
        }

        const training = await prisma.corporateTraining.update({
            where: { id },
            data: {
                title,
                slug,
                description,
                image,
                curriculum,
                features,
                duration,
                mode,
                price: price !== undefined ? (price ? parseFloat(price) : null) : undefined,
                isActive,
                sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
            },
        });

        res.status(200).json({ success: true, message: 'Training updated', data: { training } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete training (Admin)
export const deleteTraining = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.corporateTraining.delete({ where: { id } });
        res.status(200).json({ success: true, message: 'Training deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle active status (Admin)
export const toggleActive = async (req, res) => {
    try {
        const { id } = req.params;
        const training = await prisma.corporateTraining.findUnique({ where: { id } });

        if (!training) return res.status(404).json({ success: false, message: 'Training not found' });

        const updated = await prisma.corporateTraining.update({
            where: { id },
            data: { isActive: !training.isActive }
        });

        res.status(200).json({ success: true, message: 'Status updated', data: { training: updated } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get inquiries (Admin)
export const getInquiries = async (req, res) => {
    try {
        const { status, trainingId } = req.query;

        const where = {};
        if (status && status !== 'all') where.status = status;
        if (trainingId && trainingId !== 'all') where.trainingId = trainingId;

        const inquiries = await prisma.corporateTrainingInquiry.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                training: {
                    select: { title: true }
                }
            }
        });

        res.status(200).json({ success: true, data: { inquiries } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update inquiry status (Admin)
export const updateInquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const inquiry = await prisma.corporateTrainingInquiry.update({
            where: { id },
            data: { status }
        });

        res.status(200).json({ success: true, message: 'Status updated', data: { inquiry } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
