"""
账户认证 handler 单元测试
测试场景：注册、登录、用户信息获取、邀请码创建
安全测试：SQL注入防护
"""
import pytest
from datetime import datetime, timedelta
from server.handlers.account import (
    handle_account_get,
    handle_account_post,
    handle_login,
    handle_register,
    handle_logout,
    handle_create_invite_code
)
from server.auth import hash_password, generate_token, verify_token


class TestLogin:
    """登录功能测试"""

    def test_login_success(self, db_connection, test_user):
        """正常登录成功"""
        data = {
            'username': test_user['username'],
            'password': test_user['password']
        }
        status, result = handle_login(data)

        assert status == 200
        assert result['success'] is True
        assert result['message'] == '登录成功'
        assert 'token' in result
        assert result['user']['username'] == test_user['username']
        assert result['user']['id'] == test_user['id']

    def test_login_empty_username(self):
        """用户名为空"""
        data = {'username': '', 'password': 'password'}
        status, result = handle_login(data)

        assert status == 400
        assert result['success'] is False
        assert '用户名或密码为空' in result['message']

    def test_login_empty_password(self):
        """密码为空"""
        data = {'username': 'testuser', 'password': ''}
        status, result = handle_login(data)

        assert status == 400
        assert result['success'] is False
        assert '用户名或密码为空' in result['message']

    def test_login_wrong_password(self, db_connection, test_user):
        """密码错误"""
        data = {
            'username': test_user['username'],
            'password': 'wrongpassword'
        }
        status, result = handle_login(data)

        assert status == 401
        assert result['success'] is False
        assert '用户名或密码错误' in result['message']

    def test_login_nonexistent_user(self):
        """用户不存在"""
        data = {'username': 'nonexistent', 'password': 'password'}
        status, result = handle_login(data)

        assert status == 401
        assert result['success'] is False
        assert '用户名或密码错误' in result['message']

    def test_login_sql_injection_username(self, db_connection):
        """SQL注入防护 - 用户名"""
        data = {'username': "admin' OR '1'='1", 'password': 'password'}
        status, result = handle_login(data)

        assert status == 401
        assert result['success'] is False

    def test_login_sql_injection_password(self, db_connection):
        """SQL注入防护 - 密码"""
        data = {'username': 'testuser', 'password': "' OR '1'='1"}
        status, result = handle_login(data)

        assert status == 401
        assert result['success'] is False


class TestRegister:
    """注册功能测试"""

    def test_register_success(self, db_connection, test_invite_code):
        """正常注册成功"""
        data = {
            'username': 'newuser',
            'password': 'newpassword',
            'invite_code': test_invite_code['code']
        }
        status, result = handle_register(data)

        assert status == 200
        assert result['success'] is True
        assert '注册成功' in result['message']
        assert 'token' in result
        assert result['user']['username'] == 'newuser'
        assert result['vip_days'] == 30

    def test_register_missing_username(self, test_invite_code):
        """缺少用户名"""
        data = {
            'username': '',
            'password': 'password',
            'invite_code': test_invite_code['code']
        }
        status, result = handle_register(data)

        assert status == 400
        assert result['success'] is False
        assert '缺少必要字段' in result['message']

    def test_register_missing_password(self, test_invite_code):
        """缺少密码"""
        data = {
            'username': 'newuser',
            'password': '',
            'invite_code': test_invite_code['code']
        }
        status, result = handle_register(data)

        assert status == 400
        assert result['success'] is False
        assert '缺少必要字段' in result['message']

    def test_register_missing_invite_code(self):
        """缺少邀请码"""
        data = {
            'username': 'newuser',
            'password': 'password',
            'invite_code': ''
        }
        status, result = handle_register(data)

        assert status == 400
        assert result['success'] is False
        assert '缺少必要字段' in result['message']

    def test_register_invalid_invite_code(self):
        """无效邀请码"""
        data = {
            'username': 'newuser',
            'password': 'password',
            'invite_code': 'INVALIDCODE123'
        }
        status, result = handle_register(data)

        assert status == 400
        assert result['success'] is False
        assert '邀请码无效或已过期' in result['message']

    def test_register_used_invite_code(self, db_connection, used_invite_code):
        """邀请码已用完"""
        data = {
            'username': 'newuser',
            'password': 'password',
            'invite_code': used_invite_code['code']
        }
        status, result = handle_register(data)

        assert status == 400
        assert result['success'] is False
        assert '邀请码已用尽' in result['message']

    def test_register_expired_invite_code(self, db_connection, expired_invite_code):
        """邀请码已过期"""
        data = {
            'username': 'newuser',
            'password': 'password',
            'invite_code': expired_invite_code['code']
        }
        status, result = handle_register(data)

        assert status == 400
        assert result['success'] is False
        assert '邀请码无效或已过期' in result['message']

    def test_register_duplicate_username(self, db_connection, test_user, test_invite_code):
        """用户名已存在"""
        data = {
            'username': test_user['username'],
            'password': 'password',
            'invite_code': test_invite_code['code']
        }
        status, result = handle_register(data)

        assert status == 400
        assert result['success'] is False
        assert '用户已存在' in result['message']

    def test_register_sql_injection_username(self, test_invite_code):
        """SQL注入防护 - 用户名"""
        data = {
            'username': "newuser'; DROP TABLE users; --",
            'password': 'password',
            'invite_code': test_invite_code['code']
        }
        status, result = handle_register(data)

        # 应该成功注册（参数化查询防止了SQL注入）
        assert status == 200
        assert result['success'] is True

    def test_register_invite_code_usage_incremented(self, db_connection, test_invite_code):
        """注册后邀请码使用次数增加"""
        initial_uses = test_invite_code['current_uses']

        data = {
            'username': 'newuser',
            'password': 'password',
            'invite_code': test_invite_code['code']
        }
        handle_register(data)

        # 验证邀请码使用次数
        c = db_connection.cursor()
        c.execute('SELECT current_uses FROM invite_codes WHERE code = ?', (test_invite_code['code'],))
        current_uses = c.fetchone()[0]

        assert current_uses == initial_uses + 1


