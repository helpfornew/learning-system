#!/usr/bin/env python3
"""
化学学习网站后端服务
Flask + SQLite + JWT认证
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from datetime import datetime, timedelta

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['JWT_SECRET_KEY'] = 'chem-learning-secret-key-2024'  # 生产环境应使用环境变量
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

jwt = JWTManager(app)

DATABASE = 'database.db'


def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """初始化数据库表"""
    conn = get_db()
    cursor = conn.cursor()

    # 用户表（添加is_admin字段）
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 科目表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            logo TEXT NOT NULL,
            color TEXT NOT NULL,
            description TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 章节表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chapters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            key TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            content TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (subject_id) REFERENCES subjects(id),
            UNIQUE(subject_id, key)
        )
    ''')

    # 阅读记录表
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

    # 掌握记录表
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

    # 涂鸦数据表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS canvas_drawings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            chapter_key TEXT NOT NULL,
            drawing_data TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, chapter_key)
        )
    ''')

    conn.commit()
    conn.close()


# 注册
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400

    if len(username) < 3:
        return jsonify({'error': '用户名至少3个字符'}), 400

    if len(password) < 6:
        return jsonify({'error': '密码至少6个字符'}), 400

    password_hash = generate_password_hash(password)

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            (username, password_hash)
        )
        conn.commit()
        return jsonify({'message': '注册成功'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': '用户名已存在'}), 409
    finally:
        conn.close()


# 登录
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    conn.close()

    if user and check_password_hash(user['password_hash'], password):
        access_token = create_access_token(identity=str(user['id']))
        return jsonify({
            'access_token': access_token,
            'username': user['username'],
            'user_id': user['id'],
            'is_admin': bool(user['is_admin'])
        }), 200

    return jsonify({'error': '用户名或密码错误'}), 401


# 获取当前用户信息
@app.route('/api/user', methods=['GET'])
@jwt_required()
def get_user():
    user_id = get_jwt_identity()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, is_admin, created_at FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({'error': '用户不存在'}), 404

    return jsonify({
        'id': user['id'],
        'username': user['username'],
        'is_admin': bool(user['is_admin']),
        'created_at': user['created_at']
    }), 200


# 获取用户阅读记录
@app.route('/api/progress', methods=['GET'])
@jwt_required()
def get_progress():
    user_id = get_jwt_identity()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT chapter_key, last_read_at, read_count
        FROM reading_progress
        WHERE user_id = ?
    ''', (user_id,))

    progress = cursor.fetchall()
    conn.close()

    return jsonify([{
        'chapter_key': p['chapter_key'],
        'last_read_at': p['last_read_at'],
        'read_count': p['read_count']
    } for p in progress]), 200


# 更新阅读记录
@app.route('/api/progress', methods=['POST'])
@jwt_required()
def update_progress():
    user_id = get_jwt_identity()
    data = request.get_json()
    chapter_key = data.get('chapter_key')

    if not chapter_key:
        return jsonify({'error': '章节key不能为空'}), 400

    conn = get_db()
    cursor = conn.cursor()

    # 检查是否已存在记录
    cursor.execute(
        'SELECT id, read_count FROM reading_progress WHERE user_id = ? AND chapter_key = ?',
        (user_id, chapter_key)
    )
    existing = cursor.fetchone()

    if existing:
        # 更新记录
        cursor.execute('''
            UPDATE reading_progress
            SET last_read_at = CURRENT_TIMESTAMP, read_count = read_count + 1
            WHERE user_id = ? AND chapter_key = ?
        ''', (user_id, chapter_key))
    else:
        # 插入新记录
        cursor.execute('''
            INSERT INTO reading_progress (user_id, chapter_key, read_count)
            VALUES (?, ?, 1)
        ''', (user_id, chapter_key))

    conn.commit()
    conn.close()

    return jsonify({'message': '阅读记录已更新'}), 200


# 获取已掌握章节
@app.route('/api/mastered', methods=['GET'])
@jwt_required()
def get_mastered():
    user_id = get_jwt_identity()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT chapter_key, mastered_at FROM mastered_chapters WHERE user_id = ?',
        (user_id,)
    )

    mastered = cursor.fetchall()
    conn.close()

    return jsonify([{
        'chapter_key': m['chapter_key'],
        'mastered_at': m['mastered_at']
    } for m in mastered]), 200


# 切换掌握状态
@app.route('/api/mastered', methods=['POST'])
@jwt_required()
def toggle_mastered():
    user_id = get_jwt_identity()
    data = request.get_json()
    chapter_key = data.get('chapter_key')

    if not chapter_key:
        return jsonify({'error': '章节key不能为空'}), 400

    conn = get_db()
    cursor = conn.cursor()

    # 检查是否已掌握
    cursor.execute(
        'SELECT id FROM mastered_chapters WHERE user_id = ? AND chapter_key = ?',
        (user_id, chapter_key)
    )
    existing = cursor.fetchone()

    if existing:
        # 取消掌握
        cursor.execute(
            'DELETE FROM mastered_chapters WHERE user_id = ? AND chapter_key = ?',
            (user_id, chapter_key)
        )
        conn.commit()
        conn.close()
        return jsonify({'mastered': False, 'message': '已取消掌握标记'}), 200
    else:
        # 标记为掌握
        cursor.execute('''
            INSERT INTO mastered_chapters (user_id, chapter_key)
            VALUES (?, ?)
        ''', (user_id, chapter_key))
        conn.commit()
        conn.close()
        return jsonify({'mastered': True, 'message': '已标记为掌握'}), 200


# 登出（前端清除token即可，这里用于记录日志或清理服务器端状态）
@app.route('/api/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'message': '登出成功'}), 200


# 获取章节的涂鸦数据
@app.route('/api/drawing/<chapter_key>', methods=['GET'])
@jwt_required()
def get_drawing(chapter_key):
    user_id = get_jwt_identity()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT drawing_data, updated_at FROM canvas_drawings WHERE user_id = ? AND chapter_key = ?',
        (user_id, chapter_key)
    )
    result = cursor.fetchone()
    conn.close()

    if result:
        return jsonify({
            'chapter_key': chapter_key,
            'drawing_data': result['drawing_data'],
            'updated_at': result['updated_at']
        }), 200
    else:
        return jsonify({'chapter_key': chapter_key, 'drawing_data': None}), 200


# 保存章节的涂鸦数据
@app.route('/api/drawing', methods=['POST'])
@jwt_required()
def save_drawing():
    user_id = get_jwt_identity()
    data = request.get_json()
    chapter_key = data.get('chapter_key')
    drawing_data = data.get('drawing_data')

    if not chapter_key:
        return jsonify({'error': '章节key不能为空'}), 400

    if drawing_data is None:
        return jsonify({'error': '涂鸦数据不能为空'}), 400

    conn = get_db()
    cursor = conn.cursor()

    # 检查是否已存在
    cursor.execute(
        'SELECT id FROM canvas_drawings WHERE user_id = ? AND chapter_key = ?',
        (user_id, chapter_key)
    )
    existing = cursor.fetchone()

    if existing:
        # 更新
        cursor.execute('''
            UPDATE canvas_drawings
            SET drawing_data = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND chapter_key = ?
        ''', (drawing_data, user_id, chapter_key))
    else:
        # 插入
        cursor.execute('''
            INSERT INTO canvas_drawings (user_id, chapter_key, drawing_data)
            VALUES (?, ?, ?)
        ''', (user_id, chapter_key, drawing_data))

    conn.commit()
    conn.close()

    return jsonify({'message': '涂鸦已保存'}), 200


# 清除章节的涂鸦数据
@app.route('/api/drawing/<chapter_key>', methods=['DELETE'])
@jwt_required()
def delete_drawing(chapter_key):
    user_id = get_jwt_identity()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'DELETE FROM canvas_drawings WHERE user_id = ? AND chapter_key = ?',
        (user_id, chapter_key)
    )
    conn.commit()
    conn.close()

    return jsonify({'message': '涂鸦已清除'}), 200


# ============ Admin 管理接口 ============

def admin_required(fn):
    """Admin权限装饰器"""
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT is_admin FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()

        if not user or not user['is_admin']:
            return jsonify({'error': '需要管理员权限'}), 403

        return fn(*args, **kwargs)
    wrapper.__name__ = fn.__name__
    return wrapper


# 获取所有科目（公开）
@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, key, name, logo, color, description, sort_order, is_active
        FROM subjects WHERE is_active = 1 ORDER BY sort_order, id
    ''')
    subjects = cursor.fetchall()
    conn.close()

    return jsonify([{
        'id': s['id'],
        'key': s['key'],
        'name': s['name'],
        'logo': s['logo'],
        'color': s['color'],
        'description': s['description'],
        'sort_order': s['sort_order'],
        'is_active': bool(s['is_active'])
    } for s in subjects]), 200


# 获取科目详情（公开）
@app.route('/api/subjects/<subject_key>', methods=['GET'])
def get_subject_detail(subject_key):
    conn = get_db()
    cursor = conn.cursor()

    # 获取科目信息
    cursor.execute('''
        SELECT id, key, name, logo, color, description
        FROM subjects WHERE key = ? AND is_active = 1
    ''', (subject_key,))
    subject = cursor.fetchone()

    if not subject:
        conn.close()
        return jsonify({'error': '科目不存在'}), 404

    # 获取该科目下的所有章节
    cursor.execute('''
        SELECT id, key, title, description, sort_order
        FROM chapters
        WHERE subject_id = ? AND is_active = 1
        ORDER BY sort_order, id
    ''', (subject['id'],))
    chapters = cursor.fetchall()
    conn.close()

    return jsonify({
        'id': subject['id'],
        'key': subject['key'],
        'name': subject['name'],
        'logo': subject['logo'],
        'color': subject['color'],
        'description': subject['description'],
        'chapters': [{
            'id': c['id'],
            'key': c['key'],
            'title': c['title'],
            'description': c['description'],
            'sort_order': c['sort_order']
        } for c in chapters]
    }), 200


# 获取章节详情（公开）
@app.route('/api/chapters/<chapter_key>', methods=['GET'])
def get_chapter_detail(chapter_key):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT c.id, c.key, c.title, c.description, c.content,
               s.key as subject_key, s.name as subject_name
        FROM chapters c
        JOIN subjects s ON c.subject_id = s.id
        WHERE c.key = ? AND c.is_active = 1
    ''', (chapter_key,))
    chapter = cursor.fetchone()
    conn.close()

    if not chapter:
        return jsonify({'error': '章节不存在'}), 404

    return jsonify({
        'id': chapter['id'],
        'key': chapter['key'],
        'title': chapter['title'],
        'description': chapter['description'],
        'content': chapter['content'],
        'subject_key': chapter['subject_key'],
        'subject_name': chapter['subject_name']
    }), 200


# ============ Admin 管理接口（需要权限） ============

# 创建科目（Admin）
@app.route('/api/admin/subjects', methods=['POST'])
@admin_required
def create_subject():
    data = request.get_json()
    key = data.get('key', '').strip()
    name = data.get('name', '').strip()
    logo = data.get('logo', '').strip()
    color = data.get('color', '').strip()
    description = data.get('description', '').strip()
    sort_order = data.get('sort_order', 0)

    if not key or not name or not logo or not color:
        return jsonify({'error': '缺少必要字段'}), 400

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            INSERT INTO subjects (key, name, logo, color, description, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (key, name, logo, color, description, sort_order))
        conn.commit()
        subject_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': subject_id, 'message': '科目创建成功'}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': '科目key已存在'}), 409


# 更新科目（Admin）
@app.route('/api/admin/subjects/<int:subject_id>', methods=['PUT'])
@admin_required
def update_subject(subject_id):
    data = request.get_json()
    name = data.get('name', '').strip()
    logo = data.get('logo', '').strip()
    color = data.get('color', '').strip()
    description = data.get('description', '').strip()
    sort_order = data.get('sort_order')
    is_active = data.get('is_active')

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM subjects WHERE id = ?', (subject_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': '科目不存在'}), 404

    cursor.execute('''
        UPDATE subjects
        SET name = ?, logo = ?, color = ?, description = ?,
            sort_order = COALESCE(?, sort_order),
            is_active = COALESCE(?, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (name, logo, color, description, sort_order, is_active, subject_id))
    conn.commit()
    conn.close()

    return jsonify({'message': '科目更新成功'}), 200


# 删除科目（Admin）
@app.route('/api/admin/subjects/<int:subject_id>', methods=['DELETE'])
@admin_required
def delete_subject(subject_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM subjects WHERE id = ?', (subject_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': '科目不存在'}), 404

    # 软删除：标记为 inactive
    cursor.execute('''
        UPDATE subjects
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (subject_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': '科目已删除'}), 200


# 创建章节（Admin）
@app.route('/api/admin/chapters', methods=['POST'])
@admin_required
def create_chapter():
    data = request.get_json()
    subject_id = data.get('subject_id')
    key = data.get('key', '').strip()
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    content = data.get('content', '').strip()
    sort_order = data.get('sort_order', 0)

    if not subject_id or not key or not title or not content:
        return jsonify({'error': '缺少必要字段'}), 400

    conn = get_db()
    cursor = conn.cursor()

    # 检查科目是否存在
    cursor.execute('SELECT id FROM subjects WHERE id = ?', (subject_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': '科目不存在'}), 404

    try:
        cursor.execute('''
            INSERT INTO chapters (subject_id, key, title, description, content, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (subject_id, key, title, description, content, sort_order))
        conn.commit()
        chapter_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': chapter_id, 'message': '章节创建成功'}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': '该章节key在当前科目下已存在'}), 409


# 更新章节（Admin）
@app.route('/api/admin/chapters/<int:chapter_id>', methods=['PUT'])
@admin_required
def update_chapter(chapter_id):
    data = request.get_json()
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    content = data.get('content', '').strip()
    sort_order = data.get('sort_order')
    is_active = data.get('is_active')

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM chapters WHERE id = ?', (chapter_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': '章节不存在'}), 404

    cursor.execute('''
        UPDATE chapters
        SET title = ?, description = ?, content = ?,
            sort_order = COALESCE(?, sort_order),
            is_active = COALESCE(?, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (title, description, content, sort_order, is_active, chapter_id))
    conn.commit()
    conn.close()

    return jsonify({'message': '章节更新成功'}), 200


# 删除章节（Admin）
@app.route('/api/admin/chapters/<int:chapter_id>', methods=['DELETE'])
@admin_required
def delete_chapter(chapter_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM chapters WHERE id = ?', (chapter_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': '章节不存在'}), 404

    # 软删除
    cursor.execute('''
        UPDATE chapters
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (chapter_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': '章节已删除'}), 200


# 健康检查
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200


# CORS 支持
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response


if __name__ == '__main__':
    # 确保数据库已初始化
    if not os.path.exists(DATABASE):
        init_db()
        print(f"数据库已创建: {DATABASE}")

    # 运行Flask应用
    app.run(host='0.0.0.0', port=5000, debug=True)
