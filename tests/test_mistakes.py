"""
错题管理 handler 单元测试
测试场景：错题的增删改查
安全测试：SQL注入防护、权限验证
"""
import pytest
import json
from datetime import datetime
from server.handlers.mistakes import (
    handle_mistakes_get,
    handle_mistakes_post,
    handle_mistakes_put,
    handle_mistakes_delete
)


class TestGetMistakes:
    """获取错题列表测试"""

    def test_get_mistakes_success(self, db_connection, test_user):
        """正常获取错题列表"""
        # 先创建一些错题
        c = db_connection.cursor()
        for i in range(3):
            c.execute('''
                INSERT INTO mistakes (user_id, subject_id, content, created_at)
                VALUES (?, ?, ?, datetime('now'))
            ''', (test_user['id'], 1, f'错题内容{i}'))
        db_connection.commit()

        params = {}
        status, result = handle_mistakes_get(test_user['id'], params)

        assert status == 200
        assert result['success'] is True
        assert len(result['data']) == 3

    def test_get_mistakes_empty(self, test_user):
        """空错题列表"""
        params = {}
        status, result = handle_mistakes_get(test_user['id'], params)

        assert status == 200
        assert result['success'] is True
        assert len(result['data']) == 0

    def test_get_mistakes_not_logged_in(self):
        """未登录获取错题"""
        params = {}
        status, result = handle_mistakes_get(None, params)

        assert status == 401
        assert result['success'] is False
        assert '未登录' in result['message']

    def test_get_mistakes_isolation(self, db_connection, test_user):
        """用户数据隔离 - 只能看到自己的错题"""
        # 创建另一个用户
        c = db_connection.cursor()
        c.execute('''
            INSERT INTO users (username, password_hash, salt, status, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        ''', ('otheruser', 'hash', 'salt', 'active'))
        other_user_id = c.lastrowid

        # 给其他用户创建错题
        c.execute('''
            INSERT INTO mistakes (user_id, subject_id, content, created_at)
            VALUES (?, ?, ?, datetime('now'))
        ''', (other_user_id, 1, '其他用户的错题'))

        # 给当前用户创建错题
        c.execute('''
            INSERT INTO mistakes (user_id, subject_id, content, created_at)
            VALUES (?, ?, ?, datetime('now'))
        ''', (test_user['id'], 1, '我的错题'))
        db_connection.commit()

        params = {}
        status, result = handle_mistakes_get(test_user['id'], params)

        assert status == 200
        assert result['success'] is True
        assert len(result['data']) == 1
        assert result['data'][0]['content'] == '我的错题'

    def test_get_mistakes_order_by_created_at(self, db_connection, test_user):
        """按创建时间倒序排列"""
        c = db_connection.cursor()

        # 创建错题（模拟不同时间）
        c.execute('''
            INSERT INTO mistakes (user_id, subject_id, content, created_at)
            VALUES (?, ?, ?, datetime('now', '-2 days'))
        ''', (test_user['id'], 1, '较早的错题'))

        c.execute('''
            INSERT INTO mistakes (user_id, subject_id, content, created_at)
            VALUES (?, ?, ?, datetime('now'))
        ''', (test_user['id'], 1, '最新的错题'))
        db_connection.commit()

        params = {}
        status, result = handle_mistakes_get(test_user['id'], params)

        assert status == 200
        assert result['data'][0]['content'] == '最新的错题'
        assert result['data'][1]['content'] == '较早的错题'


