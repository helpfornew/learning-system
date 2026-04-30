"""
账户认证 API 处理
"""

import json
from datetime import datetime, timedelta
from ..database import get_db
from ..auth import hash_password, verify_user_credentials, create_session, generate_token, verify_token
from ..config import logger

def handle_account_get(path, user_id=None, token=None):
    """处理 GET /account/api/* 请求"""
    if path == '/account/api/verify':
        if token:
            result = verify_token(token)
            if result and result.get('valid'):
                user_id = result['user_id']
                conn = get_db()
                c = conn.cursor()
                c.execute('SELECT id, username, email, vip_level, expires_at FROM users WHERE id = ?', (user_id,))
                user = c.fetchone()
                conn.close()
                if user:
                    return 200, {'success': True, 'user': {'id': user[0], 'username': user[1], 'email': user[2] or '', 'vip_level': user[3] or 0, 'expires_at': user[4] or ''}}
        return 200, {'success': False, 'valid': False, 'user': None}
    elif path == '/account/api/user':
        # 获取当前用户信息
        if not user_id:
            return 401, {'success': False, 'message': '未登录'}

        try:
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT id, username, email, vip_level, expires_at FROM users WHERE id = ?', (user_id,))
            user = c.fetchone()
            conn.close()

            if user:
                return 200, {
                    'success': True,
                    'data': {
                        'id': user[0],
                        'username': user[1],
                        'email': user[2] or '',
                        'vip_level': user[3] or 0,
                        'expires_at': user[4] or ''
                    }
                }
            else:
                return 404, {'success': False, 'message': '用户不存在'}
        except Exception as e:
            logger.error(f"获取用户信息失败: {e}")
            return 500, {'success': False, 'message': '服务器错误'}
    return None

def handle_account_post(path, data):
    """处理 POST /account/api/* 请求"""
    try:
        if path == '/account/api/login':
            return handle_login(data)
        elif path == '/account/api/register':
            return handle_register(data)
        elif path == '/account/api/logout':
            return handle_logout(data)
        elif path == '/account/api/invite-code':
            return handle_create_invite_code(data)
        return {'success': False, 'message': '未知的账户接口'}
    except Exception as e:
        logger.error(f"账户API错误: {e}")
        return {'success': False, 'message': str(e)}

def handle_login(data):
    """处理登录"""
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return 400, {'success': False, 'message': '用户名或密码为空'}

    user = verify_user_credentials(username, password)
    if not user:
        return 401, {'success': False, 'message': '用户名或密码错误'}

    token = create_session(user['id'])

    # 获取完整的用户信息
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT id, username, email, vip_level, expires_at FROM users WHERE id = ?', (user['id'],))
    user_row = c.fetchone()
    conn.close()

    return 200, {
        'success': True,
        'message': '登录成功',
        'token': token,
        'user': {
            'id': user_row[0],
            'username': user_row[1],
            'email': user_row[2] or '',
            'vip_level': user_row[3] or 0,
            'expires_at': user_row[4] or ''
        }
    }

def handle_register(data):
    """处理注册"""
    username = data.get('username')
    password = data.get('password')
    invite_code = data.get('invite_code')

    if not username or not password or not invite_code:
        return 400, {'success': False, 'message': '缺少必要字段'}

    try:
        conn = get_db()
        c = conn.cursor()

        # 验证邀请码
        c.execute('''SELECT id, max_uses, current_uses FROM invite_codes
                     WHERE code = ? AND is_active = 1
                     AND (expires_at IS NULL OR expires_at > ?)''',
                  (invite_code, datetime.now().isoformat()))
        invite = c.fetchone()

        if not invite:
            conn.close()
            return 400, {'success': False, 'message': '邀请码无效或已过期'}

        id, max_uses, current_uses = invite
        if max_uses > 0 and current_uses >= max_uses:
            conn.close()
            return 400, {'success': False, 'message': '邀请码已用尽'}

        # 检查用户是否已存在
        c.execute('SELECT id FROM users WHERE username = ?', (username,))
        if c.fetchone():
            conn.close()
            return 400, {'success': False, 'message': '用户已存在'}

        # 创建新用户
        salt = generate_token(username)[:32]
        password_hash = hash_password(password, salt)
        expires_at = (datetime.now() + timedelta(days=30)).isoformat()

        c.execute('''INSERT INTO users (username, password_hash, salt, vip_level, expires_at, created_at, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?)''',
                  (username, password_hash, salt, 1, expires_at, datetime.now().isoformat(), 'active'))

        # 更新邀请码使用次数
        c.execute('UPDATE invite_codes SET current_uses = current_uses + 1 WHERE id = ?', (id,))

        conn.commit()

        # 获取新创建的用户ID
        user_id = c.lastrowid

        # 创建会话
        token = create_session(user_id)

        # 获取完整的用户信息
        c.execute('SELECT id, username, email, vip_level, expires_at FROM users WHERE id = ?', (user_id,))
        user_row = c.fetchone()
        conn.close()

        return 200, {
            'success': True,
            'message': '注册成功，已获得30天VIP权限',
            'token': token,
            'user': {
                'id': user_row[0],
                'username': user_row[1],
                'email': user_row[2] or '',
                'vip_level': user_row[3] or 0,
                'expires_at': user_row[4] or ''
            },
            'vip_days': 30
        }
    except Exception as e:
        logger.error(f"注册错误: {e}")
        return 500, {'success': False, 'message': str(e)}

def handle_logout(data):
    """处理登出"""
    token = data.get('token')
    if token:
        from ..auth import invalidate_session
        invalidate_session(token)
    return {'success': True, 'message': '登出成功'}

def handle_create_invite_code(data):
    """创建邀请码（仅VIP用户）"""
    # 这里应该检查user_id的vip_level
    try:
        conn = get_db()
        c = conn.cursor()

        code = generate_token('invite')[:16].upper()
        max_uses = data.get('max_uses', 0)
        remark = data.get('remark', '')
        expires_at = (datetime.now() + timedelta(days=365)).isoformat()

        c.execute('''INSERT INTO invite_codes (code, max_uses, current_uses, expires_at, remark, is_active)
                     VALUES (?, ?, ?, ?, ?, ?)''',
                  (code, max_uses, 0, expires_at, remark, 1))

        conn.commit()
        conn.close()

        return {'success': True, 'message': '邀请码已生成', 'code': code}
    except Exception as e:
        logger.error(f"创建邀请码错误: {e}")
        return {'success': False, 'message': str(e)}

