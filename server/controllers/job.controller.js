import { ApiError } from '../utils/ApiError.js';
import { ApiResponsive } from '../utils/ApiResponsive.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadToR2, deleteFromR2 } from '../utils/cloudflare.js';
import { generateSlug } from '../utils/slugGenerator.js';
import { getPublicUrl } from '../utils/cloudflare.js';
import { prisma } from '../config/db.js';

/**
 * Create a new job
 */
export const createJob = asyncHandler(async (req, res) => {
    const {
        title,
        slug,
        companyName,
        description,
        requirements,
        location,
        salary,
        type,
        experience,
        skills,
        applyLink,
        allowsQuickApply,
        companyLogo: companyLogoFromBody
    } = req.body;

    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!title || !description) {
        throw new ApiError(400, 'Title and description are required');
    }

    // Handle company logo upload
    let companyLogoUrl = null;
    if (req.files?.companyLogo?.[0]) {
        const file = req.files.companyLogo[0];
        companyLogoUrl = await uploadToR2(file, 'jobs/logos');
    } else if (companyLogoFromBody) {
        try {
            const url = new URL(companyLogoFromBody);
            companyLogoUrl = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            companyLogoUrl = companyLogoFromBody.startsWith('/') ? companyLogoFromBody.slice(1) : companyLogoFromBody;
        }
    }

    // Generate slug
    const finalSlug = slug || generateSlug(title);

    // Check slug uniqueness
    const existingJob = await prisma.job.findUnique({ where: { slug: finalSlug } });
    if (existingJob) {
        throw new ApiError(400, 'Slug already exists');
    }

    // Prepare data
    const jobData = {
        title,
        slug: finalSlug,
        companyName: companyName || (isAdmin ? 'Admin' : req.user?.name), // Default to user name if not provided
        companyLogo: companyLogoUrl,
        description,
        requirements,
        location,
        salary,
        experience,
        applyLink,
        allowsQuickApply: allowsQuickApply === 'true' || allowsQuickApply === true,
        authorId: userId,
        // Admin posts are immediately published and verified
        status: isAdmin ? 'PUBLISHED' : 'PENDING',
        isVerified: isAdmin ? true : false,
        postedAt: isAdmin ? new Date() : null,
    };

    // Handle Enums and Arrays
    if (type) {
        if (Array.isArray(type)) jobData.type = type;
        else if (typeof type === 'string') {
            try { jobData.type = JSON.parse(type); } catch { jobData.type = [type]; }
        }
    }

    if (skills) {
        if (Array.isArray(skills)) jobData.skills = skills;
        else if (typeof skills === 'string') {
            try { jobData.skills = JSON.parse(skills); } catch { jobData.skills = skills.split(',').map(s => s.trim()); }
        }
    }

    const job = await prisma.job.create({ data: jobData });

    return res.status(201).json(
        new ApiResponsive(201, { job: { ...job, companyLogoUrl: job.companyLogo ? getPublicUrl(job.companyLogo) : null } }, 'Job created successfully')
    );
});

/**
 * Get all public jobs (Verified & Published)
 */
export const getJobs = asyncHandler(async (req, res) => {
    const { search, type, location, experience, limit = 10, page = 1 } = req.query;

    const where = {
        status: 'PUBLISHED',
        isVerified: true
    };

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { skills: { has: search } } // Simple check if skills array has exact match, might need adjustment
        ];
    }

    if (location) {
        where.location = { contains: location, mode: 'insensitive' };
    }

    if (experience) {
        where.experience = { contains: experience, mode: 'insensitive' };
    }

    if (type) {
        // type is an array in DB. If query is 'REMOTE', we want jobs where type contains 'REMOTE'
        // Prisma 'has' works for single value check in array
        where.type = { has: type };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
        prisma.job.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { postedAt: 'desc' },
            include: { user: { select: { name: true, email: true } } }
        }),
        prisma.job.count({ where })
    ]);

    const jobsWithUrls = jobs.map(job => ({
        ...job,
        companyLogoUrl: job.companyLogo ? getPublicUrl(job.companyLogo) : null
    }));

    return res.status(200).json(
        new ApiResponsive(200, {
            jobs: jobsWithUrls,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        }, 'Jobs fetched successfully')
    );
});

/**
 * Get Job by Slug
 */
export const getJobBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const job = await prisma.job.findUnique({
        where: { slug }
    });

    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    // If not published/verified, only allow Admin or Author
    if ((job.status !== 'PUBLISHED' || !job.isVerified)) {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'ADMIN';
        if (!userId || (!isAdmin && job.authorId !== userId)) {
            throw new ApiError(404, 'Job not found or under review');
        }
    }

    return res.status(200).json(
        new ApiResponsive(200, { job: { ...job, companyLogoUrl: job.companyLogo ? getPublicUrl(job.companyLogo) : null } }, 'Job fetched successfully')
    );
});

/**
 * Update Job
 */
