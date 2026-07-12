// 把内容源目录同步到网站目录
// 文件名里的 # 会被浏览器当成 URL 锚点，所以统一替换掉
import fs from 'node:fs'
import path from 'node:path'

const [srcDir, destDir] = process.argv.slice(2)
if (!srcDir || !destDir) {
  console.error('用法: node sync-content.mjs <源目录> <目标目录>')
  process.exit(1)
}

function sanitize(name) {
  return name.replaceAll('#', '第').replaceAll(/[?%]/g, '')
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, sanitize(entry.name))
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

if (!fs.existsSync(srcDir)) {
  console.log(`源目录不存在: ${srcDir}，跳过同步`)
  process.exit(0)
}

copyDir(srcDir, destDir)
console.log('同步完成，文件列表:')
for (const f of fs.readdirSync(destDir, { recursive: true })) console.log(' -', f)
