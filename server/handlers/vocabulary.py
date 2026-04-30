"""
词汇表 API - 单词本管理
"""
from ..database import get_db
from ..config import logger
from datetime import datetime


def handle_vocabulary_get(user_id, params):
    """获取单词列表"""
    try:
        conn = get_db()
        c = conn.cursor()

        page = int(params.get('page', 1))
        limit = int(params.get('limit', 100))
        offset = (page - 1) * limit
        status_filter = params.get('status')
        search = params.get('search')

        query = 'SELECT * FROM vocabulary WHERE user_id = ?'
        count_query = 'SELECT COUNT(*) FROM vocabulary WHERE user_id = ?'
        query_params = [user_id]
        count_params = [user_id]

        if status_filter:
            query += ' AND status = ?'
            count_query += ' AND status = ?'
            query_params.append(status_filter)
            count_params.append(status_filter)

        if search:
            query += ' AND (word LIKE ? OR definition LIKE ?)'
            count_query += ' AND (word LIKE ? OR definition LIKE ?)'
            search_param = f'%{search}%'
            query_params.extend([search_param, search_param])
            count_params.extend([search_param, search_param])

        query += ' ORDER BY id DESC LIMIT ? OFFSET ?'
        query_params.extend([limit, offset])

        c.execute(count_query, count_params)
        total = c.fetchone()[0]

        c.execute(query, query_params)
        words = [dict(row) for row in c.fetchall()]
        conn.close()

        return 200, {'success': True, 'data': words, 'total': total, 'page': page, 'limit': limit}
    except Exception as e:
        logger.error(f"获取单词列表失败: {e}")
        return 500, {'success': False, 'message': str(e)}


def handle_vocabulary_post(user_id, data):
    """添加单词"""
    try:
        word = data.get('word', '').strip()
        if not word:
            return 400, {'success': False, 'message': '单词不能为空'}

        conn = get_db()
        c = conn.cursor()

        c.execute('''INSERT INTO vocabulary (user_id, word, phonetic, definition, example_sentence,
                    example_translation, part_of_speech, tags, difficulty_level, status, next_review)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (user_id, word, data.get('phonetic'), data.get('definition'),
                   data.get('example_sentence'), data.get('example_translation'),
                   data.get('part_of_speech'), data.get('tags'),
                   data.get('difficulty_level', 1), 'new',
                   (datetime.now().isoformat() if data.get('next_review') else None)))
        word_id = c.lastrowid
        conn.commit()
        conn.close()

        return 200, {'success': True, 'id': word_id, 'message': '单词添加成功'}
    except Exception as e:
        logger.error(f"添加单词失败: {e}")
        error_msg = str(e)
        if 'UNIQUE' in error_msg:
            return 400, {'success': False, 'message': '单词已存在'}
        return 500, {'success': False, 'message': error_msg}


def handle_vocabulary_put(user_id, word_id, data):
    """更新单词"""
    try:
        conn = get_db()
        c = conn.cursor()

        # 验证所有权
        c.execute('SELECT id FROM vocabulary WHERE id = ? AND user_id = ?', (word_id, user_id))
        if not c.fetchone():
            conn.close()
            return 404, {'success': False, 'message': '单词不存在或无权操作'}

        fields = ['word', 'phonetic', 'definition', 'example_sentence',
                  'example_translation', 'part_of_speech', 'tags',
                  'difficulty_level', 'status', '熟练度', 'review_count', 'next_review']
        updates = []
        values = []
        for field in fields:
            if field in data:
                updates.append(f'{field} = ?')
                values.append(data[field])

        if not updates:
            conn.close()
            return 400, {'success': False, 'message': '没有可更新的字段'}

        values.append(word_id)
        c.execute(f'UPDATE vocabulary SET {", ".join(updates)} WHERE id = ?', values)
        conn.commit()
        conn.close()

        return 200, {'success': True, 'message': '单词更新成功'}
    except Exception as e:
        logger.error(f"更新单词失败: {e}")
        return 500, {'success': False, 'message': str(e)}


def handle_vocabulary_delete(user_id, parsed_path):
    """删除单词"""
    try:
        parts = parsed_path.rstrip('/').split('/')
        try:
            word_id = int(parts[-1])
        except (ValueError, IndexError):
            return 400, {'success': False, 'message': '无效的单词ID'}

        conn = get_db()
        c = conn.cursor()

        # 验证所有权
        c.execute('SELECT id FROM vocabulary WHERE id = ? AND user_id = ?', (word_id, user_id))
        if not c.fetchone():
            conn.close()
            return 404, {'success': False, 'message': '单词不存在或无权操作'}

        c.execute('DELETE FROM vocabulary WHERE id = ?', (word_id,))
        conn.commit()
        conn.close()

        return 200, {'success': True, 'message': '单词已删除'}
    except Exception as e:
        logger.error(f"删除单词失败: {e}")
        return 500, {'success': False, 'message': str(e)}
