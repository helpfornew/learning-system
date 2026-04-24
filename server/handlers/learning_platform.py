"""学习平台 API 处理器 - 化学/物理等学科学习系统"""
import json
import sqlite3
from datetime import datetime
from ..database import get_db
from ..config import logger


def handle_subjects_get(user_id, params):
    """获取所有科目"""
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        SELECT id, key, name, logo, color, description, sort_order, is_active
        FROM lp_subjects WHERE is_active = 1
        ORDER BY sort_order, id
    ''')
    subjects = []
    for row in c.fetchall():
        subjects.append({
            'id': row[0],
            'key': row[1],
            'name': row[2],
            'logo': row[3],
            'color': row[4],
            'description': row[5],
            'sort_order': row[6],
            'is_active': bool(row[7])
        })
    conn.close()
    return 200, {'success': True, 'data': subjects}


def handle_subject_detail_get(user_id, subject_key):
    """获取科目详情及章节列表"""
    conn = get_db()
    c = conn.cursor()

    # 获取科目信息
    c.execute('''
        SELECT id, key, name, logo, color, description
        FROM lp_subjects WHERE key = ? AND is_active = 1
    ''', (subject_key,))
    subject = c.fetchone()

    if not subject:
        conn.close()
        return 404, {'success': False, 'message': '科目不存在'}

    # 获取章节列表
    c.execute('''
        SELECT id, key, title, description, sort_order
        FROM lp_chapters
        WHERE subject_id = ? AND is_active = 1
        ORDER BY sort_order, id
    ''', (subject[0],))

    chapters = []
    for row in c.fetchall():
        chapters.append({
            'id': row[0],
            'key': row[1],
            'title': row[2],
            'description': row[3],
            'sort_order': row[4]
        })

    conn.close()

    return 200, {
        'success': True,
        'data': {
            'id': subject[0],
            'key': subject[1],
            'name': subject[2],
            'logo': subject[3],
            'color': subject[4],
            'description': subject[5],
            'chapters': chapters
        }
    }


def handle_chapter_detail_get(user_id, chapter_key):
    """获取章节详情"""
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        SELECT c.id, c.key, c.title, c.description, c.content,
               s.key as subject_key, s.name as subject_name
        FROM lp_chapters c
        JOIN lp_subjects s ON c.subject_id = s.id
        WHERE c.key = ? AND c.is_active = 1
    ''', (chapter_key,))
    chapter = c.fetchone()
    conn.close()

    if not chapter:
        return 404, {'success': False, 'message': '章节不存在'}

    return 200, {
        'success': True,
        'data': {
            'id': chapter[0],
            'key': chapter[1],
            'title': chapter[2],
            'description': chapter[3],
            'content': chapter[4],
            'subject_key': chapter[5],
            'subject_name': chapter[6]
        }
    }


def handle_progress_get(user_id, params):
    """获取用户阅读记录"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    conn = get_db()
    c = conn.cursor()
    c.execute('''
        SELECT chapter_key, last_read_at, read_count
        FROM lp_reading_progress WHERE user_id = ?
    ''', (user_id,))

    progress = []
    for row in c.fetchall():
        progress.append({
            'chapter_key': row[0],
            'last_read_at': row[1],
            'read_count': row[2]
        })

    conn.close()
    return 200, {'success': True, 'data': progress}


def handle_progress_post(user_id, data):
    """更新阅读记录"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    chapter_key = data.get('chapter_key')
    if not chapter_key:
        return 400, {'success': False, 'message': '章节key不能为空'}

    conn = get_db()
    c = conn.cursor()

    # 检查是否已存在记录
    c.execute('''
        SELECT id, read_count FROM lp_reading_progress
        WHERE user_id = ? AND chapter_key = ?
    ''', (user_id, chapter_key))
    existing = c.fetchone()

    if existing:
        c.execute('''
            UPDATE lp_reading_progress
            SET last_read_at = CURRENT_TIMESTAMP, read_count = read_count + 1
            WHERE user_id = ? AND chapter_key = ?
        ''', (user_id, chapter_key))
    else:
        c.execute('''
            INSERT INTO lp_reading_progress (user_id, chapter_key, read_count)
            VALUES (?, ?, 1)
        ''', (user_id, chapter_key))

    conn.commit()
    conn.close()

    return 200, {'success': True, 'message': '阅读记录已更新'}


