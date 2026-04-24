const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const os = require('os')

// Web版数据库路径
const webDbPath = path.join(os.homedir(), '学习系统/工具/错题管理系统/database/mistakes.db')
// Electron版数据库路径
const electronDbPath = path.join(os.homedir(), '学习系统/错题系统/mistake-system-desktop/database/mistakes.db')

// 学科名称映射
const subjectMap = {
  '语文': '语文',
  '数学': '数学',
  '英语': '英语',
  '物理': '物理',
  '化学': '化学',
  '政治': '政治',
  '其他': '其他'
}

function migrate() {
  try {
    console.log('开始迁移数据...')

    // 打开两个数据库
    const webDb = new Database(webDbPath)
    const electronDb = new Database(electronDbPath)

    // 获取Web版的所有错题
    const webMistakes = webDb.prepare(`
      SELECT m.*, GROUP_CONCAT(t.name) as tag_names
      FROM mistakes m
      LEFT JOIN mistake_tags mt ON m.id = mt.mistake_id
      LEFT JOIN tags t ON mt.tag_id = t.id
      GROUP BY m.id
    `).all()

    console.log(`找到 ${webMistakes.length} 条Web版错题`)

    // 获取Electron版的学科ID映射
    const subjects = electronDb.prepare('SELECT id, name FROM subjects').all()
    const subjectIdMap = {}
    subjects.forEach(s => {
      subjectIdMap[s.name] = s.id
    })

    // 准备插入语句
    const insertMistake = electronDb.prepare(`
      INSERT INTO mistakes (
        subject_id, content, images_path, created_at, mastery_level
      ) VALUES (?, ?, ?, ?, ?)
    `)

    const insertTag = electronDb.prepare(`
      INSERT INTO mistake_tags (mistake_id, tag_name) VALUES (?, ?)
    `)

    // 迁移数据
    let successCount = 0
    let errorCount = 0

    const transaction = electronDb.transaction(() => {
      webMistakes.forEach(mistake => {
        try {
          const subjectId = subjectIdMap[mistake.subject] || subjectIdMap['其他']
          const masteryLevel = mistake.reviewed ? 100 : 0

          const result = insertMistake.run(
            subjectId,
            mistake.content,
            mistake.image_path,
            mistake.date_created,
            masteryLevel
          )

          // 插入标签
          if (mistake.tag_names) {
            const tags = mistake.tag_names.split(',')
            tags.forEach(tag => {
              insertTag.run(result.lastInsertRowid, tag.trim())
            })
          }

          successCount++
        } catch (err) {
          console.error(`迁移错题失败: ${mistake.id}`, err.message)
          errorCount++
        }
      })
    })

    transaction()

    // 复制图片文件
    console.log('复制图片文件...')
    const webUploadsDir = path.join(os.homedir(), '学习系统/工具/错题管理系统/uploads/mistakes')
    const electronUploadsDir = path.join(os.homedir(), '学习系统/错题系统/mistake-system-desktop/uploads/mistakes')

    // 创建目标目录
    if (!fs.existsSync(electronUploadsDir)) {
      fs.mkdirSync(electronUploadsDir, { recursive: true })
    }

    // 复制图片
    if (fs.existsSync(webUploadsDir)) {
      const files = fs.readdirSync(webUploadsDir)
      files.forEach(file => {
        const src = path.join(webUploadsDir, file)
        const dest = path.join(electronUploadsDir, file)
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(src, dest)
          console.log(`复制图片: ${file}`)
        }
      })
    }

    webDb.close()
    electronDb.close()

    console.log(`\n迁移完成！`)
    console.log(`成功: ${successCount}`)
    console.log(`失败: ${errorCount}`)

  } catch (error) {
    console.error('迁移失败:', error)
    process.exit(1)
  }
}

// 运行迁移
migrate()
