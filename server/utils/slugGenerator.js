/**
 * Generate a URL-friendly slug from text
 * @param {string} text - The text to convert to a slug
 * @returns {string} - The generated slug
 */
export const generateSlug = (text) => {
    if (!text) return '';

    return text
        .toLowerCase()
        .trim()
        .replace(/[\s]+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+|-+$/g, "");
};

