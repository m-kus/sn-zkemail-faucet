import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import commonjs from "vite-plugin-commonjs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    commonjs(),
    react(),
    nodePolyfills({
      include: [
        'buffer',
        'crypto',
        'process',
        'path',
        'stream',
        'timers',
        'tty',
        'util',
        'vm',
      ],
    }),
  ],
})
