#!/usr/bin/env python3
"""
统一学习系统后端服务器 (模块化入口)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from server.config import HOST, PORT, logger, DEV_MODE, VITE_DEV_SERVER
from server.database import init_all_tables
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

# 导入所有handlers
from server.handlers import account, mistakes, study_time, ai_proxy, config_api, schedule, tools_api, youdao
from server.handlers import weekly_analysis, user_ai_config, learning_platform, stats, review_history, vocabulary
from server.auth import verify_token
import json
import mimetypes
from urllib.parse import urlparse, parse_qs

class UnifiedHandler(BaseHTTPRequestHandler):
    """统一请求处理器"""

    # 不需要认证的路径列表
    PUBLIC_PATHS = [
        '/',
        '/index.html',
        '/favicon.ico',
        '/api/health',
    ]

    # 不需要认证的前缀列表（用于GET请求）
    PUBLIC_GET_PREFIXES = [
        '/api/config',  # 配置API允许未登录访问
    ]

    # 公开 API 前缀
    PUBLIC_API_PREFIXES = [
        '/account/api/login',
        '/account/api/register',
        '/mistake/',  # 静态资源
        '/static/',
        '/downloads/',  # 下载文件
        '/images/',
        '/shared/',  # 共享资源
        '/wordcard/',
        '/learning/',
    ]

    # ============ 路由注册表 ============
    # (handler_method, requires_auth, match_type)
    # match_type: 'exact'（精确匹配）或 'prefix'（前缀匹配）
    API_GET_ROUTES = [
        # 简单 API -> handler 调用
        ('/api/mistakes', 'call_handler_mistakes', True, 'prefix'),
        ('/api/study-time', 'call_handler_study_time', True, 'prefix'),
        ('/api/weekly-analysis', 'call_handler_weekly_analysis', True, 'exact'),
        ('/api/ai-config', 'call_handler_ai_config', True, 'exact'),
        ('/api/stats', 'call_handler_stats', True, 'exact'),
        ('/api/review-history', 'call_handler_review_history', True, 'prefix'),
        ('/api/review-due', 'call_handler_review_due', True, 'exact'),
        ('/learning/api/', 'call_handler_learning_api', True, 'prefix'),
        # 账户 API
        ('/account/api/user', 'call_handler_account_user', True, 'exact'),
        ('/account/api/verify', 'call_handler_account_user', True, 'exact'),
        # 词汇表 API
        ('/api/vocabulary', 'call_handler_vocabulary', True, 'prefix'),
        # 工具 API
        ('/api/tools/', 'call_handler_tools_get', True, 'prefix'),
        # 特殊逻辑路由（在方法里处理）
        ('/api/schedule', '_handle_api_schedule_get', True, 'prefix'),
        ('/api/config', '_handle_api_config_get', False, 'prefix'),
        ('/api/health', '_handle_api_health', False, 'exact'),
        # 页面路由
        ('/', 'serve_home', False, 'exact'),
        ('/index.html', 'serve_home', False, 'exact'),
        ('/favicon.ico', 'serve_favicon', False, 'exact'),
        # 已移除：工具中心 /tools
        # 静态文件 SPA 路由
        ('/mistake/', 'serve_mistake_frontend', False, 'prefix'),
        ('/static/', 'serve_static_resource', False, 'prefix'),
        ('/downloads/', 'serve_downloads', False, 'prefix'),
        ('/images/', 'serve_images', False, 'prefix'),
        ('/shared/', 'serve_shared', False, 'prefix'),
        ('/wordcard/', 'serve_wordcard', False, 'prefix'),
        ('/learning/', 'serve_learning_platform', False, 'prefix'),
    ]

    API_POST_ROUTES = [
        ('/account/api/', '_handle_api_account_post', False, 'prefix'),
        ('/api/mistakes', 'call_handler_mistakes_post', True, 'exact'),
        ('/api/study-time', 'call_handler_study_time_post', True, 'exact'),
        ('/api/ai-analysis', 'call_handler_ai_analysis', True, 'exact'),
        ('/api/config', 'call_handler_config_post', True, 'exact'),
        ('/api/weekly-analysis', 'call_handler_weekly_analysis_post', True, 'exact'),
        ('/api/ai-config', 'call_handler_ai_config_post', True, 'exact'),
        ('/api/schedule', 'call_handler_schedule_post', True, 'exact'),
        ('/api/youdao/segment', '_handle_api_youdao_segment', True, 'exact'),
        ('/api/review-history', 'call_handler_review_history_post', True, 'exact'),
        ('/learning/api/', 'call_handler_learning_api_post', True, 'prefix'),
        # 词汇表 API
        ('/api/vocabulary', 'call_handler_vocabulary_post', True, 'exact'),
        ('/api/vocabulary-review', 'call_handler_vocabulary_review', True, 'exact'),
        ('/api/vocabulary-batch', 'call_handler_vocabulary_batch', True, 'exact'),
        # 工具 API
        ('/api/tools/', 'call_handler_tools_post', True, 'prefix'),
    ]

    API_PUT_ROUTES = [
        ('/api/mistakes/', 'call_handler_mistakes_put', True, 'prefix'),
        ('/api/schedule/today', 'call_handler_schedule_today_put', True, 'exact'),
        ('/learning/api/', 'call_handler_learning_api_put', True, 'prefix'),
        ('/api/vocabulary/', 'call_handler_vocabulary_put', True, 'prefix'),
    ]

    API_DELETE_ROUTES = [
        ('/api/mistakes/', 'call_handler_mistakes_delete', True, 'prefix'),
        ('/api/study-time/', 'call_handler_study_time_delete', True, 'prefix'),
        ('/api/weekly-analysis/', 'call_handler_weekly_analysis_delete', True, 'prefix'),
        ('/api/ai-config/', 'call_handler_ai_config_delete', True, 'prefix'),
        ('/api/schedule/', 'call_handler_schedule_delete', True, 'prefix'),
        ('/learning/api/', 'call_handler_learning_api_delete', True, 'prefix'),
        ('/api/vocabulary/', 'call_handler_vocabulary_delete', True, 'prefix'),
    ]

    def _dispatch_route(self, method_routes, parsed_path, user_id, **kwargs):
        """遍历路由表，找到匹配的路由并执行"""
        for url_pattern, handler_name, needs_auth, match_type in method_routes:
            matched = False
            if match_type == 'exact':
                matched = (parsed_path == url_pattern)
            else:  # prefix
                matched = parsed_path.startswith(url_pattern)

            if not matched:
                continue

            # 需要认证但未登录
            if needs_auth and not user_id:
                # 特殊处理：_handle_ 开头的方法自己处理认证
                if handler_name.startswith('_handle_'):
                    pass  # 交给方法处理
                else:
                    self.handle_unauthorized()
                    return True

            method = getattr(self, handler_name, None)
            if method:
                if handler_name.startswith('_handle_'):
                    method(parsed_path, user_id, **kwargs)
                else:
                    method(user_id, parsed_path, **kwargs)
                return True

        return False

    def log_message(self, format, *args):
        logger.info(format % args)

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def require_auth(self):
        """验证认证，返回user_id或None"""
        auth_header = self.headers.get('Authorization', '')
        token = None

        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]
        else:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            token = params.get('token', [None])[0]

        if not token:
            return None

        result = verify_token(token)
        return result['user_id'] if result and result.get('valid') else None

    def is_public_path(self, parsed_path):
        """检查路径是否为公开访问（不需要认证）"""
        # 检查精确匹配
        if parsed_path in self.PUBLIC_PATHS:
            return True

        # 检查前缀匹配
        for prefix in self.PUBLIC_API_PREFIXES:
            if parsed_path.startswith(prefix):
                return True

        return False

    def is_public_get_path(self, parsed_path):
        """检查GET路径是否为公开访问"""
        for prefix in self.PUBLIC_GET_PREFIXES:
            if parsed_path.startswith(prefix):
                return True
        return False

    def handle_unauthorized(self):
        """返回未认证响应"""
        self.send_json({
            'success': False,
            'message': '未登录或登录已过期',
            'code': 'UNAUTHORIZED'
        }, 401)

    def do_GET(self):
        path = self.path
        user_id = self.require_auth()

        # 解析路径（去除查询参数）
        from urllib.parse import urlparse
        parsed_path = urlparse(path).path

        # 路由注册表匹配
        if self._dispatch_route(self.API_GET_ROUTES, parsed_path, user_id, path=path):
            return

        self.send_json({'message': 'Not Found'}, 404)

    def do_POST(self):
        path = self.path
        user_id = self.require_auth()

        # 解析路径（去除查询参数）
        from urllib.parse import urlparse
        parsed_path = urlparse(path).path

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b'{}'
        try:
            data = json.loads(body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            data = {}

        # 路由注册表匹配
        if self._dispatch_route(self.API_POST_ROUTES, parsed_path, user_id, data=data):
            return

        self.send_json({'message': 'Not Found'}, 404)

    def do_PUT(self):
        path = self.path
        user_id = self.require_auth()

        # 解析路径（去除查询参数）
        from urllib.parse import urlparse
        parsed_path = urlparse(path).path

        # PUT 请求都需要认证
        if not user_id:
            self.handle_unauthorized()
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b'{}'
        try:
            data = json.loads(body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            data = {}

        # 路由注册表匹配
        if self._dispatch_route(self.API_PUT_ROUTES, parsed_path, user_id, data=data):
            return

        self.send_json({'message': 'Not Found'}, 404)

    def do_DELETE(self):
        path = self.path
        user_id = self.require_auth()

        # 解析路径（去除查询参数）
        from urllib.parse import urlparse
        parsed_path = urlparse(path).path

        # DELETE 请求都需要认证
        if not user_id:
            self.handle_unauthorized()
            return

        # 路由注册表匹配
        if self._dispatch_route(self.API_DELETE_ROUTES, parsed_path, user_id):
            return

        self.send_json({'message': 'Not Found'}, 404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_HEAD(self):
        """处理 HEAD 请求 - 复用 GET 逻辑但只返回 headers"""
        # 解析路径
        from urllib.parse import urlparse
        parsed_path = urlparse(self.path).path

        # 静态文件 HEAD 请求处理
        if parsed_path.startswith('/mistake/'):
            import os
            from server.config import MISTAKE_FRONTEND_DIR
            sub_path = parsed_path[len('/mistake/'):]
            if not sub_path:
                sub_path = 'index.html'
            file_path = os.path.join(MISTAKE_FRONTEND_DIR, sub_path)
            if os.path.exists(file_path):
                import mimetypes
                content_type, _ = mimetypes.guess_type(file_path)
                if not content_type:
                    content_type = 'application/octet-stream'
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Cache-Control', 'public, max-age=31536000')
                self.end_headers()
                return

        # 其他路径返回 200
        self.send_response(200)
        self.end_headers()

    # ============ 路由桥接方法 ============
    # 这些方法将路由注册表连接到实际 handler 模块

    # ---- GET bridges ----
    def call_handler_mistakes(self, user_id, parsed_path, **kwargs):
        status, data = mistakes.handle_mistakes_get(user_id, {})
        self.send_json(data, status)

    def call_handler_study_time(self, user_id, parsed_path, **kwargs):
        status, data = study_time.handle_study_time_get(user_id, {})
        self.send_json(data, status)

    def call_handler_weekly_analysis(self, user_id, parsed_path, **kwargs):
        status, data = weekly_analysis.handle_weekly_analysis_get(user_id, {})
        self.send_json(data, status)

    def call_handler_ai_config(self, user_id, parsed_path, **kwargs):
        status, data = user_ai_config.handle_ai_config_get(user_id, {})
        self.send_json(data, status)

    def call_handler_stats(self, user_id, parsed_path, **kwargs):
        status, data = stats.handle_stats_get(user_id)
        self.send_json(data, status)

    def call_handler_review_history(self, user_id, parsed_path, **kwargs):
        path = kwargs.get('path', '')
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(path)
        params = parse_qs(parsed.query)
        param_dict = {k: v[0] if v else None for k, v in params.items()}
        status, data = review_history.handle_review_history_get(user_id, param_dict)
        self.send_json(data, status)

    def call_handler_review_due(self, user_id, parsed_path, **kwargs):
        path = kwargs.get('path', '')
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(path)
        params = parse_qs(parsed.query)
        param_dict = {k: v[0] if v else None for k, v in params.items()}
        status, data = review_history.handle_due_reviews_get(user_id, param_dict)
        self.send_json(data, status)

    def call_handler_account_user(self, user_id, parsed_path, **kwargs):
        # 提取 token（用于 /account/api/verify）
        auth_header = self.headers.get('Authorization', '')
        token = None
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]
        if not token:
            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            token = params.get('token', [None])[0]
        result = account.handle_account_get(parsed_path, user_id, token)
        if result:
            status, data = result
            self.send_json(data, status)
        else:
            self.send_json({'message': 'Not Found'}, 404)

    def call_handler_learning_api(self, user_id, parsed_path, **kwargs):
        self.handle_learning_platform_api('GET', parsed_path, user_id)

    # ---- Tools bridges ----
    def call_handler_tools_get(self, user_id, parsed_path, **kwargs):
        path = kwargs.get('path', '')
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(path)
        params = parse_qs(parsed.query)
        param_dict = {k: v[0] if v else None for k, v in params.items()}
        tool_action = parsed_path.replace('/api/tools/', '').split('/')[0]
        if tool_action == 'time-tracker':
            status, resp = tools_api.handle_tools_time_tracker_get(user_id, param_dict)
        elif tool_action == 'reminder':
            status, resp = tools_api.handle_tools_reminder_get(user_id, param_dict)
        elif tool_action == 'backup':
            status, resp = tools_api.handle_tools_backup_get(user_id, param_dict)
        else:
            self.send_json({'success': False, 'message': '未知的工具接口'}, 404)
            return
        self.send_json(resp, status)

    def call_handler_tools_post(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        tool_action = parsed_path.replace('/api/tools/', '').split('/')[0]
        if tool_action == 'time-tracker':
            status, resp = tools_api.handle_tools_time_tracker_post(user_id, data)
        elif tool_action == 'reminder':
            status, resp = tools_api.handle_tools_reminder_post(user_id, data)
        elif tool_action == 'backup':
            status, resp = tools_api.handle_tools_backup_post(user_id, data)
        else:
            self.send_json({'success': False, 'message': '未知的工具接口'}, 404)
            return
        self.send_json(resp, status)

    # ---- Vocabulary bridges ----
    def call_handler_vocabulary(self, user_id, parsed_path, **kwargs):
        path = kwargs.get('path', '')
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(path)
        params = parse_qs(parsed.query)
        param_dict = {k: v[0] if v else None for k, v in params.items()}
        status, data = vocabulary.handle_vocabulary_get(user_id, param_dict)
        self.send_json(data, status)

    def call_handler_vocabulary_post(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        status, resp = vocabulary.handle_vocabulary_post(user_id, data)
        self.send_json(resp, status)

    def call_handler_vocabulary_review(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        # 复习记录逻辑：更新熟练度和下次复习时间
        word_id = data.get('word_id')
        if not word_id:
            self.send_json({'success': False, 'message': 'word_id 不能为空'}, 400)
            return
        from datetime import datetime, timedelta
        conn = vocabulary.get_db() if hasattr(vocabulary, 'get_db') else __import__('server.database', fromlist=['get_db']).get_db()
        c = conn.cursor()
        c.execute('SELECT 熟练度, review_count FROM vocabulary WHERE id = ? AND user_id = ?', (word_id, user_id))
        row = c.fetchone()
        if not row:
            conn.close()
            self.send_json({'success': False, 'message': '单词不存在'}, 404)
            return
        proficiency = row['熟练度'] + 1
        review_count = row['review_count'] + 1
        # 艾宾浩斯间隔递增
        intervals = [1, 2, 4, 7, 15, 30]  # 1天, 2天, 4天, 1周, 2周, 1月
        days = intervals[min(proficiency, len(intervals)-1)]
        next_review = (datetime.now() + timedelta(days=days)).isoformat()
        c.execute('UPDATE vocabulary SET 熟练度=?, review_count=?, next_review=?, last_reviewed=? WHERE id=?',
                  (proficiency, review_count, next_review, datetime.now().isoformat(), word_id))
        conn.commit()
        conn.close()
        self.send_json({'success': True, '熟练度': proficiency, 'next_review': next_review})

    def call_handler_vocabulary_batch(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        words = data.get('words', [])
        if not words:
            self.send_json({'success': False, 'message': '单词列表不能为空'}, 400)
            return
        conn = __import__('server.database', fromlist=['get_db']).get_db()
        c = conn.cursor()
        added = 0
        skipped = 0
        for w in words:
            try:
                c.execute('''INSERT INTO vocabulary (user_id, word, phonetic, definition, part_of_speech, difficulty_level, status)
                            VALUES (?, ?, ?, ?, ?, ?, 'new')''',
                          (user_id, w.get('word', ''), w.get('phonetic'), w.get('definition'),
                           w.get('part_of_speech'), w.get('difficulty_level', 1)))
                added += 1
            except Exception:
                skipped += 1
        conn.commit()
        conn.close()
        self.send_json({'success': True, 'added': added, 'skipped': skipped})

    def call_handler_vocabulary_put(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        try:
            word_id = int(parsed_path.split('/')[-1])
        except (ValueError, IndexError):
            self.send_json({'success': False, 'message': '无效的单词ID'}, 400)
            return
        status, resp = vocabulary.handle_vocabulary_put(user_id, word_id, data)
        self.send_json(resp, status)

    def call_handler_vocabulary_delete(self, user_id, parsed_path, **kwargs):
        status, resp = vocabulary.handle_vocabulary_delete(user_id, parsed_path)
        self.send_json(resp, status)

    def _handle_api_schedule_get(self, parsed_path, user_id, **kwargs):
        path = kwargs.get('path', '')
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(path)
        params = parse_qs(parsed.query)
        param_dict = {k: v[0] if v else None for k, v in params.items()}
        if parsed_path == '/api/schedule/today':
            status, data = schedule.handle_schedule_today_get(user_id)
        else:
            status, data = schedule.handle_schedule_get(user_id, param_dict)
        self.send_json(data, status)

    def _handle_api_config_get(self, parsed_path, user_id, **kwargs):
        """处理配置获取（兼容未登录用户，内联逻辑较复杂）"""
        import os as os_mod
        from server.database import get_db

        combined_config = {}
        conn = None
        try:
            if user_id:
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("SELECT value FROM user_preferences WHERE user_id = ? AND key = ?", (user_id, "learning_config"))
                row = cursor.fetchone()
                if row and row[0]:
                    try:
                        combined_config.update(json.loads(row[0]))
                    except (json.JSONDecodeError, TypeError):
                        logger.warning(f"用户 {user_id} 的 learning_config 格式异常，已跳过")
                cursor.execute("SELECT value FROM user_preferences WHERE user_id = ? AND key = ?", (user_id, "ai_config"))
                row = cursor.fetchone()
                if row and row[0]:
                    try:
                        ai_config = json.loads(row[0])
                        if isinstance(ai_config, dict) and "ai_config" in ai_config:
                            combined_config.update(ai_config.get("ai_config", {}))
                        else:
                            combined_config.update(ai_config)
                    except (json.JSONDecodeError, TypeError):
                        logger.warning(f"用户 {user_id} 的 ai_config 格式异常，已跳过")
                conn.close()

            if combined_config:
                self.send_json({'success': True, 'data': combined_config, 'source': 'user'})
                return

            # 返回默认配置
            config_path = os_mod.path.join(os_mod.path.dirname(__file__), 'config.json')
            if os_mod.path.exists(config_path):
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                learning_config = config.get('学习配置', config)
                self.send_json({'success': True, 'data': learning_config, 'source': 'system'})
            else:
                self.send_json({'success': True, 'data': {'targetDate': '2026-06-07', 'countdownDays': 90, 'totalTarget': 540}, 'source': 'default'})
        except Exception as e:
            self.send_json({'success': False, 'message': str(e)}, 500)
        finally:
            if conn:
                conn.close()

    def _handle_api_health(self, parsed_path, user_id, **kwargs):
        self.send_json({'status': 'ok', 'time': datetime.now().isoformat()})

    # ---- POST bridges ----
    def _handle_api_account_post(self, parsed_path, user_id, **kwargs):
        data = kwargs.get('data', {})
        action = parsed_path.split('/')[-1]
        if action == 'login':
            status, resp = account.handle_login(data)
            self.send_json(resp, status)
        elif action == 'register':
            status, resp = account.handle_register(data)
            self.send_json(resp, status)
        elif action == 'logout':
            if not user_id:
                self.handle_unauthorized()
                return
            resp = account.handle_logout(data)
            self.send_json(resp)
        elif action == 'invite-code':
            if not user_id:
                self.handle_unauthorized()
                return
            resp = account.handle_create_invite_code(data)
            self.send_json(resp)
        else:
            if not user_id:
                self.handle_unauthorized()
                return
            self.send_json({'message': 'Unknown action'}, 404)

    def call_handler_mistakes_post(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        status, resp = mistakes.handle_mistakes_post(user_id, data)
        self.send_json(resp, status)

    def call_handler_study_time_post(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        status, resp = study_time.handle_study_time_post(user_id, data)
        self.send_json(resp, status)

    def call_handler_ai_analysis(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        status, resp = ai_proxy.handle_ai_analysis_proxy(user_id, data)
        self.send_json(resp, status)

    def call_handler_config_post(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        status, resp = config_api.handle_config_post(user_id, data)
        self.send_json(resp, status)

    def call_handler_weekly_analysis_post(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        status, resp = weekly_analysis.handle_weekly_analysis_post(user_id, data)
        self.send_json(resp, status)

    def call_handler_ai_config_post(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        status, resp = user_ai_config.handle_ai_config_post(user_id, data)
        self.send_json(resp, status)

    def call_handler_schedule_post(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        status, resp = schedule.handle_schedule_post(user_id, data)
        self.send_json(resp, status)

    def _handle_api_youdao_segment(self, parsed_path, user_id, **kwargs):
        data = kwargs.get('data', {})
        youdao.handle_youdao_segment_handler(self, data)

    def call_handler_review_history_post(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        status, resp = review_history.handle_review_record_post(user_id, data)
        self.send_json(resp, status)

    def call_handler_learning_api_post(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        self.handle_learning_platform_api('POST', parsed_path, user_id, data)

    # ---- PUT bridges ----
    def call_handler_mistakes_put(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        try:
            mistake_id = int(parsed_path.split('/')[-1])
            status, resp = mistakes.handle_mistakes_put(user_id, mistake_id, data)
            self.send_json(resp, status)
        except ValueError:
            self.send_json({'message': 'Invalid ID'}, 400)

    def call_handler_schedule_today_put(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        status, resp = schedule.handle_schedule_today_put(user_id, data)
        self.send_json(resp, status)

    def call_handler_learning_api_put(self, user_id, parsed_path, **kwargs):
        data = kwargs.get('data', {})
        self.handle_learning_platform_api('PUT', parsed_path, user_id, data)

    # ---- DELETE bridges ----
    def call_handler_study_time_delete(self, user_id, parsed_path, **kwargs):
        try:
            record_id = int(parsed_path.split('/')[-1])
            status, resp = study_time.handle_study_time_delete(user_id, record_id)
            self.send_json(resp, status)
        except (ValueError, IndexError):
            self.send_json({'success': False, 'message': '无效的记录ID'}, 400)

    def call_handler_mistakes_delete(self, user_id, parsed_path, **kwargs):
        status, resp = mistakes.handle_mistakes_delete(user_id, parsed_path)
        self.send_json(resp, status)

    def call_handler_weekly_analysis_delete(self, user_id, parsed_path, **kwargs):
        week_id = parsed_path.split('/')[-1]
        status, resp = weekly_analysis.handle_weekly_analysis_delete(user_id, week_id)
        self.send_json(resp, status)

    def call_handler_ai_config_delete(self, user_id, parsed_path, **kwargs):
        provider = parsed_path.split('/')[-1]
        status, resp = user_ai_config.handle_ai_config_delete(user_id, provider)
        self.send_json(resp, status)

    def call_handler_schedule_delete(self, user_id, parsed_path, **kwargs):
        day = parsed_path.split('/')[-1]
        status, resp = schedule.handle_schedule_delete(user_id, day)
        self.send_json(resp, status)

    def call_handler_learning_api_delete(self, user_id, parsed_path, **kwargs):
        self.handle_learning_platform_api('DELETE', parsed_path, user_id, None)

    # ============ 页面服务 ============

    def serve_home(self, *args, **kwargs):
        """提供主页"""
        import os
        index_path = os.path.join(os.path.dirname(__file__), 'config', 'index.html')
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
            self.wfile.write(html_content.encode('utf-8'))
        else:
            self.send_json({'message': 'Home page not found'}, 404)

    def serve_schedule_view_page(self, *args, **kwargs):
        """提供日程查看页面"""
        import os
        schedule_path = os.path.join(os.path.dirname(__file__), 'config', 'schedule-view.html')
        if os.path.exists(schedule_path):
            with open(schedule_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html_content.encode('utf-8'))
        else:
            self.send_json({'message': 'Schedule view page not found'}, 404)

    def serve_favicon(self, *args, **kwargs):
        """提供 favicon.ico"""
        import os
        favicon_path = os.path.join(os.path.dirname(__file__), 'config', 'favicon.ico')
        if os.path.exists(favicon_path):
            with open(favicon_path, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'image/x-icon')
            self.end_headers()
            self.wfile.write(content)
        else:
            self.send_response(204)
            self.end_headers()

    def serve_mistake_frontend(self, *args, **kwargs):
        """提供错题系统前端"""
        path = kwargs.get('path', '')
        from server.config import MISTAKE_FRONTEND_DIR, DEV_MODE, VITE_DEV_SERVER
        self._serve_spa_frontend(path, MISTAKE_FRONTEND_DIR, '/mistake/', DEV_MODE, VITE_DEV_SERVER)
    
    def _serve_spa_frontend(self, path, frontend_dir, url_prefix, dev_mode=False, vite_server=None):
        """通用的 SPA 前端服务方法（替换重复的 serve_mistake/wordcard/learning 函数）"""
        import os
        from urllib.parse import urlparse

        if dev_mode and vite_server:
            self.proxy_to_vite(path, url_prefix, vite_server)
            return

        parsed = urlparse(path)
        path_without_query = parsed.path

        if path_without_query.startswith(url_prefix):
            sub_path = path_without_query[len(url_prefix):]
        else:
            sub_path = path_without_query[1:]

        if sub_path == '' or sub_path == '/':
            sub_path = 'index.html'

        file_path = os.path.join(frontend_dir, sub_path)

        # 安全检查
        real_path = os.path.realpath(file_path)
        if not real_path.startswith(os.path.realpath(frontend_dir)):
            self.send_json({'message': 'Forbidden'}, 403)
            return

        if os.path.exists(file_path):
            content_type = 'text/html' if file_path.lower().endswith('.html') else None
            self.send_static(file_path, content_type)
        else:
            # SPA 回退到 index.html
            index_path = os.path.join(frontend_dir, 'index.html')
            if os.path.exists(index_path):
                self.send_static(index_path, 'text/html')
            else:
                self.send_json({'message': 'Not Found'}, 404)

    def _serve_static_dir(self, path, static_dir, url_prefix, use_unquote=False):
        """通用的静态目录文件服务方法（替换重复的 serve_static/downloads/images/shared 函数）"""
        import os
        from urllib.parse import urlparse, unquote

        parsed = urlparse(path)
        path_without_query = unquote(parsed.path) if use_unquote else parsed.path

        if path_without_query.startswith(url_prefix):
            sub_path = path_without_query[len(url_prefix):]
        else:
            sub_path = path_without_query[1:]

        file_path = os.path.join(static_dir, sub_path)

        # 安全检查
        real_path = os.path.realpath(file_path)
        if not real_path.startswith(os.path.realpath(static_dir)):
            self.send_json({'message': 'Forbidden'}, 403)
            return

        if os.path.exists(file_path) and os.path.isfile(file_path):
            self.send_static(file_path)
        else:
            self.send_json({'message': 'Not Found'}, 404)

    def proxy_to_vite(self, path, url_prefix='/mistake/', vite_server='http://localhost:5173'):
        """代理到 Vite 开发服务器"""
        import urllib.request

        try:
            # 构建 Vite URL
            vite_path = path.replace(url_prefix, '/')
            if vite_path == url_prefix.rstrip('/') or vite_path == '/':
                vite_path = '/'

            url = f"{vite_server}{vite_path}"

            # 转发请求
            req = urllib.request.Request(url, method=self.command)

            # 复制请求头
            for header in self.headers:
                if header.lower() not in ('host', 'content-length'):
                    req.add_header(header, self.headers[header])

            # 发送请求
            response = urllib.request.urlopen(req, timeout=30)

            # 返回响应
            self.send_response(response.status)
            for header, value in response.headers.items():
                self.send_header(header, value)
            self.end_headers()
            self.wfile.write(response.read())

        except Exception as e:
            self.send_json({'message': str(e)}, 500)

    def serve_static_resource(self, *args, **kwargs):
        """提供静态资源文件"""
        path = kwargs.get('path', '')
        static_dir = os.path.join(os.path.dirname(__file__), 'static')
        self._serve_static_dir(path, static_dir, '/static/')

    def serve_downloads(self, *args, **kwargs):
        """提供下载文件"""
        path = kwargs.get('path', '')
        downloads_dir = os.path.join(os.path.dirname(__file__), 'downloads')
        self._serve_static_dir(path, downloads_dir, '/downloads/', use_unquote=True)

    def serve_images(self, *args, **kwargs):
        """提供图片文件"""
        path = kwargs.get('path', '')
        images_dir = os.path.join(os.path.dirname(__file__), 'images')
        self._serve_static_dir(path, images_dir, '/images/')

    def serve_shared(self, *args, **kwargs):
        """提供 shared 目录文件"""
        path = kwargs.get('path', '')
        shared_dir = os.path.join(os.path.dirname(__file__), 'shared')
        self._serve_static_dir(path, shared_dir, '/shared/')

    def serve_wordcard(self, *args, **kwargs):
        """提供单词卡系统前端"""
        path = kwargs.get('path', '')
        WORDCARD_DIR = os.path.join(os.path.dirname(__file__), 'wordcard')
        self._serve_spa_frontend(path, WORDCARD_DIR, '/wordcard/')

    def handle_learning_platform_api(self, method, parsed_path, user_id, data=None):
        """处理学习平台 API 请求"""
        if data is None:
            data = {}
        path_parts = parsed_path.split('/')
        # /learning/api/xxx
        if len(path_parts) < 4:
            self.send_json({'message': 'Invalid path'}, 400)
            return

        resource = path_parts[3]  # subjects, chapters, progress, mastered, drawing
        action = path_parts[4] if len(path_parts) > 4 else None

        if method == 'GET':
            if resource == 'subjects':
                if action:
                    status, resp = learning_platform.handle_subject_detail_get(user_id, action)
                else:
                    status, resp = learning_platform.handle_subjects_get(user_id, {})
            elif resource == 'chapters':
                status, resp = learning_platform.handle_chapter_detail_get(user_id, action)
            elif resource == 'progress':
                status, resp = learning_platform.handle_progress_get(user_id, {})
            elif resource == 'mastered':
                status, resp = learning_platform.handle_mastered_get(user_id, {})
            elif resource == 'drawing':
                status, resp = learning_platform.handle_drawing_get(user_id, action)
            else:
                status, resp = 404, {'message': 'Not Found'}

        elif method == 'POST':
            if resource == 'progress':
                status, resp = learning_platform.handle_progress_post(user_id, data)
            elif resource == 'mastered':
                status, resp = learning_platform.handle_mastered_post(user_id, data)
            elif resource == 'drawing':
                status, resp = learning_platform.handle_drawing_post(user_id, data)
            elif resource == 'admin':
                admin_resource = path_parts[4] if len(path_parts) > 4 else None
                if admin_resource == 'subjects':
                    status, resp = learning_platform.handle_admin_subjects_post(user_id, data)
                elif admin_resource == 'chapters':
                    status, resp = learning_platform.handle_admin_chapters_post(user_id, data)
                else:
                    status, resp = 404, {'message': 'Not Found'}
            else:
                status, resp = 404, {'message': 'Not Found'}

        elif method == 'PUT':
            if resource == 'admin':
                admin_resource = path_parts[4] if len(path_parts) > 4 else None
                admin_id = path_parts[5] if len(path_parts) > 5 else None
                if admin_resource == 'subjects' and admin_id:
                    try:
                        status, resp = learning_platform.handle_admin_subjects_put(user_id, int(admin_id), data)
                    except ValueError:
                        status, resp = 400, {'message': 'Invalid ID'}
                elif admin_resource == 'chapters' and admin_id:
                    try:
                        status, resp = learning_platform.handle_admin_chapters_put(user_id, int(admin_id), data)
                    except ValueError:
                        status, resp = 400, {'message': 'Invalid ID'}
                else:
                    status, resp = 404, {'message': 'Not Found'}
            else:
                status, resp = 404, {'message': 'Not Found'}

        elif method == 'DELETE':
            if resource == 'drawing':
                status, resp = learning_platform.handle_drawing_delete(user_id, action)
            elif resource == 'admin':
                admin_resource = path_parts[4] if len(path_parts) > 4 else None
                admin_id = path_parts[5] if len(path_parts) > 5 else None
                if admin_resource == 'subjects' and admin_id:
                    try:
                        status, resp = learning_platform.handle_admin_subjects_delete(user_id, int(admin_id))
                    except ValueError:
                        status, resp = 400, {'message': 'Invalid ID'}
                elif admin_resource == 'chapters' and admin_id:
                    try:
                        status, resp = learning_platform.handle_admin_chapters_delete(user_id, int(admin_id))
                    except ValueError:
                        status, resp = 400, {'message': 'Invalid ID'}
                else:
                    status, resp = 404, {'message': 'Not Found'}
            else:
                status, resp = 404, {'message': 'Not Found'}
        else:
            status, resp = 405, {'message': 'Method not allowed'}

        self.send_json(resp, status)

    def serve_learning_platform(self, *args, **kwargs):
        """提供学习平台前端"""
        path = kwargs.get('path', '')
        LEARNING_DIR = os.path.join(os.path.dirname(__file__), 'learning-platform')
        self._serve_spa_frontend(path, LEARNING_DIR, '/learning/')

    def send_static(self, file_path, content_type=None):
        """发送静态文件"""
        import mimetypes
        import os
        
        try:
            if not content_type:
                content_type, _ = mimetypes.guess_type(file_path)
                if not content_type:
                    content_type = 'application/octet-stream'
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            # 开发/学习系统禁用缓存，确保 JS/CSS 修改立即生效
            if content_type in ('application/javascript', 'text/javascript', 'text/css'):
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            else:
                self.send_header('Cache-Control', 'public, max-age=86400')
            self.end_headers()

            with open(file_path, 'rb') as f:
                self.wfile.write(f.read())
        except Exception as e:
            self.send_json({'message': str(e)}, 500)

def main():
    logger.info("=" * 60)
    logger.info("启动模块化服务器...")
    logger.info("=" * 60)

    init_all_tables()
    logger.info("✓ 数据库初始化完成")

    server = ThreadingHTTPServer((HOST, PORT), UnifiedHandler)
    logger.info(f"✓ 服务器启动: http://{HOST}:{PORT}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("服务器已停止")

if __name__ == '__main__':
    from datetime import datetime
    main()