def handle_mastered_get(user_id, params):
    """获取已掌握章节"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    conn = get_db()
    c = conn.cursor()
    c.execute('''
        SELECT chapter_key, mastered_at
        FROM lp_mastered_chapters WHERE user_id = ?
    ''', (user_id,))

    mastered = []
    for row in c.fetchall():
        mastered.append({
            'chapter_key': row[0],
            'mastered_at': row[1]
        })

    conn.close()
    return 200, {'success': True, 'data': mastered}


def handle_mastered_post(user_id, data):
    """切换掌握状态"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    chapter_key = data.get('chapter_key')
    if not chapter_key:
        return 400, {'success': False, 'message': '章节key不能为空'}

    conn = get_db()
    c = conn.cursor()

    # 检查是否已掌握
    c.execute('''
        SELECT id FROM lp_mastered_chapters
        WHERE user_id = ? AND chapter_key = ?
    ''', (user_id, chapter_key))
    existing = c.fetchone()

    if existing:
        # 取消掌握
        c.execute('''
            DELETE FROM lp_mastered_chapters
            WHERE user_id = ? AND chapter_key = ?
        ''', (user_id, chapter_key))
        conn.commit()
        conn.close()
        return 200, {'success': True, 'mastered': False, 'message': '已取消掌握标记'}
    else:
        # 标记为掌握
        c.execute('''
            INSERT INTO lp_mastered_chapters (user_id, chapter_key)
            VALUES (?, ?)
        ''', (user_id, chapter_key))
        conn.commit()
        conn.close()
        return 200, {'success': True, 'mastered': True, 'message': '已标记为掌握'}


def handle_drawing_get(user_id, chapter_key):
    """获取章节涂鸦数据"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    conn = get_db()
    c = conn.cursor()
    c.execute('''
        SELECT drawing_data, updated_at
        FROM lp_canvas_drawings
        WHERE user_id = ? AND chapter_key = ?
    ''', (user_id, chapter_key))
    result = c.fetchone()
    conn.close()

    if result:
        return 200, {
            'success': True,
            'data': {
                'chapter_key': chapter_key,
                'drawing_data': result[0],
                'updated_at': result[1]
            }
        }
    else:
        return 200, {
            'success': True,
            'data': {'chapter_key': chapter_key, 'drawing_data': None}
        }


def handle_drawing_post(user_id, data):
    """保存章节涂鸦数据"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    chapter_key = data.get('chapter_key')
    drawing_data = data.get('drawing_data')

    if not chapter_key:
        return 400, {'success': False, 'message': '章节key不能为空'}

    if drawing_data is None:
        return 400, {'success': False, 'message': '涂鸦数据不能为空'}

    conn = get_db()
    c = conn.cursor()

    # 检查是否已存在
    c.execute('''
        SELECT id FROM lp_canvas_drawings
        WHERE user_id = ? AND chapter_key = ?
    ''', (user_id, chapter_key))
    existing = c.fetchone()

    if existing:
        c.execute('''
            UPDATE lp_canvas_drawings
            SET drawing_data = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND chapter_key = ?
        ''', (drawing_data, user_id, chapter_key))
    else:
        c.execute('''
            INSERT INTO lp_canvas_drawings (user_id, chapter_key, drawing_data)
            VALUES (?, ?, ?)
        ''', (user_id, chapter_key, drawing_data))

    conn.commit()
    conn.close()

    return 200, {'success': True, 'message': '涂鸦已保存'}


