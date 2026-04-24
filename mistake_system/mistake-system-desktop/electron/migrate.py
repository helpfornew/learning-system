#!/usr/bin/env python3
import sqlite3
import os
import shutil
from pathlib import Path
from datetime import datetime

# 统一路径配置
home = str(Path.home())
# Web 版路径（旧）
web_db_path = os.path.join(home, '学习系统/工具/错题管理系统/database/mistakes.db')
web_uploads_dir = os.path.join(home, '学习系统/工具/错题管理系统/uploads/mistakes')
# Electron 版路径（新）- 统一路径
electron_db_path = os.path.join(home, '学习系统/错题系统/database/mistakes.db')
electron_uploads_dir = os.path.join(home, '学习系统/错题系统/uploads/mistakes')

# 学科映射
subject_map = {
    '语文': '语文',
    '数学': '数学',
    '英语': '英语',
    '物理': '物理',
    '化学': '化学',
    '政治': '政治',
    '其他': '其他'
}

def migrate():
    try:
        print('开始迁移数据...')

        # 打开两个数据库
        web_conn = sqlite3.connect(web_db_path)
        web_conn.row_factory = sqlite3.Row
        web_cursor = web_conn.cursor()

        electron_conn = sqlite3.connect(electron_db_path)
        electron_cursor = electron_conn.cursor()

        # 获取Web版的所有错题
        web_cursor.execute('''
            SELECT m.*, GROUP_CONCAT(t.name) as tag_names
            FROM mistakes m
            LEFT JOIN mistake_tags mt ON m.id = mt.mistake_id
            LEFT JOIN tags t ON mt.tag_id = t.id
            GROUP BY m.id
        ''')
        web_mistakes = web_cursor.fetchall()

        print(f'找到 {len(web_mistakes)} 条Web版错题')

        # 获取Electron版的学科ID映射
        electron_cursor.execute('SELECT id, name FROM subjects')
        subjects = electron_cursor.fetchall()
        subject_id_map = {row[1]: row[0] for row in subjects}

        # 迁移数据
        success_count = 0
        error_count = 0

        for mistake in web_mistakes:
            try:
                subject_id = subject_id_map.get(mistake['subject'], subject_id_map.get('其他', 1))
                mastery_level = 100 if mistake['reviewed'] else 0

                electron_cursor.execute('''
                    INSERT INTO mistakes (
                        subject_id, content, images_path, created_at, mastery_level
                    ) VALUES (?, ?, ?, ?, ?)
                ''', (
                    subject_id,
                    mistake['content'],
                    mistake['image_path'],
                    mistake['date_created'],
                    mastery_level
                ))

                mistake_id = electron_cursor.lastrowid

                # 插入标签
                if mistake['tag_names']:
                    tags = mistake['tag_names'].split(',')
                    for tag in tags:
                        electron_cursor.execute('''
                            INSERT INTO mistake_tags (mistake_id, tag_name) VALUES (?, ?)
                        ''', (mistake_id, tag.strip()))

                success_count += 1
            except Exception as e:
                print(f'迁移错题失败: {mistake["id"]} - {str(e)}')
                error_count += 1

        electron_conn.commit()

        # 复制图片文件
        print('复制图片文件...')
        if os.path.exists(web_uploads_dir):
            os.makedirs(electron_uploads_dir, exist_ok=True)
            for file in os.listdir(web_uploads_dir):
                src = os.path.join(web_uploads_dir, file)
                dest = os.path.join(electron_uploads_dir, file)
                if not os.path.exists(dest):
                    shutil.copy2(src, dest)
                    print(f'复制图片: {file}')

        web_conn.close()
        electron_conn.close()

        print(f'\n迁移完成！')
        print(f'成功: {success_count}')
        print(f'失败: {error_count}')

    except Exception as e:
        print(f'迁移失败: {str(e)}')
        exit(1)

if __name__ == '__main__':
    migrate()
