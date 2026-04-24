"""
配置管理 - 环境变量、常量和日志配置
"""

import os
import logging
from logging.handlers import RotatingFileHandler

# ============ 加载 .env 环境变量 ============
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path)
    except ImportError:
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

# ============ 基本配置 ============
BASE_DIR = os.environ.get('LEARNING_SYSTEM_DIR', os.path.expanduser('~/learning_system'))
DATA_DIR = os.environ.get('LEARNING_SYSTEM_DATA', os.path.join(BASE_DIR, 'data'))
HOST = os.environ.get('LEARNING_SYSTEM_HOST', '0.0.0.0')
PORT = int(os.environ.get('LEARNING_SYSTEM_PORT', 8080))
ALLOWED_ORIGIN = os.environ.get('ALLOWED_ORIGIN', '*')
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
LOG_FILE_PATH = os.environ.get('LOG_FILE_PATH', '/var/log/learning-system/server.log')

# ============ 开发模式 ============
DEV_MODE = os.environ.get('DEV_MODE', '0') in ('1', 'true', 'yes', 'on')
VITE_DEV_SERVER = os.environ.get('VITE_DEV_SERVER', 'http://localhost:5173')

# ============ API 配置 ============
MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 20 * 1024 * 1024))
AI_ANALYSIS_CONCURRENCY = int(os.environ.get('AI_ANALYSIS_CONCURRENCY', 15))
YOUDAO_APP_ID = os.environ.get('YOUDAO_APP_ID', '')
YOUDAO_APP_SECRET = os.environ.get('YOUDAO_APP_SECRET', '')

# ============ 目录配置 ============
CONFIG_DIR = os.path.join(BASE_DIR, 'config')
MISTAKE_FRONTEND_DIR = os.path.join(BASE_DIR, 'mistake_system', 'mistake-system-desktop', 'dist')
DB_DIR = os.path.join(DATA_DIR, 'database')
BACKUP_DIR = os.path.join(DATA_DIR, 'backup')
UNIFIED_DB = os.path.join(DB_DIR, 'unified_learning.db')

# ============ 日志配置 ============
def setup_logging():
    """设置日志系统"""
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, LOG_LEVEL))

    try:
        log_dir = os.path.dirname(LOG_FILE_PATH)
        if log_dir:
            os.makedirs(log_dir, exist_ok=True)
        handler = RotatingFileHandler(LOG_FILE_PATH, maxBytes=10*1024*1024, backupCount=5)
        handler.setFormatter(logging.Formatter('[%(asctime)s] %(levelname)s: %(message)s'))
        logger.addHandler(handler)
    except (PermissionError, OSError):
        pass

    console = logging.StreamHandler()
    console.setFormatter(logging.Formatter('[%(asctime)s] %(levelname)s: %(message)s'))
    logger.addHandler(console)
    return logger

logger = setup_logging()
