import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // React plugin with Fast Refresh enabled (default)
    react({
      // Enable Fast Refresh for instant HMR
      fastRefresh: true,
      // Include all files for HMR
      include: '**/*.{jsx,tsx}',
    }),
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Optimized HMR configuration for reliable hot reloading
    hmr: {
      overlay: true,
      // Explicit port configuration for better reliability
      // clientPort: 5173, // Uncomment if HMR connection issues occur
    },
    // Disable caching headers in development to prevent stale content
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    // Optimized watch configuration to detect all file changes
    watch: {
      // Use polling to ensure file changes are detected (more reliable)
      usePolling: true,
      // Ensure all source files are watched, exclude only build artifacts
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      // Polling interval if usePolling is enabled (in ms) - increased for reliability
      interval: 1000,
      // Watch for changes in all relevant directories
      // Vite automatically watches src/ by default, but we ensure it's explicit
    },
    // Ensure fast refresh works correctly
    fs: {
      // Allow serving files from project root
      allow: ['..'],
      // Strict mode for security
      strict: true,
    },
  },
  // Optimize dependency pre-bundling for faster HMR
  optimizeDeps: {
    // Force re-optimization to ensure fresh dependencies (helps with cache issues)
    force: true,
    // Include all critical dependencies for faster initial load and HMR
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-scroll-area',
      '@tanstack/react-table',
      'lucide-react',
    ],
    // Exclude problematic dependencies if any
    exclude: [],
    // ESBuild options for faster processing
    esbuildOptions: {
      // Target modern browsers for faster builds
      target: 'esnext',
    },
  },
  build: {
    // Add hash to filenames for cache busting
    rollupOptions: {
      output: {
        // Add content hash to filenames for better cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'radix-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          'tanstack-table': ['@tanstack/react-table'],
          'lucide-icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    // Clear output directory before building
    emptyOutDir: true,
  },
  // Clear Vite cache on startup in development
  clearScreen: true,
})
