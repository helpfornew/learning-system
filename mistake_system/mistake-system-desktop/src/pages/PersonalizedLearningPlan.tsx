import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Progress,
  Button,
  Space,
  Tag,
  Statistic,
  message,
  Empty,
  Modal,
  Spin,
  Select,
  Typography,
  Divider
} from 'antd';
import {
  BarChartOutlined,
  RiseOutlined,
  SyncOutlined,
  BulbOutlined,
  HistoryOutlined,
  FireOutlined,
  TrophyOutlined,
  BookOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { refreshMistakes } from '../services/dataService';
import {
  analyzePersonalizedLearningPlan,
  saveWeeklyAnalysis,
  getWeeklyAnalysisHistory,
  deleteWeeklyAnalysis,
  WeeklyAnalysisResult,
  getCurrentWeekId
} from '../services/deepseekAnalyzer';
import { getDeepseekConfig } from '../services/aiConfig';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const PersonalizedLearningPlan: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyAnalysisResult[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalMistakes: 0,
    analyzedMistakes: 0,
    moduleCount: 0
  });

  // 个性化分析结果状态
  const [personalizedAnalysis, setPersonalizedAnalysis] = useState<any>(null);
  const [analysisLoaded, setAnalysisLoaded] = useState(false);

  useEffect(() => {
    loadInitialData();
    loadWeeklyHistory();
  }, []);

  const loadInitialData = async () => {
    try {
      const data = await refreshMistakes();

      // 统计知识点板块（只要 knowledge_points、topic 任一字段存在即视为已分析）
      const analyzedCount = data.filter((m: any) => {
        const hasKnowledgePoints = m.knowledge_points && m.knowledge_points !== '待分析' && m.knowledge_points !== '';
        const hasTopic = m.topic && m.topic !== '待分析' && m.topic !== '';
        return hasKnowledgePoints || hasTopic;
      }).length;

      setTotalStats({
        totalMistakes: data.length,
        analyzedMistakes: analyzedCount,
        moduleCount: 0 // 这里可能需要单独计算
      });

      // 尝试加载最近的分析历史
      const history = await getWeeklyAnalysisHistory();
      const historyArray = Object.values(history);
      if (historyArray.length > 0) {
        const latestAnalysis = historyArray[0];
        setPersonalizedAnalysis(latestAnalysis.personalizedAnalysis);
        setAnalysisLoaded(true);
        setTotalStats({
          totalMistakes: latestAnalysis.totalMistakes,
          analyzedMistakes: latestAnalysis.analyzedMistakes,
          moduleCount: latestAnalysis.moduleStats?.length || 0
        });
      } else if (analyzedCount > 0) {
        // 如果没有历史但有分析数据，尝试自动分析
        await loadPersonalizedAnalysis();
      }
    } catch (error) {
      console.error('加载初始数据失败:', error);
      message.error('加载数据失败');
    }
  };

  const loadWeeklyHistory = async () => {
    const history = await getWeeklyAnalysisHistory();
    setWeeklyHistory(Object.values(history));
  };

  // 自动加载个性化分析
  const loadPersonalizedAnalysis = async () => {
    const config = getDeepseekConfig();
    if (!config.enabled || !config.apiKey) {
      message.error('❌ DeepSeek AI 未配置，请先在设置中配置 API 密钥');
      setPersonalizedAnalysis({
        summary: "AI分析需要配置DeepSeek API密钥",
        modules: [],
        suggestions: "请前往设置页面配置DeepSeek或其它AI提供商的API密钥以获取个性化分析",
        plan: "配置API密钥后，系统将自动生成基于您错题数据的个性化学习计划"
      });
      setAnalysisLoaded(true);
      return;
    }

    if (totalStats.analyzedMistakes === 0) {
      setPersonalizedAnalysis({
        summary: "暂无已分析的错题数据",
        modules: [],
        suggestions: "请先添加错题并使用AI分析功能识别知识点，然后再查看个性化学习建议",
        plan: "您可以通过AI分析按钮对现有错题进行知识点分析，以获得更多数据"
      });
      setAnalysisLoaded(true);
      return;
    }

    setLoading(true);
    try {
      const data = await refreshMistakes();
      const result = await analyzePersonalizedLearningPlan(data, config.apiKey);

      if (result) {
        setPersonalizedAnalysis(result);

        // 保存分析结果到历史
        const weekId = getCurrentWeekId();
        const weeklyResult: WeeklyAnalysisResult = {
          id: weekId,
          timestamp: new Date().toISOString(),
          totalMistakes: data.length,
          analyzedMistakes: data.filter((m: any) => {
            const hasKnowledgeModules = m.knowledge_modules && m.knowledge_modules.length > 0;
            const hasTopic = m.topic && m.topic !== '待分析';
            const hasKnowledgePoints = m.knowledge_points && m.knowledge_points !== '待分析';
            return hasKnowledgeModules || hasTopic || hasKnowledgePoints;
          }).length,
          moduleStats: [], // 临时设置为空数组，可以根据需要填充
          personalizedAnalysis: result
        };
        await saveWeeklyAnalysis(weeklyResult);
        await loadWeeklyHistory();
      } else {
        setPersonalizedAnalysis({
          summary: "未能获取到有效的AI分析结果",
          modules: [],
          suggestions: "可能是由于API请求限制或AI模型响应格式问题，请稍后重试",
          plan: "确保您的API密钥有效并有足够的调用额度"
        });
      }
    } catch (error) {
      console.error('[PersonalizedLearningPlan] 加载个性化分析失败:', error);
      setPersonalizedAnalysis({
        summary: "加载个性化分析时发生错误",
        modules: [],
        suggestions: error instanceof Error ? error.message : "未知错误，请检查网络连接和API配置",
        plan: "您可以稍后重试，或检查设置中的API配置"
      });
    } finally {
      setLoading(false);
      setAnalysisLoaded(true);
    }
  };

  // 个性化学习分析
  const handlePersonalizedAnalysis = async () => {
    const config = getDeepseekConfig();
    if (!config.enabled || !config.apiKey) {
      message.error('❌ DeepSeek AI 未配置，请先在设置中配置 API 密钥');
      return;
    }

    if (totalStats.analyzedMistakes === 0) {
      message.warning('暂无已分析的错题数据，无法进行个性化分析');
      return;
    }

    setAnalyzing(true);
    setAnalysisLoaded(false); // 重置加载状态以触发重新加载

    try {
      const data = await refreshMistakes();
      if (data.length === 0) {
        message.warning('暂无错题数据可分析');
        return;
      }

      const result = await analyzePersonalizedLearningPlan(data, config.apiKey);

      if (!result) {
        message.error('分析失败');
        return;
      }

      // 更新个性化分析结果
      setPersonalizedAnalysis(result);
      setAnalysisLoaded(true);

      // 保存每周分析结果
      const weekId = getCurrentWeekId();
      const weeklyResult: WeeklyAnalysisResult = {
        id: weekId,
        timestamp: new Date().toISOString(),
        totalMistakes: data.length,
        analyzedMistakes: data.filter((m: any) => {
          const hasKnowledgeModules = m.knowledge_modules && m.knowledge_modules.length > 0;
          const hasTopic = m.topic && m.topic !== '待分析';
          const hasKnowledgePoints = m.knowledge_points && m.knowledge_points !== '待分析';
          return hasKnowledgeModules || hasTopic || hasKnowledgePoints;
        }).length,
        moduleStats: [], // 可以根据需要填充
        personalizedAnalysis: result
      };
      await saveWeeklyAnalysis(weeklyResult);
      await loadWeeklyHistory();

      message.success('个性化分析完成！');
    } catch (error) {
      console.error('[PersonalizedLearningPlan] 分析失败:', error);
      message.error('分析失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setAnalyzing(false);
    }
  };

  // 刷新数据
  const refreshData = async () => {
    setAnalysisLoaded(false); // 重置分析加载状态
    setPersonalizedAnalysis(null); // 清空当前分析结果
    await loadInitialData();
  };

  return (
    <div className="personalized-learning-plan">
      <style>{`
        .hover-row:hover {
          cursor: pointer;
          background-color: #f0f8ff !important;
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          <BulbOutlined /> 个性化学习建议
        </Title>
        <Text type="secondary">基于您的错题数据，AI生成的个性化学习分析和建议</Text>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="总错题数"
              value={totalStats.totalMistakes}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="已分析错题"
              value={totalStats.analyzedMistakes}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="知识点板块"
              value={totalStats.moduleCount}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 个性化学习分析 */}
      <Card
        id="personalized-analysis-section"
        title="🎯 个性化学习分析"
        style={{ marginBottom: 24 }}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<BulbOutlined />}
              onClick={handlePersonalizedAnalysis}
              loading={analyzing}
              disabled={totalStats.analyzedMistakes === 0}
            >
              生成分析
            </Button>
            <Button
              icon={<SyncOutlined />}
              onClick={refreshData}
              loading={loading}
            >
              刷新数据
            </Button>
          </Space>
        }
      >
        {personalizedAnalysis ? (
          <div>
            {/* 总体分析摘要 */}
            <Row gutter={16}>
              <Col span={24}>
                <Card style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <FireOutlined style={{ fontSize: '24px', color: '#f5222d', marginRight: 16 }} />
                    <div>
                      <Title level={4}>整体分析</Title>
                      <Paragraph style={{ fontSize: '16px', lineHeight: 1.8 }}>
                        {personalizedAnalysis.summary}
                      </Paragraph>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16} style={{ marginTop: 16 }}>
              {/* 最薄弱知识点 */}
              <Col span={12}>
                <Card title="🔴 最薄弱知识点板块" style={{ height: '100%' }}>
                  {personalizedAnalysis.modules && personalizedAnalysis.modules.length > 0 ? (
                    <div>
                      {personalizedAnalysis.modules.slice(0, 5).map((module: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <strong>{module.name}</strong>
                            <Text type="secondary">{module.count} 次错误 ({module.percentage}%)</Text>
                          </div>
                          <Progress percent={Math.round(module.percentage)} size="small" status="exception" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="暂无薄弱知识点数据" />
                  )}
                </Card>
              </Col>

              {/* 学习建议 */}
              <Col span={12}>
                <Card title="💡 个性化学习建议" style={{ height: '100%' }}>
                  {personalizedAnalysis.suggestions ? (
                    <Paragraph style={{ lineHeight: 1.8 }}>
                      {personalizedAnalysis.suggestions}
                    </Paragraph>
                  ) : (
                    <Empty description="暂无学习建议" />
                  )}
                </Card>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16} style={{ marginTop: 16 }}>
              {/* 学习计划 */}
              <Col span={24}>
                <Card title="📅 个性化学习计划">
                  {personalizedAnalysis.plan ? (
                    <div style={{ lineHeight: 1.8 }}>
                      <Paragraph>{personalizedAnalysis.plan}</Paragraph>
                    </div>
                  ) : (
                    <Empty description="暂无学习计划" />
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin spinning={analysisLoaded === false && totalStats.analyzedMistakes > 0} size="large" />
            <Text type="secondary" style={{ marginTop: 16, display: 'block' }}>
              {totalStats.analyzedMistakes === 0
                ? "暂无已分析的错题数据，无法生成个性化分析。请先分析一些错题。"
                : analysisLoaded === false
                  ? "正在加载个性化分析，请稍候..."
                  : "点击“生成分析”按钮获取个性化学习建议"}
            </Text>
          </div>
        )}
      </Card>

      {weeklyHistory.length > 0 && (
        <Card title="📚 分析历史" style={{ marginBottom: 24 }}>
          <Table
            dataSource={weeklyHistory.map((history, index) => ({
              ...history,
              key: index,
            }))}
            columns={[
              {
                title: '分析时间',
                dataIndex: 'id',
                key: 'id',
                render: (text: string) => <Text strong>{text}</Text>,
              },
              {
                title: '总错题数',
                dataIndex: 'totalMistakes',
                key: 'totalMistakes',
                width: 100,
              },
              {
                title: '已分析错题',
                dataIndex: 'analyzedMistakes',
                key: 'analyzedMistakes',
                width: 120,
              },
              {
                title: '知识点板块数',
                dataIndex: 'moduleStats',
                key: 'moduleCount',
                render: (moduleStats: Array<{ module: string; count: number }>) => moduleStats?.length || 0,
                width: 120,
              },
              {
                title: '操作',
                key: 'action',
                render: (_, record) => (
                  <Space>
                    <Button
                      type="link"
                      onClick={() => {
                        // 将历史记录的数据设置为当前分析结果，从而自动投影到相应区域
                        setPersonalizedAnalysis(record.personalizedAnalysis);
                        setTotalStats({
                          totalMistakes: record.totalMistakes,
                          analyzedMistakes: record.analyzedMistakes,
                          moduleCount: record.moduleStats?.length || 0
                        });
                      }}
                    >
                      应用此分析
                    </Button>
                    <Button
                      type="link"
                      danger
                      onClick={(e) => {
                        e.stopPropagation(); // 阻止行点击事件
                        Modal.confirm({
                          title: '确认删除',
                          content: `确定要删除 ${record.id} 的分析历史吗？`,
                          onOk: async () => {
                            // 删除指定的分析历史
                            await deleteWeeklyAnalysis(record.id);
                            await loadWeeklyHistory(); // 重新加载历史记录

                            // 如果删除的是当前显示的分析，尝试加载最近的分析
                            if (personalizedAnalysis === record.personalizedAnalysis) {
                              const remainingHistory = weeklyHistory.filter(h => h.id !== record.id);
                              if (remainingHistory.length > 0) {
                                const latestRecord = remainingHistory[0]; // 最近的记录通常是第一个
                                setPersonalizedAnalysis(latestRecord.personalizedAnalysis);
                                setTotalStats({
                                  totalMistakes: latestRecord.totalMistakes,
                                  analyzedMistakes: latestRecord.analyzedMistakes,
                                  moduleCount: latestRecord.moduleStats?.length || 0
                                });
                              } else {
                                // 如果没有剩余历史记录，清空个性化分析
                                setPersonalizedAnalysis(null);
                              }
                            }
                          },
                        });
                      }}
                    >
                      删除
                    </Button>
                  </Space>
                ),
                width: 150,
              },
            ]}
            pagination={{ pageSize: 5 }}
            onRow={(record) => {
              return {
                onClick: () => {
                  // 将历史记录的数据设置为当前分析结果
                  setPersonalizedAnalysis(record.personalizedAnalysis);
                  setTotalStats({
                    totalMistakes: record.totalMistakes,
                    analyzedMistakes: record.analyzedMistakes,
                    moduleCount: record.moduleStats?.length || 0
                  });
                },
              };
            }}
            rowClassName={() => 'hover-row'}
          />
        </Card>
      )}
    </div>
  );
};

export default PersonalizedLearningPlan;