class TestCreateMistake:
    """创建错题测试"""

    def test_create_mistake_success(self, test_user):
        """正常创建错题"""
        data = {
            'subject_id': 1,
            'content': '这是一道数学题',
            'wrong_answer': '错误答案',
            'correct_answer': '正确答案',
            'error_reason': '粗心',
            'analysis': '解析内容',
            'knowledge_points': ['代数', '方程'],
            'tags': ['重要', '易错'],
            'difficulty': 3,
            'images_path': ''
        }
        status, result = handle_mistakes_post(test_user['id'], data)

        assert status == 200
        assert result['success'] is True
        assert 'id' in result

    def test_create_mistake_not_logged_in(self):
        """未登录创建错题"""
        data = {'subject_id': 1, 'content': '错题内容'}
        status, result = handle_mistakes_post(None, data)

        assert status == 401
        assert result['success'] is False
        assert '未登录' in result['message']

    def test_create_mistake_with_knowledge_points_list(self, test_user):
        """创建带知识点列表的错题"""
        data = {
            'subject_id': 1,
            'content': '错题内容',
            'knowledge_points': ['点1', '点2', '点3'],
            'tags': ['标签1', '标签2']
        }
        status, result = handle_mistakes_post(test_user['id'], data)

        assert status == 200
        assert result['success'] is True

    def test_create_mistake_with_image(self, test_user):
        """创建带图片的错题"""
        data = {
            'subject_id': 1,
            'content': '错题内容',
            'images_path': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...'
        }
        status, result = handle_mistakes_post(test_user['id'], data)

        assert status == 200
        assert result['success'] is True

    def test_create_mistake_default_values(self, db_connection, test_user):
        """默认值测试"""
        data = {
            'subject_id': 1,
            'content': '最小化数据'
        }
        status, result = handle_mistakes_post(test_user['id'], data)

        assert status == 200
        assert result['success'] is True

        # 验证默认值
        c = db_connection.cursor()
        c.execute('SELECT * FROM mistakes WHERE id = ?', (result['id'],))
        row = c.fetchone()

        assert row['subject_id'] == 1
        assert row['difficulty'] == 2  # 默认难度
        assert row['is_deleted'] == 0
        assert row['review_count'] == 0


class TestUpdateMistake:
    """更新错题测试"""

    def test_update_mistake_success(self, db_connection, test_user):
        """正常更新错题"""
        # 先创建错题
        c = db_connection.cursor()
        c.execute('''
            INSERT INTO mistakes (user_id, subject_id, content, created_at)
            VALUES (?, ?, ?, datetime('now'))
        ''', (test_user['id'], 1, '原始内容'))
        mistake_id = c.lastrowid
        db_connection.commit()

        data = {
            'content': '更新后的内容',
            'correct_answer': '正确答案',
            'difficulty': 4
        }
        status, result = handle_mistakes_put(test_user['id'], mistake_id, data)

        assert status == 200
        assert result['success'] is True

        # 验证更新
        c.execute('SELECT content, correct_answer, difficulty FROM mistakes WHERE id = ?', (mistake_id,))
        row = c.fetchone()
        assert row['content'] == '更新后的内容'
        assert row['correct_answer'] == '正确答案'
        assert row['difficulty'] == 4

    def test_update_mistake_not_logged_in(self):
        """未登录更新错题"""
        data = {'content': '新内容'}
        status, result = handle_mistakes_put(None, 1, data)

        assert status == 401
        assert result['success'] is False
        assert '未登录' in result['message']

    def test_update_mistake_not_found(self, test_user):
        """更新不存在的错题"""
        data = {'content': '新内容'}
        status, result = handle_mistakes_put(test_user['id'], 99999, data)

        assert status == 404
        assert result['success'] is False
        assert '错题不存在' in result['message']

    def test_update_mistake_no_permission(self, db_connection, test_user):
        """更新其他用户的错题"""
        # 创建另一个用户
        c = db_connection.cursor()
        c.execute('''
            INSERT INTO users (username, password_hash, salt, status, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        ''', ('otheruser', 'hash', 'salt', 'active'))
        other_user_id = c.lastrowid

        # 给其他用户创建错题
        c.execute('''
            INSERT INTO mistakes (user_id, subject_id, content, created_at)
            VALUES (?, ?, ?, datetime('now'))
        ''', (other_user_id, 1, '其他用户的错题'))
        mistake_id = c.lastrowid
        db_connection.commit()

        data = {'content': '试图修改'}
        status, result = handle_mistakes_put(test_user['id'], mistake_id, data)

        assert status == 404
        assert result['success'] is False
        assert '无权限' in result['message']

    def test_update_mistake_no_fields(self, db_connection, test_user):
        """没有提供更新字段"""
        # 先创建错题
        c = db_connection.cursor()
        c.execute('''
            INSERT INTO mistakes (user_id, subject_id, content, created_at)
            VALUES (?, ?, ?, datetime('now'))
        ''', (test_user['id'], 1, '原始内容'))
        mistake_id = c.lastrowid
        db_connection.commit()

        data = {}
        status, result = handle_mistakes_put(test_user['id'], mistake_id, data)

        assert status == 400
        assert result['success'] is False
        assert '无更新字段' in result['message']

    def test_update_mistake_partial_fields(self, db_connection, test_user):
        """部分字段更新"""
        # 先创建错题
        c = db_connection.cursor()
        c.execute('''
            INSERT INTO mistakes (user_id, subject_id, content, correct_answer, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        ''', (test_user['id'], 1, '原始内容', '原始答案'))
        mistake_id = c.lastrowid
        db_connection.commit()

        # 只更新 content
        data = {'content': '只更新内容'}
        status, result = handle_mistakes_put(test_user['id'], mistake_id, data)

        assert status == 200
        assert result['success'] is True

        # 验证只更新了 content
        c.execute('SELECT content, correct_answer FROM mistakes WHERE id = ?', (mistake_id,))
        row = c.fetchone()
        assert row['content'] == '只更新内容'
        assert row['correct_answer'] == '原始答案'  # 保持不变


