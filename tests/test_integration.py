"""
集成测试 - 测试完整的 API 流程
场景：用户注册 -> 登录 -> 创建错题 -> 查询错题 -> 更新错题 -> 删除错题
安全场景：SQL注入、权限隔离
"""
import pytest
import json
from server.handlers.account import handle_register, handle_login, handle_logout
from server.handlers.mistakes import (
    handle_mistakes_get,
    handle_mistakes_post,
    handle_mistakes_put,
    handle_mistakes_delete
)
from server.auth import verify_token


class TestUserMistakeWorkflow:
    """用户错题完整工作流测试"""

    def test_complete_workflow(self, db_connection, test_invite_code):
        """完整工作流：注册 -> 登录 -> 增删改查错题"""

        # 1. 注册新用户
        register_data = {
            'username': 'workflowuser',
            'password': 'workflowpass',
            'invite_code': test_invite_code['code']
        }
        status, result = handle_register(register_data)
        assert status == 200
        assert result['success'] is True
        user_id = result['user']['id']
        token = result['token']

        # 验证 token 有效
        verify_result = verify_token(token)
        assert verify_result is not None
        assert verify_result['user_id'] == user_id

        # 2. 创建错题
        mistake_data = {
            'subject_id': 1,
            'content': '数学题：1+1=?',
            'wrong_answer': '3',
            'correct_answer': '2',
            'error_reason': '粗心',
            'analysis': '1加1等于2',
            'knowledge_points': ['加法', '基础数学'],
            'tags': ['简单', '必考'],
            'difficulty': 1
        }
        status, result = handle_mistakes_post(user_id, mistake_data)
        assert status == 200
        assert result['success'] is True
        mistake_id = result['id']

        # 3. 查询错题列表
        status, result = handle_mistakes_get(user_id, {})
        assert status == 200
        assert result['success'] is True
        assert len(result['data']) == 1
        assert result['data'][0]['content'] == '数学题：1+1=?'

        # 4. 更新错题
        update_data = {
            'content': '数学题：1+1=?（已更新）',
            'correct_answer': '2（二）'
        }
        status, result = handle_mistakes_put(user_id, mistake_id, update_data)
        assert status == 200
        assert result['success'] is True

        # 5. 验证更新
        status, result = handle_mistakes_get(user_id, {})
        assert result['data'][0]['content'] == '数学题：1+1=?（已更新）'

        # 6. 删除错题
        path = f'/api/mistakes/{mistake_id}'
        status, result = handle_mistakes_delete(user_id, path)
        assert status == 200
        assert result['success'] is True

        # 7. 验证删除
        status, result = handle_mistakes_get(user_id, {})
        assert len(result['data']) == 0

    def test_multiple_users_isolation(self, db_connection, test_invite_code):
        """多用户数据隔离测试"""

        # 创建用户A
        status, result = handle_register({
            'username': 'usera',
            'password': 'passa',
            'invite_code': test_invite_code['code']
        })
        user_a_id = result['user']['id']

        # 创建用户B
        status, result = handle_register({
            'username': 'userb',
            'password': 'passb',
            'invite_code': test_invite_code['code']
        })
        user_b_id = result['user']['id']

        # 用户A创建错题
        handle_mistakes_post(user_a_id, {
            'subject_id': 1,
            'content': 'A用户的错题',
            'tags': ['A']
        })

        # 用户B创建错题
        handle_mistakes_post(user_b_id, {
            'subject_id': 2,
            'content': 'B用户的错题',
            'tags': ['B']
        })

        # 验证用户A只能看到自己的错题
        status, result = handle_mistakes_get(user_a_id, {})
        assert len(result['data']) == 1
        assert result['data'][0]['content'] == 'A用户的错题'

        # 验证用户B只能看到自己的错题
        status, result = handle_mistakes_get(user_b_id, {})
        assert len(result['data']) == 1
        assert result['data'][0]['content'] == 'B用户的错题'

        # 验证用户A不能修改B的错题
        c = db_connection.cursor()
        c.execute('SELECT id FROM mistakes WHERE user_id = ?', (user_b_id,))
        b_mistake_id = c.fetchone()[0]

        status, result = handle_mistakes_put(user_a_id, b_mistake_id, {'content': '试图修改'})
        assert status == 404
        assert '无权限' in result['message']

        # 验证用户A不能删除B的错题
        status, result = handle_mistakes_delete(user_a_id, f'/api/mistakes/{b_mistake_id}')
        assert status == 404
        assert '无权限' in result['message']


