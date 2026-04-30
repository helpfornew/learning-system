"""
词汇表 API 测试
"""
import pytest
import json


class TestVocabulary:
    """词汇表基础功能测试"""

    def test_get_vocabulary_empty(self, db_cursor, test_user):
        """新用户词汇表应为空"""
        c = db_cursor
        c.execute('SELECT COUNT(*) FROM vocabulary WHERE user_id = ?', (test_user['id'],))
        assert c.fetchone()[0] == 0

    def test_add_vocabulary(self, db_cursor, test_user):
        """添加单词"""
        c = db_cursor
        c.execute('''INSERT INTO vocabulary (user_id, word, phonetic, definition, part_of_speech)
                    VALUES (?, ?, ?, ?, ?)''',
                  (test_user['id'], 'abandon', 'əˈbændən', '放弃；遗弃', 'verb'))
        vocab_id = c.lastrowid
        c.connection.commit()

        c.execute('SELECT * FROM vocabulary WHERE id = ?', (vocab_id,))
        row = dict(c.fetchone())
        assert row['word'] == 'abandon'
        assert row['definition'] == '放弃；遗弃'
        assert row['status'] == 'new'
        assert row['熟练度'] == 0

    def test_vocabulary_unique_per_user(self, db_cursor, test_user):
        """同一用户不能重复添加相同单词"""
        c = db_cursor
        c.execute('''INSERT INTO vocabulary (user_id, word, definition)
                    VALUES (?, ?, ?)''',
                  (test_user['id'], 'apple', '苹果'))
        c.connection.commit()

        with pytest.raises(Exception):
            c.execute('''INSERT INTO vocabulary (user_id, word, definition)
                        VALUES (?, ?, ?)''',
                      (test_user['id'], 'apple', '苹果公司'))

    def test_update_vocabulary(self, db_cursor, test_user):
        """更新单词信息"""
        c = db_cursor
        c.execute('''INSERT INTO vocabulary (user_id, word, definition)
                    VALUES (?, ?, ?)''',
                  (test_user['id'], 'beautiful', '美丽的'))
        vocab_id = c.lastrowid
        c.connection.commit()

        c.execute('UPDATE vocabulary SET definition = ?, 熟练度 = 1 WHERE id = ?',
                  ('漂亮的', vocab_id))
        c.connection.commit()

        c.execute('SELECT * FROM vocabulary WHERE id = ?', (vocab_id,))
        row = dict(c.fetchone())
        assert row['definition'] == '漂亮的'
        assert row['熟练度'] == 1

    def test_delete_vocabulary(self, db_cursor, test_user):
        """删除单词"""
        c = db_cursor
        c.execute('''INSERT INTO vocabulary (user_id, word, definition)
                    VALUES (?, ?, ?)''',
                  (test_user['id'], 'cancel', '取消'))
        vocab_id = c.lastrowid
        c.connection.commit()

        c.execute('DELETE FROM vocabulary WHERE id = ?', (vocab_id,))
        c.connection.commit()

        c.execute('SELECT COUNT(*) FROM vocabulary WHERE id = ?', (vocab_id,))
        assert c.fetchone()[0] == 0

    def test_vocabulary_user_isolation(self, db_cursor, test_user, admin_user):
        """用户间词汇隔离"""
        c = db_cursor
        c.execute('''INSERT INTO vocabulary (user_id, word, definition)
                    VALUES (?, ?, ?)''',
                  (test_user['id'], 'dog', '狗'))
        c.execute('''INSERT INTO vocabulary (user_id, word, definition)
                    VALUES (?, ?, ?)''',
                  (admin_user['id'], 'cat', '猫'))
        c.connection.commit()

        c.execute('SELECT COUNT(*) FROM vocabulary WHERE user_id = ?', (test_user['id'],))
        assert c.fetchone()[0] == 1

        c.execute('SELECT COUNT(*) FROM vocabulary WHERE user_id = ?', (admin_user['id'],))
        assert c.fetchone()[0] == 1

    def test_vocabulary_search(self, db_cursor, test_user):
        """搜索单词"""
        c = db_cursor
        words = [
            ('apple', '苹果'),
            ('application', '应用程序'),
            ('banana', '香蕉'),
            ('cat', '猫'),
        ]
        for word, definition in words:
            c.execute('''INSERT INTO vocabulary (user_id, word, definition)
                        VALUES (?, ?, ?)''',
                      (test_user['id'], word, definition))
        c.connection.commit()

        # 搜索包含 'app' 的单词
        c.execute('SELECT * FROM vocabulary WHERE user_id = ? AND word LIKE ?',
                  (test_user['id'], '%app%'))
        results = [dict(r) for r in c.fetchall()]
        assert len(results) == 2

    def test_vocabulary_pagination(self, db_cursor, test_user):
        """分页查询"""
        c = db_cursor
        for i in range(10):
            c.execute('''INSERT INTO vocabulary (user_id, word, definition)
                        VALUES (?, ?, ?)''',
                      (test_user['id'], f'word{i}', f'定义{i}'))
        c.connection.commit()

        # LIMIT 5
        c.execute('SELECT * FROM vocabulary WHERE user_id = ? LIMIT 5', (test_user['id'],))
        assert len(c.fetchall()) == 5

    def test_vocabulary_status_filter(self, db_cursor, test_user):
        """按状态筛选"""
        c = db_cursor
        c.execute('''INSERT INTO vocabulary (user_id, word, definition, status)
                    VALUES (?, ?, ?, ?)''', (test_user['id'], 'learned', '已学', 'learned'))
        c.execute('''INSERT INTO vocabulary (user_id, word, definition, status)
                    VALUES (?, ?, ?, ?)''', (test_user['id'], 'new_word', '新词', 'new'))
        c.execute('''INSERT INTO vocabulary (user_id, word, definition, status)
                    VALUES (?, ?, ?, ?)''', (test_user['id'], 'reviewing', '复习中', 'reviewing'))
        c.connection.commit()

        c.execute('SELECT COUNT(*) FROM vocabulary WHERE user_id = ? AND status = ?',
                  (test_user['id'], 'new'))
        assert c.fetchone()[0] == 1

        c.execute('SELECT COUNT(*) FROM vocabulary WHERE user_id = ? AND status = ?',
                  (test_user['id'], 'learned'))
        assert c.fetchone()[0] == 1

        c.execute('SELECT COUNT(*) FROM vocabulary WHERE user_id = ? AND status = ?',
                  (test_user['id'], 'reviewing'))
        assert c.fetchone()[0] == 1
