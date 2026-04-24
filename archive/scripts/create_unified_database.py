#!/usr/bin/env python3
"""
统一数据库创建和数据迁移脚本
将原来的三个数据库合并到一个统一数据库中
"""

import sqlite3
import os
from pathlib import Path

# 定义数据库路径
BASE_DIR = Path.home() / 'learning_system'
DATABASE_DIR = BASE_DIR / 'database'
UNIFIED_DB_PATH = DATABASE_DIR / 'unified_learning.db'

# 原数据库路径
ACCOUNT_DB_PATH = BASE_DIR / 'account_server' / 'accounts.db'
MISTAKE_DB_PATH = BASE_DIR / 'mistake_system' / 'mistake-system-desktop' / '.data' / 'mistakes.db'
STUDY_TIME_DB_PATH = BASE_DIR / 'progress' / 'study_time.db'

def create_unified_database():
    """创建统一数据库结构"""
    # 创建数据库目录
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)

    # 连接到统一数据库
    conn = sqlite3.connect(UNIFIED_DB_PATH)
    cursor = conn.cursor()

    # 创建 users 表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            is_active BOOLEAN DEFAULT 1,
            vip_level INTEGER DEFAULT 0,
            expiration_date DATE,
            status TEXT DEFAULT 'active',
            expires_at TEXT,
            device_limit INTEGER DEFAULT 3,
            login_count INTEGER DEFAULT 0
        )
    ''')

    # 创建 mistakes 表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mistakes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            subject_id INTEGER NOT NULL,
            content TEXT,
            wrong_answer TEXT,
            correct_answer TEXT,
            error_reason TEXT,
            difficulty INTEGER DEFAULT 2,
            images_path TEXT,
            knowledge_points TEXT,
            tags TEXT,
            analysis TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_deleted BOOLEAN DEFAULT 0,
            review_count INTEGER DEFAULT 0,
            last_review_date TEXT,
            next_review_date TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # 创建 study_time 表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS study_time (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            subject TEXT NOT NULL,
            duration REAL NOT NULL,
            date TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # 创建 course_schedule 表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS course_schedule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            subject TEXT NOT NULL,
            weekday INTEGER NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # 创建 user_preferences 表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            key TEXT NOT NULL,
            value TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, key)
        )
    ''')

    conn.commit()
    conn.close()
    print("✅ 统一数据库结构创建成功")


