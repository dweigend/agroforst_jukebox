import { defineConfig } from 'vite';

export default defineConfig({
  // Asset handling for 3D files
  assetsInclude: ['**/*.obj', '**/*.mtl'],

  // Ensure assets are properly served
  publicDir: 'public',

  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    // Keep asset filenames for reliable loading
    rollupOptions: {
      output: {
        assetFileNames: assetInfo => {
          // Keep original names for 3D assets
          if (assetInfo.name?.endsWith('.obj') || assetInfo.name?.endsWith('.mtl')) {
            return 'assets/3d_assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },

  // Server configuration for development
  server: {
    port: 5173,
    host: true,
  },

  // Ensure proper MIME types for 3D assets
  define: {
    // Enable development helpers
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
});