class TestDeleteMistake:
    """删除错题测试"""

    def test_delete_mistake_success(self, db_connection, test_user):
        """正常删除错题"""
        # 先创建错题
        c = db_connection.cursor()
        c.execute('''
            INSERT INTO mistakes (user_id, subject_id, content, created_at)
            VALUES (?, ?, ?, datetime('now'))
        ''', (test_user['id'], 1, '要删除的错题'))
        mistake_id = c.lastrowid
        db_connection.commit()

        path = f'/api/mistakes/{mistake_id}'
        status, result = handle_mistakes_delete(test_user['id'], path)

        assert status == 200
        assert result['success'] is True

        # 验证已删除
        c.execute('SELECT * FROM mistakes WHERE id = ?', (mistake_id,))
        assert c.fetchone() is None

    def test_delete_mistake_not_logged_in(self):
        """未登录删除错题"""
        path = '/api/mistakes/1'
        status, result = handle_mistakes_delete(None, path)

        assert status == 401
        assert result['success'] is False
        assert '未登录' in result['message']

    def test_delete_mistake_invalid_id_format(self, test_user):
        """无效ID格式"""
        path = '/api/mistakes/invalid'
        status, result = handle_mistakes_delete(test_user['id'], path)

        assert status == 400
        assert result['success'] is False
        assert '无效ID' in result['message']

    def test_delete_mistake_missing_id(self, test_user):
        """缺少ID"""
        path = '/api/mistakes'
        status, result = handle_mistakes_delete(test_user['id'], path)

        assert status == 400
        assert result['success'] is False
        assert '缺少错题ID' in result['message']

    def test_delete_mistake_not_found(self, test_user):
        """删除不存在的错题"""
        path = '/api/mistakes/99999'
        status, result = handle_mistakes_delete(test_user['id'], path)

        assert status == 404
        assert result['success'] is False
        assert '错题不存在' in result['message']

    def test_delete_mistake_no_permission(self, db_connection, test_user):
        """删除其他用户的错题"""
        # 创建另一个用户
        c = db_connection.cursor()
        c.execute('''
            INSERT INTO users (username, password_hash, salt, status, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        ''', ('otheruser', 'hash', 'salt', 'active'))
        other_user_id = c.lastrowid

        # 给其他用户创建错题
        c.execute('''
            INSERT INTO mistakes (user_id, subject_id, content, created_at)
            VALUES (?, ?, ?, datetime('now'))
        ''', (other_user_id, 1, '其他用户的错题'))
        mistake_id = c.lastrowid
        db_connection.commit()

        path = f'/api/mistakes/{mistake_id}'
        status, result = handle_mistakes_delete(test_user['id'], path)

        assert status == 404
        assert result['success'] is False
        assert '无权限' in result['message']


