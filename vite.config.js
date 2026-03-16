import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const vendorChunkMap = [
  { name: 'vendor-ui', includes: ['/vue/', '/vue-router/', '/element-plus/', '/@element-plus/'] },
  { name: 'vendor-markdown', includes: ['/markdown-it/', '/katex/'] },
  { name: 'vendor-charts', includes: ['/echarts/', '/zrender/'] },
  { name: 'vendor-utils', includes: ['/axios/', '/dayjs/'] }
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          const normalizedId = id.replace(/\\/g, '/')
          const matchedChunk = vendorChunkMap.find(chunk =>
            chunk.includes.some(token => normalizedId.includes(token))
          )

          return matchedChunk?.name || 'vendor'
        }
      }
    }
  }
})
