/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'https', // Or 'http' if needed
            hostname: 'www.bing.com', // Allow images from Bing
            port: '', // Usually empty unless a specific port is needed
            pathname: '/images/search/**', // Be specific if possible, or use '/**' for any path
          },
        ]
    }
};

export default nextConfig;
