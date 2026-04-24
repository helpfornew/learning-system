"""学习时间 API 处理器"""
from datetime import datetime
from ..database import get_db

def handle_study_time_get(user_id, params):
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}
    conn = get_db()
    cursor = conn.cursor()
    date = params.get('date', datetime.now().strftime('%Y-%m-%d'))
    cursor.execute('SELECT * FROM study_time WHERE user_id = ? AND date = ?', (user_id, date))
    rows = cursor.fetchall()
    conn.close()
    return 200, {'success': True, 'data': [dict(r) for r in rows]}

def handle_study_time_post(user_id, data):
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO study_time (user_id, subject, duration, date, created_at) VALUES (?, ?, ?, ?, ?)',
                   (user_id, data['subject'], data['duration'], data.get('date', datetime.now().strftime('%Y-%m-%d')),
                    datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return 200, {'success': True, 'id': cursor.lastrowid}

def handle_study_time_delete(user_id, study_id):
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM study_time WHERE id = ? AND user_id = ?', (study_id, user_id))
    conn.commit()
    conn.close()
    return 200, {'success': True}