class TestAuthenticationSecurity:
    """认证安全测试"""

    def test_token_expiration(self, db_connection, test_invite_code):
        """Token 过期测试（模拟）"""
        # 注册并获取 token
        status, result = handle_register({
            'username': 'tokenuser',
            'password': 'tokenpass',
            'invite_code': test_invite_code['code']
        })
        token = result['token']
        user_id = result['user']['id']

        # 模拟 token 过期（直接修改数据库）
        c = db_connection.cursor()
        c.execute('UPDATE sessions SET expires_at = datetime("now", "-1 day") WHERE token = ?', (token,))
        db_connection.commit()

        # 验证过期 token 无效
        verify_result = verify_token(token)
        assert verify_result is None

    def test_multiple_sessions_same_user(self, db_connection, test_invite_code):
        """同一用户多次登录 - 只有最新 session 有效（单设备登录策略）"""
        # 注册用户
        handle_register({
            'username': 'multisession',
            'password': 'pass',
            'invite_code': test_invite_code['code']
        })

        # 第一次登录
        status, result = handle_login({
            'username': 'multisession',
            'password': 'pass'
        })
        first_token = result['token']

        # 第一次登录的 token 应该有效
        assert verify_token(first_token) is not None

        # 第二次登录（会使第一次的 token 失效）
        status, result = handle_login({
            'username': 'multisession',
            'password': 'pass'
        })
        second_token = result['token']

        # 第二次的 token 有效
        assert verify_token(second_token) is not None

        # 第一次的 token 应该已经失效（单设备登录策略）
        assert verify_token(first_token) is None

        # 登出
        from server.handlers.account import handle_logout
        handle_logout({'token': second_token})

        # 被登出的 token 应该无效
        assert verify_token(second_token) is None


class TestSQLInjectionProtection:
    """SQL注入防护集成测试"""

    def test_sql_injection_throughout_workflow(self, db_connection, test_invite_code):
        """在整个工作流中测试 SQL 注入防护"""

        # 注册时使用注入字符串
        malicious_username = "user' UNION SELECT * FROM users --"
        status, result = handle_register({
            'username': malicious_username,
            'password': 'pass',
            'invite_code': test_invite_code['code']
        })
        assert status == 200
        user_id = result['user']['id']

        # 验证用户名正确存储（没有被解析为 SQL）
        c = db_connection.cursor()
        c.execute('SELECT username FROM users WHERE id = ?', (user_id,))
        assert c.fetchone()[0] == malicious_username

        # 登录时使用注入
        status, result = handle_login({
            'username': malicious_username,
            'password': 'pass'
        })
        assert status == 200

        # 创建错题时使用注入
        status, result = handle_mistakes_post(user_id, {
            'subject_id': 1,
            'content': "'; DROP TABLE mistakes; --",
            'wrong_answer': "'; DELETE FROM users; --",
            'correct_answer': "'; UPDATE users SET vip_level=9; --",
            'analysis': "'; SELECT * FROM passwords; --"
        })
        assert status == 200

        # 验证表没有被删除
        c.execute('SELECT name FROM sqlite_master WHERE type="table" AND name="mistakes"')
        assert c.fetchone() is not None

        # 验证数据没有被修改
        c.execute('SELECT vip_level FROM users WHERE id = ?', (user_id,))
        assert c.fetchone()[0] == 1  # 仍然是普通VIP

    def test_blind_sql_injection_attempt(self, test_invite_code):
        """布尔盲注测试"""
        # 尝试布尔盲注
        status, result = handle_login({
            'username': "' OR '1'='1",
            'password': "' OR '1'='1"
        })
        # 应该失败
        assert status == 401

    def test_time_based_sql_injection(self, db_connection, test_invite_code):
        """时间盲注测试（观察响应时间）"""
        import time

        start = time.time()
        status, result = handle_login({
            'username': "'; SELECT * FROM users WHERE random() > 0.5; --",
            'password': 'pass'
        })
        elapsed = time.time() - start

        # 如果存在时间盲注漏洞，响应时间会很长
        # 正常情况下应该很快返回
        assert elapsed < 2.0  # 小于2秒
        assert status == 401


