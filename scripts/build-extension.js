import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const distDir = path.join(projectRoot, 'dist-extension')

async function buildExtension() {
  console.log('📦 开始构建Chrome扩展...')
  
  try {
    // 确保输出目录存在
    await fs.mkdir(distDir, { recursive: true })
    
    // 复制manifest.json
    console.log('📄 复制manifest.json...')
    await fs.copyFile(
      path.join(projectRoot, 'manifest.json'),
      path.join(distDir, 'manifest.json')
    )
    
    // 复制background.js
    console.log('📜 复制background.js...')
    await fs.copyFile(
      path.join(projectRoot, 'background.js'),
      path.join(distDir, 'background.js')
    )
    
    // extension-index.html 已经被 Vite 构建过了，不需要再复制
    console.log('✓ 扩展主页面已由Vite构建')
    
    // 复制favicon.ico
    console.log('🖼️  复制图标文件...')
    await fs.mkdir(path.join(distDir, 'public'), { recursive: true })
    await fs.copyFile(
      path.join(projectRoot, 'public/favicon.ico'),
      path.join(distDir, 'public/favicon.ico')
    )
    
    // 复制favicon.ico到根目录（供extension-index.html使用）
    await fs.copyFile(
      path.join(projectRoot, 'public/favicon.ico'),
      path.join(distDir, 'favicon.ico')
    )
    
    console.log('✅ Chrome扩展构建完成！')
    console.log(`📁 输出目录: ${distDir}`)
    console.log('\n🚀 安装步骤:')
    console.log('1. 打开Chrome浏览器')
    console.log('2. 访问 chrome://extensions/')
    console.log('3. 开启"开发者模式"')
    console.log('4. 点击"加载已解压的扩展程序"')
    console.log(`5. 选择文件夹: ${distDir}`)
    
  } catch (error) {
    console.error('❌ 构建失败:', error)
    process.exit(1)
  }
}

buildExtension() 