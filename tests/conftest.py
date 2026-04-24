"""
Pytest 配置文件 - 测试 fixtures 和配置
"""
import pytest
import sqlite3
import os
import sys

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.auth import hash_password, generate_token
from server.config import DATA_DIR


@pytest.fixture
def db_connection(mock_database):
    """提供内存数据库连接"""
    return mock_database


@pytest.fixture
def db_cursor(mock_database):
    """提供数据库游标"""
    return mock_database.cursor()


@pytest.fixture
def test_user(mock_database):
    """创建一个测试用户"""
    c = mock_database.cursor()
    salt = generate_token('test')[:32]
    password_hash = hash_password('testpassword', salt)

    c.execute('''
        INSERT INTO users (username, password_hash, salt, vip_level, status, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
    ''', ('testuser', password_hash, salt, 1, 'active'))

    user_id = c.lastrowid
    mock_database.commit()

    return {
        'id': user_id,
        'username': 'testuser',
        'password': 'testpassword',
        'salt': salt,
        'vip_level': 1
    }


@pytest.fixture
def admin_user(mock_database):
    """创建一个管理员用户"""
    c = mock_database.cursor()
    salt = generate_token('admin')[:32]
    password_hash = hash_password('adminpassword', salt)

    c.execute('''
        INSERT INTO users (username, password_hash, salt, vip_level, status, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
    ''', ('adminuser', password_hash, salt, 9, 'active'))

    user_id = c.lastrowid
    mock_database.commit()

    return {
        'id': user_id,
        'username': 'adminuser',
        'password': 'adminpassword',
        'salt': salt,
        'vip_level': 9
    }


@pytest.fixture
def test_invite_code(mock_database):
    """创建一个有效的邀请码"""
    c = mock_database.cursor()
    c.execute('''
        INSERT INTO invite_codes (code, max_uses, current_uses, expires_at, is_active, remark)
        VALUES (?, ?, ?, datetime('now', '+30 days'), ?, ?)
    ''', ('TESTINVITE123', 10, 0, 1, '测试邀请码'))

    invite_id = c.lastrowid
    mock_database.commit()

    return {
        'id': invite_id,
        'code': 'TESTINVITE123',
        'max_uses': 10,
        'current_uses': 0
    }


@pytest.fixture
def used_invite_code(mock_database):
    """创建一个已用完的邀请码"""
    c = mock_database.cursor()
    c.execute('''
        INSERT INTO invite_codes (code, max_uses, current_uses, expires_at, is_active, remark)
        VALUES (?, ?, ?, datetime('now', '+30 days'), ?, ?)
    ''', ('USEDINVITE123', 1, 1, 1, '已用完的邀请码'))

    invite_id = c.lastrowid
    mock_database.commit()

    return {
        'id': invite_id,
        'code': 'USEDINVITE123',
        'max_uses': 1,
        'current_uses': 1
    }


@pytest.fixture
def expired_invite_code(mock_database):
    """创建一个过期的邀请码"""
    c = mock_database.cursor()
    c.execute('''
        INSERT INTO invite_codes (code, max_uses, current_uses, expires_at, is_active, remark)
        VALUES (?, ?, ?, datetime('now', '-1 days'), ?, ?)
    ''', ('EXPIREDINVITE123', 10, 0, 1, '过期的邀请码'))

    invite_id = c.lastrowid
    mock_database.commit()

    return {
        'id': invite_id,
        'code': 'EXPIREDINVITE123',
        'max_uses': 10,
        'current_uses': 0
    }


def _init_test_tables(conn):
    """初始化测试数据库表"""
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

    conn.commit()


class NonClosingConnection:
    """包装连接对象，忽略 close() 调用"""
    def __init__(self, conn):
        self._conn = conn
        self._closed = False

    def __getattr__(self, name):
        return getattr(self._conn, name)

    def close(self):
        # 在测试中忽略 close() 调用
        pass

    def real_close(self):
        self._conn.close()
        self._closed = True


@pytest.fixture(autouse=True)
def mock_database(monkeypatch):
    """自动替换 get_db 函数，使用内存数据库"""
    import server.database as database
    import server.auth as auth
    import server.handlers.account as account
    import server.handlers.mistakes as mistakes
    import server.handlers.vocabulary as vocabulary
    import server.handlers.study_time as study_time

    # 创建共享的内存数据库连接
    raw_conn = sqlite3.connect(':memory:', check_same_thread=False)
    raw_conn.row_factory = sqlite3.Row
    raw_conn.execute('PRAGMA foreign_keys = ON')
    _init_test_tables(raw_conn)

    # 使用包装器防止连接被关闭
    conn = NonClosingConnection(raw_conn)

    def mock_get_db():
        return conn

    monkeypatch.setattr(database, 'get_db', mock_get_db)
    monkeypatch.setattr(auth, 'get_db', mock_get_db)
    monkeypatch.setattr(account, 'get_db', mock_get_db)
    monkeypatch.setattr(mistakes, 'get_db', mock_get_db)
    monkeypatch.setattr(vocabulary, 'get_db', mock_get_db)
    monkeypatch.setattr(study_time, 'get_db', mock_get_db)

    yield conn

    conn.real_close()
