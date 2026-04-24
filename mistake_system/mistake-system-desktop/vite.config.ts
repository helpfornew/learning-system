import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/mistake/',
  // 将缓存目录移到 /tmp，避免权限问题
  cacheDir: '/tmp/vite-cache-mistake-system',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  // 优化依赖，排除全局变量
  optimizeDeps: {
    exclude: ['@ant-design/icons', 'antd', 'axios', 'echarts', 'echarts-for-react']
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    // 本地开发时的代理配置，生产环境不使用
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/account': {
        target: process.env.VITE_ACCOUNT_TARGET_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',        // 启用代码压缩
    cssCodeSplit: true,      // CSS 代码分割
    rollupOptions: {
      output: {
        // 使用 ES 模块格式
        format: 'es',
        compact: true,       // 启用紧凑输出
        manualChunks: {      // 代码分割，按需加载
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['antd', '@ant-design/icons'],
          'vendor-charts': ['echarts', 'echarts-for-react'],
          'vendor-utils': ['axios', 'zustand', 'cropperjs']
        },
        // 控制 chunk 文件命名
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (info) => {
          const infoSrc = info.name || '';
          if (infoSrc.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  define: {
    'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL),
    'process.env.VITE_ACCOUNT_API_URL': JSON.stringify(process.env.VITE_ACCOUNT_API_URL),
    'process.env.VITE_API_TIMEOUT': JSON.stringify(process.env.VITE_API_TIMEOUT),
    'process.env.VITE_API_RETRY_ATTEMPTS': JSON.stringify(process.env.VITE_API_RETRY_ATTEMPTS)
  }
})
