const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')

class MistakeDatabase {
  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'mistakes.db')
    this.db = new Database(dbPath)
    // 检查是否需要初始化
    const initFlagPath = path.join(app.getPath('userData'), '.db-initialized')
    if (!fs.existsSync(initFlagPath)) {
      this.initDatabase()
      fs.writeFileSync(initFlagPath, 'true')
      console.log('[Database] First time initialization completed')
    } else {
      console.log('[Database] Database already initialized, skipping table creation')
    }
  }

  initDatabase() {
    // 创建学科表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#1890FF',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 创建知识点表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER DEFAULT 0,
        subject_id INTEGER NOT NULL,
        level INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
      )
    `)

    // 创建错题表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mistakes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        wrong_answer TEXT,
        correct_answer TEXT,
        error_reason TEXT,
        difficulty INTEGER DEFAULT 3,
        images_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_reviewed DATETIME,
        review_count INTEGER DEFAULT 0,
        mastery_level INTEGER DEFAULT 0,
        is_deleted BOOLEAN DEFAULT 0,
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
      )
    `)

    // 创建错题-知识点关联表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mistake_knowledge (
        mistake_id INTEGER NOT NULL,
        point_id INTEGER NOT NULL,
        relevance REAL DEFAULT 1.0,
        PRIMARY KEY (mistake_id, point_id),
        FOREIGN KEY (mistake_id) REFERENCES mistakes(id),
        FOREIGN KEY (point_id) REFERENCES knowledge_points(id)
      )
    `)

    // 创建复习记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS review_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mistake_id INTEGER NOT NULL,
        review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_correct BOOLEAN DEFAULT 0,
        response_time INTEGER,
        FOREIGN KEY (mistake_id) REFERENCES mistakes(id)
      )
    `)

    // 创建标签表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mistake_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mistake_id INTEGER NOT NULL,
        tag_name TEXT NOT NULL,
        FOREIGN KEY (mistake_id) REFERENCES mistakes(id)
      )
    `)

    // 插入默认学科数据
    this.insertDefaultData()
  }

  insertDefaultData() {
    // 检查是否已有学科数据
    const subjectCount = this.db.prepare('SELECT COUNT(*) as count FROM subjects').get()
    if (subjectCount.count === 0) {
      const defaultSubjects = [
        { name: '语文', color: '#52C41A' },
        { name: '数学', color: '#1890FF' },
        { name: '英语', color: '#FAAD14' },
        { name: '物理', color: '#F5222D' },
        { name: '化学', color: '#722ED1' },
        { name: '生物', color: '#13C2C2' },
        { name: '政治', color: '#EB2F96' },
        { name: '历史', color: '#FA8C16' },
        { name: '地理', color: '#2F54EB' }
      ]

      const insertSubject = this.db.prepare(`
        INSERT INTO subjects (name, color) VALUES (?, ?)
      `)

      const transaction = this.db.transaction((subjects) => {
        for (const subject of subjects) {
          insertSubject.run(subject.name, subject.color)
        }
      })

      transaction(defaultSubjects)
    }
  }

  // 通用查询方法
  query(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql)
      return params.length > 0 ? stmt.all(...params) : stmt.all()
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  // 通用执行方法
  execute(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql)
      return params.length > 0 ? stmt.run(...params) : stmt.run()
    } catch (error) {
      console.error('Database execute error:', error)
      throw error
    }
  }

  // 获取错题列表
  getMistakes(filters = {}) {
    let sql = `
      SELECT 
        m.*,
        s.name as subject_name,
        s.color as subject_color,
        GROUP_CONCAT(DISTINCT kp.name) as knowledge_points,
        GROUP_CONCAT(DISTINCT mt.tag_name) as tags
      FROM mistakes m
      LEFT JOIN subjects s ON m.subject_id = s.id
      LEFT JOIN mistake_knowledge mk ON m.id = mk.mistake_id
      LEFT JOIN knowledge_points kp ON mk.point_id = kp.id
      LEFT JOIN mistake_tags mt ON m.id = mt.mistake_id
      WHERE m.is_deleted = 0
    `

    const params = []
    const conditions = []

    // 应用筛选条件
    if (filters.subject_id) {
      conditions.push('m.subject_id = ?')
      params.push(filters.subject_id)
    }

    if (filters.error_reason) {
      conditions.push('m.error_reason = ?')
      params.push(filters.error_reason)
    }

    if (filters.difficulty_min) {
      conditions.push('m.difficulty >= ?')
      params.push(filters.difficulty_min)
    }

    if (filters.difficulty_max) {
      conditions.push('m.difficulty <= ?')
      params.push(filters.difficulty_max)
    }

    if (filters.mastery_min) {
      conditions.push('m.mastery_level >= ?')
      params.push(filters.mastery_min)
    }

    if (filters.mastery_max) {
      conditions.push('m.mastery_level <= ?')
      params.push(filters.mastery_max)
    }

    if (filters.start_date) {
      conditions.push('m.created_at >= ?')
      params.push(filters.start_date)
    }

    if (filters.end_date) {
      conditions.push('m.created_at <= ?')
      params.push(filters.end_date)
    }

    if (filters.search) {
      conditions.push(`
        (m.content LIKE ? OR 
         m.wrong_answer LIKE ? OR 
         m.correct_answer LIKE ?)
      `)
      const searchTerm = `%${filters.search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' AND ')
    }

    sql += ' GROUP BY m.id ORDER BY m.created_at DESC'

    if (filters.limit) {
      sql += ' LIMIT ?'
      params.push(filters.limit)
    }

    if (filters.offset) {
      sql += ' OFFSET ?'
      params.push(filters.offset)
    }

    return this.query(sql, params)
  }

  // 添加错题
  addMistake(mistake) {
    const {
      subject_id,
      content,
      wrong_answer,
      correct_answer,
      error_reason,
      difficulty,
      images_path,
      knowledge_points,
      tags
    } = mistake

    const insertMistake = this.db.prepare(`
      INSERT INTO mistakes (
        subject_id, content, wrong_answer, correct_answer,
        error_reason, difficulty, images_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const insertMistakeKnowledge = this.db.prepare(`
      INSERT INTO mistake_knowledge (mistake_id, point_id, relevance)
      VALUES (?, ?, ?)
    `)

    const insertTag = this.db.prepare(`
      INSERT INTO mistake_tags (mistake_id, tag_name)
      VALUES (?, ?)
    `)

    return this.db.transaction(() => {
      const result = insertMistake.run(
        subject_id,
        content,
        wrong_answer,
        correct_answer,
        error_reason,
        difficulty,
        images_path || null
      )

      const mistakeId = result.lastInsertRowid

      // 添加知识点关联
      if (knowledge_points && knowledge_points.length > 0) {
        for (const point of knowledge_points) {
          insertMistakeKnowledge.run(mistakeId, point.id, point.relevance || 1.0)
        }
      }

      // 添加标签
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          insertTag.run(mistakeId, tag)
        }
      }

      return { id: mistakeId, ...mistake }
    })()
  }

  // 更新错题
  updateMistake(id, updates) {
    const fields = []
    const params = []

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`)
        params.push(value)
      }
    }

    if (fields.length === 0) {
      return { changes: 0 }
    }

    params.push(id)

    const sql = `UPDATE mistakes SET ${fields.join(', ')} WHERE id = ?`
    return this.execute(sql, params)
  }

  // 删除错题（软删除）
  deleteMistake(id) {
    return this.execute('UPDATE mistakes SET is_deleted = 1 WHERE id = ?', [id])
  }

  // 获取学科列表
  getSubjects() {
    return this.query('SELECT * FROM subjects WHERE is_active = 1 ORDER BY name')
  }

  // 获取知识点树
  getKnowledgeTree(subjectId = null) {
    let sql = 'SELECT * FROM knowledge_points'
    const params = []

    if (subjectId) {
      sql += ' WHERE subject_id = ?'
      params.push(subjectId)
    }

    sql += ' ORDER BY subject_id, parent_id, level, name'
    
    const points = this.query(sql, params)
    
    // 构建树形结构
    const tree = []
    const map = {}

    points.forEach(point => {
      map[point.id] = { ...point, children: [] }
    })

    points.forEach(point => {
      if (point.parent_id === 0) {
        tree.push(map[point.id])
      } else if (map[point.parent_id]) {
        map[point.parent_id].children.push(map[point.id])
      }
    })

    return tree
  }

  // 获取统计数据
  getStatistics() {
    const totalMistakes = this.db.prepare(`
      SELECT COUNT(*) as count FROM mistakes WHERE is_deleted = 0
    `).get()

    const todayMistakes = this.db.prepare(`
      SELECT COUNT(*) as count FROM mistakes 
      WHERE DATE(created_at) = DATE('now') AND is_deleted = 0
    `).get()

    const subjectStats = this.db.prepare(`
      SELECT 
        s.name,
        s.color,
        COUNT(m.id) as mistake_count,
        AVG(m.mastery_level) as avg_mastery
      FROM subjects s
      LEFT JOIN mistakes m ON s.id = m.subject_id AND m.is_deleted = 0
      WHERE s.is_active = 1
      GROUP BY s.id
      ORDER BY mistake_count DESC
    `).all()

    const errorReasonStats = this.db.prepare(`
      SELECT 
        error_reason,
        COUNT(*) as count
      FROM mistakes 
      WHERE error_reason IS NOT NULL AND is_deleted = 0
      GROUP BY error_reason
      ORDER BY count DESC
      LIMIT 5
    `).all()

    return {
      total: totalMistakes.count,
      today: todayMistakes.count,
      bySubject: subjectStats,
      byErrorReason: errorReasonStats
    }
  }

  // 关闭数据库连接
  close() {
    this.db.close()
  }
}

module.exports = MistakeDatabase