class TestSecurity:
    """安全测试"""

    def test_sql_injection_in_content(self, test_user):
        """内容中的SQL注入防护"""
        data = {
            'subject_id': 1,
            'content': "题目' OR '1'='1'; DROP TABLE mistakes; --",
            'wrong_answer': "答案'; DELETE FROM users; --",
            'correct_answer': "正确'; UPDATE users SET vip_level=9; --"
        }
        status, result = handle_mistakes_post(test_user['id'], data)

        # 应该成功创建（参数化查询防止了SQL注入）
        assert status == 200
        assert result['success'] is True

    def test_sql_injection_in_tags(self, test_user):
        """标签中的SQL注入防护"""
        data = {
            'subject_id': 1,
            'content': '正常内容',
            'tags': ['正常标签', "'; DROP TABLE mistakes; --"]
        }
        status, result = handle_mistakes_post(test_user['id'], data)

        assert status == 200
        assert result['success'] is True

    def test_sql_injection_in_update(self, db_connection, test_user):
        """更新时的SQL注入防护"""
        # 先创建错题
        c = db_connection.cursor()
        c.execute('''
            INSERT INTO mistakes (user_id, subject_id, content, created_at)
            VALUES (?, ?, ?, datetime('now'))
        ''', (test_user['id'], 1, '原始内容'))
        mistake_id = c.lastrowid
        db_connection.commit()

        data = {
            'content': "新内容'; DROP TABLE mistakes; --",
            'analysis': "解析'; DELETE FROM users; --"
        }
        status, result = handle_mistakes_put(test_user['id'], mistake_id, data)

        assert status == 200
        assert result['success'] is True

        # 验证内容正确存储（没有被截断或解析）
        c.execute('SELECT content FROM mistakes WHERE id = ?', (mistake_id,))
        row = c.fetchone()
        assert "'; DROP TABLE mistakes; --" in row['content']

    def test_sql_injection_in_delete_path(self, db_connection, test_user):
        """删除路径中的SQL注入防护"""
        # 尝试使用注入语句作为路径
        path = "/api/mistakes/1' OR '1'='1"
        status, result = handle_mistakes_delete(test_user['id'], path)

        # 应该失败（路径解析失败）
        assert status == 400

    def test_user_id_injection_attempt(self, test_user):
        """尝试注入user_id"""
        # 尝试使用OR条件绕过权限检查
        fake_user_id = "1 OR 1=1"
        data = {'subject_id': 1, 'content': '测试'}

        # 这里应该会因为类型检查而失败
        # 注意：实际处理取决于handle_mistakes_get的实现
        try:
            status, result = handle_mistakes_get(fake_user_id, data)
            # 如果执行了，应该返回错误或空结果
            assert status in [200, 401, 500]
        except (TypeError, ValueError):
            # 类型错误是预期的，因为user_id应该是整数
            pass


class TestDataTypes:
    """数据类型测试"""

    def test_knowledge_points_list_conversion(self, db_connection, test_user):
        """知识点列表转换为JSON"""
        data = {
            'subject_id': 1,
            'content': '测试',
            'knowledge_points': ['点1', '点2', '点3']
        }
        status, result = handle_mistakes_post(test_user['id'], data)

        assert status == 200

        # 验证存储的是JSON字符串
        c = db_connection.cursor()
        c.execute('SELECT knowledge_points FROM mistakes WHERE id = ?', (result['id'],))
        row = c.fetchone()
        stored_value = row['knowledge_points']

        # 应该可以解析为列表
        parsed = json.loads(stored_value)
        assert isinstance(parsed, list)
        assert len(parsed) == 3

    def test_difficulty_integer_conversion(self, db_connection, test_user):
        """难度值整数转换"""
        data = {
            'subject_id': 1,
            'content': '测试',
            'difficulty': '3'  # 字符串传入
        }
        status, result = handle_mistakes_post(test_user['id'], data)

        assert status == 200

        c = db_connection.cursor()
        c.execute('SELECT difficulty FROM mistakes WHERE id = ?', (result['id'],))
        row = c.fetchone()
        assert row['difficulty'] == 3  # 被转换为整数

    def test_subject_id_integer_conversion(self, db_connection, test_user):
        """科目ID整数转换"""
        data = {
            'subject_id': '2',  # 字符串传入
            'content': '测试'
        }
        status, result = handle_mistakes_post(test_user['id'], data)

        assert status == 200

        c = db_connection.cursor()
        c.execute('SELECT subject_id FROM mistakes WHERE id = ?', (result['id'],))
        row = c.fetchone()
        assert row['subject_id'] == 2  # 被转换为整数
