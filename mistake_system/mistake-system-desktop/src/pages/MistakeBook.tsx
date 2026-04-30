import React, { useState, useEffect, useMemo } from 'react';
import {
  List,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  Card,
  Row,
  Col,
  Progress,
  Image,
  message,
  InputNumber
} from 'antd';
import {
  SearchOutlined,
  RobotOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  UploadOutlined,
  LeftOutlined,
  RightOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { analyzeMistakesInBatch } from '../services/aiMistakeAnalyzer';
import { loadQianwenConfig } from '../services/aiConfig';
import { useMistakes, getSubjectName, getDifficultyLabel } from '../hooks';
import type { Mistake, MistakeBookProps, ReviewStatus } from '../types';

const { Search } = Input;
const { Option } = Select;

const MistakeBook: React.FC<MistakeBookProps> = ({ onNavigate }) => {
  const { mistakes, loading, stats, refresh, removeMistake, update } = useMistakes();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMistake, setCurrentMistake] = useState<Mistake | null>(null);
  const [currentMistakeIndex, setCurrentMistakeIndex] = useState<number>(-1);
  const [jumpModalVisible, setJumpModalVisible] = useState(false);
  const [jumpId, setJumpId] = useState<number | undefined>();
  const [analyzing, setAnalyzing] = useState(false);
  const [aiConfigLoaded, setAiConfigLoaded] = useState(false);
  const [aiApiKey, setAiApiKey] = useState<string>('');
  const [analysisProgress, setAnalysisProgress] = useState({ completed: 0, total: 0, percent: 0 });

  // 检查AI配置
  useEffect(() => {
    const checkAiConfig = async () => {
      try {
        const config = await loadQianwenConfig();
        setAiConfigLoaded(!!config.apiKey);
        setAiApiKey(config.apiKey || '');
      } catch (error) {
        console.error('加载AI配置失败:', error);
      }
    };
    checkAiConfig();
  }, []);

  // 处理图片路径，确保是有效的 Data URL
  const getImageSrc = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('data:')) return path;
    if (path.startsWith('http') || path.startsWith('/')) return path;
    return `data:image/jpeg;base64,${path}`;
  };

  // 打开快速上传弹窗
  const handleOpenQuickUpload = () => {
    window.dispatchEvent(new CustomEvent('open-quick-upload'));
  };

  // 转换数据格式用于显示
  const displayMistakes = useMemo(() => {
    return mistakes.map(item => {
      const hasKnowledgePoints = item.knowledge_points && item.knowledge_points !== '待分析' && item.knowledge_points !== '';
      const hasTopic = item.topic && item.topic !== '待分析' && item.topic !== '';
      const isAnalyzed = hasKnowledgePoints || hasTopic;

      return {
        ...item,
        subject: getSubjectName(item.subject_id),
        difficulty_label: getDifficultyLabel(item.difficulty),
        status: getReviewStatus(item.review_count, item.mastery_level),
        analyzed: isAnalyzed,
      };
    });
  }, [mistakes]);

  // 过滤错题
  const filteredMistakes = useMemo(() => {
    return displayMistakes.filter(mistake => {
      const matchesSubject = selectedSubject === 'all' || mistake.subject === selectedSubject;
      const matchesSearch =
        !searchTerm ||
        mistake.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mistake.correct_answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mistake.knowledge_points?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mistake.topic?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSubject && matchesSearch;
    });
  }, [displayMistakes, selectedSubject, searchTerm]);

  // 处理上一题
  const handlePrevMistake = () => {
    if (currentMistakeIndex > 0) {
      const prevIndex = currentMistakeIndex - 1;
      const prevMistake = filteredMistakes[prevIndex];
      setCurrentMistake(prevMistake);
      setCurrentMistakeIndex(prevIndex);
    } else {
      message.info('已经是第一道题了');
    }
  };

  // 处理下一题
  const handleNextMistake = () => {
    if (currentMistakeIndex < filteredMistakes.length - 1) {
      const nextIndex = currentMistakeIndex + 1;
      const nextMistake = filteredMistakes[nextIndex];
      setCurrentMistake(nextMistake);
      setCurrentMistakeIndex(nextIndex);
    } else {
      message.info('已经是最后一道题了');
    }
  };

  // 处理题号跳转
  const handleJumpToId = () => {
    if (!jumpId) {
      message.warning('请输入题号');
      return;
    }

    const foundIndex = filteredMistakes.findIndex(m => m.id === jumpId);
    if (foundIndex !== -1) {
      const foundMistake = filteredMistakes[foundIndex];
      setCurrentMistake(foundMistake);
      setCurrentMistakeIndex(foundIndex);
      setJumpModalVisible(false);
      setJumpId(undefined);
      message.success(`已跳转到题号 ${jumpId}`);
    } else {
      message.error(`未找到题号为 ${jumpId} 的错题`);
    }
  };

  // 监听键盘事件 - 在模态框打开时支持左右箭头切换
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 只在模态框打开时处理
      if (!modalVisible) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevMistake();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextMistake();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalVisible, currentMistakeIndex, mistakes, selectedSubject, searchTerm]);

  // 处理错题删除
  const handleDelete = async (id: number) => {
    const success = await removeMistake(id);
    if (success) {
      message.success('删除成功');
    } else {
      message.error('删除失败');
    }
  };

  // 处理错题编辑
  const handleEdit = (mistake: Mistake) => {
    setCurrentMistake(mistake);
    setModalVisible(true);
  };

  // 处理查看详情
  const handleView = (mistake: Mistake) => {
    const index = filteredMistakes.findIndex(m => m.id === mistake.id);
    setCurrentMistake(mistake);
    setCurrentMistakeIndex(index);
    setModalVisible(true);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setModalVisible(false);
    setCurrentMistake(null);
  };

  // AI批量分析未分析的错题
  const handleAnalyzeUnanalyzed = async () => {
    if (!aiConfigLoaded || !aiApiKey) {
      message.error('请先在设置中配置千问API');
      return;
    }

    const unanalyzedMistakes = mistakes.filter(m => !m.analyzed);
    if (unanalyzedMistakes.length === 0) {
      message.info('没有需要分析的错题');
      return;
    }

    setAnalyzing(true);
    setAnalysisProgress({ completed: 0, total: unanalyzedMistakes.length, percent: 0 });
    try {
      message.loading('正在分析知识点，请稍候...', 0);

      // 批量分析未分析的错题
      const mistakesToAnalyze = unanalyzedMistakes.map(m => {
        const item = {
          id: m.id,
          subject: m.subject,
          question: m.question,
          answer: m.answer,
          imagePath: m.imagePath
        };
        console.log('[MistakeBook] 准备分析错题:', { id: m.id, subject: m.subject, question: m.question.substring(0, 50), imagePath: m.imagePath?.substring(0, 100) });
        return item;
      });

      console.log('[MistakeBook] 开始批量分析，共', mistakesToAnalyze.length, '道错题');

      // 传入进度回调
      const results = await analyzeMistakesInBatch(mistakesToAnalyze, (completed, total) => {
        const percent = Math.round((completed / total) * 100);
        setAnalysisProgress({ completed, total, percent });
      });

      // 更新错题分析结果
      console.log('[MistakeBook] AI分析完成，开始更新结果到数据库，共', results.length, '条结果');
      let updatedCount = 0;
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const originalMistake = unanalyzedMistakes[i];

        console.log(`[MistakeBook] 处理第${i+1}道题(ID:${originalMistake.id})，success=${result.success}, knowledgePoints=`, result.knowledgePoints);

        if (result.success && (result.knowledgePoints.length > 0 || (result.analysis && result.analysis.trim() !== '') || result.correctAnswer)) {
          const updateData: any = {
            knowledge_points: result.knowledgePoints.length > 0 ? result.knowledgePoints.join(',') : originalMistake.knowledge_points || '',
            analysis: result.analysis || '',
            difficulty: result.difficulty ?
              (result.difficulty === '简单' ? 1 : result.difficulty === '中等' ? 2 : 3) :
              originalMistake.difficulty === '简单' ? 1 : originalMistake.difficulty === '中等' ? 2 : 3
          };

          // 只有当 AI 返回了正确答案时才更新，否则保留原有答案
          if (result.correctAnswer && result.correctAnswer.trim() !== '') {
            updateData.correct_answer = result.correctAnswer;
          }

          console.log(`[MistakeBook] 更新错题 ${originalMistake.id}，数据:`, updateData);
          const updateResult = await updateMistake(originalMistake.id, updateData);
          console.log(`[MistakeBook] 更新错题 ${originalMistake.id} 结果:`, updateResult);
          if (updateResult.success) {
            updatedCount++;
          }
        } else {
          console.log(`[MistakeBook] 跳过更新第${i+1}道题(ID:${originalMistake.id})，条件不满足:`, {
            success: result.success,
            hasKnowledgePoints: result.knowledgePoints.length > 0,
            hasAnalysis: !!(result.analysis && result.analysis.trim() !== ''),
            hasCorrectAnswer: !!result.correctAnswer
          });
        }
      }

      message.destroy();
      message.success(`分析完成！${updatedCount}/${results.length}道错题已更新知识点`);
      console.log('[MistakeBook] 开始重新加载错题数据...');
      await refresh(); // 重新加载数据
      console.log('[MistakeBook] 错题数据重新加载完成');
    } catch (error) {
      console.error('AI分析失败:', error);
      message.destroy();
      message.error('分析失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setAnalyzing(false);
      setAnalysisProgress({ completed: 0, total: 0, percent: 0 });
    }
  };

  // 难度颜色映射
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '简单': return '#52c41a';
      case '中等': return '#faad14';
      case '困难': return '#f5222d';
      default: return '#ccc';
    }
  };

  // 状态颜色映射
  const getStatusColor = (status: string) => {
    switch (status) {
      case '待复习': return '#1890ff';
      case '复习中': return '#faad14';
      case '已掌握': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  return (
    <div className="mistake-book" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>错题本</h1>
        <p style={{ color: '#666' }}>管理您的错题，提高学习效率</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: 8 }}>总错题数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                {stats.pendingReview}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: 8 }}>待复习</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {stats.mastered}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: 8 }}>已掌握</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff7875' }}>
                {stats.needsAnalysis}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: 8 }}>待分析</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleOpenQuickUpload}
              size="large"
            >
              快速上传题目
            </Button>
            <Select
              defaultValue="all"
              style={{ width: 150 }}
              onChange={setSelectedSubject}
            >
              <Option value="all">全部科目</Option>
              <Option value="数学">数学</Option>
              <Option value="物理">物理</Option>
              <Option value="化学">化学</Option>
              <Option value="英语">英语</Option>
              <Option value="语文">语文</Option>
              <Option value="政治">政治</Option>
            </Select>

            <Button
              type="primary"
              icon={<RobotOutlined spin={analyzing} />}
              onClick={handleAnalyzeUnanalyzed}
              loading={analyzing}
              disabled={!aiConfigLoaded || stats.needsAnalysis === 0}
            >
              分析 {stats.needsAnalysis > 0 ? `(${stats.needsAnalysis})` : ''}
            </Button>

            {/* 分析进度条 */}
            {analyzing && analysisProgress.total > 0 && (
              <div style={{ width: 200, marginLeft: 8 }}>
                <Progress
                  percent={analysisProgress.percent}
                  size="small"
                  status="active"
                  format={(percent) => `${analysisProgress.completed}/${analysisProgress.total}`}
                />
              </div>
            )}
          </Space>
          <Search
            placeholder="搜索题目或答案..."
            allowClear
            enterButton="搜索"
            onSearch={setSearchTerm}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
        </Space>
      </Card>

      {/* 错题列表 */}
      <List
        loading={loading}
        grid={{ gutter: 16, column: 2, xs: 1, sm: 2 }}
        dataSource={filteredMistakes}
        renderItem={mistake => (
          <List.Item>
            <Card
              hoverable
              style={{ borderRadius: 8 }}
              cover={
                mistake.images_path ? (
                  <div style={{ height: 200, overflow: 'hidden' }}>
                    <Image
                      src={getImageSrc(mistake.images_path)}
                      alt="错题图片"
                      height={200}
                      style={{ objectFit: 'cover', width: '100%' }}
                    />
                  </div>
                ) : null
              }
              actions={[
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => handleView(mistake)}
                >
                  查看
                </Button>,
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(mistake)}
                >
                  编辑
                </Button>,
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(mistake.id!)}
                >
                  删除
                </Button>
              ]}
            >
              <Card.Meta
                title={
                  <div>
                    <Tag color={getStatusColor(mistake.status!)}>
                      {mistake.status}
                    </Tag>
                    <Tag color={getDifficultyColor(mistake.difficulty_label!)}>
                      {mistake.difficulty_label}
                    </Tag>
                    <span style={{ marginLeft: 8 }}>{mistake.subject}</span>

                    {!mistake.analyzed && (
                      <Tag color="orange" style={{ float: 'right' }}>
                        待分析
                      </Tag>
                    )}
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginTop: 8, fontWeight: 'bold', color: '#262626' }}>
                      {mistake.topic || mistake.knowledge_points || '待分析'}
                    </div>
                    <div style={{ marginTop: 4, color: '#666', fontSize: '14px', lineHeight: 1.4 }}>
                      {mistake.content?.substring(0, 60)}{mistake.content && mistake.content.length > 60 ? '...' : ''}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {(Array.isArray(mistake.tags) ? mistake.tags : []).slice(0, 3).map(tag => (
                        <Tag key={tag} color="blue" style={{ margin: '2px' }}>
                          {tag}
                        </Tag>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
                      创建时间: {mistake.created_at ? new Date(mistake.created_at).toLocaleDateString() : '--'}
                    </div>
                  </div>
                }
              />
            </Card>
          </List.Item>
        )}
      />

      {/* 错题详情模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>错题详情</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag color="blue">题号：{currentMistake?.id}</Tag>
              <Tag color="purple">{currentMistakeIndex + 1} / {filteredMistakes.length}</Tag>
              <Button size="small" icon={<SwapOutlined />} onClick={() => setJumpModalVisible(true)}>
                跳转
              </Button>
            </div>
          </div>
        }
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="prev" icon={<LeftOutlined />} onClick={handlePrevMistake} disabled={currentMistakeIndex <= 0}>
            上一题
          </Button>,
          <Button key="close" onClick={handleCloseModal}>
            关闭
          </Button>,
          <Button key="next" icon={<RightOutlined />} type="primary" onClick={handleNextMistake} disabled={currentMistakeIndex >= filteredMistakes.length - 1}>
            下一题
          </Button>
        ]}
        width={800}
      >
        {currentMistake && (
          <div>
            <Row gutter={16}>
              <Col span={16}>
                <h3>题目</h3>
                <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{currentMistake.content || '无内容'}</p>

                <h3 style={{ marginTop: 24 }}>正确答案</h3>
                <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{currentMistake.correct_answer || '无答案'}</p>

                <h3 style={{ marginTop: 24 }}>知识点</h3>
                <p>{currentMistake.topic || currentMistake.knowledge_points || '待分析'}</p>

                <h3 style={{ marginTop: 24 }}>难度</h3>
                <Tag color={getDifficultyColor(currentMistake.difficulty_label || '中等')}>
                  {currentMistake.difficulty_label || '中等'}
                </Tag>

              </Col>
              <Col span={8}>
                <div>
                  <h3>状态信息</h3>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ marginBottom: 4 }}>科目: {currentMistake.subject}</div>
                    <Tag color={getStatusColor(currentMistake.status || '待复习')}>
                      {currentMistake.status || '待复习'}
                    </Tag>
                    {!currentMistake.analyzed && (
                      <Tag color="orange" style={{ marginLeft: 8 }}>
                        待分析
                      </Tag>
                    )}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div>创建时间: {currentMistake.created_at ? new Date(currentMistake.created_at).toLocaleString() : '--'}</div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div>上次复习: {currentMistake.last_reviewed || '从未复习'}</div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div>下次复习: {currentMistake.next_review || '未安排'}</div>
                  </div>

                  <div>
                    <h4>标签</h4>
                    <div>
                      {(Array.isArray(currentMistake.tags) ? currentMistake.tags : []).map(tag => (
                        <Tag key={tag} color="blue" style={{ marginBottom: 4 }}>
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {currentMistake.images_path && (
              <div style={{ marginTop: 24 }}>
                <h3>题目图片</h3>
                <Image
                  src={getImageSrc(currentMistake.images_path)}
                  alt="错题图片"
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </div>
            )}

            {currentMistake.analysis && (
              <div style={{ marginTop: 24 }}>
                <h3>分析结果</h3>
                <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{currentMistake.analysis}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 题号跳转弹窗 */}
      <Modal
        title="跳转到题号"
        open={jumpModalVisible}
        onCancel={() => {
          setJumpModalVisible(false);
          setJumpId(undefined);
        }}
        onOk={handleJumpToId}
        width={400}
      >
        <div style={{ padding: '20px 0' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>输入错题题号：</label>
          <InputNumber
            value={jumpId}
            onChange={setJumpId}
            placeholder="请输入题号"
            style={{ width: '100%' }}
            onPressEnter={handleJumpToId}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
};

// 辅助函数：获取复习状态
function getReviewStatus(reviewCount: number = 0, masteryLevel: number = 0): ReviewStatus {
  if (masteryLevel > 70) return '已掌握';
  if (reviewCount > 0) return '复习中';
  return '待复习';
}

export default MistakeBook;