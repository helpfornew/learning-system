"""
数据库管理 - 统一连接和初始化
"""

import sqlite3
import os
import threading
from contextlib import contextmanager
from .config import UNIFIED_DB, DB_DIR, logger

# 连接池配置
MAX_POOL_SIZE = 10
_pool = []
_pool_lock = threading.Lock()
_pool_initialized = False


def _create_connection():
    """创建新的数据库连接"""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(UNIFIED_DB, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # 启用外键约束
    conn.execute('PRAGMA foreign_keys = ON')
    # 优化性能
    conn.execute('PRAGMA journal_mode = WAL')
    conn.execute('PRAGMA synchronous = NORMAL')
    return conn


def init_pool():
    """初始化连接池"""
    global _pool_initialized
    if _pool_initialized:
        return

    with _pool_lock:
        if _pool_initialized:
            return

        # 预创建连接
        for _ in range(min(3, MAX_POOL_SIZE)):
            _pool.append(_create_connection())

        _pool_initialized = True
        logger.info(f"数据库连接池已初始化，大小: {len(_pool)}")


def get_db():
    """获取统一数据库连接（兼容旧接口）"""
    return _create_connection()


@contextmanager
def get_db_connection():
    """
    使用连接池获取数据库连接的上下文管理器

    用法:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(...)
    """
    global _pool_initialized

    if not _pool_initialized:
        init_pool()

    conn = None
    try:
        with _pool_lock:
            if _pool:
                conn = _pool.pop()
            else:
                conn = _create_connection()

        yield conn

    finally:
        if conn:
            with _pool_lock:
                if len(_pool) < MAX_POOL_SIZE:
                    _pool.append(conn)
                else:
                    conn.close()


def close_pool():
    """关闭连接池中的所有连接"""
    global _pool_initialized
    with _pool_lock:
        while _pool:
            conn = _pool.pop()
            try:
                conn.close()
            except Exception as e:
                logger.warning(f"关闭数据库连接时出错: {e}")
        _pool_initialized = False
        logger.info("数据库连接池已关闭")

def init_all_tables():
    """初始化所有数据库表"""
    conn = get_db()
    c = conn.cursor()

    # users 表
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        email TEXT,
        vip_level INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        expires_at DATETIME,
        created_at DATETIME,
        last_login DATETIME
    )''')

    # sessions 表
    c.execute('''CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    # mistakes 表
    c.execute('''CREATE TABLE IF NOT EXISTS mistakes (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        content TEXT,
        wrong_answer TEXT,
        correct_answer TEXT,
        error_reason TEXT,
        difficulty INTEGER DEFAULT 2,
        images_path TEXT,
        knowledge_points TEXT,
        tags TEXT,
        analysis TEXT,
        created_at DATETIME,
        is_deleted BOOLEAN DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        last_review_date TEXT,
        next_review_date TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    # study_time 表
    c.execute('''CREATE TABLE IF NOT EXISTS study_time (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        duration REAL NOT NULL,
        date TEXT NOT NULL,
        created_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    # vocabulary 表
    c.execute('''CREATE TABLE IF NOT EXISTS vocabulary (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        word TEXT NOT NULL,
        phonetic TEXT,
        definition TEXT NOT NULL,
        example_sentence TEXT,
        example_translation TEXT,
        part_of_speech TEXT,
        tags TEXT,
        difficulty_level INTEGER DEFAULT 1,
        status TEXT DEFAULT 'new',
        熟练度 INTEGER DEFAULT 0,
        next_review DATETIME,
        review_count INTEGER DEFAULT 0,
        last_reviewed DATETIME,
        UNIQUE(user_id, word),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    # user_preferences 表
    c.execute('''CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT,
        UNIQUE(user_id, key),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    # invite_codes 表
    c.execute('''CREATE TABLE IF NOT EXISTS invite_codes (
        id INTEGER PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        max_uses INTEGER DEFAULT 0,
        current_uses INTEGER DEFAULT 0,
        expires_at DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        remark TEXT
    )''')

    # weekly_analysis 表 - 个性化学习分析
    c.execute('''CREATE TABLE IF NOT EXISTS weekly_analysis (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        week_id TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_mistakes INTEGER DEFAULT 0,
        analyzed_mistakes INTEGER DEFAULT 0,
        module_stats TEXT,
        personalized_analysis TEXT,
        UNIQUE(user_id, week_id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    # user_ai_config 表 - 用户AI配置
    c.execute('''CREATE TABLE IF NOT EXISTS user_ai_config (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        provider TEXT NOT NULL,
        api_key TEXT,
        endpoint TEXT,
        model TEXT,
        enabled BOOLEAN DEFAULT 1,
        max_tokens INTEGER DEFAULT 2000,
        temperature REAL DEFAULT 0.7,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, provider),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    # user_schedules 表 - 用户自定义时间表
    c.execute('''CREATE TABLE IF NOT EXISTS user_schedules (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        schedule_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, day_of_week),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    # lp_subjects 表 - 学习平台科目
    c.execute('''CREATE TABLE IF NOT EXISTS lp_subjects (
        id INTEGER PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        logo TEXT NOT NULL,
        color TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')

    # lp_chapters 表 - 学习平台章节
    c.execute('''CREATE TABLE IF NOT EXISTS lp_chapters (
        id INTEGER PRIMARY KEY,
        subject_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(subject_id) REFERENCES lp_subjects(id),
        UNIQUE(subject_id, key)
    )''')

    # lp_reading_progress 表 - 阅读进度
    c.execute('''CREATE TABLE IF NOT EXISTS lp_reading_progress (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        chapter_key TEXT NOT NULL,
        last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        read_count INTEGER DEFAULT 1,
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE(user_id, chapter_key)
    )''')

    # lp_mastered_chapters 表 - 已掌握章节
    c.execute('''CREATE TABLE IF NOT EXISTS lp_mastered_chapters (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        chapter_key TEXT NOT NULL,
        mastered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE(user_id, chapter_key)
    )''')

    # lp_canvas_drawings 表 - 涂鸦数据
    c.execute('''CREATE TABLE IF NOT EXISTS lp_canvas_drawings (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        chapter_key TEXT NOT NULL,
        drawing_data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE(user_id, chapter_key)
    )''')

    # 初始化默认科目数据（如果表为空）
    c.execute('SELECT COUNT(*) FROM lp_subjects')
    if c.fetchone()[0] == 0:
        default_subjects = [
            ('chemistry', '化学', '⚗️', '#4c9aff', '高中化学核心知识', 1),
            ('physics', '物理', '⚡', '#f59e0b', '高中物理核心知识', 2),
            ('chinese', '语文', '📖', '#10b981', '高中语文核心知识', 3),
            ('math', '数学', '🔢', '#ef4444', '高中数学核心知识', 4),
            ('english', '英语', '🔤', '#8b5cf6', '高中英语核心知识', 5),
            ('politics', '政治', '🏛️', '#ec4899', '高中政治核心知识', 6)
        ]
        c.executemany('''
            INSERT INTO lp_subjects (key, name, logo, color, description, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', default_subjects)
        logger.info(f"已初始化 {len(default_subjects)} 个默认科目")

    # 创建性能优化索引
    _create_indexes(c)

    conn.commit()
    conn.close()
    logger.info("数据库表已初始化")


def _create_indexes(c):
    """创建数据库索引以优化查询性能"""
    indexes = [
        # mistakes 表索引
        ('idx_mistakes_user_id', 'mistakes(user_id)'),
        ('idx_mistakes_user_subject', 'mistakes(user_id, subject_id)'),
        ('idx_mistakes_user_created', 'mistakes(user_id, created_at)'),
        ('idx_mistakes_next_review', 'mistakes(user_id, next_review_date)'),
        ('idx_mistakes_is_deleted', 'mistakes(is_deleted)'),

        # vocabulary 表索引
        ('idx_vocabulary_user_id', 'vocabulary(user_id)'),
        ('idx_vocabulary_user_status', 'vocabulary(user_id, status)'),
        ('idx_vocabulary_next_review', 'vocabulary(user_id, next_review)'),

        # study_time 表索引
        ('idx_study_time_user_date', 'study_time(user_id, date)'),
        ('idx_study_time_user_subject', 'study_time(user_id, subject)'),

        # sessions 表索引
        ('idx_sessions_token', 'sessions(token)'),
        ('idx_sessions_user_id', 'sessions(user_id)'),
        ('idx_sessions_expires', 'sessions(expires_at)'),

        # weekly_analysis 表索引
        ('idx_weekly_analysis_user_week', 'weekly_analysis(user_id, week_id)'),

        # user_ai_config 表索引
        ('idx_user_ai_config_user', 'user_ai_config(user_id, provider)'),

        # user_schedules 表索引
        ('idx_user_schedules_user_day', 'user_schedules(user_id, day_of_week)'),

        # lp_reading_progress 表索引
        ('idx_lp_progress_user_chapter', 'lp_reading_progress(user_id, chapter_key)'),

        # lp_mastered_chapters 表索引
        ('idx_lp_mastered_user_chapter', 'lp_mastered_chapters(user_id, chapter_key)'),

        # lp_canvas_drawings 表索引
        ('idx_lp_canvas_user_chapter', 'lp_canvas_drawings(user_id, chapter_key)'),
    ]

    created_count = 0
    for index_name, index_def in indexes:
        try:
            c.execute(f'CREATE INDEX IF NOT EXISTS {index_name} ON {index_def}')
            created_count += 1
        except Exception as e:
            logger.warning(f"创建索引 {index_name} 失败: {e}")

    logger.info(f"数据库索引已创建/更新，共 {created_count} 个")

