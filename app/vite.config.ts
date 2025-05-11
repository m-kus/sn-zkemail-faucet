import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import commonjs from "vite-plugin-commonjs"
import serveStatic from 'vite-plugin-serve-static'

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
    {
      ...serveStatic([
        {
          pattern: /main.worker.js/,
          resolve: 'node_modules/@aztec/bb.js/dest/browser/main.worker.js'
        }
      ]),
      apply: 'serve', // Only apply in dev mode
    }
  ],
})
