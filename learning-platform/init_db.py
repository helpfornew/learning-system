#!/usr/bin/env python3
"""
数据库初始化脚本
创建表结构并添加默认账号
"""

import sqlite3
import os
from werkzeug.security import generate_password_hash

DATABASE = 'database.db'


def init_database():
    """初始化数据库"""

    # 如果数据库已存在，先删除（开发环境）
    # 生产环境应使用迁移工具
    if os.path.exists(DATABASE):
        print(f"数据库已存在: {DATABASE}")
        conn = sqlite3.connect(DATABASE)
    else:
        print(f"创建新数据库: {DATABASE}")
        conn = sqlite3.connect(DATABASE)

    cursor = conn.cursor()

    # 创建用户表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print("✓ 用户表已创建")

    # 创建阅读记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reading_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            chapter_key TEXT NOT NULL,
            last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_count INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, chapter_key)
        )
    ''')
    print("✓ 阅读记录表已创建")

    # 创建掌握记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mastered_chapters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            chapter_key TEXT NOT NULL,
            mastered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, chapter_key)
        )
    ''')
    # 创建涂鸦记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS canvas_drawings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            chapter_key TEXT NOT NULL,
            drawing_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, chapter_key)
        )
    ''')
    print("✓ 涂鸦记录表已创建")

    # 创建默认账号
    cursor.execute('SELECT id FROM users WHERE username = ?', ('admin',))
    if cursor.fetchone():
        print("✓ 默认账号已存在 (admin)")
    else:
        password_hash = generate_password_hash('chem123456')
        cursor.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            ('admin', password_hash)
        )
        print("✓ 默认账号已创建")
        print("  - 用户名: admin")
        print("  - 密码: chem123456")

    conn.commit()
    conn.close()
    print("\n数据库初始化完成！")


if __name__ == '__main__':
    init_database()