export const updateJob = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        title, slug, companyName, description, requirements, location, salary,
        type, experience, skills, applyLink, allowsQuickApply, status, isVerified,
        removeCompanyLogo, companyLogo: companyLogoFromBody
    } = req.body;

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) throw new ApiError(404, 'Job not found');

    const isAdmin = req.user?.role === 'ADMIN';
    const isAuthor = job.authorId === req.user?.id;

    if (!isAdmin && !isAuthor) {
        throw new ApiError(403, 'Not authorized to update this job');
    }

    // Start preparing update data
    const updateData = {};

    if (title) updateData.title = title;
    if (slug && slug !== job.slug) {
        // Check uniqueness
        const exists = await prisma.job.findUnique({ where: { slug } });
        if (exists) throw new ApiError(400, 'Slug already exists');
        updateData.slug = slug;
    }
    if (companyName) updateData.companyName = companyName;
    if (description) updateData.description = description;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (location !== undefined) updateData.location = location;
    if (salary !== undefined) updateData.salary = salary;
    if (experience !== undefined) updateData.experience = experience;
    if (applyLink !== undefined) updateData.applyLink = applyLink;
    if (allowsQuickApply !== undefined) updateData.allowsQuickApply = allowsQuickApply === 'true' || allowsQuickApply === true;

    // Type and Skills logic
    if (type) {
        if (Array.isArray(type)) updateData.type = type;
        else if (typeof type === 'string') {
            try { updateData.type = JSON.parse(type); } catch { updateData.type = [type]; }
        }
    }
    if (skills) {
        if (Array.isArray(skills)) updateData.skills = skills;
        else if (typeof skills === 'string') {
            try { updateData.skills = JSON.parse(skills); } catch { updateData.skills = skills.split(',').map(s => s.trim()); }
        }
    }

    // Role specific updates
    if (isAdmin) {
        // Admin can update status and verification
        if (status) updateData.status = status;
        if (isVerified !== undefined) updateData.isVerified = isVerified === 'true' || isVerified === true;

        // If becoming verified/published and wasn't before, set postedAt
        if (updateData.status === 'PUBLISHED' && updateData.isVerified && !job.postedAt) {
            updateData.postedAt = new Date();
        }
    } else {
        // If User updates, reset verification? 
        // Typically if a user edits a live job, it might need re-verification.
        // For now, let's keep it simple: Users can't change status directly, but if they edit critical fields, maybe we should set to PENDING?
        // Let's set to PENDING if user edits.
        if (job.status === 'PUBLISHED') {
            updateData.status = 'PENDING';
            updateData.isVerified = false;
        }
    }

    // Image handling
    let companyLogoUrl = job.companyLogo;
    if (req.files?.companyLogo?.[0]) {
        const file = req.files.companyLogo[0];
        companyLogoUrl = await uploadToR2(file, 'jobs/logos');
        updateData.companyLogo = companyLogoUrl;
    } else if (companyLogoFromBody) {
        try {
            const url = new URL(companyLogoFromBody);
            updateData.companyLogo = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            updateData.companyLogo = companyLogoFromBody.startsWith('/') ? companyLogoFromBody.slice(1) : companyLogoFromBody;
        }
    } else if (removeCompanyLogo === 'true' || removeCompanyLogo === true) {
        if (job.companyLogo) await deleteFromR2(job.companyLogo);
        updateData.companyLogo = null;
    }

    const updatedJob = await prisma.job.update({
        where: { id },
        data: updateData
    });

    return res.status(200).json(
        new ApiResponsive(200, { job: { ...updatedJob, companyLogoUrl: updatedJob.companyLogo ? getPublicUrl(updatedJob.companyLogo) : null } }, 'Job updated successfully')
    );
});

/**
 * Delete Job
 */
export const deleteJob = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) throw new ApiError(404, 'Job not found');

    const isAdmin = req.user?.role === 'ADMIN';
    const isAuthor = job.authorId === req.user?.id;

    if (!isAdmin && !isAuthor) {
        throw new ApiError(403, 'Not authorized to delete this job');
    }

    if (job.companyLogo) {
        await deleteFromR2(job.companyLogo);
    }

    await prisma.job.delete({ where: { id } });

    return res.status(200).json(
        new ApiResponsive(200, null, 'Job deleted successfully')
    );
});

/**
 * Verify Job (Admin Only)
 */
export const verifyJob = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { verify } = req.body; // true = verify, false = unverify/reject?

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) throw new ApiError(404, 'Job not found');

    const isVerified = verify === true || verify === 'true';

    const updateData = {
        isVerified,
        status: isVerified ? 'PUBLISHED' : 'REJECTED' // Or remain PENDING? Let's say REJECTED if explicit false
    };

    if (isVerified && !job.postedAt) {
        updateData.postedAt = new Date();
    }

    const updatedJob = await prisma.job.update({
        where: { id },
        data: updateData
    });

    return res.status(200).json(
        new ApiResponsive(200, { job: updatedJob }, `Job ${isVerified ? 'verified' : 'rejected'} successfully`)
    );
});

/**
 * Get Admin Jobs (List all with filters)
 */
export const getAdminJobs = asyncHandler(async (req, res) => {
    const { status, search, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status) where.status = status;

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
        ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
        prisma.job.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, email: true } } }
        }),
        prisma.job.count({ where })
    ]);

    const jobsWithUrls = jobs.map(job => ({
        ...job,
        companyLogoUrl: job.companyLogo ? getPublicUrl(job.companyLogo) : null
    }));

    return res.status(200).json(
        new ApiResponsive(200, {
            jobs: jobsWithUrls,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        }, 'Admin jobs fetched successfully')
    );
});
