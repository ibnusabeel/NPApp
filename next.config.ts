import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // === Memory & Performance Optimizations ===

    // Disable source maps in production (saves ~50-80MB memory)
    productionBrowserSourceMaps: false,

    // Remove console.log in production (keeps error/warn)
    compiler: {
        removeConsole:
            process.env.NODE_ENV === "production"
                ? { exclude: ["error", "warn"] }
                : false,
    },

    reactStrictMode: true,

    experimental: {
        // Tree-shake unused lucide-react icons
        optimizePackageImports: ["lucide-react"],
    },

    // Don't generate etags (saves a bit of memory)
    generateEtags: false,

    // External packages that shouldn't be bundled
    serverExternalPackages: ["mongoose", "sharp"],
};

export default nextConfig;
