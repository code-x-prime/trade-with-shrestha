/**
 * Get public URL for R2 files
 */
export function getPublicUrl(filename) {
    if (!filename) return null;

    // If already a full URL, return as is
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
        return filename;
    }

    // Get base URL from env
    const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.NEXT_PUBLIC_CDN_URL;

    if (!baseUrl) {
        console.warn('R2_PUBLIC_URL not configured');
        return null;
    }

    // Remove trailing slash from base URL
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

    // Remove leading slash from filename if present
    const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;

    return `${cleanBaseUrl}/${cleanFilename}`;
}

