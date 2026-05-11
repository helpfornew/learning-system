"""AI分析代理处理器 - 真正调用DeepSeek/Qwen API"""
import json
import requests
import threading
from datetime import datetime
from ..config import logger
from ..database import get_db

# ============ OpenViking 记忆系统集成 ============

OPENVIKING_BASE = "http://127.0.0.1:1933"
OPENVIKING_API_KEY = "rKkbsMnMlKGBtGWbt2JL69SEiAsyiOyUTFBX2x2r5Uc"
OPENVIKING_HEADERS = {
    "Content-Type": "application/json",
    "X-API-Key": OPENVIKING_API_KEY,
    "X-OpenViking-Account": "default",
    "X-OpenViking-User": "default",
}


def viking_search(query, limit=5):
    """搜索OpenViking记忆"""
    try:
        resp = requests.post(
            f"{OPENVIKING_BASE}/api/v1/search/search",
            json={"query": query, "mode": "fast", "limit": limit},
            headers=OPENVIKING_HEADERS,
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            return data.get("result", {}).get("memories", [])
    except Exception as e:
        logger.warning(f'[Viking] 搜索失败: {e}')
    return []


def viking_add_memory(content, category="entity"):
    """向OpenViking添加记忆（通过session流程）"""
    try:
        # Step 1: 创建session
        resp = requests.post(
            f"{OPENVIKING_BASE}/api/v1/sessions",
            json={},
            headers=OPENVIKING_HEADERS,
            timeout=10
        )
        if resp.status_code != 200:
            return False
        session_id = resp.json().get("result", {}).get("session_id")
        if not session_id:
            return False

        # Step 2: 添加消息
        resp = requests.post(
            f"{OPENVIKING_BASE}/api/v1/sessions/{session_id}/messages",
            json={"role": "user", "content": content},
            headers=OPENVIKING_HEADERS,
            timeout=10
        )
        if resp.status_code != 200:
            return False

        # Step 3: Commit保存
        resp = requests.post(
            f"{OPENVIKING_BASE}/api/v1/sessions/{session_id}/commit",
            json={},
            headers=OPENVIKING_HEADERS,
            timeout=15
        )
        return resp.status_code == 200
    except Exception as e:
        logger.warning(f'[Viking] 添加记忆失败: {e}')
    return False


def get_user_vocab_level(user_id):
    """获取用户词汇水平统计"""
    try:
        conn = get_db()
        c = conn.cursor()

        # 统计各状态单词数量
        c.execute("""
            SELECT status, COUNT(*) as cnt
            FROM vocabulary WHERE user_id = ?
            GROUP BY status
        """, (user_id,))
        status_counts = {row[0]: row[1] for row in c.fetchall()}

        # 统计各熟练度单词数量
        c.execute("""
            SELECT "熟练度", COUNT(*) as cnt
            FROM vocabulary WHERE user_id = ? AND "熟练度" IS NOT NULL
            GROUP BY "熟练度"
        """, (user_id,))
        proficiency_counts = {row[0]: row[1] for row in c.fetchall()}

        # 获取已掌握的单词样本（用于判断用户水平）
        c.execute("""
            SELECT word FROM vocabulary
            WHERE user_id = ? AND status = 'mastered'
            ORDER BY RANDOM() LIMIT 50
        """, (user_id,))
        mastered_words = [row[0] for row in c.fetchall()]

        # 获取学习中的单词
        c.execute("""
            SELECT word, 熟练度 FROM vocabulary
            WHERE user_id = ? AND status = 'learning'
            ORDER BY RANDOM() LIMIT 30
        """, (user_id,))
        learning_words = [{"word": row[0], "proficiency": row[1]} for row in c.fetchall()]

        # 获取新词
        c.execute("""
            SELECT word FROM vocabulary
            WHERE user_id = ? AND status = 'new'
            ORDER BY RANDOM() LIMIT 20
        """, (user_id,))
        new_words = [row[0] for row in c.fetchall()]

        conn.close()

        return {
            "status_counts": status_counts,
            "proficiency_counts": proficiency_counts,
            "mastered_sample": mastered_words,
            "learning_sample": learning_words,
            "new_sample": new_words,
            "total": sum(status_counts.values()),
            "mastered_count": status_counts.get("mastered", 0),
            "learning_count": status_counts.get("learning", 0),
            "new_count": status_counts.get("new", 0),
        }
    except Exception as e:
        logger.error(f'[Viking] 获取用户词汇水平失败: {e}')
        return None


def get_viking_memories_for_user(user_id):
    """从OpenViking获取与用户词汇学习相关的记忆"""
    try:
        # 搜索用户的词汇学习记忆
        memories = viking_search(f"用户{user_id} 英语词汇学习 单词记忆", limit=3)
        if memories:
            summaries = []
            for m in memories:
                abstract = m.get("abstract", "")
                if abstract and len(abstract) > 20:
                    summaries.append(abstract[:300])
            return summaries
    except Exception as e:
        logger.warning(f'[Viking] 获取记忆失败: {e}')
    return []


def save_chat_memory_async(user_id, learned_words, mode):
    """异步保存对话学习记忆到OpenViking"""
    def _save():
        try:
            if not learned_words:
                return
            words_str = ", ".join(learned_words[:10])
            content = (
                f"用户{user_id}在{mode}模式下学习了新单词: {words_str}。"
                f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}。"
                f"这些单词需要在后续对话中适当复习巩固。"
            )
            viking_add_memory(content, category="event")
            logger.info(f'[Viking] 已保存学习记忆: {words_str}')
        except Exception as e:
            logger.warning(f'[Viking] 保存记忆失败: {e}')

    threading.Thread(target=_save, daemon=True).start()


