import { Router } from 'express';
import { verifyJWTToken, isAdmin } from '../middlewares/auth.middleware.js';
import {
    getMyCertificates,
    verifyCertificate,
    downloadCertificate,
    getAdminCertificates,
    getCertificateStats,
    revokeCertificate,
    restoreCertificate,
    deleteCertificate,
    regenerateCertificate,
    processWebinarCompletions,
    getCourseCertificates,
    getWebinarCertificates,
    // Template management
    getTemplates,
    getTemplateByType,
    upsertTemplate,
    updateTemplateImages,
    deleteTemplate,
    // Manual generation
    getEligibleItems,
    searchUsersForCertificate,
    generateManualCertificate,
    adminGenerateCertificateForUser,
} from '../controllers/certificate.controller.js';

const router = Router();

// Public routes
router.get('/verify/:certificateNo', verifyCertificate);

// User routes (authenticated)
router.get('/my', verifyJWTToken, getMyCertificates);
router.get('/download/:id', verifyJWTToken, downloadCertificate);

// Admin: Certificate management
router.get('/admin', verifyJWTToken, isAdmin, getAdminCertificates);
router.get('/admin/stats', verifyJWTToken, isAdmin, getCertificateStats);
router.get('/admin/course/:courseId', verifyJWTToken, isAdmin, getCourseCertificates);
router.get('/admin/webinar/:webinarId', verifyJWTToken, isAdmin, getWebinarCertificates);
router.patch('/admin/:id/revoke', verifyJWTToken, isAdmin, revokeCertificate);
router.patch('/admin/:id/restore', verifyJWTToken, isAdmin, restoreCertificate);
router.delete('/admin/:id', verifyJWTToken, isAdmin, deleteCertificate);
router.post('/admin/:id/regenerate', verifyJWTToken, isAdmin, regenerateCertificate);
router.post('/admin/process-webinars', verifyJWTToken, isAdmin, processWebinarCompletions);
router.post('/admin/process-webinars/:webinarId', verifyJWTToken, isAdmin, processWebinarCompletions);

// Admin: Template management
router.get('/admin/templates', verifyJWTToken, isAdmin, getTemplates);
router.get('/admin/templates/:type', verifyJWTToken, isAdmin, getTemplateByType);
router.post('/admin/templates', verifyJWTToken, isAdmin, upsertTemplate);
router.patch('/admin/templates/:type/images', verifyJWTToken, isAdmin, updateTemplateImages);
router.delete('/admin/templates/:type', verifyJWTToken, isAdmin, deleteTemplate);

// Admin: Manual generation
router.get('/admin/eligible-items', verifyJWTToken, isAdmin, getEligibleItems);
router.get('/admin/search-users', verifyJWTToken, isAdmin, searchUsersForCertificate);
router.post('/admin/generate-manual', verifyJWTToken, isAdmin, generateManualCertificate);
router.post('/admin/generate-for-user', verifyJWTToken, isAdmin, adminGenerateCertificateForUser);

export default router;
