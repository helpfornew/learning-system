#!/usr/bin/env python3
"""
数据库迁移脚本 - 添加 token 相关字段

运行方式:
    python3 tools/fix_users_table.py
"""

import sqlite3
import os

# 数据库路径
ACCOUNT_DB = os.path.expanduser('~/learning_system/account_server/accounts.db')

def migrate():
    """执行数据库迁移"""
    if not os.path.exists(ACCOUNT_DB):
        print(f"错误：数据库不存在 {ACCOUNT_DB}")
        return False

    conn = sqlite3.connect(ACCOUNT_DB)
    cursor = conn.cursor()

    try:
        # 检查字段是否存在
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]

        # 添加缺失的字段
        if 'token' not in columns:
            cursor.execute('ALTER TABLE users ADD COLUMN token TEXT')
            print("✓ 添加字段：token")

        if 'token_expires_at' not in columns:
            cursor.execute('ALTER TABLE users ADD COLUMN token_expires_at DATETIME')
            print("✓ 添加字段：token_expires_at")

        if 'vip_level' not in columns:
            cursor.execute('ALTER TABLE users ADD COLUMN vip_level INTEGER DEFAULT 0')
            print("✓ 添加字段：vip_level")

        if 'expires_at' not in columns:
            cursor.execute('ALTER TABLE users ADD COLUMN expires_at DATETIME')
            print("✓ 添加字段：expires_at")

        # 创建 user_configs 表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_configs (
                user_id INTEGER PRIMARY KEY,
                config_json TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        print("✓ 创建表：user_configs")

        conn.commit()
        print()
        print("✓ 数据库迁移成功")
        return True

    except Exception as e:
        print(f"✗ 迁移失败：{e}")
        return False

    finally:
        conn.close()

if __name__ == '__main__':
    print("╔════════════════════════════════════════════╗")
    print("║  数据库迁移 - 修复 users 表                   ║")
    print("╚════════════════════════════════════════════╝")
    print()
    print(f"数据库路径：{ACCOUNT_DB}")
    print()

    if migrate():
        print()
        print("迁移完成!")
    else:
        print()
        print("迁移失败，请检查错误信息")
