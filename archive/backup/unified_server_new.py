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
from server.handlers import account, mistakes, vocabulary, study_time, ai_proxy, config_api, schedule, tools_api, youdao
from server.auth import verify_token
import json
import mimetypes
from urllib.parse import urlparse, parse_qs

class UnifiedHandler(BaseHTTPRequestHandler):
    """统一请求处理器"""

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

    def do_GET(self):
        path = self.path
        user_id = self.require_auth()

        # API路由
        if path.startswith('/api/mistakes'):
            status, data = mistakes.handle_mistakes_get(user_id, {})
            self.send_json(data, status)
            return

        if path.startswith('/api/vocabulary'):
            status, data = vocabulary.handle_vocabulary_get(user_id, {})
            self.send_json(data, status)
            return

        if path.startswith('/api/study-time'):
            status, data = study_time.handle_study_time_get(user_id, {})
            self.send_json(data, status)
            return

        if path.startswith('/api/schedule'):
            status, data = schedule.handle_schedule_get()
            self.send_json(data, status)
            return

        if path.startswith('/api/config'):
            status, data = config_api.handle_config_get(user_id)
            self.send_json(data, status)
            return

        if path == '/api/health':
            self.send_json({'status': 'ok', 'time': datetime.now().isoformat()})
            return

        # 静态文件服务
        if path.startswith('/mistake/'):
            self.serve_mistake_frontend(path)
            return

        self.send_json({'error': 'Not Found'}, 404)

    def do_POST(self):
        path = self.path
        user_id = self.require_auth()

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b'{}'
        try:
            data = json.loads(body.decode('utf-8'))
        except:
            data = {}

        # Account API
        if path.startswith('/account/api/'):
            action = path.split('/')[-1]
            if action == 'login':
                status, resp = account.handle_login(data)
                self.send_json(resp, status)
            elif action == 'register':
                status, resp = account.handle_register(data)
                self.send_json(resp, status)
            else:
                self.send_json({'error': 'Unknown action'}, 404)
            return

        # Mistakes API
        if path == '/api/mistakes':
            status, resp = mistakes.handle_mistakes_post(user_id, data)
            self.send_json(resp, status)
            return

        # Vocabulary API
        if path == '/api/vocabulary':
            status, resp = vocabulary.handle_vocabulary_post(user_id, data)
            self.send_json(resp, status)
            return

        # Study Time API
        if path == '/api/study-time':
            status, resp = study_time.handle_study_time_post(user_id, data)
            self.send_json(resp, status)
            return

        # AI Analysis
        if path == '/api/ai-analysis':
            status, resp = ai_proxy.handle_ai_analysis_proxy(user_id, data)
            self.send_json(resp, status)
            return

        # Config
        if path == '/api/config':
            status, resp = config_api.handle_config_post(user_id, data)
            self.send_json(resp, status)
            return

        self.send_json({'error': 'Not Found'}, 404)

    def do_PUT(self):
        path = self.path
        user_id = self.require_auth()

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b'{}'
        try:
            data = json.loads(body.decode('utf-8'))
        except:
            data = {}

        # Mistakes PUT
        if path.startswith('/api/mistakes/'):
            try:
                mistake_id = int(path.split('/')[-1])
                status, resp = mistakes.handle_mistakes_put(user_id, mistake_id, data)
                self.send_json(resp, status)
            except ValueError:
                self.send_json({'error': 'Invalid ID'}, 400)
            return

        self.send_json({'error': 'Not Found'}, 404)

    def do_DELETE(self):
        path = self.path
        user_id = self.require_auth()

        # Mistakes DELETE
        if path.startswith('/api/mistakes/'):
            status, resp = mistakes.handle_mistakes_delete(user_id, path)
            self.send_json(resp, status)
            return

        self.send_json({'error': 'Not Found'}, 404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def serve_mistake_frontend(self, path):
        """提供错题系统前端"""
        # 简化实现
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(b'<html><body>错题系统前端</body></html>')

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