def get_user_ai_config(user_id, provider):
    """从数据库获取用户的AI配置"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('''SELECT api_key, endpoint, model, enabled, max_tokens, temperature
                     FROM user_ai_config
                     WHERE user_id = ? AND provider = ? AND enabled = 1''',
                  (user_id, provider))
        row = c.fetchone()
        conn.close()

        if row:
            return {
                'apiKey': row[0],
                'endpoint': row[1],
                'model': row[2],
                'enabled': bool(row[3]),
                'maxTokens': row[4] or 2000,
                'temperature': row[5] or 0.7
            }
        return None
    except Exception as e:
        logger.error(f'[AI] 获取用户配置失败: {e}')
        return None


def call_deepseek_api(config, messages, tools=None):
    """调用 DeepSeek API"""
    api_key = config.get('apiKey')
    endpoint = config.get('endpoint', 'https://api.deepseek.com/chat/completions')
    model = config.get('model', 'deepseek-chat')
    max_tokens = config.get('maxTokens', 2000)
    temperature = config.get('temperature', 0.7)

    if not api_key:
        raise ValueError('DeepSeek API密钥未配置')

    logger.info(f'[AI] DeepSeek API密钥: {api_key[:20]}..., 长度: {len(api_key)}')

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    }

    payload = {
        'model': model,
        'messages': messages,
        'max_tokens': max_tokens,
        'temperature': temperature,
        'stream': False
    }

    if tools:
        payload['tools'] = tools

    logger.info(f'[AI] 调用 DeepSeek API: {endpoint}, model: {model}')

    response = requests.post(
        endpoint,
        headers=headers,
        json=payload,
        timeout=120  # 2分钟超时
    )

    response.raise_for_status()
    return response.json()


def call_qwen_api(config, messages, tools=None):
    """调用通义千问 API"""
    api_key = config.get('apiKey')
    endpoint = config.get('endpoint', 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions')
    model = config.get('model', 'qwen-max')
    max_tokens = config.get('maxTokens', 2000)
    temperature = config.get('temperature', 0.7)

    if not api_key:
        raise ValueError('通义千问 API密钥未配置')

    # 检查密钥格式
    if not api_key.startswith('sk-'):
        logger.warning(f'[AI] 通义千问 API密钥格式可能不正确: {api_key[:10]}...')

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    }

    payload = {
        'model': model,
        'messages': messages,
        'max_tokens': max_tokens,
        'temperature': temperature,
        'stream': False
    }

    if tools:
        payload['tools'] = tools

    logger.info(f'[AI] 调用 Qwen API: {endpoint}')
    logger.debug(f'[AI] API Key前缀: {api_key[:15]}...')
    logger.debug(f'[AI] Model: {model}')

    response = requests.post(
        endpoint,
        headers=headers,
        json=payload,
        timeout=120  # 2分钟超时
    )

    response.raise_for_status()
    return response.json()


def handle_ai_analysis_proxy(user_id, data):
    """处理AI分析请求代理"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    try:
        # 获取请求参数
        provider = data.get('provider', 'deepseek')
        messages = data.get('messages', [])
        prompt = data.get('prompt', '')

        # 如果没有messages但有prompt，构建简单消息
        if not messages and prompt:
            messages = [{'role': 'user', 'content': prompt}]

        if not messages:
            return 400, {'success': False, 'message': '缺少消息内容'}

        # 从数据库获取用户配置
        config = get_user_ai_config(user_id, provider)

        if not config:
            # 尝试从请求中获取配置（兼容旧方式）
            config = {
                'apiKey': data.get('apiKey'),
                'endpoint': data.get('apiEndpoint'),
                'model': data.get('model'),
                'maxTokens': data.get('maxTokens', 2000),
                'temperature': data.get('temperature', 0.7)
            }

        if not config.get('apiKey'):
            return 400, {
                'success': False,
                'message': f'{provider} API密钥未配置，请先在设置中配置API密钥'
            }

        # 根据提供商调用不同API
        if provider == 'deepseek':
            result = call_deepseek_api(config, messages)
        elif provider in ('qwen', 'qianwen'):
            result = call_qwen_api(config, messages)
        else:
            return 400, {'success': False, 'message': f'不支持的AI提供商: {provider}'}

        logger.info(f'[AI] 用户 {user_id} {provider} AI分析成功')

        return 200, {
            'success': True,
            'data': result
        }

    except requests.exceptions.Timeout:
        logger.error('[AI] API调用超时')
        return 504, {'success': False, 'message': 'AI API调用超时，请稍后重试'}
    except requests.exceptions.RequestException as e:
        logger.error(f'[AI] API请求失败: {e}')
        return 502, {'success': False, 'message': f'AI API请求失败: {str(e)}'}
    except Exception as e:
        logger.error(f'[AI] 分析失败: {e}')
        return 500, {'success': False, 'message': str(e)}


