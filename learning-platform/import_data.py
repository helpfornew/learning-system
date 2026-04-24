#!/usr/bin/env python3
"""
导入静态化学数据到数据库
"""

import sqlite3
import re
import os

def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def parse_js_file(filepath):
    """解析JS文件，提取章节数据"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    chapters = []

    # 匹配章节定义模式：key: { title: "...", description: "...", content: `...` }
    # 使用更宽松的模式匹配
    pattern = r'(\w+)\s*:\s*\{[^}]*title\s*:\s*"([^"]*)"[^}]*description\s*:\s*"([^"]*)"[^}]*content\s*:\s*`([^`]+)`[^}]*\}'

    matches = re.findall(pattern, content, re.DOTALL)

    for match in matches:
        key, title, description, content = match
        chapters.append({
            'key': key,
            'title': title,
            'description': description,
            'content': content.strip()
        })

    return chapters

def import_chemistry_data():
    """导入化学数据"""
    conn = get_db()
    cursor = conn.cursor()

    # 确保化学科目存在
    cursor.execute('''
        INSERT OR IGNORE INTO subjects (key, name, logo, color, description, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', ('chemistry', '化学', 'Chem', '#4c9aff', '高中化学核心知识', 0))

    cursor.execute('SELECT id FROM subjects WHERE key = ?', ('chemistry',))
    subject_id = cursor.fetchone()['id']

    # 数据文件映射
    data_files = [
        ('data/intro.js', 0),      # 化学基本概念
        ('data/reaction.js', 10),  # 化学反应基础
        ('data/metal.js', 20),     # 金属元素
        ('data/nonmetal.js', 30),  # 非金属元素
        ('data/structure.js', 40), # 物质结构
        ('data/principle.js', 50), # 化学反应原理
        ('data/organic.js', 60),   # 有机化学
        ('data/lab.js', 70),       # 化学实验
        ('data/calculation.js', 80),  # 化学计算
        ('data/equations.js', 90),    # 化学方程式
    ]

    total_imported = 0

    for filepath, base_order in data_files:
        if not os.path.exists(filepath):
            print(f"文件不存在: {filepath}")
            continue

        print(f"\n正在导入: {filepath}")
        chapters = parse_js_file(filepath)

        for idx, chapter in enumerate(chapters):
            try:
                cursor.execute('''
                    INSERT OR REPLACE INTO chapters
                    (subject_id, key, title, description, content, sort_order, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, 1)
                ''', (
                    subject_id,
                    chapter['key'],
                    chapter['title'],
                    chapter['description'],
                    chapter['content'],
                    base_order + idx
                ))
                total_imported += 1
                print(f"  ✓ {chapter['key']}: {chapter['title']}")
            except Exception as e:
                print(f"  ✗ {chapter['key']}: {e}")

    conn.commit()
    conn.close()

    print(f"\n导入完成! 共导入 {total_imported} 个章节")

if __name__ == '__main__':
    import_chemistry_data()
