"""错题 API 处理器"""
import os
import json
import base64
from datetime import datetime, timedelta
from ..database import get_db
from ..config import DATA_DIR

def save_base64_image(base64_data, user_id, mistake_id):
    if not base64_data:
        return None
    try:
        images_dir = os.path.join(DATA_DIR, 'images', str(user_id))
        os.makedirs(images_dir, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"mistake_{mistake_id}_{timestamp}.jpg"
        filepath = os.path.join(images_dir, filename)
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]
        image_data = base64.b64decode(base64_data)
        with open(filepath, 'wb') as f:
            f.write(image_data)
        return f"/images/{user_id}/{filename}"
    except Exception as e:
        print(f"[SaveImage] 失败: {e}")
        return None

def handle_mistakes_get(user_id, params):
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM mistakes WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return 200, {'success': True, 'data': [dict(row) for row in rows]}

def handle_mistakes_post(user_id, data):
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}
    conn = get_db()
    cursor = conn.cursor()

    def safe_str(val):
        if val is None:
            return ''
        elif isinstance(val, (list, dict)):
            return json.dumps(val, ensure_ascii=False)
        return str(val)

    images_path = data.get('images_path', '')
    now = datetime.now()
    tomorrow = (now + timedelta(days=1)).strftime('%Y-%m-%d')
    cursor.execute('''INSERT INTO mistakes (user_id, subject_id, content, wrong_answer, correct_answer, error_reason, analysis, knowledge_points, tags, difficulty, images_path, created_at, next_review_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (user_id, int(data.get('subject_id', 1)), safe_str(data.get('content', '')), safe_str(data.get('wrong_answer', '')), safe_str(data.get('correct_answer', '')), safe_str(data.get('error_reason', '')), safe_str(data.get('analysis', '')), safe_str(data.get('knowledge_points', '')), safe_str(data.get('tags', '')), int(data.get('difficulty', 2)), '', now.strftime('%Y-%m-%d %H:%M:%S'), tomorrow))

    mistake_id = cursor.lastrowid

    if images_path:
        file_path = save_base64_image(images_path, user_id, mistake_id)
        if file_path:
            cursor.execute('UPDATE mistakes SET images_path = ? WHERE id = ?', (file_path, mistake_id))
        else:
            final_images_path = images_path if images_path.startswith('data:') else f"data:image/jpeg;base64,{images_path}"
            cursor.execute('UPDATE mistakes SET images_path = ? WHERE id = ?', (final_images_path, mistake_id))

    conn.commit()
    conn.close()
    return 200, {'success': True, 'id': mistake_id}

def handle_mistakes_put(user_id, mistake_id, data):
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT id FROM mistakes WHERE id = ? AND user_id = ?', (mistake_id, user_id))
        if not cursor.fetchone():
            return 404, {'success': False, 'message': '错题不存在或无权限'}

        def safe_str(val):
            if val is None:
                return ''
            elif isinstance(val, (list, dict)):
                return json.dumps(val, ensure_ascii=False)
            return str(val)

        update_fields = []
        update_values = []
        for field in ['content', 'wrong_answer', 'correct_answer', 'error_reason', 'analysis', 'knowledge_points', 'tags', 'difficulty', 'images_path']:
            if field in data:
                update_fields.append(f"{field} = ?")
                update_values.append(safe_str(data[field]))

        if not update_fields:
            return 400, {'success': False, 'message': '无更新字段'}

        update_values.extend([user_id, mistake_id])
        sql = f"UPDATE mistakes SET {', '.join(update_fields)} WHERE user_id = ? AND id = ?"
        cursor.execute(sql, update_values)
        conn.commit()
        return 200, {'success': True}
    except Exception as e:
        return 500, {'success': False, 'message': str(e)}
    finally:
        conn.close()

def handle_mistakes_delete(user_id, path):
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}
    path_parts = path.strip('/').split('/')
    if len(path_parts) < 3:
        return 400, {'success': False, 'message': '缺少错题ID'}
    try:
        mistake_id = int(path_parts[2])
    except ValueError:
        return 400, {'success': False, 'message': '无效ID'}

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT id FROM mistakes WHERE id = ? AND user_id = ?', (mistake_id, user_id))
        if not cursor.fetchone():
            return 404, {'success': False, 'message': '错题不存在或无权限'}
        cursor.execute('DELETE FROM mistakes WHERE id = ? AND user_id = ?', (mistake_id, user_id))
        conn.commit()
        return 200, {'success': True}
    except Exception as e:
        return 500, {'success': False, 'message': str(e)}
    finally:
        conn.close()