# ============ 词汇对话学习 ============

# 工具定义 - 供 AI 调用
VOCABULARY_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_user_vocabulary",
            "description": "获取用户的生词列表，可以按状态筛选或搜索",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "description": "单词状态筛选: new(新词), learning(学习中), mastered(已掌握)",
                        "enum": ["new", "learning", "mastered"]
                    },
                    "limit": {
                        "type": "integer",
                        "description": "返回单词数量，默认2000",
                        "default": 2000
                    },
                    "search": {
                        "type": "string",
                        "description": "搜索关键词（可选）"
                    }
                }
            }
        }
    }
]


def execute_tool_call(tool_name, arguments, user_id):
    """执行工具调用，返回结果字符串"""
    logger.info(f'[AI] 执行工具: {tool_name}, 用户: {user_id}, 参数: {arguments}')

    if tool_name == "get_user_vocabulary":
        status = arguments.get("status")
        limit = arguments.get("limit", 2000)  # 默认返回2000个
        search = arguments.get("search")

        conn = get_db()
        c = conn.cursor()
        query = "SELECT word, status, 熟练度 FROM vocabulary WHERE user_id = ? AND status != 'mastered'"
        params = [user_id]

        if status:
            query += " AND status = ?"
            params.append(status)
        if search:
            query += " AND word LIKE ?"
            params.append(f"%{search}%")

        query += " ORDER BY id DESC LIMIT ?"
        params.append(limit)

        c.execute(query, params)
        words = [dict(row) for row in c.fetchall()]
        conn.close()

        logger.info(f'[AI] 查询到 {len(words)} 个单词')

        if not words:
            return json.dumps({"message": "没有找到符合条件的单词"}, ensure_ascii=False)
        return json.dumps(words, ensure_ascii=False)

    return json.dumps({"error": f"未知工具: {tool_name}"}, ensure_ascii=False)


