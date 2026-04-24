"""
统一的认证装饰器和中间件
"""

from functools import wraps
from .auth import verify_token
from .config import logger


def require_auth(func):
    """
    要求用户登录的装饰器
    被装饰的函数第一个参数必须是 handler 或包含 user_id 的参数
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # 获取 handler (假设第一个参数是 handler)
        handler = args[0] if args else None

        if handler is None:
            return {'success': False, 'message': '内部错误：缺少 handler'}, 500

        # 从 handler 获取 user_id
        user_id = getattr(handler, 'current_user_id', None)

        if not user_id:
            return {'success': False, 'message': '未登录或登录已过期'}, 401

        # 将 user_id 添加到 kwargs
        kwargs['user_id'] = user_id

        return func(*args, **kwargs)
    return wrapper


def require_admin(func):
    """
    要求管理员权限的装饰器
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        handler = args[0] if args else None

        if handler is None:
            return {'success': False, 'message': '内部错误：缺少 handler'}, 500

        user_id = getattr(handler, 'current_user_id', None)

        if not user_id:
            return {'success': False, 'message': '未登录或登录已过期'}, 401

        # 检查管理员权限
        from .database import get_db
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT vip_level FROM users WHERE id = ?', (user_id,))
        user = c.fetchone()
        conn.close()

        if not user or user[0] < 9:
            return {'success': False, 'message': '需要管理员权限'}, 403

        kwargs['user_id'] = user_id
        return func(*args, **kwargs)
    return wrapper


def validate_json(*required_fields):
    """
    验证请求 JSON 数据的装饰器
    :param required_fields: 必需的字段名列表
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            handler = args[0] if args else None

            if handler is None:
                return {'success': False, 'message': '内部错误：缺少 handler'}, 500

            # 获取请求数据
            data = kwargs.get('data', {})

            # 检查必需字段
            missing_fields = [field for field in required_fields if field not in data or data[field] is None]

            if missing_fields:
                return {
                    'success': False,
                    'message': f'缺少必需字段: {", ".join(missing_fields)}'
                }, 400

            return func(*args, **kwargs)
        return wrapper
    return decorator


def rate_limit(max_requests=100, window=60):
    """
    简单的速率限制装饰器
    :param max_requests: 时间窗口内最大请求数
    :param window: 时间窗口（秒）
    """
    from time import time
    requests_cache = {}

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            handler = args[0] if args else None

            if handler is None:
                return func(*args, **kwargs)

            # 获取客户端标识（使用 user_id 或 IP）
            user_id = getattr(handler, 'current_user_id', None)
            client_id = str(user_id) if user_id else handler.client_address[0]

            now = time()

            # 清理过期记录
            if client_id in requests_cache:
                requests_cache[client_id] = [
                    req_time for req_time in requests_cache[client_id]
                    if now - req_time < window
                ]
            else:
                requests_cache[client_id] = []

            # 检查请求次数
            if len(requests_cache[client_id]) >= max_requests:
                logger.warning(f"速率限制触发: {client_id}")
                return {'success': False, 'message': '请求过于频繁，请稍后再试'}, 429

            # 记录请求
            requests_cache[client_id].append(now)

            return func(*args, **kwargs)
        return wrapper
    return decorator
