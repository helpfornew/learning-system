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
from server.handlers import weekly_analysis, user_ai_config, learning_platform, stats, review_history
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
        '/tools',
        '/tools.html',
        '/schedule-view',
        '/schedule-view.html',
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

        # 检查是否需要认证
        is_public = (self.is_public_path(parsed_path) or
                     self.is_public_get_path(parsed_path))
        if not is_public and not user_id:
            self.handle_unauthorized()
            return

        # API路由 - 需要认证的接口
        if parsed_path.startswith('/api/mistakes'):
            if not user_id:
                self.handle_unauthorized()
                return
            status, data = mistakes.handle_mistakes_get(user_id, {})
            self.send_json(data, status)
            return

        if parsed_path.startswith('/api/study-time'):
            if not user_id:
                self.handle_unauthorized()
                return
            status, data = study_time.handle_study_time_get(user_id, {})
            self.send_json(data, status)
            return

        if parsed_path.startswith('/api/schedule'):
            if not user_id:
                self.handle_unauthorized()
                return
            # 解析查询参数
            parsed = urlparse(path)
            params = parse_qs(parsed.query)
            param_dict = {k: v[0] if v else None for k, v in params.items()}

            if parsed_path == '/api/schedule/today':
                status, data = schedule.handle_schedule_today_get(user_id)
            else:
                status, data = schedule.handle_schedule_get(user_id, param_dict)
            self.send_json(data, status)
            return

        if parsed_path.startswith('/api/config'):
            # 直接处理，兼容未登录用户
            import json
            import os
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
                        except:
                            pass
                    cursor.execute("SELECT value FROM user_preferences WHERE user_id = ? AND key = ?", (user_id, "ai_config"))
                    row = cursor.fetchone()
                    if row and row[0]:
                        try:
                            ai_config = json.loads(row[0])
                            if isinstance(ai_config, dict) and "ai_config" in ai_config:
                                combined_config.update(ai_config.get("ai_config", {}))
                            else:
                                combined_config.update(ai_config)
                        except:
                            pass
                    conn.close()

                if combined_config:
                    self.send_json({'success': True, 'data': combined_config, 'source': 'user'})
                    return

                # 返回默认配置
                config_path = os.path.join(os.path.dirname(__file__), 'config.json')
                if os.path.exists(config_path):
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
            return

        if parsed_path == '/api/health':
            self.send_json({'status': 'ok', 'time': datetime.now().isoformat()})
            return

        # 个性化学习分析 API - 需要认证
        if parsed_path == '/api/weekly-analysis':
            if not user_id:
                self.handle_unauthorized()
                return
            status, data = weekly_analysis.handle_weekly_analysis_get(user_id, {})
            self.send_json(data, status)
            return

        # 用户 AI 配置 API - 需要认证
        if parsed_path == '/api/ai-config':
            if not user_id:
                self.handle_unauthorized()
                return
            status, data = user_ai_config.handle_ai_config_get(user_id, {})
            self.send_json(data, status)
            return

        # Account API - GET /account/api/user - 需要认证
        if parsed_path == '/account/api/user':
            if not user_id:
                self.handle_unauthorized()
                return
            result = account.handle_account_get(parsed_path, user_id)
            if result:
                status, data = result
                self.send_json(data, status)
            else:
                self.send_json({'message': 'Not Found'}, 404)
            return

        # 用户统计数据 API - 需要认证
        if parsed_path == '/api/stats':
            if not user_id:
                self.handle_unauthorized()
                return
            status, data = stats.handle_stats_get(user_id)
            self.send_json(data, status)
            return

        # 复习历史 API - 需要认证
        if parsed_path == '/api/review-history':
            if not user_id:
                self.handle_unauthorized()
                return
            # 解析查询参数
            parsed = urlparse(path)
            params = parse_qs(parsed.query)
            param_dict = {k: v[0] if v else None for k, v in params.items()}
            status, data = review_history.handle_review_history_get(user_id, param_dict)
            self.send_json(data, status)
            return

        # 学习平台 API - 需要认证
        if parsed_path.startswith('/learning/api/'):
            if not user_id:
                self.handle_unauthorized()
                return
            self.handle_learning_platform_api('GET', parsed_path, user_id)
            return

        # 主页
        if parsed_path == '/' or parsed_path == '/index.html':
            self.serve_home()
            return

        # favicon
        if parsed_path == '/favicon.ico':
            self.serve_favicon()
            return

        # 工具中心页面
        if parsed_path == '/tools' or parsed_path == '/tools.html':
            self.serve_tools_page()
            return

        # 日程查看页面
        if parsed_path == '/schedule-view' or parsed_path == '/schedule-view.html':
            self.serve_schedule_view_page()
            return

        # 静态文件服务
        if parsed_path.startswith('/mistake/'):
            self.serve_mistake_frontend(path)
            return

        # 静态资源目录
        if parsed_path.startswith('/static/'):
            self.serve_static_resource(path)
            return

        # 下载目录
        if parsed_path.startswith('/downloads/'):
            self.serve_downloads(path)
            return

        # 图片目录
        if parsed_path.startswith('/images/'):
            self.serve_images(path)
            return

        # shared 目录
        if parsed_path.startswith('/shared/'):
            self.serve_shared(path)
            return

        # 单词卡系统
        if parsed_path.startswith('/wordcard/'):
            self.serve_wordcard(path)
            return

        # 学习平台系统
        if parsed_path.startswith('/learning/'):
            self.serve_learning_platform(path)
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
        except:
            data = {}

        # Account API - 公开接口（登录/注册）
        if parsed_path.startswith('/account/api/'):
            action = parsed_path.split('/')[-1]
            if action == 'login':
                status, resp = account.handle_login(data)
                self.send_json(resp, status)
            elif action == 'register':
                status, resp = account.handle_register(data)
                self.send_json(resp, status)
            else:
                # 其他 account API 需要认证
                if not user_id:
                    self.handle_unauthorized()
                    return
                self.send_json({'message': 'Unknown action'}, 404)
            return

        # 以下 API 都需要认证
        if not user_id:
            self.handle_unauthorized()
            return

        # Mistakes API
        if parsed_path == '/api/mistakes':
            status, resp = mistakes.handle_mistakes_post(user_id, data)
            self.send_json(resp, status)
            return

        # Study Time API
        if parsed_path == '/api/study-time':
            status, resp = study_time.handle_study_time_post(user_id, data)
            self.send_json(resp, status)
            return

        # AI Analysis
        if parsed_path == '/api/ai-analysis':
            status, resp = ai_proxy.handle_ai_analysis_proxy(user_id, data)
            self.send_json(resp, status)
            return

        # Config
        if parsed_path == '/api/config':
            status, resp = config_api.handle_config_post(user_id, data)
            self.send_json(resp, status)
            return

        # 个性化学习分析保存
        if parsed_path == '/api/weekly-analysis':
            status, resp = weekly_analysis.handle_weekly_analysis_post(user_id, data)
            self.send_json(resp, status)
            return

        # 用户 AI 配置保存
        if parsed_path == '/api/ai-config':
            status, resp = user_ai_config.handle_ai_config_post(user_id, data)
            self.send_json(resp, status)
            return

        # Schedule API - 保存/更新时间表
        if parsed_path == '/api/schedule':
            status, resp = schedule.handle_schedule_post(user_id, data)
            self.send_json(resp, status)
            return

        # 有道题目识别 API
        if parsed_path == '/api/youdao/segment':
            youdao.handle_youdao_segment_handler(self, data)
            return

        # 记录复习历史 API
        if parsed_path == '/api/review-history':
            status, resp = review_history.handle_review_record_post(user_id, data)
            self.send_json(resp, status)
            return

        # 学习平台 API
        if parsed_path.startswith('/learning/api/'):
            self.handle_learning_platform_api('POST', parsed_path, user_id, data)
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
        except:
            data = {}

        # Mistakes PUT
        if parsed_path.startswith('/api/mistakes/'):
            try:
                mistake_id = int(parsed_path.split('/')[-1])
                status, resp = mistakes.handle_mistakes_put(user_id, mistake_id, data)
                self.send_json(resp, status)
            except ValueError:
                self.send_json({'message': 'Invalid ID'}, 400)
            return

        # Schedule PUT - 更新今日时间表
        if parsed_path == '/api/schedule/today':
            status, resp = schedule.handle_schedule_today_put(user_id, data)
            self.send_json(resp, status)
            return

        # 学习平台 API
        if parsed_path.startswith('/learning/api/'):
            self.handle_learning_platform_api('PUT', parsed_path, user_id, data)
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

        # Mistakes DELETE
        if parsed_path.startswith('/api/mistakes/'):
            status, resp = mistakes.handle_mistakes_delete(user_id, parsed_path)
            self.send_json(resp, status)
            return

        # 删除个性化学习分析
        if parsed_path.startswith('/api/weekly-analysis/'):
            week_id = parsed_path.split('/')[-1]
            status, resp = weekly_analysis.handle_weekly_analysis_delete(user_id, week_id)
            self.send_json(resp, status)
            return

        # 删除用户 AI 配置
        if parsed_path.startswith('/api/ai-config/'):
            provider = parsed_path.split('/')[-1]
            status, resp = user_ai_config.handle_ai_config_delete(user_id, provider)
            self.send_json(resp, status)
            return

        # 删除用户时间表
        if parsed_path.startswith('/api/schedule/'):
            day = parsed_path.split('/')[-1]
            status, resp = schedule.handle_schedule_delete(user_id, day)
            self.send_json(resp, status)
            return

        # 学习平台 API
        if parsed_path.startswith('/learning/api/'):
            self.handle_learning_platform_api('DELETE', parsed_path, user_id, None)
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

    def serve_home(self):
        """提供主页"""
        import os
        index_path = os.path.join(os.path.dirname(__file__), 'config', 'index.html')
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html_content.encode('utf-8'))
        else:
            self.send_json({'message': 'Home page not found'}, 404)

    def serve_tools_page(self):
        """提供工具中心页面"""
        import os
        tools_path = os.path.join(os.path.dirname(__file__), 'config', 'tools.html')
        if os.path.exists(tools_path):
            with open(tools_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html_content.encode('utf-8'))
        else:
            self.send_json({'message': 'Tools page not found'}, 404)

    def serve_schedule_view_page(self):
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

    def serve_favicon(self):
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

    def serve_mistake_frontend(self, path):
        """提供错题系统前端"""
        from server.config import MISTAKE_FRONTEND_DIR, DEV_MODE, VITE_DEV_SERVER
        import os
        from urllib.parse import urlparse
        
        if DEV_MODE:
            # 开发模式：代理到 Vite
            self.proxy_to_vite(path)
            return
        
        # 生产模式：从 dist 目录提供静态文件
        parsed = urlparse(path)
        path_without_query = parsed.path
        
        if path_without_query.startswith('/mistake/'):
            sub_path = path_without_query[len('/mistake/'):]
        else:
            sub_path = path_without_query[1:]
        
        if sub_path == '' or sub_path == '/':
            sub_path = 'index.html'
        
        file_path = os.path.join(MISTAKE_FRONTEND_DIR, sub_path)
        
        # 安全检查
        real_path = os.path.realpath(file_path)
        if not real_path.startswith(os.path.realpath(MISTAKE_FRONTEND_DIR)):
            self.send_json({'message': 'Forbidden'}, 403)
            return
        
        if os.path.exists(file_path):
            if file_path.lower().endswith('.html'):
                self.send_static(file_path, 'text/html')
            else:
                self.send_static(file_path)
        else:
            # SPA 回退到 index.html
            index_path = os.path.join(MISTAKE_FRONTEND_DIR, 'index.html')
            if os.path.exists(index_path):
                self.send_static(index_path, 'text/html')
            else:
                self.send_json({'message': 'Not Found'}, 404)
    
    def proxy_to_vite(self, path):
        """代理到 Vite 开发服务器"""
        import urllib.request
        from server.config import VITE_DEV_SERVER
        
        try:
            # 构建 Vite URL
            vite_path = path.replace('/mistake/', '/')
            if vite_path == '/mistake' or vite_path == '/':
                vite_path = '/'
            
            url = f"{VITE_DEV_SERVER}{vite_path}"
            
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

    def serve_static_resource(self, path):
        """提供静态资源文件"""
        import os
        from urllib.parse import urlparse

        parsed = urlparse(path)
        path_without_query = parsed.path

        # 移除 /static/ 前缀
        if path_without_query.startswith('/static/'):
            sub_path = path_without_query[len('/static/'):]
        else:
            sub_path = path_without_query[1:]

        # 静态文件目录
        static_dir = os.path.join(os.path.dirname(__file__), 'static')
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

    def serve_downloads(self, path):
        """提供下载文件"""
        import os
        from urllib.parse import urlparse, unquote

        parsed = urlparse(path)
        path_without_query = unquote(parsed.path)

        # 移除 /downloads/ 前缀
        if path_without_query.startswith('/downloads/'):
            sub_path = path_without_query[len('/downloads/'):]
        else:
            sub_path = path_without_query[1:]

        # 下载文件目录
        downloads_dir = os.path.join(os.path.dirname(__file__), 'downloads')
        file_path = os.path.join(downloads_dir, sub_path)

        # 安全检查
        real_path = os.path.realpath(file_path)
        if not real_path.startswith(os.path.realpath(downloads_dir)):
            self.send_json({'message': 'Forbidden'}, 403)
            return

        if os.path.exists(file_path) and os.path.isfile(file_path):
            self.send_static(file_path)
        else:
            self.send_json({'message': 'Not Found'}, 404)

    def serve_images(self, path):
        """提供图片文件"""
        import os
        from urllib.parse import urlparse

        parsed = urlparse(path)
        path_without_query = parsed.path

        # 移除 /images/ 前缀
        if path_without_query.startswith('/images/'):
            sub_path = path_without_query[len('/images/'):]
        else:
            sub_path = path_without_query[1:]

        # 图片目录
        images_dir = os.path.join(os.path.dirname(__file__), 'images')
        file_path = os.path.join(images_dir, sub_path)

        # 安全检查
        real_path = os.path.realpath(file_path)
        if not real_path.startswith(os.path.realpath(images_dir)):
            self.send_json({'message': 'Forbidden'}, 403)
            return

        if os.path.exists(file_path) and os.path.isfile(file_path):
            self.send_static(file_path)
        else:
            self.send_json({'message': 'Not Found'}, 404)

    def serve_shared(self, path):
        """提供 shared 目录文件"""
        import os
        from urllib.parse import urlparse

        parsed = urlparse(path)
        path_without_query = parsed.path

        # 移除 /shared/ 前缀
        if path_without_query.startswith('/shared/'):
            sub_path = path_without_query[len('/shared/'):]
        else:
            sub_path = path_without_query[1:]

        # shared 目录
        shared_dir = os.path.join(os.path.dirname(__file__), 'shared')
        file_path = os.path.join(shared_dir, sub_path)

        # 安全检查
        real_path = os.path.realpath(file_path)
        if not real_path.startswith(os.path.realpath(shared_dir)):
            self.send_json({'message': 'Forbidden'}, 403)
            return

        if os.path.exists(file_path) and os.path.isfile(file_path):
            self.send_static(file_path)
        else:
            self.send_json({'message': 'Not Found'}, 404)

    def serve_wordcard(self, path):
        """提供单词卡系统前端"""
        import os
        from urllib.parse import urlparse

        WORDCARD_DIR = os.path.join(os.path.dirname(__file__), 'wordcard')

        parsed = urlparse(path)
        path_without_query = parsed.path

        if path_without_query.startswith('/wordcard/'):
            sub_path = path_without_query[len('/wordcard/'):]
        else:
            sub_path = path_without_query[1:]

        if sub_path == '' or sub_path == '/':
            sub_path = 'index.html'

        file_path = os.path.join(WORDCARD_DIR, sub_path)

        # 安全检查
        real_path = os.path.realpath(file_path)
        if not real_path.startswith(os.path.realpath(WORDCARD_DIR)):
            self.send_json({'message': 'Forbidden'}, 403)
            return

        if os.path.exists(file_path) and os.path.isfile(file_path):
            if file_path.lower().endswith('.html'):
                self.send_static(file_path, 'text/html')
            else:
                self.send_static(file_path)
        else:
            # SPA 回退到 index.html
            index_path = os.path.join(WORDCARD_DIR, 'index.html')
            if os.path.exists(index_path):
                self.send_static(index_path, 'text/html')
            else:
                self.send_json({'message': 'Not Found'}, 404)

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

    def serve_learning_platform(self, path):
        """提供学习平台前端"""
        import os
        from urllib.parse import urlparse

        LEARNING_DIR = os.path.join(os.path.dirname(__file__), 'learning-platform')

        parsed = urlparse(path)
        path_without_query = parsed.path

        if path_without_query.startswith('/learning/'):
            sub_path = path_without_query[len('/learning/'):]
        else:
            sub_path = path_without_query[1:]

        if sub_path == '' or sub_path == '/':
            sub_path = 'index.html'

        file_path = os.path.join(LEARNING_DIR, sub_path)

        # 安全检查
        real_path = os.path.realpath(file_path)
        if not real_path.startswith(os.path.realpath(LEARNING_DIR)):
            self.send_json({'message': 'Forbidden'}, 403)
            return

        if os.path.exists(file_path) and os.path.isfile(file_path):
            if file_path.lower().endswith('.html'):
                self.send_static(file_path, 'text/html')
            else:
                self.send_static(file_path)
        else:
            # SPA 回退到 index.html
            index_path = os.path.join(LEARNING_DIR, 'index.html')
            if os.path.exists(index_path):
                self.send_static(index_path, 'text/html')
            else:
                self.send_json({'message': 'Not Found'}, 404)

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
            self.send_header('Cache-Control', 'public, max-age=31536000')
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
