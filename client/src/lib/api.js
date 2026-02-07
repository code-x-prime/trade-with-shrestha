/**
 * API Utility - Centralized API calls
 * All API calls go through this file
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Generic API request handler
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
        ...options,
        headers: {
            ...options.headers,
        },
        credentials: 'include', // Important for cookies
    };

    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!(options.body instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    }

    // Add auth token if available
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            // Create error with response data for better error handling
            const error = new Error(data.message || 'An error occurred');
            error.response = { data, status: response.status };
            throw error;
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ==================== AUTH APIs ====================

export const authAPI = {
    /**
     * Email signup
     */
    signup: async (data) => {
        return apiRequest('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Verify OTP
     */
    verifyOTP: async (data) => {
        return apiRequest('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Login
     */
    login: async (email, password) => {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    /**
     * Google OAuth login
     */
    googleAuth: async (googleData) => {
        return apiRequest('/auth/google', {
            method: 'POST',
            body: JSON.stringify(googleData),
        });
    },

    /**
     * Forgot password
     */
    forgotPassword: async (email) => {
        return apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    /**
     * Reset password
     */
    resetPassword: async (data) => {
        return apiRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Logout
     */
    logout: async () => {
        return apiRequest('/auth/logout', {
            method: 'POST',
        });
    },

    /**
     * Refresh token
     */
    refreshToken: async () => {
        return apiRequest('/auth/refresh-token', {
            method: 'POST',
        });
    },
};

// ==================== USER APIs ====================

export const userAPI = {
    /**
     * Get user profile
     */
    getProfile: async () => {
        return apiRequest('/users/profile', {
            method: 'GET',
        });
    },

    /**
     * Update profile
     */
    updateProfile: async (data) => {
        return apiRequest('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * Upload avatar
     */
    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append('avatar', file);

        const url = `${API_BASE_URL}/users/avatar`;
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
            },
            credentials: 'include',
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }

        return data;
    },

    /**
     * Change password
     */
    changePassword: async (currentPassword, newPassword) => {
        return apiRequest('/users/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    },

    /**
     * Delete account
     */
    deleteAccount: async () => {
        return apiRequest('/users/account', {
            method: 'DELETE',
        });
    },

    /**
     * Get purchase status for multiple items
     * @param {Array} items - Array of { type: 'COURSE'|'BUNDLE'|'WEBINAR'|'MENTORSHIP'|'EBOOK'|'OFFLINE_BATCH'|'INDICATOR', id: string }
     */
    getPurchaseStatus: async (items) => {
        return apiRequest('/users/purchase-status', {
            method: 'POST',
            body: JSON.stringify({ items }),
        });
    },
};

// ==================== UPLOAD APIs ====================

export const uploadAPI = {
    /**
     * Upload file
     */
    uploadFile: async (file, folder = 'uploads') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const url = `${API_BASE_URL}/upload`;
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
            },
            credentials: 'include',
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }

        return data;
    },

    /**
     * Delete file (admin only)
     */
    deleteFile: async (fileUrl) => {
        return apiRequest('/upload', {
            method: 'DELETE',
            body: JSON.stringify({ fileUrl }),
        });
    },

    /**
     * Get signed URL
     */
    getSignedUrl: async (fileUrl, expiresIn = 3600) => {
        return apiRequest(`/upload/signed-url?fileUrl=${encodeURIComponent(fileUrl)}&expiresIn=${expiresIn}`, {
            method: 'GET',
        });
    },
};

// ==================== CONTACT API ====================

export const contactAPI = {
    /**
     * Send contact message
     */
    sendMessage: async (data) => {
        return apiRequest('/contact', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get all contacts (Admin only)
     */
    getContacts: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.status) queryParams.append('status', params.status);

        const queryString = queryParams.toString();
        return apiRequest(`/contact${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Mark as read (Admin only)
     */
    markAsRead: async (id) => {
        return apiRequest(`/contact/${id}/read`, {
            method: 'PATCH',
        });
    },

    /**
     * Delete contact (Admin only)
     */
    deleteContact: async (id) => {
        return apiRequest(`/contact/${id}`, {
            method: 'DELETE',
        });
    },
};

// ==================== ADMIN APIs ====================

export const adminAPI = {
    /**
     * Get all users (Admin only)
     */
    getUsers: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.role) queryParams.append('role', params.role);
        if (params.isVerified !== undefined) queryParams.append('isVerified', params.isVerified);
        if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);

        const queryString = queryParams.toString();
        return apiRequest(`/admin/users${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Update user verification status (Admin only)
     */
    updateUserVerification: async (userId, isVerified) => {
        return apiRequest(`/admin/users/${userId}/verify`, {
            method: 'PATCH',
            body: JSON.stringify({ isVerified }),
        });
    },

    /**
     * Update user active status (Admin only)
     */
    updateUserActiveStatus: async (userId, isActive) => {
        return apiRequest(`/admin/users/${userId}/active`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive }),
        });
    },

    /**
     * Delete user and all related data (Admin only)
     */
    deleteUser: async (userId) => {
        return apiRequest(`/admin/users/${userId}`, {
            method: 'DELETE',
        });
    },

    /**
     * Manual enroll user in a course (Admin only)
     */
    manualEnroll: async (data) => {
        return apiRequest('/courses/admin/manual-enroll', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

// ==================== COUPON APIs ====================

export const couponAPI = {
    /**
     * Validate coupon code (Public)
     */
    validateCoupon: async (code, totalAmount, applicableTo = null) => {
        return apiRequest('/coupons/validate', {
            method: 'POST',
            body: JSON.stringify({ code, totalAmount, applicableTo }),
        });
    },

    /**
     * Get all coupons (Admin only)
     */
    getCoupons: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);

        const queryString = queryParams.toString();
        return apiRequest(`/coupons${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Get coupon by ID (Admin only)
     */
    getCouponById: async (id) => {
        return apiRequest(`/coupons/${id}`, {
            method: 'GET',
        });
    },

    /**
     * Create coupon (Admin only)
     */
    createCoupon: async (data) => {
        return apiRequest('/coupons', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Update coupon (Admin only)
     */
    updateCoupon: async (id, data) => {
        return apiRequest(`/coupons/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    /**
     * Delete coupon (Admin only)
     */
    deleteCoupon: async (id) => {
        return apiRequest(`/coupons/${id}`, {
            method: 'DELETE',
        });
    },

    /**
     * Get coupons ready to show in popup (Public)
     */
    getCouponsReadyToShow: async () => {
        return apiRequest('/coupons/ready-to-show', {
            method: 'GET',
        });
    },
};

// ==================== WEBINAR APIs ====================

export const webinarAPI = {
    /**
     * Get all webinars
     */
    getWebinars: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.type) queryParams.append('type', params.type);
        if (params.isPublished !== undefined) queryParams.append('isPublished', params.isPublished);

        const queryString = queryParams.toString();
        return apiRequest(`/webinars${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Get webinar by ID
     */
    getWebinarById: async (id) => {
        return apiRequest(`/webinars/${id}`, {
            method: 'GET',
        });
    },

    /**
     * Get webinar by slug
     */
    getWebinarBySlug: async (slug) => {
        return apiRequest(`/webinars/slug/${slug}`, {
            method: 'GET',
        });
    },

    /**
     * Create webinar (Admin only)
     */
    createWebinar: async (formData) => {
        return apiRequest('/webinars', {
            method: 'POST',
            body: formData,
        });
    },

    /**
     * Update webinar (Admin only)
     */
    updateWebinar: async (id, formData) => {
        return apiRequest(`/webinars/${id}`, {
            method: 'PATCH',
            body: formData,
        });
    },

    /**
     * Delete webinar (Admin only)
     */
    deleteWebinar: async (id) => {
        return apiRequest(`/webinars/${id}`, {
            method: 'DELETE',
        });
    },

    /**
     * Toggle publish status (Admin only)
     */
    togglePublish: async (id, isPublished) => {
        return apiRequest(`/webinars/${id}/publish`, {
            method: 'PATCH',
            body: JSON.stringify({ isPublished }),
        });
    },

    /**
     * Check enrollment status
     */
    checkEnrollment: async (id) => {
        return apiRequest(`/webinars/${id}/enrollment`, {
            method: 'GET',
        });
    },
};

// ==================== GUIDANCE APIs ====================

export const guidanceAPI = {
    /**
     * Get all guidance
     */
    getGuidance: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.status) queryParams.append('status', params.status);

        const queryString = queryParams.toString();
        return apiRequest(`/guidance${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Get guidance by ID
     */
    getGuidanceById: async (id) => {
        return apiRequest(`/guidance/${id}`, {
            method: 'GET',
        });
    },

    /**
     * Get guidance by slug
     */
    getGuidanceBySlug: async (slug) => {
        return apiRequest(`/guidance/slug/${slug}`, {
            method: 'GET',
        });
    },

    /**
     * Create guidance (Admin only)
     */
    createGuidance: async (formData) => {
        return apiRequest('/guidance', {
            method: 'POST',
            body: formData,
        });
    },

    /**
     * Update guidance (Admin only)
     */
    updateGuidance: async (id, formData) => {
        return apiRequest(`/guidance/${id}`, {
            method: 'PATCH',
            body: formData,
        });
    },

    /**
     * Delete guidance (Admin only)
     */
    deleteGuidance: async (id) => {
        return apiRequest(`/guidance/${id}`, {
            method: 'DELETE',
        });
    },

    /**
     * Toggle guidance status (Admin only)
     */
    toggleStatus: async (id, status) => {
        return apiRequest(`/guidance/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },

    /**
     * Create slot (Admin only)
     */
    createSlot: async (guidanceId, slotData) => {
        return apiRequest(`/guidance/${guidanceId}/slots`, {
            method: 'POST',
            body: JSON.stringify(slotData),
        });
    },

    /**
     * Get slots for guidance (Admin only - all slots)
     */
    getSlots: async (guidanceId, params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.date) queryParams.append('date', params.date);
        if (params.status) queryParams.append('status', params.status);

        const queryString = queryParams.toString();
        return apiRequest(`/guidance/${guidanceId}/slots${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Get available slots for guidance (Public - only AVAILABLE slots)
     */
    getAvailableSlots: async (guidanceId, params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.date) queryParams.append('date', params.date);

        const queryString = queryParams.toString();
        return apiRequest(`/guidance/${guidanceId}/slots/available${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Update slot status (Admin only)
     */
    updateSlotStatus: async (slotId, status) => {
        return apiRequest(`/guidance/slots/${slotId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },

    /**
     * Delete slot (Admin only)
     */
    deleteSlot: async (slotId) => {
        return apiRequest(`/guidance/slots/${slotId}`, {
            method: 'DELETE',
        });
    },

    /**
     * Check slot access (get Google Meet link)
     */
    checkSlotAccess: async (slotId) => {
        return apiRequest(`/guidance/slots/${slotId}/access`, {
            method: 'GET',
        });
    },
};

// ==================== EBOOK APIs ====================

export const ebookAPI = {
    /**
     * Get all e-books
     */
    getEbooks: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.isPublished !== undefined) queryParams.append('isPublished', params.isPublished);
        if (params.isFree !== undefined) queryParams.append('isFree', params.isFree);

        const queryString = queryParams.toString();
        return apiRequest(`/ebooks${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Get e-book by ID
     */
    getEbookById: async (id) => {
        return apiRequest(`/ebooks/${id}`, {
            method: 'GET',
        });
    },

    /**
     * Get e-book by slug
     */
    getEbookBySlug: async (slug) => {
        return apiRequest(`/ebooks/slug/${slug}`, {
            method: 'GET',
        });
    },

    /**
     * Get e-books by category
     */
    getEbooksByCategory: async (category, limit = 10) => {
        const queryParams = new URLSearchParams();
        queryParams.append('category', category);
        queryParams.append('limit', limit);
        return apiRequest(`/ebooks/category?${queryParams.toString()}`, {
            method: 'GET',
        });
    },

    /**
     * Create e-book (Admin only)
     */
    createEbook: async (formData) => {
        return apiRequest('/ebooks', {
            method: 'POST',
            body: formData, // FormData with files
            headers: {}, // Let browser set Content-Type with boundary
        });
    },

    /**
     * Update e-book (Admin only) with progress callback
     */
    updateEbook: async (id, formData, onProgress) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    onProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (error) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new Error(error.message || 'Update failed'));
                    } catch {
                        reject(new Error('Update failed'));
                    }
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error'));
            });

            xhr.addEventListener('abort', () => {
                reject(new Error('Update aborted'));
            });

            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
            xhr.open('PATCH', `${API_BASE_URL}/ebooks/${id}`);
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            xhr.send(formData);
        });
    },

    /**
     * Publish/Unpublish e-book (Admin only)
     */
    togglePublish: async (id, isPublished) => {
        return apiRequest(`/ebooks/${id}/publish`, {
            method: 'PATCH',
            body: JSON.stringify({ isPublished }),
        });
    },

    /**
     * Update e-book categories (Admin only)
     */
    updateEbookCategories: async (id, categories) => {
        return apiRequest(`/ebooks/${id}/categories`, {
            method: 'PATCH',
            body: JSON.stringify({ categories }),
        });
    },

    /**
     * Delete e-book (Admin only)
     */
    deleteEbook: async (id) => {
        return apiRequest(`/ebooks/${id}`, {
            method: 'DELETE',
        });
    },
};

// ==================== ORDER APIs ====================

export const orderAPI = {
    /**
     * Initialize payment (Razorpay only)
     */
    initPayment: async (items, couponCode = null) => {
        return apiRequest('/orders/init-payment', {
            method: 'POST',
            body: JSON.stringify({ items, couponCode }),
        });
    },

    /**
     * Complete payment (Create order after success)
     */
    completePayment: async (paymentData) => {
        return apiRequest('/orders/complete-payment', {
            method: 'POST',
            body: JSON.stringify(paymentData),
        });
    },
    /**
     * Create order
     */
    createOrder: async (ebookIds, couponCode = null) => {
        return apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify({ ebookIds, couponCode }),
        });
    },

    /**
     * Create webinar order
     */
    createWebinarOrder: async (webinarIds, couponCode = null) => {
        return apiRequest('/orders/webinar', {
            method: 'POST',
            body: JSON.stringify({ webinarIds, couponCode }),
        });
    },

    /**
     * Create guidance order
     */
    createGuidanceOrder: async (slotId, couponCode = null) => {
        return apiRequest('/orders/guidance', {
            method: 'POST',
            body: JSON.stringify({ slotId, couponCode }),
        });
    },

    /**
     * Create mentorship order
     */
    createMentorshipOrder: async (mentorshipId, couponCode = null) => {
        return apiRequest('/orders/mentorship', {
            method: 'POST',
            body: JSON.stringify({ mentorshipId, couponCode }),
        });
    },

    /**
     * Create course order
     */
    createCourseOrder: async (courseId, couponCode = null) => {
        return apiRequest('/orders/course', {
            method: 'POST',
            body: JSON.stringify({ courseId, couponCode }),
        });
    },

    /**
     * Create offline batch order
     */
    createOfflineBatchOrder: async (batchId, couponCode = null) => {
        return apiRequest('/orders/offline-batch', {
            method: 'POST',
            body: JSON.stringify({ batchId, couponCode }),
        });
    },

    /**
     * Create bundle order
     */
    createBundleOrder: async (bundleId, couponCode = null) => {
        return apiRequest('/orders/bundle', {
            method: 'POST',
            body: JSON.stringify({ bundleId, couponCode }),
        });
    },

    /**
     * Check guidance booking status
     */
    checkGuidanceBooking: async (slotId) => {
        return apiRequest(`/orders/guidance/${slotId}/booking`, {
            method: 'GET',
        });
    },

    /**
     * Verify Razorpay payment
     */
    verifyPayment: async (orderId, paymentId, signature) => {
        return apiRequest('/orders/verify', {
            method: 'POST',
            body: JSON.stringify({ orderId, paymentId, signature }),
        });
    },

    /**
     * Get user orders
     */
    getOrders: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append('status', params.status);
        if (params.type) queryParams.append('type', params.type);

        const queryString = queryParams.toString();
        return apiRequest(`/orders${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Get all orders (Admin only)
     */
    getAllOrders: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append('status', params.status);
        if (params.type) queryParams.append('type', params.type);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);

        const queryString = queryParams.toString();
        return apiRequest(`/orders/all${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Create review for e-book
     */
    createReview: async (ebookId, rating, comment = null) => {
        return apiRequest('/orders/review', {
            method: 'POST',
            body: JSON.stringify({ ebookId, rating, comment }),
        });
    },
};

export const courseAPI = {
    /**
     * Get all courses
     */
    getCourses: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.published) queryParams.append('published', params.published);
        if (params.search) queryParams.append('search', params.search);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.isFree !== undefined) queryParams.append('isFree', params.isFree);
        if (params.category) queryParams.append('category', params.category);

        const queryString = queryParams.toString();
        return apiRequest(`/courses${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Get course by slug
     */
    getCourseBySlug: async (slug) => {
        return apiRequest(`/courses/slug/${slug}`, {
            method: 'GET',
        });
    },

    /**
     * Get course by ID (admin)
     */
    getCourseById: async (id) => {
        return apiRequest(`/courses/${id}`, {
            method: 'GET',
        });
    },

    /**
     * Create course (admin)
     */
    createCourse: async (formData) => {
        return apiRequest('/courses', {
            method: 'POST',
            body: formData,
        });
    },

    /**
     * Update course (admin)
     */
    updateCourse: async (id, formData) => {
        return apiRequest(`/courses/${id}`, {
            method: 'PATCH',
            body: formData,
        });
    },

    /**
     * Delete course (admin)
     */
    deleteCourse: async (id) => {
        return apiRequest(`/courses/${id}`, {
            method: 'DELETE',
        });
    },

    /**
     * Toggle publish status (admin)
     */
    togglePublishStatus: async (id) => {
        return apiRequest(`/courses/${id}/publish`, {
            method: 'PATCH',
        });
    },

    /**
     * Update course badges (admin)
     */
    updateBadges: async (id, badges) => {
        return apiRequest(`/courses/${id}/badges`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ badges }),
        });
    },

    /**
     * Get courses by badge (FEATURED, BESTSELLER, NEW, TRENDING, POPULAR)
     */
    getCoursesByBadge: async (badge, limit = 10) => {
        return apiRequest(`/courses/badge/${badge}?limit=${limit}`, {
            method: 'GET',
        });
    },

    /**
     * Get sessions for a course
     */
    getSessions: async (courseId) => {
        return apiRequest(`/courses/${courseId}/sessions`, {
            method: 'GET',
        });
    },

    /**
     * Create session (admin)
     */
    createSession: async (courseId, data) => {
        return apiRequest(`/courses/${courseId}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    },

    /**
     * Update session (admin)
     */
    updateSession: async (sessionId, data) => {
        return apiRequest(`/courses/sessions/${sessionId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    },

    /**
     * Delete session (admin)
     */
    deleteSession: async (sessionId) => {
        return apiRequest(`/courses/sessions/${sessionId}`, {
            method: 'DELETE',
        });
    },

    /**
     * Create chapter (admin)
     */
    createChapter: async (sessionId, data) => {
        return apiRequest(`/courses/sessions/${sessionId}/chapters`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    },

    /**
     * Update chapter (admin)
     */
    updateChapter: async (chapterId, data) => {
        return apiRequest(`/courses/chapters/${chapterId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    },

    /**
     * Delete chapter (admin)
     */
    deleteChapter: async (chapterId) => {
        return apiRequest(`/courses/chapters/${chapterId}`, {
            method: 'DELETE',
        });
    },

    /**
     * Upload session resource (admin)
     */
    uploadSessionResource: async (sessionId, formData) => {
        return apiRequest(`/courses/sessions/${sessionId}/resources`, {
            method: 'POST',
            body: formData,
        });
    },

    /**
     * Delete session resource (admin)
     */
    deleteSessionResource: async (resourceId) => {
        return apiRequest(`/courses/resources/${resourceId}`, {
            method: 'DELETE',
        });
    },

    /**
     * Check enrollment
     */
    checkEnrollment: async (courseId) => {
        return apiRequest(`/courses/${courseId}/enrollment`, {
            method: 'GET',
        });
    },

    /**
     * Get course progress
     */
    getCourseProgress: async (courseId) => {
        return apiRequest(`/courses/${courseId}/progress`, {
            method: 'GET',
        });
    },

    /**
     * Get course reviews
     */
    getCourseReviews: async (courseId) => {
        return apiRequest(`/courses/${courseId}/reviews`, {
            method: 'GET',
        });
    },

    /**
     * Get user's review for a course
     */
    getUserCourseReview: async (courseId) => {
        return apiRequest(`/courses/${courseId}/reviews/my`, {
            method: 'GET',
        });
    },

    /**
     * Create or update course review
     */
    createCourseReview: async (courseId, rating, comment) => {
        return apiRequest(`/courses/${courseId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rating, comment }),
        });
    },

    /**
     * Update chapter progress
     */
    updateChapterProgress: async (chapterId, progress, completed) => {
        return apiRequest(`/courses/${chapterId}/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ progress, completed }),
        });
    },

    /**
     * Get chapter by slug
     */
    getChapterBySlug: async (courseSlug, chapterSlug) => {
        return apiRequest(`/courses/${courseSlug}/chapters/${chapterSlug}`, {
            method: 'GET',
        });
    },

    /**
     * Admin: Get all course enrollments with progress
     */
    getAdminEnrollments: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.courseId) queryParams.append('courseId', params.courseId);
        if (params.search) queryParams.append('search', params.search);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const queryString = queryParams.toString();
        return apiRequest(`/courses/admin/enrollments${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Admin: Get single enrollment details
     */
    getAdminEnrollmentDetails: async (enrollmentId) => {
        return apiRequest(`/courses/admin/enrollments/${enrollmentId}`, {
            method: 'GET',
        });
    },

    /**
     * Admin: Get course-wise stats
     */
    getAdminCourseStats: async () => {
        return apiRequest('/courses/admin/course-stats', {
            method: 'GET',
        });
    },
};

/**
 * Category API
 */
export const categoryAPI = {
    /**
     * Get all categories
     */
    getCategories: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.active !== undefined) {
            queryParams.append('active', params.active);
        }
        const query = queryParams.toString();
        return apiRequest(`/categories${query ? `?${query}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Get category by ID
     */
    getCategoryById: async (id) => {
        return apiRequest(`/categories/${id}`, {
            method: 'GET',
        });
    },

    /**
     * Create category (Admin only)
     */
    createCategory: async (name) => {
        return apiRequest('/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });
    },

    /**
     * Update category (Admin only)
     */
    updateCategory: async (id, data) => {
        return apiRequest(`/categories/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    },

    /**
     * Delete category (Admin only)
     */
    deleteCategory: async (id) => {
        return apiRequest(`/categories/${id}`, {
            method: 'DELETE',
        });
    },
};

// ==================== ANALYTICS APIs ====================

export const analyticsAPI = {
    /**
     * Get analytics data (Admin only)
     */
    getAnalytics: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.days) queryParams.append('days', params.days);

        const queryString = queryParams.toString();
        return apiRequest(`/analytics${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },
};

// ==================== CERTIFICATE APIs ====================

export const certificateAPI = {
    // Get user's certificates
    getMyCertificates: async () => {
        return apiRequest('/certificates/my', { method: 'GET' });
    },

    // Verify certificate (public)
    verifyCertificate: async (certificateNo) => {
        return apiRequest(`/certificates/verify/${certificateNo}`, { method: 'GET' });
    },

    // Download certificate
    downloadCertificate: async (id) => {
        return apiRequest(`/certificates/download/${id}`, { method: 'GET' });
    },

    // Admin: Get all certificates
    getAdminCertificates: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.type) queryParams.append('type', params.type);
        if (params.status) queryParams.append('status', params.status);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        const queryString = queryParams.toString();
        return apiRequest(`/certificates/admin${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
    },

    // Admin: Get certificate stats
    getCertificateStats: async () => {
        return apiRequest('/certificates/admin/stats', { method: 'GET' });
    },

    // Admin: Get course certificates
    getCourseCertificates: async (courseId) => {
        return apiRequest(`/certificates/admin/course/${courseId}`, { method: 'GET' });
    },

    // Admin: Get webinar certificates
    getWebinarCertificates: async (webinarId) => {
        return apiRequest(`/certificates/admin/webinar/${webinarId}`, { method: 'GET' });
    },

    // Admin: Revoke certificate
    revokeCertificate: async (id) => {
        return apiRequest(`/certificates/admin/${id}/revoke`, { method: 'PATCH' });
    },

    // Admin: Delete certificate permanently
    deleteCertificate: async (id) => {
        return apiRequest(`/certificates/admin/${id}`, { method: 'DELETE' });
    },

    // Admin: Restore revoked certificate
    restoreCertificate: async (id) => {
        return apiRequest(`/certificates/admin/${id}/restore`, { method: 'PATCH' });
    },

    // Admin: Regenerate certificate
    regenerateCertificate: async (id) => {
        return apiRequest(`/certificates/admin/${id}/regenerate`, { method: 'POST' });
    },

    // Admin: Process webinar completions
    processWebinarCompletions: async (webinarId = null) => {
        const endpoint = webinarId
            ? `/certificates/admin/process-webinars/${webinarId}`
            : '/certificates/admin/process-webinars';
        return apiRequest(endpoint, { method: 'POST' });
    },

    // ==================== TEMPLATE MANAGEMENT ====================

    // Admin: Get all templates
    getTemplates: async () => {
        return apiRequest('/certificates/admin/templates', { method: 'GET' });
    },

    // Admin: Get template by type
    getTemplateByType: async (type) => {
        return apiRequest(`/certificates/admin/templates/${type}`, { method: 'GET' });
    },

    // Admin: Create or update template
    upsertTemplate: async (data) => {
        return apiRequest('/certificates/admin/templates', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Admin: Update template images
    updateTemplateImages: async (type, imageData) => {
        return apiRequest(`/certificates/admin/templates/${type}/images`, {
            method: 'PATCH',
            body: JSON.stringify(imageData),
        });
    },

    // Admin: Delete template
    deleteTemplate: async (type) => {
        return apiRequest(`/certificates/admin/templates/${type}`, { method: 'DELETE' });
    },

    // ==================== MANUAL GENERATION ====================

    // Admin: Get eligible items for manual generation
    getEligibleItems: async (type) => {
        return apiRequest(`/certificates/admin/eligible-items?type=${type}`, { method: 'GET' });
    },

    // Admin: Search users for manual generation
    searchUsers: async (query) => {
        return apiRequest(`/certificates/admin/search-users?query=${encodeURIComponent(query)}`, { method: 'GET' });
    },

    // Admin: Generate certificate manually
    generateManual: async (data) => {
        return apiRequest('/certificates/admin/generate-manual', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

// ==================== REVIEW APIs ====================

export const reviewAPI = {
    // Admin: Get all reviews
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.type) queryParams.append('type', params.type);
        if (params.rating) queryParams.append('rating', params.rating);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        const queryString = queryParams.toString();
        return apiRequest(`/reviews${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
    },

    // Admin: Get review stats
    getStats: async () => {
        return apiRequest('/reviews/stats', { method: 'GET' });
    },

    // Admin: Get single review
    getById: async (id, reviewType) => {
        return apiRequest(`/reviews/${id}?reviewType=${reviewType}`, { method: 'GET' });
    },

    // Admin: Update review
    update: async (id, reviewType, data) => {
        return apiRequest(`/reviews/${id}?reviewType=${reviewType}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    // Admin: Delete review
    delete: async (id, reviewType) => {
        return apiRequest(`/reviews/${id}?reviewType=${reviewType}`, { method: 'DELETE' });
    },
};

// ==================== FLASH SALE APIs ====================

export const cartAPI = {
    // Get user's cart
    getCart: async () => {
        return apiRequest('/cart', { method: 'GET' });
    },

    // Add item to cart
    addToCart: async (itemType, itemId) => {
        return apiRequest('/cart/add', {
            method: 'POST',
            body: JSON.stringify({ itemType, itemId }),
        });
    },

    // Remove item from cart
    removeFromCart: async (itemType, itemId) => {
        return apiRequest('/cart/remove', {
            method: 'POST',
            body: JSON.stringify({ itemType, itemId }),
        });
    },

    // Clear cart
    clearCart: async () => {
        return apiRequest('/cart/clear', { method: 'DELETE' });
    },

    // Sync cart (replace entire cart)
    syncCart: async (cart) => {
        return apiRequest('/cart/sync', {
            method: 'POST',
            body: JSON.stringify({ cart }),
        });
    },
};

export const flashSaleAPI = {
    // Get active flash sale (public)
    getActive: async () => {
        return apiRequest('/flash-sales/active', { method: 'GET' });
    },

    // Admin: Get all flash sales
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.type) queryParams.append('type', params.type);
        if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        const queryString = queryParams.toString();
        return apiRequest(`/flash-sales${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
    },

    // Admin: Get items by type
    getItemsByType: async (type) => {
        return apiRequest(`/flash-sales/items/${type}`, { method: 'GET' });
    },

    // Admin: Create flash sale
    create: async (data) => {
        return apiRequest('/flash-sales', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Admin: Update flash sale
    update: async (id, data) => {
        return apiRequest(`/flash-sales/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    // Admin: Toggle flash sale
    toggle: async (id) => {
        return apiRequest(`/flash-sales/${id}/toggle`, { method: 'PATCH' });
    },

    // Admin: Delete flash sale
    delete: async (id) => {
        return apiRequest(`/flash-sales/${id}`, { method: 'DELETE' });
    },
};

export const footerAPI = {
    // Get active footer links (public)
    getLinks: async () => {
        return apiRequest('/footer', { method: 'GET' });
    },

    // Admin: Get all footer links
    getAll: async () => {
        return apiRequest('/footer/admin', { method: 'GET' });
    },

    // Admin: Create footer link
    create: async (data) => {
        return apiRequest('/footer/admin', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Admin: Update footer link
    update: async (id, data) => {
        return apiRequest(`/footer/admin/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Admin: Delete footer link
    delete: async (id) => {
        return apiRequest(`/footer/admin/${id}`, { method: 'DELETE' });
    },

    // Admin: Reorder footer links
    reorder: async (links) => {
        return apiRequest('/footer/admin/reorder', {
            method: 'POST',
            body: JSON.stringify({ links }),
        });
    },
};

export const offlineBatchAPI = {
    // Public: Get all offline batches
    getBatches: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.city) queryParams.append('city', params.city);
        if (params.status) queryParams.append('status', params.status);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        const queryString = queryParams.toString();
        return apiRequest(`/offline-batches${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
    },

    // Public: Get batch by slug
    getBatchBySlug: async (slug) => {
        return apiRequest(`/offline-batches/${slug}`, { method: 'GET' });
    },

    // Public: Get batch by ID (for cart/checkout)
    getBatchById: async (id) => {
        return apiRequest(`/offline-batches/id/${id}`, { method: 'GET' });
    },

    // User: Enroll in batch
    enroll: async (batchId) => {
        return apiRequest('/offline-batches/enroll', {
            method: 'POST',
            body: JSON.stringify({ batchId }),
        });
    },

    // Admin: Get all batches
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append('status', params.status);
        if (params.city) queryParams.append('city', params.city);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        const queryString = queryParams.toString();
        return apiRequest(`/offline-batches/admin/all${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
    },

    // Admin: Get batch by ID
    getById: async (id) => {
        return apiRequest(`/offline-batches/admin/${id}`, { method: 'GET' });
    },

    // Admin: Create batch
    create: async (formData) => {
        return apiRequest('/offline-batches/admin', {
            method: 'POST',
            body: formData, // FormData for file upload
        });
    },

    // Admin: Update batch
    update: async (id, formData) => {
        return apiRequest(`/offline-batches/admin/${id}`, {
            method: 'PUT',
            body: formData, // FormData for file upload
        });
    },

    // Admin: Delete batch
    delete: async (id) => {
        return apiRequest(`/offline-batches/admin/${id}`, { method: 'DELETE' });
    },
};

// ==================== BUNDLE APIs ====================

export const bundleAPI = {
    // Public: Get all published bundles
    getBundles: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        const queryString = queryParams.toString();
        return apiRequest(`/bundles${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
    },

    // Public: Get bundle by slug
    getBundleBySlug: async (slug) => {
        return apiRequest(`/bundles/${slug}`, { method: 'GET' });
    },

    // Public: Get bundle by ID (for cart)
    getBundleById: async (id) => {
        return apiRequest(`/bundles/id/${id}`, { method: 'GET' });
    },

    // Admin: Get all bundles
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.isPublished !== undefined) queryParams.append('isPublished', params.isPublished);
        const queryString = queryParams.toString();
        return apiRequest(`/bundles/admin/all${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
    },

    // Admin: Get bundle by ID
    getById: async (id) => {
        return apiRequest(`/bundles/admin/${id}`, { method: 'GET' });
    },

    // Admin: Get courses for bundle selection
    getCoursesForBundle: async () => {
        return apiRequest('/bundles/admin/courses', { method: 'GET' });
    },

    // Admin: Create bundle
    create: async (formData) => {
        return apiRequest('/bundles/admin', {
            method: 'POST',
            body: formData, // FormData for file upload
        });
    },

    // Admin: Update bundle
    update: async (id, formData) => {
        return apiRequest(`/bundles/admin/${id}`, {
            method: 'PUT',
            body: formData, // FormData for file upload
        });
    },

    // Admin: Toggle publish status
    togglePublish: async (id) => {
        return apiRequest(`/bundles/admin/${id}/toggle-publish`, { method: 'PATCH' });
    },

    // Admin: Delete bundle
    delete: async (id) => {
        return apiRequest(`/bundles/admin/${id}`, { method: 'DELETE' });
    },
};

// ==================== MEDIA APIs (Bunny.net) ====================

export const mediaAPI = {
    /**
     * Check if Bunny service is configured
     */
    getConfigStatus: async () => {
        return apiRequest('/media/config/status', {
            method: 'GET',
        });
    },

    /**
     * Upload video file
     */
    uploadVideo: async (file, title, onProgress) => {
        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title);

        const url = `${API_BASE_URL}/media/upload`;
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable && onProgress) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    onProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(data.message || 'Upload failed'));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse response'));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('POST', url);
            xhr.withCredentials = true;
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            xhr.send(formData);
        });
    },

    /**
     * Fetch video from URL
     */
    fetchFromUrl: async (url, title) => {
        return apiRequest('/media/fetch-url', {
            method: 'POST',
            body: JSON.stringify({ url, title }),
        });
    },

    /**
     * List all videos with pagination
     */
    listVideos: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.orderBy) queryParams.append('orderBy', params.orderBy);

        const queryString = queryParams.toString();
        return apiRequest(`/media${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Get single video details
     */
    getVideo: async (videoId) => {
        return apiRequest(`/media/${videoId}`, {
            method: 'GET',
        });
    },

    /**
     * Update video metadata
     */
    updateVideo: async (videoId, data) => {
        return apiRequest(`/media/${videoId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    /**
     * Delete a video
     */
    deleteVideo: async (videoId) => {
        return apiRequest(`/media/${videoId}`, {
            method: 'DELETE',
        });
    },

    /**
     * Check video encoding status
     */
    getVideoStatus: async (videoId) => {
        return apiRequest(`/media/${videoId}/status`, {
            method: 'GET',
        });
    },

    // ==================== R2 Storage ====================

    /**
     * List files from R2
     */
    listR2Files: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.folder) queryParams.append('folder', params.folder);
        if (params.type) queryParams.append('type', params.type);

        const queryString = queryParams.toString();
        return apiRequest(`/media/r2/files${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        });
    },

    /**
     * Get R2 folders
     */
    getR2Folders: async () => {
        return apiRequest('/media/r2/folders', {
            method: 'GET',
        });
    },

    /**
     * Upload file to R2
     */
    uploadR2File: async (file, folder = '', onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        if (folder) formData.append('folder', folder);

        const url = `${API_BASE_URL}/media/r2/upload`;
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable && onProgress) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    onProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Invalid response format'));
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new Error(error.message || 'Upload failed'));
                    } catch (e) {
                        reject(new Error('Upload failed'));
                    }
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error'));
            });

            xhr.open('POST', url);
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            xhr.send(formData);
        });
    },

    /**
     * Delete file from R2
     */
    deleteR2File: async (key) => {
        return apiRequest('/media/r2/files', {
            method: 'DELETE',
            body: JSON.stringify({ key }),
        });
    },
};

// ==================== INVOICE APIs ====================

export const invoiceAPI = {
    getSettings: async () => {
        return apiRequest('/invoice/settings', { method: 'GET' });
    },
    updateSettings: async (data) => {
        return apiRequest('/invoice/settings', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    getOrderForInvoice: async (orderId) => {
        return apiRequest(`/invoice/order/${orderId}`, { method: 'GET' });
    },
    // Manual invoices - kisi bhi cheez ke liye (course, ebook, office, service)
    manual: {
        list: () => apiRequest('/invoice/manual', { method: 'GET' }),
        create: (data) => apiRequest('/invoice/manual', { method: 'POST', body: JSON.stringify(data) }),
        get: (id) => apiRequest(`/invoice/manual/${id}`, { method: 'GET' }),
        update: (id, data) => apiRequest(`/invoice/manual/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => apiRequest(`/invoice/manual/${id}`, { method: 'DELETE' }),
    },
};

// ==================== BANNER APIs ====================

export const bannerAPI = {
    getActive: async () => {
        return apiRequest('/banners/active', { method: 'GET' });
    },
    getAll: async () => {
        return apiRequest('/banners', { method: 'GET' });
    },
    create: async (data) => {
        return apiRequest('/banners', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    update: async (id, data) => {
        return apiRequest(`/banners/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    delete: async (id) => {
        return apiRequest(`/banners/${id}`, { method: 'DELETE' });
    },
};

// ==================== PLACEMENT APIs ====================
export const placementAPI = {
    getAll: async () => apiRequest('/placement', { method: 'GET' }),
    getAllAdmin: async () => apiRequest('/placement/all', { method: 'GET' }),
    create: async (data) => apiRequest('/placement', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id, data) => apiRequest(`/placement/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: async (id) => apiRequest(`/placement/${id}`, { method: 'DELETE' }),
};

// ==================== TRAINING SCHEDULE APIs ====================
export const trainingScheduleAPI = {
    getUpcoming: async (params) => {
        const q = new URLSearchParams(params || {}).toString();
        return apiRequest(`/training-schedule${q ? `?${q}` : ''}`, { method: 'GET' });
    },
    getAllAdmin: async (params) => {
        const q = new URLSearchParams(params || {}).toString();
        return apiRequest(`/training-schedule/all${q ? `?${q}` : ''}`, { method: 'GET' });
    },
    create: async (data) => apiRequest('/training-schedule', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id, data) => apiRequest(`/training-schedule/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: async (id) => apiRequest(`/training-schedule/${id}`, { method: 'DELETE' }),
};

// ==================== DEMO REQUEST APIs ====================
export const demoRequestAPI = {
    submit: async (data) => apiRequest('/demo-requests', { method: 'POST', body: JSON.stringify(data) }),
    getAll: async (params) => {
        const q = new URLSearchParams(params || {}).toString();
        return apiRequest(`/demo-requests${q ? `?${q}` : ''}`, { method: 'GET' });
    },
    updateStatus: async (id, status) => apiRequest(`/demo-requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ==================== MOCK INTERVIEW APIs ====================
export const mockInterviewAPI = {
    getSlots: async () => apiRequest('/mock-interview/slots', { method: 'GET' }),
    book: async (data) => apiRequest('/mock-interview/book', { method: 'POST', body: JSON.stringify(data) }),
    getMyBookings: async (params) => {
        const q = new URLSearchParams(params || {}).toString();
        return apiRequest(`/mock-interview/my-bookings${q ? `?${q}` : ''}`, { method: 'GET' });
    },
    admin: {
        getSlots: async () => apiRequest('/mock-interview/admin/slots', { method: 'GET' }),
        createSlot: async (data) => apiRequest('/mock-interview/admin/slots', { method: 'POST', body: JSON.stringify(data) }),
        updateSlot: async (id, data) => apiRequest(`/mock-interview/admin/slots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteSlot: async (id) => apiRequest(`/mock-interview/admin/slots/${id}`, { method: 'DELETE' }),
        getBookings: async (params) => {
            const q = new URLSearchParams(params || {}).toString();
            return apiRequest(`/mock-interview/admin/bookings${q ? `?${q}` : ''}`, { method: 'GET' });
        },
        updateBookingStatus: async (id, status) => apiRequest(`/mock-interview/admin/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    },
};

// ==================== EXPERT PRACTICE APIs ====================
export const expertPracticeAPI = {
    getActive: async () => apiRequest('/expert-practice', { method: 'GET' }),
    getAllAdmin: async () => apiRequest('/expert-practice/all', { method: 'GET' }),
    create: async (data) => apiRequest('/expert-practice', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id, data) => apiRequest(`/expert-practice/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: async (id) => apiRequest(`/expert-practice/${id}`, { method: 'DELETE' }),
    createBooking: async (data) => apiRequest('/expert-practice/bookings', { method: 'POST', body: JSON.stringify(data) }),
    getBookingsAdmin: async () => apiRequest('/expert-practice/bookings', { method: 'GET' }),
    updateBookingStatus: async (id, status) => apiRequest(`/expert-practice/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export const hireFromUsAPI = {
    submit: async (data) => apiRequest('/hire-from-us', { method: 'POST', body: JSON.stringify(data) }),
    getAllAdmin: async (params) => {
        const q = new URLSearchParams(params || {}).toString();
        return apiRequest(`/hire-from-us/admin${q ? `?${q}` : ''}`, { method: 'GET' });
    },
};

export const placementTrainingAPI = {
    register: async (data) => apiRequest('/placement-training/register', { method: 'POST', body: JSON.stringify(data) }),
    verifyOtp: async (data) => apiRequest('/placement-training/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
    getAllAdmin: async (params) => {
        const q = new URLSearchParams(params || {}).toString();
        return apiRequest(`/placement-training/admin/registrations${q ? `?${q}` : ''}`, { method: 'GET' });
    },
};

// ==================== INDICATOR APIs ====================
export const indicatorAPI = {
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.isPublished !== undefined) queryParams.append('isPublished', params.isPublished);
        const queryString = queryParams.toString();
        return apiRequest(`/indicators${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
    },
    getBySlug: async (slug) => apiRequest(`/indicators/slug/${slug}`, { method: 'GET' }),
    getById: async (id) => apiRequest(`/indicators/${id}`, { method: 'GET' }),
    create: async (formData) => apiRequest('/indicators', { method: 'POST', body: formData }),
    update: async (id, formData) => apiRequest(`/indicators/${id}`, { method: 'PATCH', body: formData }),
    delete: async (id) => apiRequest(`/indicators/${id}`, { method: 'DELETE' }),
    togglePublish: async (id, isPublished) => apiRequest(`/indicators/${id}/publish`, { method: 'PATCH', body: JSON.stringify({ isPublished }) }),
};

// ==================== MENTORSHIP APIs ====================
export const mentorshipAPI = {
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        const queryString = queryParams.toString();
        return apiRequest(`/mentorship${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
    },
    getById: async (id) => apiRequest(`/mentorship/${id}`, { method: 'GET' }),
    getBySlug: async (slug) => apiRequest(`/mentorship/slug/${slug}`, { method: 'GET' }),
    getSessions: async (id) => apiRequest(`/mentorship/${id}/sessions`, { method: 'GET' }),
    checkEnrollment: async (id) => apiRequest(`/mentorship/${id}/enrollment`, { method: 'GET' }),

    // Admin
    create: async (formData) => apiRequest('/mentorship', { method: 'POST', body: formData }),
    update: async (id, formData) => apiRequest(`/mentorship/${id}`, { method: 'PATCH', body: formData }),
    delete: async (id) => apiRequest(`/mentorship/${id}`, { method: 'DELETE' }),
    togglePublish: async (id) => apiRequest(`/mentorship/${id}/publish`, { method: 'PATCH' }),

    // Sessions (Admin)
    createSession: async (mentorshipId, data) => apiRequest(`/mentorship/${mentorshipId}/sessions`, { method: 'POST', body: JSON.stringify(data) }),
    updateSession: async (sessionId, data) => apiRequest(`/mentorship/sessions/${sessionId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteSession: async (sessionId) => apiRequest(`/mentorship/sessions/${sessionId}`, { method: 'DELETE' }),
};

// ==================== SUBSCRIPTION APIs ====================
export const subscriptionAPI = {
    checkActive: async () => apiRequest('/subscriptions/check-active', { method: 'GET' }),
    create: async (data) => apiRequest('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
    verifyPayment: async (data) => apiRequest('/subscriptions/verify-payment', { method: 'POST', body: JSON.stringify(data) }),
    getUserSubscriptions: async (status) => {
        const queryParams = new URLSearchParams();
        if (status) queryParams.append('status', status);
        return apiRequest(`/subscriptions?${queryParams.toString()}`, { method: 'GET' });
    },
    cancel: async (id) => apiRequest(`/subscriptions/${id}/cancel`, { method: 'POST' }),
    renew: async (id, data) => apiRequest(`/subscriptions/${id}/renew`, { method: 'POST', body: JSON.stringify(data) }),

    // Admin
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.status) queryParams.append('status', params.status);
        const queryString = queryParams.toString();
        return apiRequest(`/subscriptions/all${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
    },
    updateTradingViewUsername: async (id, username) => apiRequest(`/subscriptions/${id}/tradingview`, { method: 'PATCH', body: JSON.stringify({ tradingViewUsername: username }) }),
    updateStatus: async (id, status) => apiRequest(`/subscriptions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    changePlan: async (id, planId) => apiRequest(`/subscriptions/${id}/plan`, { method: 'PATCH', body: JSON.stringify({ planId }) }),
    stop: async (id) => apiRequest(`/subscriptions/${id}/stop`, { method: 'POST' }),
    adminRenew: async (id, data) => apiRequest(`/subscriptions/${id}/renew`, { method: 'POST', body: JSON.stringify(data) }),
};

// ==================== SUBSCRIPTION PLAN APIs ====================
export const subscriptionPlanAPI = {
    getGlobalPlans: async () => apiRequest('/subscription-plans', { method: 'GET' }),

    // Admin
    getAll: async () => apiRequest('/subscription-plans/all', { method: 'GET' }),
    getById: async (id) => apiRequest(`/subscription-plans/${id}`, { method: 'GET' }),
    upsert: async (data) => apiRequest('/subscription-plans', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id, data) => apiRequest(`/subscription-plans/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id) => apiRequest(`/subscription-plans/${id}`, { method: 'DELETE' }),
};

// ==================== INTERVIEW CATEGORY APIs ====================
export const interviewCategoryAPI = {
    // Public
    getAll: async () => apiRequest('/interview-categories', { method: 'GET' }),

    // Admin
    getAllAdmin: async () => apiRequest('/interview-categories/admin/all', { method: 'GET' }),
    getById: async (id) => apiRequest(`/interview-categories/admin/${id}`, { method: 'GET' }),
    create: async (data) => apiRequest('/interview-categories', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id, data) => apiRequest(`/interview-categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id) => apiRequest(`/interview-categories/${id}`, { method: 'DELETE' }),
    toggleActive: async (id) => apiRequest(`/interview-categories/${id}/toggle-active`, { method: 'PATCH' }),
};

// ==================== INTERVIEW QUESTION APIs ====================
export const interviewQuestionAPI = {
    // Public
    getAll: async (params = {}) => {
        const q = new URLSearchParams(params || {}).toString();
        return apiRequest(`/interview-questions${q ? `?${q}` : ''}`, { method: 'GET' });
    },
    getBySlug: async (slug) => apiRequest(`/interview-questions/slug/${slug}`, { method: 'GET' }),

    // Admin
    getAllAdmin: async (params = {}) => {
        const q = new URLSearchParams(params || {}).toString();
        return apiRequest(`/interview-questions/admin/all${q ? `?${q}` : ''}`, { method: 'GET' });
    },
    getById: async (id) => apiRequest(`/interview-questions/admin/${id}`, { method: 'GET' }),
    create: async (data) => apiRequest('/interview-questions', { method: 'POST', body: JSON.stringify(data) }),
    createBulk: async (questions) => apiRequest('/interview-questions/bulk', { method: 'POST', body: JSON.stringify({ questions }) }),
    update: async (id, data) => apiRequest(`/interview-questions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id) => apiRequest(`/interview-questions/${id}`, { method: 'DELETE' }),
    togglePublish: async (id) => apiRequest(`/interview-questions/${id}/toggle-publish`, { method: 'PATCH' }),
};

// ==================== CORPORATE TRAINING APIs ====================
export const corporateTrainingAPI = {
    // Public
    getAll: async () => apiRequest('/corporate-training', { method: 'GET' }),
    getBySlug: async (slug) => apiRequest(`/corporate-training/${slug}`, { method: 'GET' }),
    createInquiry: async (data) => apiRequest('/corporate-training/inquiry', { method: 'POST', body: JSON.stringify(data) }),

    // Admin
    getAllAdmin: async () => apiRequest('/corporate-training/admin/all', { method: 'GET' }),
    getById: async (id) => apiRequest(`/corporate-training/admin/${id}`, { method: 'GET' }),
    create: async (data) => apiRequest('/corporate-training', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id, data) => apiRequest(`/corporate-training/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id) => apiRequest(`/corporate-training/${id}`, { method: 'DELETE' }),
    toggleActive: async (id) => apiRequest(`/corporate-training/${id}/toggle-active`, { method: 'PATCH' }),

    // Admin Inquiries
    getInquiries: async (params = {}) => {
        const q = new URLSearchParams(params || {}).toString();
        return apiRequest(`/corporate-training/admin/inquiries/all${q ? `?${q}` : ''}`, { method: 'GET' });
    },
    updateInquiryStatus: async (id, status) => apiRequest(`/corporate-training/admin/inquiries/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// Export default for convenience
export const api = {
    get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body }),
    put: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
    patch: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PATCH', body }),
    delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),

    auth: authAPI,
    user: userAPI,
    upload: uploadAPI,
    contact: contactAPI,
    admin: adminAPI,
    ebook: ebookAPI,
    order: orderAPI,
    coupon: couponAPI,
    webinar: webinarAPI,
    guidance: guidanceAPI,
    course: courseAPI,
    category: categoryAPI,
    analytics: analyticsAPI,
    certificate: certificateAPI,
    review: reviewAPI,
    flashSale: flashSaleAPI,
    cart: cartAPI,
    footer: footerAPI,
    offlineBatch: offlineBatchAPI,
    bundle: bundleAPI,
    media: mediaAPI,
    invoice: invoiceAPI,
    banner: bannerAPI,
    placement: placementAPI,
    trainingSchedule: trainingScheduleAPI,
    demoRequest: demoRequestAPI,
    mockInterview: mockInterviewAPI,
    expertPractice: expertPracticeAPI,
    hireFromUs: hireFromUsAPI,
    placementTraining: placementTrainingAPI,
    indicator: indicatorAPI,
    mentorship: mentorshipAPI,
    subscription: subscriptionAPI,
    subscriptionPlan: subscriptionPlanAPI,
    interviewCategory: interviewCategoryAPI,
    interviewQuestion: interviewQuestionAPI,
    corporateTraining: corporateTrainingAPI,
};



export default api;