"""
认证和授权 - 用户验证、token管理
修复：无token时返回None而非默认admin
"""

import hashlib
import secrets
import sqlite3
from datetime import datetime, timedelta
from .database import get_db
from .config import logger

def hash_password(password, salt):
    """生成密码哈希"""
    return hashlib.sha256((password + salt).encode()).hexdigest()

def generate_token(user_id):
    """生成session token"""
    token = hashlib.sha256(f"{user_id}:{datetime.now().isoformat()}:{secrets.token_hex(32)}".encode()).hexdigest()
    return token

def verify_token(token):
    """验证token - 修复：无效token返回None而非admin"""
    if not token:
        return None

    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('''SELECT u.id FROM sessions s
                     JOIN users u ON s.user_id = u.id
                     WHERE s.token = ? AND s.expires_at > ? AND u.status = 'active'
                     AND (u.expires_at IS NULL OR u.expires_at > ?)''',
                  (token, datetime.now().isoformat(), datetime.now().isoformat()))
        row = c.fetchone()
        conn.close()

        if row:
            return {'valid': True, 'user_id': row[0]}
        return None
    except Exception as e:
        logger.error(f"Token验证失败: {e}")
        return None

def create_session(user_id):
    """创建新session"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('DELETE FROM sessions WHERE user_id = ?', (user_id,))

        token = generate_token(user_id)
        expires_at = (datetime.now() + timedelta(days=7)).isoformat()

        c.execute('''INSERT INTO sessions (user_id, token, expires_at, created_at)
                     VALUES (?, ?, ?, ?)''',
                  (user_id, token, expires_at, datetime.now().isoformat()))
        conn.commit()
        conn.close()

        return token
    except Exception as e:
        logger.error(f"创建session失败: {e}")
        return None

def verify_user_credentials(username, password):
    """验证用户凭证"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT id, password_hash, salt FROM users WHERE username = ? AND status = "active"', (username,))
        row = c.fetchone()

        if row:
            user_id, password_hash, salt = row
            if hash_password(password, salt) == password_hash:
                c.execute('UPDATE users SET last_login = ? WHERE id = ?',
                         (datetime.now().isoformat(), user_id))
                conn.commit()
                conn.close()
                return {'id': user_id, 'username': username}

        conn.close()
        return None
    except Exception as e:
        logger.error(f"用户验证失败: {e}")
        return None

def invalidate_session(token):
    """使session token失效（登出）"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('DELETE FROM sessions WHERE token = ?', (token,))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"登出失败: {e}")
        return False