VOCABULARY_CHAT_SYSTEM_PROMPT = """你是一个英语学习助手，专门帮助高中生学习高考3600词汇。

## 核心规则
1. **词汇难度控制**: 你输出的单词要让用户大部分都认识，但不能太简单。具体规则：
   - 70% 的单词应该是用户已经认识的常用词（用于构建句子框架）
   - 20% 的单词应该是用户正在学习的词（适当重复帮助记忆）
   - 10% 的单词可以是用户可能不认识但能通过上下文猜出的词（适度挑战）
   - 绝对不要使用超出高考3600范围的生僻词
2. **句子简单**: 句子结构简单清晰，适合高中生理解
3. **解释方式**: 当用户不理解某个单词时，用更简单的英语或中文解释
4. **鼓励表达**: 鼓励用户用英语回复，但允许使用中文提问
5. **自然对话**: 对话要自然有趣，像朋友聊天一样
6. **重复练习**: 适当重复使用用户正在学习的单词，帮助记忆

## 对话模式
- **自由对话**: 用简单英语和用户聊天，话题可以是日常生活、学校、爱好等
- **情景对话**: 模拟特定场景（如餐厅点餐、购物、问路），让用户在情境中学习
- **词汇练习**: 用目标单词造句，解释含义，让用户造句巩固

## 回复格式
- 英文回复后，括号内附上中文翻译
- 重要单词用 **粗体** 标记
- 如果用户犯了语法错误，温和地纠正并解释

## 示例回复
"Hello! Do you like **music**? (你喜欢音乐吗？) I think music is very important for students."
"""

SCENE_PROMPTS = {
    'restaurant': """现在模拟餐厅场景。你是服务员，用户是顾客。使用简单的英语进行点餐对话。
关键词汇: order, menu, delicious, bill, waiter, dish, drink, hungry, thirsty""",

    'shopping': """现在模拟购物场景。你是店员，用户是顾客。使用简单的英语进行购物对话。
关键词汇: price, cheap, expensive, buy, sell, size, color, discount, receipt""",

    'asking_way': """现在模拟问路场景。你是路人，用户是问路的人。使用简单的英语进行问路对话。
关键词汇: direction, left, right, straight, turn, near, far, walk, bus, subway""",

    'school': """现在模拟学校场景。你是同学，用户是学生。使用简单的英语讨论学校生活。
关键词汇: homework, exam, teacher, subject, grade, class, study, library, playground""",

    'travel': """现在模拟旅行场景。你是导游，用户是游客。使用简单的英语讨论旅行。
关键词汇: visit, beautiful, famous, ticket, hotel, camera, photo, trip, journey"""
}


