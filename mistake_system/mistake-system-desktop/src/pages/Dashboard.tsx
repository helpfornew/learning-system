import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Space, Button, message, Modal } from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  QuestionOutlined,
  EditOutlined
} from '@ant-design/icons';
import { refreshMistakes } from '../services/dataService';
import { getUserStats } from '../services/statsService';
import { getDueForReviewCount, recordReview } from '../services/reviewService';
import type { UserStats } from '../services/statsService';
import type { Mistake } from '../types';
import './../styles/App.css';

const Dashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [todayStats, setTodayStats] = useState({
    totalMistakes: 0,
    reviewedToday: 0,
    reviewAccuracy: 0,
    upcomingReviews: 0
  });
  const [recentMistakes, setRecentMistakes] = useState<Mistake[]>([]);
  const [recentMistakesData, setRecentMistakesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingMistake, setReviewingMistake] = useState<Mistake | null>(null);

  // 响应式检测
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 加载统计数据
  const loadStats = useCallback(async () => {
    try {
      const stats = await getUserStats();
      if (stats) {
        setUserStats(stats);
        setTodayStats(prev => ({
          ...prev,
          totalMistakes: stats.total_mistakes,
          reviewAccuracy: Math.round(stats.mastered_rate)
        }));
      }

      const dueCount = await getDueForReviewCount();
      setTodayStats(prev => ({
        ...prev,
        upcomingReviews: dueCount
      }));
    } catch (error) {
      console.error('[Dashboard] 加载统计数据失败:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const mistakes = await refreshMistakes();
        loadStats();

        setRecentMistakes(mistakes.slice(0, 4));

        const today = new Date().toISOString().split('T')[0];
        const reviewedCount = mistakes.filter((m: any) => {
          const reviewDate = m.last_reviewed?.split('T')[0];
          return reviewDate === today;
        }).length;

        setTodayStats(prev => ({
          ...prev,
          reviewedToday: reviewedCount
        }));

        const formattedMistakes = mistakes.slice(0, 4).map((m: any) => ({
          key: m.id?.toString() || Math.random().toString(),
          id: m.id,
          subject: m.subject_name || m.subject || '未分类',
          topic: m.knowledge_points || m.topic || '待添加知识点',
          difficulty: m.difficulty === 1 ? '简单' : m.difficulty <= 3 ? '中等' : '困难',
          lastReview: m.last_reviewed ? new Date(m.last_reviewed).toLocaleDateString() : '--',
          nextReview: m.next_review ? new Date(m.next_review).toLocaleDateString() : '--',
          status: (m.mastery_level || 0) > 70 ? '已掌握' : (m.review_count || 0) > 0 ? '复习中' : '待复习'
        }));

        setRecentMistakesData(formattedMistakes);
      } catch (error) {
        console.error('[Dashboard] 加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const handleDataUpdate = (event: CustomEvent) => {
      loadData();
    };

    window.addEventListener('mistakes-updated' as any, handleDataUpdate as any);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('mistakes-updated' as any, handleDataUpdate as any);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 处理复习错题
  const handleReview = (record: any) => {
    const mistake = recentMistakes.find(m => m.id === record.id);
    if (mistake) {
      setReviewingMistake(mistake);
    }
  };

  // 提交复习结果
  const submitReviewResult = async (result: 'success' | 'difficult' | 'forgotten') => {
    if (!reviewingMistake?.id) return;

    const success = await recordReview(reviewingMistake.id, result);
    if (success) {
      message.success(result === 'success' ? '已掌握' : '已记录复习结果');
      setReviewingMistake(null);
      await loadStats();
      const mistakes = await refreshMistakes();
      setRecentMistakes(mistakes.slice(0, 4));
    } else {
      message.error('记录复习结果失败');
    }
  };

  const columns = [
    {
      title: '科目',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: '知识点',
      dataIndex: 'topic',
      key: 'topic',
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty: string) => {
        let color = '';
        switch (difficulty) {
          case '简单': color = 'green'; break;
          case '中等': color = 'orange'; break;
          case '困难': color = 'red'; break;
          default: color = 'gray';
        }
        return <span style={{ color }}>{difficulty}</span>;
      }
    },
    {
      title: '上次复习',
      dataIndex: 'lastReview',
      key: 'lastReview',
    },
    {
      title: '下次复习',
      dataIndex: 'nextReview',
      key: 'nextReview',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = '';
        switch (status) {
          case '已掌握': color = 'green'; break;
          case '复习中': color = 'blue'; break;
          case '待复习': color = 'orange'; break;
          default: color = 'gray';
        }
        return <span style={{ color, fontWeight: 'bold' }}>{status}</span>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleReview(record)}
            disabled={record.status === '已掌握'}
          >
            复习
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="dashboard">
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <h1 className="page-title">学习仪表盘</h1>
      </div>

      <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="错题总数"
              value={todayStats.totalMistakes}
              prefix={<BookOutlined />}
              valueStyle={{ color: 'var(--accent)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日已复习"
              value={todayStats.reviewedToday}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: 'var(--accent)' }}
            />
            <Progress
              percent={Math.min(100, Math.round((todayStats.reviewedToday / Math.max(1, todayStats.upcomingReviews)) * 100))}
              size="small"
              style={{ marginTop: 8 }}
              strokeColor="var(--accent)"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="复习准确率"
              value={todayStats.reviewAccuracy}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: 'var(--accent)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待复习错题"
              value={todayStats.upcomingReviews}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: 'var(--accent)' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
        <Col xs={24} lg={24}>
          <Card
            title="最近错题"
            extra={<Button type="link" onClick={() => window.location.hash = '#/mistakes'}>查看全部</Button>}
          >
            <Table
              dataSource={recentMistakesData}
              columns={columns}
              pagination={false}
              size="small"
              loading={loading}
              scroll={{ x: isMobile ? 600 : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="错题复习"
        open={!!reviewingMistake}
        onCancel={() => setReviewingMistake(null)}
        footer={null}
        width={500}
      >
        {reviewingMistake && (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 12 }}>题目</h4>
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, maxHeight: 150, overflow: 'auto' }}>
                {reviewingMistake.content || '无内容'}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 12 }}>正确答案</h4>
              <div style={{ padding: 12, background: '#f6ffed', borderRadius: 4, maxHeight: 150, overflow: 'auto' }}>
                {reviewingMistake.correct_answer || '无答案'}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: 16, fontSize: '16px', fontWeight: 'bold' }}>
                这道错题复习得怎么样？
              </p>
              <Space size="middle">
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckOutlined />}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  onClick={() => submitReviewResult('success')}
                >
                  已掌握
                </Button>
                <Button
                  size="large"
                  icon={<QuestionOutlined />}
                  onClick={() => submitReviewResult('difficult')}
                >
                  较困难
                </Button>
                <Button
                  danger
                  size="large"
                  icon={<CloseOutlined />}
                  onClick={() => submitReviewResult('forgotten')}
                >
                  忘记了
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