class TestEdgeCases:
    """边界情况和异常测试"""

    def test_very_long_content(self, db_connection, test_invite_code):
        """超长内容测试"""
        status, result = handle_register({
            'username': 'longcontent',
            'password': 'pass',
            'invite_code': test_invite_code['code']
        })
        user_id = result['user']['id']

        # 创建包含超长内容的错题
        long_content = 'A' * 10000
        status, result = handle_mistakes_post(user_id, {
            'subject_id': 1,
            'content': long_content
        })
        assert status == 200

        # 验证内容完整存储
        status, result = handle_mistakes_get(user_id, {})
        assert len(result['data'][0]['content']) == 10000

    def test_special_characters(self, db_connection, test_invite_code):
        """特殊字符测试"""
        status, result = handle_register({
            'username': 'specialchars',
            'password': 'pass',
            'invite_code': test_invite_code['code']
        })
        user_id = result['user']['id']

        # 各种特殊字符
        special_chars = '<>&"\'\n\r\t\x00\x01😀🎉'
        status, result = handle_mistakes_post(user_id, {
            'subject_id': 1,
            'content': f'题目{special_chars}',
            'wrong_answer': f'错误{special_chars}',
            'correct_answer': f'正确{special_chars}'
        })
        assert status == 200

    def test_unicode_content(self, db_connection, test_invite_code):
        """Unicode 内容测试"""
        status, result = handle_register({
            'username': 'unicodeuser',
            'password': 'pass',
            'invite_code': test_invite_code['code']
        })
        user_id = result['user']['id']

        # 中文、日文、阿拉伯文、表情符号
        unicode_content = '数学题目：∫x²dx = ? 答案：⅓x³ + C 🎯 加油！'
        status, result = handle_mistakes_post(user_id, {
            'subject_id': 1,
            'content': unicode_content
        })
        assert status == 200

        # 验证内容正确存储
        status, result = handle_mistakes_get(user_id, {})
        assert result['data'][0]['content'] == unicode_content

    def test_concurrent_operations(self, db_connection, test_invite_code):
        """并发操作测试（简化版）"""
        status, result = handle_register({
            'username': 'concurrent',
            'password': 'pass',
            'invite_code': test_invite_code['code']
        })
        user_id = result['user']['id']

        # 快速创建多个错题（模拟并发）
        for i in range(10):
            handle_mistakes_post(user_id, {
                'subject_id': i % 6 + 1,
                'content': f'错题{i}'
            })

        # 验证所有错题都存在
        status, result = handle_mistakes_get(user_id, {})
        assert len(result['data']) == 10

    def test_empty_and_null_values(self, db_connection, test_invite_code):
        """空值和 null 值测试"""
        status, result = handle_register({
            'username': 'emptyvalues',
            'password': 'pass',
            'invite_code': test_invite_code['code']
        })
        user_id = result['user']['id']

        # 创建最小化数据错题
        status, result = handle_mistakes_post(user_id, {
            'subject_id': 1,
            'content': '只有内容'
        })
        assert status == 200

        # 创建空字符串字段错题
        status, result = handle_mistakes_post(user_id, {
            'subject_id': 1,
            'content': '内容',
            'wrong_answer': '',
            'correct_answer': '',
            'error_reason': '',
            'analysis': ''
        })
        assert status == 200


class TestErrorRecovery:
    """错误恢复测试"""

    def test_invalid_json_in_data(self, test_invite_code):
        """数据中包含无效 JSON"""
        # 这个测试需要确保系统不会因无效数据崩溃
        status, result = handle_register({
            'username': 'invalidjson',
            'password': 'pass',
            'invite_code': test_invite_code['code']
        })
        user_id = result['user']['id']

        # 尝试传递列表而不是预期的字符串
        status, result = handle_mistakes_post(user_id, {
            'subject_id': 1,
            'content': ['这不是字符串'],
            'knowledge_points': '这也不是列表'
        })

        # 应该成功处理（系统会转换数据类型）
        assert status == 200

    def test_negative_numbers(self, db_connection, test_invite_code):
        """负数输入测试"""
        status, result = handle_register({
            'username': 'negative',
            'password': 'pass',
            'invite_code': test_invite_code['code']
        })
        user_id = result['user']['id']

        # 负数的 subject_id
        status, result = handle_mistakes_post(user_id, {
            'subject_id': -1,
            'content': '测试'
        })
        assert status == 200  # 系统允许存储（由业务逻辑决定是否限制）
