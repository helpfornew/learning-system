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
  HistoryOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { refreshMistakes } from '../services/dataService';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const DataAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [moduleStats, setModuleStats] = useState<Array<{
    module: string;
    count: number;
    percentage: number;
    level: string;
  }>>([]);
  const [pieData, setPieData] = useState<Array<{
    name: string;
    value: number;
  }>>([]);
  const [totalStats, setTotalStats] = useState({
    totalMistakes: 0,
    analyzedMistakes: 0,
    moduleCount: 0
  });

  const [chartData, setChartData] = useState({
    timeline: [],
    subjectDistribution: [],
    difficultyDistribution: []
  });

  useEffect(() => {
    loadData();
  }, [selectedSubject]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await refreshMistakes();
      console.log('[DataAnalysis] 获取到错题数:', data.length);

      // 按科目筛选
      const filteredData = selectedSubject === 'all'
        ? data
        : data.filter((m: any) => {
            const subjects = ['', '数学', '物理', '化学', '英语', '语文', '政治'];
            return subjects[m.subject_id] === selectedSubject;
          });

      // 统计知识点板块（只要 knowledge_points、topic 任一字段存在即视为已分析）
      const moduleMap = new Map<string, number>();
      let analyzedCount = 0;

      filteredData.forEach((m: any) => {
        // 检查是否已分析：字段存在且不为空/待分析
        const hasKnowledgePoints = m.knowledge_points && m.knowledge_points !== '待分析' && m.knowledge_points !== '';
        const hasTopic = m.topic && m.topic !== '待分析' && m.topic !== '';

        if (hasKnowledgePoints || hasTopic) {
          analyzedCount++;
        }

        // 从 knowledge_points 字段提取知识点（逗号分隔的字符串）
        const knowledgePointsStr = m.knowledge_points || '';
        if (knowledgePointsStr && knowledgePointsStr !== '待分析') {
          const modules = knowledgePointsStr.split(',').map((s: string) => s.trim()).filter((s: string) => s);
          modules.forEach((mod: string) => {
            moduleMap.set(mod, (moduleMap.get(mod) || 0) + 1);
          });
        }
      });

      console.log('[DataAnalysis] 已分析错题数:', analyzedCount, '知识点板块数:', moduleMap.size);

      // 计算排行
      const sortedModules = Array.from(moduleMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20); // 只取前20个

      const modulesWithStats = sortedModules.map(([module, count]) => ({
        module,
        count,
        percentage: parseFloat(((count / filteredData.length) * 100).toFixed(2)),
        level: count > 10 ? 'high' : count > 5 ? 'medium' : 'low'
      }));

      setModuleStats(modulesWithStats);

      // 为饼图准备数据
      const pieData = sortedModules.map(([name, value]) => ({ name, value }));
      setPieData(pieData);

      // 统计数据
      setTotalStats({
        totalMistakes: filteredData.length,
        analyzedMistakes: analyzedCount,
        moduleCount: moduleMap.size
      });

      // 生成其他图表数据
      generateChartData(filteredData);
    } catch (error) {
      console.error('加载数据分析失败:', error);
      message.error('加载数据分析失败');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (data: any[]) => {
    // 时间线数据（按月份统计）
    const monthlyData = data.reduce((acc: any, item: any) => {
      const month = new Date(item.created_at).toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const timeline = Object.entries(monthlyData).map(([month, count]) => ({ month, count }));

    // 科目分布
    const subjectCounts: Record<string, number> = {};
    data.forEach(item => {
      const subjects = ['', '数学', '物理', '化学', '英语', '语文', '政治'];
      const subject = subjects[item.subject_id] || '未知';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    });

    const subjectDistribution = Object.entries(subjectCounts).map(([name, value]) => ({ name, value }));

    // 难度分布
    const difficultyCounts: Record<string, number> = { '简单': 0, '较易': 0, '中等': 0, '较难': 0, '困难': 0 };
    data.forEach(item => {
      const levels = ['', '简单', '较易', '中等', '较难', '困难'];
      const level = levels[item.difficulty] || '未知';
      if (difficultyCounts.hasOwnProperty(level)) {
        difficultyCounts[level]++;
      }
    });

    const difficultyDistribution = Object.entries(difficultyCounts).map(([name, value]) => ({ name, value }));

    setChartData({
      timeline,
      subjectDistribution,
      difficultyDistribution
    });
  };

  // 重新加载数据
  const refreshData = async () => {
    await loadData();
  };

  // 图表配置
  const pieOption = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '知识点板块',
        type: 'pie',
        radius: '50%',
        data: pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  const subjectOption = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '科目分布',
        type: 'pie',
        radius: '50%',
        data: chartData.subjectDistribution,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  const difficultyOption = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '难度分布',
        type: 'pie',
        radius: '50%',
        data: chartData.difficultyDistribution,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  // 知识点排行榜列定义
  const columns = [
    {
      title: '知识点板块',
      dataIndex: 'module',
      key: 'module',
    },
    {
      title: '错误次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => b.count - a.count,
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage: number) => `${percentage}%`,
      sorter: (a: any, b: any) => b.percentage - a.percentage,
    },
    {
      title: '难度级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => {
        const colors = {
          high: 'red',
          medium: 'orange',
          low: 'green'
        };
        return <Tag color={colors[level as keyof typeof colors] || 'default'}>{level === 'high' ? '高' : level === 'medium' ? '中' : '低'}</Tag>;
      }
    }
  ];

  return (
    <div className="data-analysis">
      <style>{`
        .hover-row:hover {
          cursor: pointer;
          background-color: #f0f8ff !important;
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          <BarChartOutlined /> 数据分析
        </Title>
        <Text type="secondary">可视化展示您的学习数据，帮助您发现薄弱环节</Text>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总错题数"
              value={totalStats.totalMistakes}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已分析错题"
              value={totalStats.analyzedMistakes}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="知识点板块"
              value={totalStats.moduleCount}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center', paddingTop: 16 }}>
              <Select
                style={{ width: 200 }}
                placeholder="选择科目"
                value={selectedSubject}
                onChange={setSelectedSubject}
                allowClear
              >
                <Option value="all">全部科目</Option>
                <Option value="数学">数学</Option>
                <Option value="物理">物理</Option>
                <Option value="化学">化学</Option>
                <Option value="英语">英语</Option>
                <Option value="语文">语文</Option>
                <Option value="政治">政治</Option>
              </Select>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="知识点板块分布" loading={loading}>
            {pieData.length > 0 ? (
              <ReactECharts option={pieOption} style={{ height: '400px' }} />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="科目分布" loading={loading}>
            {chartData.subjectDistribution.length > 0 ? (
              <ReactECharts option={subjectOption} style={{ height: '400px' }} />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="难度分布" loading={loading}>
            {chartData.difficultyDistribution.length > 0 ? (
              <ReactECharts option={difficultyOption} style={{ height: '400px' }} />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="知识点板块排行"
            loading={loading}
            extra={
              <Space>
                <Button
                  icon={<SyncOutlined />}
                  onClick={refreshData}
                  loading={loading}
                >
                  刷新
                </Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={moduleStats}
              rowKey="module"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DataAnalysis;