def handle_drawing_delete(user_id, chapter_key):
    """删除章节涂鸦数据"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    conn = get_db()
    c = conn.cursor()
    c.execute('''
        DELETE FROM lp_canvas_drawings
        WHERE user_id = ? AND chapter_key = ?
    ''', (user_id, chapter_key))
    conn.commit()
    conn.close()

    return 200, {'success': True, 'message': '涂鸦已清除'}


# ============ Admin 管理接口 ============

def _check_admin(user_id):
    """检查用户是否为管理员"""
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT vip_level FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()
    conn.close()
    return user and user[0] >= 9  # vip_level >= 9 视为管理员


def handle_admin_subjects_post(user_id, data):
    """创建科目（Admin）"""
    if not user_id or not _check_admin(user_id):
        return 403, {'success': False, 'message': '需要管理员权限'}

    key = data.get('key', '').strip()
    name = data.get('name', '').strip()
    logo = data.get('logo', '').strip()
    color = data.get('color', '').strip()
    description = data.get('description', '').strip()
    sort_order = data.get('sort_order', 0)

    if not key or not name or not logo or not color:
        return 400, {'success': False, 'message': '缺少必要字段'}

    conn = get_db()
    c = conn.cursor()

    try:
        c.execute('''
            INSERT INTO lp_subjects (key, name, logo, color, description, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (key, name, logo, color, description, sort_order))
        conn.commit()
        subject_id = c.lastrowid
        conn.close()
        return 201, {'success': True, 'id': subject_id, 'message': '科目创建成功'}
    except sqlite3.IntegrityError:
        conn.close()
        return 409, {'success': False, 'message': '科目key已存在'}


def handle_admin_subjects_put(user_id, subject_id, data):
    """更新科目（Admin）"""
    if not user_id or not _check_admin(user_id):
        return 403, {'success': False, 'message': '需要管理员权限'}

    name = data.get('name', '').strip()
    logo = data.get('logo', '').strip()
    color = data.get('color', '').strip()
    description = data.get('description', '').strip()
    sort_order = data.get('sort_order')
    is_active = data.get('is_active')

    conn = get_db()
    c = conn.cursor()

    c.execute('SELECT id FROM lp_subjects WHERE id = ?', (subject_id,))
    if not c.fetchone():
        conn.close()
        return 404, {'success': False, 'message': '科目不存在'}

    c.execute('''
        UPDATE lp_subjects
        SET name = ?, logo = ?, color = ?, description = ?,
            sort_order = COALESCE(?, sort_order),
            is_active = COALESCE(?, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (name, logo, color, description, sort_order, is_active, subject_id))
    conn.commit()
    conn.close()

    return 200, {'success': True, 'message': '科目更新成功'}


def handle_admin_subjects_delete(user_id, subject_id):
    """删除科目（Admin）- 软删除"""
    if not user_id or not _check_admin(user_id):
        return 403, {'success': False, 'message': '需要管理员权限'}

    conn = get_db()
    c = conn.cursor()

    c.execute('SELECT id FROM lp_subjects WHERE id = ?', (subject_id,))
    if not c.fetchone():
        conn.close()
        return 404, {'success': False, 'message': '科目不存在'}

    c.execute('''
        UPDATE lp_subjects
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (subject_id,))
    conn.commit()
    conn.close()

    return 200, {'success': True, 'message': '科目已删除'}


def handle_admin_chapters_post(user_id, data):
    """创建章节（Admin）"""
    if not user_id or not _check_admin(user_id):
        return 403, {'success': False, 'message': '需要管理员权限'}

    subject_id = data.get('subject_id')
    key = data.get('key', '').strip()
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    content = data.get('content', '').strip()
    sort_order = data.get('sort_order', 0)

    if not subject_id or not key or not title or not content:
        return 400, {'success': False, 'message': '缺少必要字段'}

    conn = get_db()
    c = conn.cursor()

    # 检查科目是否存在
    c.execute('SELECT id FROM lp_subjects WHERE id = ?', (subject_id,))
    if not c.fetchone():
        conn.close()
        return 404, {'success': False, 'message': '科目不存在'}

    try:
        c.execute('''
            INSERT INTO lp_chapters (subject_id, key, title, description, content, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (subject_id, key, title, description, content, sort_order))
        conn.commit()
        chapter_id = c.lastrowid
        conn.close()
        return 201, {'success': True, 'id': chapter_id, 'message': '章节创建成功'}
    except sqlite3.IntegrityError:
        conn.close()
        return 409, {'success': False, 'message': '该章节key在当前科目下已存在'}


def handle_admin_chapters_put(user_id, chapter_id, data):
    """更新章节（Admin）"""
    if not user_id or not _check_admin(user_id):
        return 403, {'success': False, 'message': '需要管理员权限'}

    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    content = data.get('content', '').strip()
    sort_order = data.get('sort_order')
    is_active = data.get('is_active')

    conn = get_db()
    c = conn.cursor()

    c.execute('SELECT id FROM lp_chapters WHERE id = ?', (chapter_id,))
    if not c.fetchone():
        conn.close()
        return 404, {'success': False, 'message': '章节不存在'}

    c.execute('''
        UPDATE lp_chapters
        SET title = ?, description = ?, content = ?,
            sort_order = COALESCE(?, sort_order),
            is_active = COALESCE(?, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (title, description, content, sort_order, is_active, chapter_id))
    conn.commit()
    conn.close()

    return 200, {'success': True, 'message': '章节更新成功'}


def handle_admin_chapters_delete(user_id, chapter_id):
    """删除章节（Admin）- 软删除"""
    if not user_id or not _check_admin(user_id):
        return 403, {'success': False, 'message': '需要管理员权限'}

    conn = get_db()
    c = conn.cursor()

    c.execute('SELECT id FROM lp_chapters WHERE id = ?', (chapter_id,))
    if not c.fetchone():
        conn.close()
        return 404, {'success': False, 'message': '章节不存在'}

    c.execute('''
        UPDATE lp_chapters
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (chapter_id,))
    conn.commit()
    conn.close()

    return 200, {'success': True, 'message': '章节已删除'}