class TestGetUserInfo:
    """获取用户信息测试"""

    def test_get_user_info_success(self, test_user):
        """正常获取用户信息"""
        status, result = handle_account_get('/account/api/user', user_id=test_user['id'])

        assert status == 200
        assert result['success'] is True
        assert result['data']['username'] == test_user['username']
        assert result['data']['id'] == test_user['id']
        assert result['data']['vip_level'] == test_user['vip_level']

    def test_get_user_info_no_user_id(self):
        """未提供用户ID"""
        status, result = handle_account_get('/account/api/user', user_id=None)

        assert status == 401
        assert result['success'] is False
        assert '未登录' in result['message']

    def test_get_user_info_invalid_user_id(self):
        """无效用户ID"""
        status, result = handle_account_get('/account/api/user', user_id=99999)

        assert status == 404
        assert result['success'] is False
        assert '用户不存在' in result['message']


class TestLogout:
    """登出功能测试"""

    def test_logout_success(self, db_connection, test_user):
        """正常登出"""
        # 先登录
        login_data = {
            'username': test_user['username'],
            'password': test_user['password']
        }
        _, login_result = handle_login(login_data)
        token = login_result['token']

        # 登出
        data = {'token': token}
        result = handle_logout(data)

        assert result['success'] is True
        assert '登出成功' in result['message']

        # 验证token已失效
        verify_result = verify_token(token)
        assert verify_result is None

    def test_logout_no_token(self):
        """没有token也能成功"""
        data = {'token': ''}
        result = handle_logout(data)

        assert result['success'] is True


class TestCreateInviteCode:
    """创建邀请码测试"""

    def test_create_invite_code_success(self):
        """正常创建邀请码"""
        data = {
            'max_uses': 10,
            'remark': '测试邀请码'
        }
        result = handle_create_invite_code(data)

        assert result['success'] is True
        assert '邀请码已生成' in result['message']
        assert 'code' in result
        assert len(result['code']) == 16

    def test_create_invite_code_default_max_uses(self):
        """默认无限使用次数"""
        data = {'remark': ''}
        result = handle_create_invite_code(data)

        assert result['success'] is True
        assert 'code' in result


class TestAccountPostRouter:
    """POST 请求路由测试"""

    def test_post_login(self, test_user):
        """登录路由"""
        data = {
            'username': test_user['username'],
            'password': test_user['password']
        }
        result = handle_account_post('/account/api/login', data)

        assert result[0] == 200  # status
        assert result[1]['success'] is True

    def test_post_register(self, test_invite_code):
        """注册路由"""
        data = {
            'username': 'newuser',
            'password': 'password',
            'invite_code': test_invite_code['code']
        }
        result = handle_account_post('/account/api/register', data)

        assert result[0] == 200
        assert result[1]['success'] is True

    def test_post_logout(self):
        """登出路由"""
        data = {'token': 'sometoken'}
        result = handle_account_post('/account/api/logout', data)

        assert result['success'] is True

    def test_post_create_invite_code(self):
        """创建邀请码路由"""
        data = {'max_uses': 5}
        result = handle_account_post('/account/api/invite-code', data)

        assert result['success'] is True

    def test_post_unknown_path(self):
        """未知路径"""
        data = {}
        result = handle_account_post('/account/api/unknown', data)

        assert result['success'] is False
        assert '未知的账户接口' in result['message']


class TestSecurity:
    """安全测试"""

    def test_password_hash_stored_not_plain(self, db_connection, test_invite_code):
        """密码不以明文存储"""
        data = {
            'username': 'securitytest',
            'password': 'mypassword123',
            'invite_code': test_invite_code['code']
        }
        handle_register(data)

        c = db_connection.cursor()
        c.execute('SELECT password_hash, salt FROM users WHERE username = ?', ('securitytest',))
        row = c.fetchone()

        # 验证密码已哈希存储
        assert row['password_hash'] != 'mypassword123'
        assert len(row['salt']) == 32

    def test_token_generation_unique(self, db_connection, test_user):
        """Token生成唯一性"""
        data = {
            'username': test_user['username'],
            'password': test_user['password']
        }

        # 多次登录获取不同token
        _, result1 = handle_login(data)
        token1 = result1['token']

        _, result2 = handle_login(data)
        token2 = result2['token']

        assert token1 != token2

    def test_sql_injection_union_attack(self, db_connection, test_invite_code):
        """UNION攻击防护"""
        data = {
            'username': "user' UNION SELECT * FROM users --",
            'password': 'password',
            'invite_code': test_invite_code['code']
        }

        # 应该正常注册，不会泄露数据
        status, result = handle_register(data)
        assert result['success'] is True
