#!/usr/bin/env python3
"""
高考学习系统 - 单词本数据库表迁移脚本
添加 vocabulary（单词本）和 vocabulary_learning_record（单词学习记录）表
"""

import sqlite3
import os

# 数据库路径
DB_DIR = os.path.join(os.path.dirname(__file__), '..', 'database')
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, 'unified_learning.db')

def migrate():
    """创建单词本相关数据表"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 创建单词本表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vocabulary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            word TEXT NOT NULL,
            phonetic TEXT,
            definition TEXT NOT NULL,
            example_sentence TEXT,
            example_translation TEXT,
            part_of_speech TEXT,
            tags TEXT,
            difficulty_level INTEGER DEFAULT 1,
            status TEXT DEFAULT 'new',
           熟练度 INTEGER DEFAULT 0,
            next_review DATETIME,
            review_count INTEGER DEFAULT 0,
            last_reviewed DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, word)
        )
    ''')

    # 创建单词学习记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vocabulary_learning_record (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            vocabulary_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            result TEXT,
            response_time_ms INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE CASCADE
        )
    ''')

    # 创建索引
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id ON vocabulary(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_vocabulary_status ON vocabulary(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_vocabulary_next_review ON vocabulary(next_review)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_learning_record_user_id ON vocabulary_learning_record(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_learning_record_vocab_id ON vocabulary_learning_record(vocabulary_id)')

    conn.commit()
    conn.close()

    print(f"✓ 单词本数据库表创建完成：{DB_PATH}")

if __name__ == '__main__':
    migrate()
