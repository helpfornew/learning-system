#!/usr/bin/env python3
"""
学习平台数据迁移脚本
将 learning-platform/database.db 迁移到统一数据库
"""

import sqlite3
import os
import sys

def migrate_learning_platform_data():
    """迁移学习平台数据到统一数据库"""

    # 数据库路径
    old_db_path = os.path.join(os.path.dirname(__file__), '..', 'learning-platform', 'database.db')
    new_db_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'unified_learning.db')

    if not os.path.exists(old_db_path):
        print(f"源数据库不存在: {old_db_path}")
        print("没有旧数据需要迁移")
        return

    print(f"源数据库: {old_db_path}")
    print(f"目标数据库: {new_db_path}")

    # 连接数据库
    old_conn = sqlite3.connect(old_db_path)
    old_conn.row_factory = sqlite3.Row

    new_conn = sqlite3.connect(new_db_path)
    new_conn.row_factory = sqlite3.Row

    old_c = old_conn.cursor()
    new_c = new_conn.cursor()

    # 检查表是否存在
    old_c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    old_tables = {row[0] for row in old_c.fetchall()}
    print(f"\n源数据库表: {old_tables}")

    # 1. 迁移科目 (subjects -> lp_subjects)
    if 'subjects' in old_tables:
        print("\n[1/5] 迁移科目数据...")
        old_c.execute('SELECT id, key, name, logo, color, description, sort_order, is_active FROM subjects')
        subjects = old_c.fetchall()

        for s in subjects:
            try:
                new_c.execute('''
                    INSERT OR REPLACE INTO lp_subjects (id, key, name, logo, color, description, sort_order, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (s['id'], s['key'], s['name'], s['logo'], s['color'], s['description'], s['sort_order'], s['is_active']))
                print(f"  ✓ 科目: {s['key']} - {s['name']}")
            except Exception as e:
                print(f"  ✗ 科目 {s['key']}: {e}")

    # 2. 迁移章节 (chapters -> lp_chapters)
    if 'chapters' in old_tables:
        print("\n[2/5] 迁移章节数据...")
        old_c.execute('''
            SELECT id, subject_id, key, title, description, content, sort_order, is_active
            FROM chapters
        ''')
        chapters = old_c.fetchall()

        for c in chapters:
            try:
                new_c.execute('''
                    INSERT OR REPLACE INTO lp_chapters
                    (id, subject_id, key, title, description, content, sort_order, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (c['id'], c['subject_id'], c['key'], c['title'], c['description'], c['content'], c['sort_order'], c['is_active']))
                print(f"  ✓ 章节: {c['key']} - {c['title'][:30]}...")
            except Exception as e:
                print(f"  ✗ 章节 {c['key']}: {e}")

    # 3. 迁移阅读进度 (reading_progress -> lp_reading_progress)
    if 'reading_progress' in old_tables:
        print("\n[3/5] 迁移阅读进度...")
        old_c.execute('SELECT user_id, chapter_key, last_read_at, read_count FROM reading_progress')
        progresses = old_c.fetchall()

        for p in progresses:
            try:
                new_c.execute('''
                    INSERT OR REPLACE INTO lp_reading_progress
                    (user_id, chapter_key, last_read_at, read_count)
                    VALUES (?, ?, ?, ?)
                ''', (p['user_id'], p['chapter_key'], p['last_read_at'], p['read_count']))
                print(f"  ✓ 阅读进度: user={p['user_id']}, chapter={p['chapter_key']}")
            except Exception as e:
                print(f"  ✗ 阅读进度: {e}")

    # 4. 迁移已掌握章节 (mastered_chapters -> lp_mastered_chapters)
    if 'mastered_chapters' in old_tables:
        print("\n[4/5] 迁移已掌握章节...")
        old_c.execute('SELECT user_id, chapter_key, mastered_at FROM mastered_chapters')
        mastered = old_c.fetchall()

        for m in mastered:
            try:
                new_c.execute('''
                    INSERT OR REPLACE INTO lp_mastered_chapters
                    (user_id, chapter_key, mastered_at)
                    VALUES (?, ?, ?)
                ''', (m['user_id'], m['chapter_key'], m['mastered_at']))
                print(f"  ✓ 掌握: user={m['user_id']}, chapter={m['chapter_key']}")
            except Exception as e:
                print(f"  ✗ 掌握记录: {e}")

    # 5. 迁移涂鸦数据 (canvas_drawings -> lp_canvas_drawings)
    if 'canvas_drawings' in old_tables:
        print("\n[5/5] 迁移涂鸦数据...")
        old_c.execute('SELECT user_id, chapter_key, drawing_data, updated_at FROM canvas_drawings')
        drawings = old_c.fetchall()

        for d in drawings:
            try:
                new_c.execute('''
                    INSERT OR REPLACE INTO lp_canvas_drawings
                    (user_id, chapter_key, drawing_data, updated_at)
                    VALUES (?, ?, ?, ?)
                ''', (d['user_id'], d['chapter_key'], d['drawing_data'], d['updated_at']))
                print(f"  ✓ 涂鸦: user={d['user_id']}, chapter={d['chapter_key']}")
            except Exception as e:
                print(f"  ✗ 涂鸦: {e}")

    # 提交事务
    new_conn.commit()

    # 统计
    print("\n" + "=" * 50)
    print("迁移完成!")
    print("=" * 50)

    # 验证迁移结果
    new_c.execute('SELECT COUNT(*) FROM lp_subjects')
    subject_count = new_c.fetchone()[0]

    new_c.execute('SELECT COUNT(*) FROM lp_chapters')
    chapter_count = new_c.fetchone()[0]

    new_c.execute('SELECT COUNT(*) FROM lp_reading_progress')
    progress_count = new_c.fetchone()[0]

    new_c.execute('SELECT COUNT(*) FROM lp_mastered_chapters')
    mastered_count = new_c.fetchone()[0]

    new_c.execute('SELECT COUNT(*) FROM lp_canvas_drawings')
    drawing_count = new_c.fetchone()[0]

    print(f"科目数: {subject_count}")
    print(f"章节数: {chapter_count}")
    print(f"阅读进度: {progress_count}")
    print(f"已掌握: {mastered_count}")
    print(f"涂鸦数据: {drawing_count}")

    old_conn.close()
    new_conn.close()

    print("\n数据迁移成功!")

if __name__ == '__main__':
    migrate_learning_platform_data()
