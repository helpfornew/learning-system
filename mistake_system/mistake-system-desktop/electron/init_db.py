#!/usr/bin/env python3
import sqlite3
import os
from pathlib import Path

home = str(Path.home())
# 统一路径配置 - 与 toolLauncher.js 保持一致
db_path = os.path.join(home, '学习系统/错题系统/database/mistakes.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 创建学科表
cursor.execute('''
  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#1890FF',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
''')

# 创建知识点表
cursor.execute('''
  CREATE TABLE IF NOT EXISTS knowledge_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER DEFAULT 0,
    subject_id INTEGER NOT NULL,
    level INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  )
''')

# 创建错题表
cursor.execute('''
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
''')

# 创建错题-知识点关联表
cursor.execute('''
  CREATE TABLE IF NOT EXISTS mistake_knowledge (
    mistake_id INTEGER NOT NULL,
    point_id INTEGER NOT NULL,
    relevance REAL DEFAULT 1.0,
    PRIMARY KEY (mistake_id, point_id),
    FOREIGN KEY (mistake_id) REFERENCES mistakes(id),
    FOREIGN KEY (point_id) REFERENCES knowledge_points(id)
  )
''')

# 创建复习记录表
cursor.execute('''
  CREATE TABLE IF NOT EXISTS review_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mistake_id INTEGER NOT NULL,
    review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_correct BOOLEAN DEFAULT 0,
    response_time INTEGER,
    FOREIGN KEY (mistake_id) REFERENCES mistakes(id)
  )
''')

# 创建标签表
cursor.execute('''
  CREATE TABLE IF NOT EXISTS mistake_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mistake_id INTEGER NOT NULL,
    tag_name TEXT NOT NULL,
    FOREIGN KEY (mistake_id) REFERENCES mistakes(id)
  )
''')

# 插入默认学科
default_subjects = [
    ('语文', '#52C41A'),
    ('数学', '#1890FF'),
    ('英语', '#FAAD14'),
    ('物理', '#F5222D'),
    ('化学', '#722ED1'),
    ('生物', '#13C2C2'),
    ('政治', '#EB2F96'),
    ('历史', '#FA8C16'),
    ('地理', '#2F54EB')
]

for name, color in default_subjects:
    cursor.execute('INSERT OR IGNORE INTO subjects (name, color) VALUES (?, ?)', (name, color))

conn.commit()
conn.close()
print('数据库初始化完成')
