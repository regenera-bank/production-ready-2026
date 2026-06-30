import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NODE_MODULES = path.join(__dirname, 'node_modules');

const dep = (name: string) => path.join(NODE_MODULES, name);

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
      react: dep('react'),
      'react-dom': dep('react-dom'),
      'react/jsx-dev-runtime': dep('react/jsx-dev-runtime.js'),
      'react/jsx-runtime': dep('react/jsx-runtime.js'),
      'lucide-react': dep('lucide-react'),
    },
    dedupe: ['react', 'react-dom'],
    modules: [NODE_MODULES, 'node_modules'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-dev-runtime', 'lucide-react'],
  },
  css: {
    postcss: path.join(__dirname, 'postcss.config.js'),
  },
  server: {
    port: Number(process.env.VITE_PORT ?? 5176),
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3200',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api/, '/v1'),
      },
    },
  },
  envDir: __dirname,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.join(__dirname, 'src/test/setup.ts')],
  },
});