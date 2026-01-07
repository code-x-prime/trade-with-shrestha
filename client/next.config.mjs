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
        ],
    },
};

export default nextConfig;