def handle_vocabulary_chat(user_id, data):
    """处理词汇对话学习请求（支持工具调用 + OpenViking记忆）"""
    if not user_id:
        return 401, {'success': False, 'message': '未登录'}

    try:
        # 获取请求参数
        messages = data.get('messages', [])
        mode = data.get('mode', 'free')  # free, scene, vocabulary
        scene = data.get('scene', '')
        target_words = data.get('targetWords', [])
        provider = data.get('provider', 'deepseek')

        if not messages:
            return 400, {'success': False, 'message': '缺少消息内容'}

        # 构建 system prompt
        system_prompt = VOCABULARY_CHAT_SYSTEM_PROMPT

        # ---- OpenViking 记忆集成：获取用户词汇水平 ----
        vocab_level = get_user_vocab_level(user_id)
        if vocab_level and vocab_level["total"] > 0:
            mastered = vocab_level["mastered_count"]
            learning = vocab_level["learning_count"]
            new = vocab_level["new_count"]
            total = vocab_level["total"]

            # 构建用户词汇画像
            level_desc = f"\n\n## 用户词汇画像\n"
            level_desc += f"- 总词汇量: {total} 个\n"
            level_desc += f"- 已掌握: {mastered} 个, 学习中: {learning} 个, 新词: {new} 个\n"

            if vocab_level["mastered_sample"]:
                sample = ", ".join(vocab_level["mastered_sample"][:20])
                level_desc += f"- 已掌握的单词示例: {sample}\n"

            if vocab_level["learning_sample"]:
                learning_info = ", ".join(
                    [f"{w['word']}(熟练度{w['proficiency'] or 0})" for w in vocab_level["learning_sample"][:15]]
                )
                level_desc += f"- 正在学习的单词: {learning_info}\n"

            if vocab_level["new_sample"]:
                new_sample = ", ".join(vocab_level["new_sample"][:10])
                level_desc += f"- 待学习的新词: {new_sample}\n"

            level_desc += """
## 词汇难度调整指南（基于用户画像）
根据用户的词汇水平，请严格遵循以下原则：
1. 造句时优先使用用户"已掌握"的单词构建句子主干（主语、谓语、宾语）
2. 适当穿插用户"正在学习"的单词，帮助复习巩固（每2-3句用1-2个）
3. 可以偶尔引入1个"待学习新词"，但必须在上下文中给出中文提示
4. 如果用户已掌握词汇较少（<100），则尽量只用最基础的词汇
5. 如果用户已掌握词汇较多（>500），可以适当增加难度
"""
            system_prompt += level_desc

        # ---- OpenViking 记忆：获取历史学习记录 ----
        viking_memories = get_viking_memories_for_user(user_id)
        if viking_memories:
            memory_text = "\n\n## 历史学习记录\n以下是用户之前的学习情况，请参考以保持教学连续性：\n"
            for i, mem in enumerate(viking_memories[:3], 1):
                memory_text += f"{i}. {mem}\n"
            memory_text += "请在对话中适当复习之前学过的单词。"
            system_prompt += memory_text

        # 根据模式添加额外指令
        if mode == 'scene' and scene in SCENE_PROMPTS:
            system_prompt += f"\n\n## 当前场景\n{SCENE_PROMPTS[scene]}"
        elif mode == 'vocabulary' and target_words:
            words_str = ', '.join(target_words[:10])
            system_prompt += f"\n\n## 目标单词\n请在对话中重点使用以下单词: {words_str}\n让用户通过对话理解和掌握这些单词。"

        # 添加工具使用说明
        system_prompt += """

## 工具使用
你可以使用 get_user_vocabulary 工具查看用户的生词列表。
当用户询问关于他们的单词、生词、学习进度等问题时，主动调用工具获取数据。

## 记忆系统
你拥有长期记忆能力。每次对话结束后，系统会自动记录用户本次学习的单词。
下次对话时，你会看到用户之前的学习记录，可以据此复习巩固。
在对话中，你可以主动告诉用户"我记得你之前学过XXX"来增强学习连贯性。
"""

        # 构建完整消息列表
        full_messages = [{'role': 'system', 'content': system_prompt}]
        full_messages.extend(messages)

        # 从数据库获取用户配置
        config = get_user_ai_config(user_id, provider)

        if not config:
            # 尝试从请求中获取配置
            config = {
                'apiKey': data.get('apiKey'),
                'endpoint': data.get('apiEndpoint'),
                'model': data.get('model'),
                'maxTokens': data.get('maxTokens', 1000),
                'temperature': data.get('temperature', 0.8)
            }

        if not config.get('apiKey'):
            return 400, {
                'success': False,
                'message': f'{provider} API密钥未配置，请先在设置中配置API密钥'
            }

        # 工具调用循环（最多5轮）
        max_tool_rounds = 5
        for round_num in range(max_tool_rounds):
            # 调用 AI API（带工具定义）
            if provider == 'deepseek':
                result = call_deepseek_api(config, full_messages, tools=VOCABULARY_TOOLS)
            elif provider in ('qwen', 'qianwen'):
                result = call_qwen_api(config, full_messages, tools=VOCABULARY_TOOLS)
            else:
                return 400, {'success': False, 'message': f'不支持的AI提供商: {provider}'}

            # 提取 AI 响应
            choice = result.get('choices', [{}])[0]
            message = choice.get('message', {})
            finish_reason = choice.get('finish_reason', '')

            # 检查是否有工具调用
            tool_calls = message.get('tool_calls', [])

            if not tool_calls:
                # 没有工具调用，返回最终回复
                ai_response = message.get('content', '')
                logger.info(f'[AI] 用户 {user_id} 词汇对话成功, 模式: {mode}, 工具调用轮数: {round_num}')

                # ---- 异步保存学习记忆到 OpenViking ----
                # 从用户最后几条消息中提取可能学到的单词
                learned = []
                for msg in messages[-3:]:
                    content = msg.get('content', '')
                    # 简单提取英文单词（3字母以上的）
                    import re
                    words_in_msg = re.findall(r'\b[a-zA-Z]{3,}\b', content)
                    learned.extend(words_in_msg[:5])
                if learned:
                    save_chat_memory_async(user_id, list(set(learned)), mode)

                return 200, {
                    'success': True,
                    'data': {
                        'reply': ai_response,
                        'mode': mode,
                        'usage': result.get('usage', {})
                    }
                }

            # 有工具调用，执行工具并继续对话
            # 将 AI 的响应（包含 tool_calls）添加到消息列表
            full_messages.append(message)

            # 执行每个工具调用
            for tool_call in tool_calls:
                tool_call_id = tool_call.get('id', '')
                tool_name = tool_call.get('function', {}).get('name', '')
                tool_arguments_str = tool_call.get('function', {}).get('arguments', '{}')

                try:
                    tool_arguments = json.loads(tool_arguments_str)
                except json.JSONDecodeError:
                    tool_arguments = {}

                logger.info(f'[AI] 执行工具调用: {tool_name}, 参数: {tool_arguments}')

                # 执行工具
                tool_result = execute_tool_call(tool_name, tool_arguments, user_id)

                logger.info(f'[AI] 工具结果: {tool_result[:200]}...')

                # 将工具结果添加到消息列表
                full_messages.append({
                    'role': 'tool',
                    'tool_call_id': tool_call_id,
                    'content': tool_result
                })

        # 超过最大工具调用轮数
        logger.warning(f'[AI] 用户 {user_id} 工具调用超过最大轮数 {max_tool_rounds}')
        return 200, {
            'success': True,
            'data': {
                'reply': '抱歉，处理过程中出现了问题，请重新提问。',
                'mode': mode,
                'usage': {}
            }
        }

    except requests.exceptions.Timeout:
        logger.error('[AI] 词汇对话 API 调用超时')
        return 504, {'success': False, 'message': 'AI API调用超时，请稍后重试'}
    except requests.exceptions.RequestException as e:
        logger.error(f'[AI] 词汇对话 API 请求失败: {e}')
        return 502, {'success': False, 'message': f'AI API请求失败: {str(e)}'}
    except Exception as e:
        logger.error(f'[AI] 词汇对话失败: {e}')
        return 500, {'success': False, 'message': str(e)}
