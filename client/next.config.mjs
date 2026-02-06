/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'pub-67f953912205445f932ab892164f22e5.r2.dev',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'vz-13518470-6e3.b-cdn.net',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'ab34b1ded723351fcea2230b83b540f8.r2.cloudflarestorage.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'vz-1a5b5031-ba8.b-cdn.net',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'pub-ea068395076f48558e674cdcaf6fd536.r2.dev',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'ui-avatars.com',
                pathname: '/api/**',
            },
        ],
    },
};

export default nextConfig;
