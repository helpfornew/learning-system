#!/usr/bin/env python3
"""
高考学习系统 - 同步词汇到生产数据库
用于将开发环境的词汇数据同步到生产环境
"""

import sqlite3
import shutil
import os
import sys

PROD_DB = '/var/lib/learning-system/database/unified_learning.db'
DEV_DB = os.path.join(os.path.dirname(__file__), '..', 'database', 'unified_learning.db')
TEMP_DB = '/tmp/temp_prod_vocab.db'

def main():
    print("高考学习系统 - 词汇同步工具")
    print("=" * 50)

    # 检查开发数据库
    if not os.path.exists(DEV_DB):
        print(f"错误：开发数据库不存在：{DEV_DB}")
        sys.exit(1)

    # 从开发数据库读取词汇
    source_conn = sqlite3.connect(DEV_DB)
    source_cursor = source_conn.cursor()
    source_cursor.execute('SELECT COUNT(*) FROM vocabulary')
    dev_count = source_cursor.fetchone()[0]
    print(f"开发数据库词汇数：{dev_count}")

    if dev_count == 0:
        print("错误：开发数据库中没有词汇数据")
        source_conn.close()
        sys.exit(1)

    source_cursor.execute('SELECT * FROM vocabulary')
    words = source_cursor.fetchall()
    source_conn.close()

    # 检查生产数据库
    if not os.path.exists(PROD_DB):
        print(f"错误：生产数据库不存在：{PROD_DB}")
        sys.exit(1)

    # 复制生产数据库到临时位置
    try:
        shutil.copy(PROD_DB, TEMP_DB)
        print(f"已复制生产数据库到：{TEMP_DB}")
    except Exception as e:
        print(f"错误：无法复制生产数据库：{e}")
        sys.exit(1)

    # 导入到临时数据库
    target_conn = sqlite3.connect(TEMP_DB)
    target_cursor = target_conn.cursor()

    target_cursor.execute('SELECT COUNT(*) FROM vocabulary')
    before_count = target_cursor.fetchone()[0]
    print(f"生产数据库当前词汇数：{before_count}")

    imported = 0
    skipped = 0
    for word in words:
        try:
            target_cursor.execute('''
                INSERT OR IGNORE INTO vocabulary
                (user_id, word, phonetic, definition, example_sentence, example_translation,
                 part_of_speech, tags, difficulty_level, status, "熟练度", next_review,
                 review_count, last_reviewed, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (1, word[2], word[3], word[4], word[5], word[6], word[7], word[8],
                  word[9], word[10], word[11], word[12], word[13], word[14], word[15], word[16]))
            if target_cursor.rowcount > 0:
                imported += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"导入失败 {word[2]}: {e}")

    target_conn.commit()

    target_cursor.execute('SELECT COUNT(*) FROM vocabulary')
    after_count = target_cursor.fetchone()[0]
    print(f"导入后临时数据库词汇数：{after_count}")
    print(f"新导入：{imported}, 跳过：{skipped}")

    target_conn.close()

    # 提示用户手动复制
    print()
    print("=" * 50)
    print("临时数据库已准备就绪，请执行以下命令完成同步:")
    print(f"  sudo cp {TEMP_DB} {PROD_DB}")
    print(f"  sudo systemctl restart learning-system")
    print("=" * 50)

if __name__ == '__main__':
    main()