def migrate_data():
    """迁移数据从旧数据库到统一数据库"""
    # 连接数据库
    unified_conn = sqlite3.connect(UNIFIED_DB_PATH)
    unified_cursor = unified_conn.cursor()

    print("开始数据迁移...")

    # 迁移用户数据
    if ACCOUNT_DB_PATH.exists():
        account_conn = sqlite3.connect(ACCOUNT_DB_PATH)
        account_cursor = account_conn.cursor()

        try:
            account_cursor.execute("SELECT * FROM users")
            users = account_cursor.fetchall()

            if users:
                # 获取列信息
                columns = [description[0] for description in account_cursor.description]

                # 插入用户数据
                for user in users:
                    user_dict = dict(zip(columns, user))

                    # 构建插入语句，只插入统一数据库中存在的列
                    unified_columns = [
                        'username', 'email', 'password_hash', 'salt',
                        'created_at', 'last_login', 'is_active', 'vip_level',
                        'expiration_date', 'status', 'expires_at',
                        'device_limit', 'login_count'
                    ]

                    placeholders = ', '.join(['?' for _ in unified_columns])
                    columns_str = ', '.join(unified_columns)

                    values = []
                    for col in unified_columns:
                        val = user_dict.get(col)
                        # 处理默认值
                        if col == 'is_active' and val is None:
                            val = 1
                        elif col == 'vip_level' and val is None:
                            val = 0
                        elif col == 'device_limit' and val is None:
                            val = 3
                        elif col == 'login_count' and val is None:
                            val = 0
                        elif col == 'status' and val is None:
                            val = 'active'

                        values.append(val)

                    unified_cursor.execute(f'''
                        INSERT OR IGNORE INTO users ({columns_str})
                        VALUES ({placeholders})
                    ''', values)

                print(f"✅ 成功迁移 {len(users)} 个用户")
            else:
                print("ℹ️  用户数据为空")

        except Exception as e:
            print(f"⚠️ 迁移用户数据时出错: {e}")
        finally:
            account_conn.close()

    # 迁移错题数据
    if MISTAKE_DB_PATH.exists():
        mistake_conn = sqlite3.connect(MISTAKE_DB_PATH)
        mistake_cursor = mistake_conn.cursor()

        try:
            mistake_cursor.execute("SELECT * FROM mistakes")
            mistakes = mistake_cursor.fetchall()

            if mistakes:
                # 获取列信息
                columns = [description[0] for description in mistake_cursor.description]

                # 插入错题数据
                for mistake in mistakes:
                    mistake_dict = dict(zip(columns, mistake))

                    # 构建插入语句，只插入统一数据库中存在的列
                    unified_columns = [
                        'user_id', 'subject_id', 'content', 'wrong_answer',
                        'correct_answer', 'error_reason', 'difficulty', 'images_path',
                        'knowledge_points', 'tags', 'analysis', 'is_deleted',
                        'review_count', 'last_review_date', 'next_review_date'
                    ]

                    placeholders = ', '.join(['?' for _ in unified_columns])
                    columns_str = ', '.join(unified_columns)

                    values = []
                    for col in unified_columns:
                        val = mistake_dict.get(col)
                        # 处理默认值
                        if col == 'difficulty' and val is None:
                            val = 2
                        elif col == 'is_deleted' and val is None:
                            val = 0
                        elif col == 'review_count' and val is None:
                            val = 0

                        values.append(val)

                    # 确保user_id存在，否则设置为默认值1
                    if mistake_dict.get('user_id') is None:
                        values[0] = 1  # 设置为默认用户ID

                    unified_cursor.execute(f'''
                        INSERT INTO mistakes ({columns_str})
                        VALUES ({placeholders})
                    ''', values)

                print(f"✅ 成功迁移 {len(mistakes)} 个错题")
            else:
                print("ℹ️  错题数据为空")

        except Exception as e:
            print(f"⚠️ 迁移错题数据时出错: {e}")
        finally:
            mistake_conn.close()

    # 迁移学习时间数据
    if STUDY_TIME_DB_PATH.exists():
        study_conn = sqlite3.connect(STUDY_TIME_DB_PATH)
        study_cursor = study_conn.cursor()

        try:
            study_cursor.execute("SELECT * FROM study_time")
            study_times = study_cursor.fetchall()

            if study_times:
                # 获取列信息
                columns = [description[0] for description in study_cursor.description]

                # 插入学习时间数据
                for study_time in study_times:
                    study_time_dict = dict(zip(columns, study_time))

                    # 构建插入语句，只插入统一数据库中存在的列
                    unified_columns = [
                        'user_id', 'subject', 'duration', 'date'
                    ]

                    placeholders = ', '.join(['?' for _ in unified_columns])
                    columns_str = ', '.join(unified_columns)

                    values = []
                    for col in unified_columns:
                        val = study_time_dict.get(col)
                        # 处理默认值
                        if col == 'user_id' and val is None:
                            val = 1  # 设置为默认用户ID

                        values.append(val)

                    unified_cursor.execute(f'''
                        INSERT INTO study_time ({columns_str})
                        VALUES ({placeholders})
                    ''', values)

                print(f"✅ 成功迁移 {len(study_times)} 条学习时间记录")
            else:
                print("ℹ️  学习时间数据为空")

        except Exception as e:
            print(f"⚠️ 迁移学习时间数据时出错: {e}")
        finally:
            study_conn.close()

    unified_conn.commit()
    unified_conn.close()
    print("✅ 数据迁移完成")


def backup_old_databases():
    """备份旧数据库"""
    backup_dir = DATABASE_DIR / 'backup'
    backup_dir.mkdir(parents=True, exist_ok=True)

    databases_to_backup = [
        (ACCOUNT_DB_PATH, 'accounts_backup.db'),
        (MISTAKE_DB_PATH, 'mistakes_backup.db'),
        (STUDY_TIME_DB_PATH, 'study_time_backup.db')
    ]

    for db_path, backup_name in databases_to_backup:
        if db_path.exists():
            backup_path = backup_dir / backup_name
            # 创建备份目录
            os.makedirs(backup_dir, exist_ok=True)
            import shutil
            shutil.copy2(db_path, backup_path)
            print(f"✅ 已备份 {db_path.name} 到 {backup_path}")


if __name__ == "__main__":
    print("🚀 开始创建统一数据库和数据迁移...")

    # 检查数据库是否已存在
    if UNIFIED_DB_PATH.exists():
        print(f"ℹ️  统一数据库已存在: {UNIFIED_DB_PATH}")
        response = input("是否要继续执行迁移？(y/N): ")
        if response.lower() != 'y':
            print("操作已取消")
            exit(0)

    # 备份旧数据库
    print("\n📂 正在备份旧数据库...")
    backup_old_databases()

    # 创建统一数据库
    print("\n🔧 正在创建统一数据库结构...")
    create_unified_database()

    # 迁移数据
    print("\n🚚 正在迁移数据...")
    migrate_data()

    print(f"\n🎉 统一数据库创建完成！")
    print(f"📁 数据库位置: {UNIFIED_DB_PATH}")
    print(f"📋 数据表: users, mistakes, study_time, course_schedule, user_preferences")

    print(f"\n⚠️  旧数据库已备份到: {DATABASE_DIR / 'backup'}")
    print("   建议在确认新系统运行正常后，再删除备份文件")