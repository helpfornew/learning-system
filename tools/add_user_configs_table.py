#!/usr/bin/env python3
"""
数据库迁移脚本 - 添加用户配置表

运行方式:
    python3 tools/add_user_configs_table.py
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
        # 创建 user_configs 表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_configs (
                user_id INTEGER PRIMARY KEY,
                config_json TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')

        conn.commit()
        print("✓ 数据库迁移成功")
        print("  已添加表：user_configs")
        return True

    except Exception as e:
        print(f"✗ 迁移失败：{e}")
        return False

    finally:
        conn.close()

if __name__ == '__main__':
    print("╔════════════════════════════════════════════╗")
    print("║  数据库迁移 - 添加用户配置表                ║")
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
