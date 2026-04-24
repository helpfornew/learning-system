#!/usr/bin/env python3
"""
数据库迁移脚本
修复现有数据库的表结构和数据
"""

import sqlite3
import hashlib
import secrets
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACCOUNT_DB = os.path.join(BASE_DIR, 'account_server', 'accounts.db')

def hash_password(password: str, salt: str) -> str:
    """使用 salt 哈希密码"""
    return hashlib.sha256(f'{password}{salt}'.encode()).hexdigest()

def migrate_accounts_db():
    """迁移账号数据库"""
    if not os.path.exists(ACCOUNT_DB):
        print("账号数据库不存在，跳过迁移")
        return

    conn = sqlite3.connect(ACCOUNT_DB)
    cursor = conn.cursor()

    # 启用 WAL 模式
    cursor.execute('PRAGMA journal_mode=WAL')

    # 检查表是否存在
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        print("创建 users 表...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                vip_level INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                expires_at DATETIME,
                device_limit INTEGER DEFAULT 3,
                login_count INTEGER DEFAULT 0,
                token TEXT,
                token_expires_at DATETIME
            )
        ''')

    # 检查是否需要添加新字段
    cursor.execute("PRAGMA table_info(users)")
    columns = {col[1]: col for col in cursor.fetchall()}

    # 添加缺失的字段
    if 'password_hash' not in columns:
        print("添加 password_hash 字段...")
        cursor.execute('ALTER TABLE users ADD COLUMN password_hash TEXT')

    if 'salt' not in columns:
        print("添加 salt 字段...")
        cursor.execute('ALTER TABLE users ADD COLUMN salt TEXT')

    if 'status' not in columns:
        print("添加 status 字段...")
        cursor.execute('ALTER TABLE users ADD COLUMN status TEXT DEFAULT "active"')

    if 'token_expires_at' not in columns:
        print("添加 token_expires_at 字段...")
        cursor.execute('ALTER TABLE users ADD COLUMN token_expires_at DATETIME')

    if 'device_limit' not in columns:
        print("添加 device_limit 字段...")
        cursor.execute('ALTER TABLE users ADD COLUMN device_limit INTEGER DEFAULT 3')

    if 'login_count' not in columns:
        print("添加 login_count 字段...")
        cursor.execute('ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0')

    # 检查是否有旧数据需要迁移（明文密码）
    if 'password' in columns:
        print("检测到旧版 password 字段，正在迁移数据...")
        cursor.execute('SELECT id, password FROM users WHERE password_hash IS NULL AND password IS NOT NULL')
        rows = cursor.fetchall()

        for row in rows:
            user_id, password = row
            salt = secrets.token_hex(16)
            password_hash = hash_password(password, salt)
            cursor.execute('''
                UPDATE users SET password_hash = ?, salt = ? WHERE id = ?
            ''', (password_hash, salt, user_id))
            print(f"  迁移用户 {user_id}")

    conn.commit()
    conn.close()
    print("账号数据库迁移完成")

def migrate_mistake_db():
    """迁移错题数据库"""
    mistake_db = os.path.join(BASE_DIR, 'mistake_system', 'mistake-system-desktop', '.data', 'mistakes.db')

    if not os.path.exists(mistake_db):
        print("错题数据库不存在，跳过迁移")
        return

    conn = sqlite3.connect(mistake_db)
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(mistakes)")
    columns = {col[1]: col for col in cursor.fetchall()}

    # 添加缺失的字段
    if 'review_count' not in columns:
        print("添加 review_count 字段...")
        cursor.execute('ALTER TABLE mistakes ADD COLUMN review_count INTEGER DEFAULT 0')

    if 'last_review_date' not in columns:
        print("添加 last_review_date 字段...")
        cursor.execute('ALTER TABLE mistakes ADD COLUMN last_review_date DATETIME')

    if 'next_review_date' not in columns:
        print("添加 next_review_date 字段...")
        cursor.execute('ALTER TABLE mistakes ADD COLUMN next_review_date DATETIME')

    conn.commit()
    conn.close()
    print("错题数据库迁移完成")

if __name__ == '__main__':
    print("=" * 50)
    print("开始数据库迁移...")
    print("=" * 50)

    migrate_accounts_db()
    migrate_mistake_db()

    print("=" * 50)
    print("数据库迁移完成！")
    print("=" * 50)
