import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { codeInspectorPlugin } from 'code-inspector-plugin'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isExtension = mode === 'extension'
  
  return {
    plugins: [
      vue(),
      vueDevTools(),
      codeInspectorPlugin({
        bundler: 'vite',
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: isExtension ? {
      rollupOptions: {
        input: './extension-index.html',
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      },
      outDir: 'dist-extension',
      emptyOutDir: true,
      minify: false, // 保持代码可读性，便于调试
      sourcemap: false
    } : {
      outDir: 'dist'
    }
  }
})
