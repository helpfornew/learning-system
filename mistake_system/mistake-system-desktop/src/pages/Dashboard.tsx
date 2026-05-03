import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Space, Button, message, Modal, Tag, Image } from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  CalendarOutlined,
  CheckOutlined,
  QuestionOutlined,
  EditOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  PlayCircleOutlined,
  LinkOutlined,
  LeftOutlined,
  RightOutlined,
  PlusOutlined,
  BarChartOutlined,
  BulbOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { refreshMistakes } from '../services/dataService';
import { getUserStats } from '../services/statsService';
import { getDueForReviewCount, getDueReviews, recordReview } from '../services/reviewService';
import { API_BASE } from '../config/api';
import type { Mistake } from '../types';
import './../styles/App.css';

// 根据 review_count 判断复习状态
function getReviewStatus(reviewCount: number = 0): string {
  if (reviewCount >= 3) return '已掌握';
  if (reviewCount > 0) return '复习中';
  return '待复习';
}

function getStatusColor(status: string): string {
  switch (status) {
    case '已掌握': return '#52c41a';
    case '复习中': return '#faad14';
    case '待复习': return '#1890ff';
    default: return '#d9d9d9';
  }
}

function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 1) return '简单';
  if (difficulty <= 3) return '中等';
  return '困难';
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case '简单': return 'green';
    case '中等': return 'orange';
    case '困难': return 'red';
    default: return 'gray';
  }
}

const Dashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [todayStats, setTodayStats] = useState({
    totalMistakes: 0,
    reviewedToday: 0,
    reviewAccuracy: 0,
    upcomingReviews: 0
  });
  const [recentMistakesData, setRecentMistakesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectPieData, setSubjectPieData] = useState<any[]>([]);
  const [weeklyTrendData, setWeeklyTrendData] = useState<{ dates: string[]; counts: number[] }>({ dates: [], counts: [] });
  const [subjectProgress, setSubjectProgress] = useState<any[]>([]);

  // 每日复习状态
  const [reviewSession, setReviewSession] = useState<Mistake[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  // 响应式检测
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 获取图片src
  const getImageSrc = (path: string) => {
    if (!path) return '';
    if (path.startsWith('data:')) return path;
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
  };

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // 获取统计数据
      const stats = await getUserStats();
      const dueCount = await getDueForReviewCount();

      // 获取错题列表
      const mistakes = await refreshMistakes();

      // 今日已复习数
      const today = new Date().toISOString().split('T')[0];
      const reviewedToday = mistakes.filter((m: any) => {
        return m.last_review_date === today;
      }).length;

      // 计算已掌握率
      const masteredCount = stats?.mastered_mistakes || mistakes.filter((m: any) => (m.review_count || 0) >= 3).length;
      const total = stats?.total_mistakes || mistakes.length;
      const masteredRate = total > 0 ? Math.round(masteredCount / total * 100) : 0;

      setTodayStats({
        totalMistakes: total,
        reviewedToday,
        reviewAccuracy: masteredRate,
        upcomingReviews: stats?.review_due_count ?? dueCount ?? mistakes.filter((m: any) => (m.review_count || 0) < 3).length
      });

      // 格式化最近错题
      const formatted = mistakes.slice(0, 5).map((m: any) => ({
        key: m.id?.toString() || Math.random().toString(),
        id: m.id,
        subject: m.subject_name || m.subject || '未分类',
        topic: m.knowledge_points || m.topic || '待添加',
        difficulty: getDifficultyLabel(m.difficulty || 2),
        lastReview: m.last_review_date || '--',
        status: getReviewStatus(m.review_count || 0)
      }));

      setRecentMistakesData(formatted);

      // 科目分布饼图
      const subjectMap = new Map<string, number>();
      mistakes.forEach((m: any) => {
        const name = m.subject_name || m.subject || '未分类';
        subjectMap.set(name, (subjectMap.get(name) || 0) + 1);
      });
      setSubjectPieData(Array.from(subjectMap.entries()).map(([name, value]) => ({ name, value })));

      // 最近 7 天复习趋势
      const trendDates: string[] = [];
      const trendCounts: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        trendDates.push(dateStr.slice(5)); // MM-DD
        trendCounts.push(mistakes.filter((m: any) => m.last_review_date === dateStr).length);
      }
      setWeeklyTrendData({ dates: trendDates, counts: trendCounts });

      // 各科学习进度
      const progressMap = new Map<string, { total: number; mastered: number; reviewing: number; pending: number }>();
      mistakes.forEach((m: any) => {
        const name = m.subject_name || m.subject || '未分类';
        if (!progressMap.has(name)) progressMap.set(name, { total: 0, mastered: 0, reviewing: 0, pending: 0 });
        const p = progressMap.get(name)!;
        p.total++;
        const rc = m.review_count || 0;
        if (rc >= 3) p.mastered++;
        else if (rc > 0) p.reviewing++;
        else p.pending++;
      });
      setSubjectProgress(Array.from(progressMap.entries()).map(([subject, data]) => ({ subject, ...data })));
    } catch (error) {
      console.error('[Dashboard] 加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleDataUpdate = () => loadData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    const handleStartReview = () => startDailyReview();

    window.addEventListener('mistakes-updated' as any, handleDataUpdate as any);
    window.addEventListener('start-daily-review' as any, handleStartReview as any);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('mistakes-updated' as any, handleDataUpdate as any);
      window.removeEventListener('start-daily-review' as any, handleStartReview as any);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData]);

  // 开始每日复习 - 从到期错题中获取
  const startDailyReview = async () => {
    const dueMistakes = await getDueReviews(10);
    if (dueMistakes.length === 0) {
      message.info('暂无到期的复习题目，所有错题都在计划中！');
      return;
    }
    setReviewSession(dueMistakes);
    setReviewIndex(0);
    setShowAnswer(false);
    setReviewModalVisible(true);
  };

  // 提交复习结果并跳到下一题
  const submitReviewAndNext = async (result: 'success' | 'difficult' | 'forgotten') => {
    const current = reviewSession[reviewIndex];
    if (!current?.id) return;

    const success = await recordReview(current.id, result);
    if (success) {
      const msg = result === 'success' ? '已掌握！' : result === 'difficult' ? '已记录为较困难' : '已记录为忘记，将缩短复习间隔';
      message.success(msg);
    }

    if (reviewIndex < reviewSession.length - 1) {
      setReviewIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setReviewModalVisible(false);
      message.success(`每日复习完成！共复习 ${reviewSession.length} 题`);
      loadData();
    }
  };

  // 复习界面快捷键
  useEffect(() => {
    if (!reviewModalVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框内的按键
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (reviewIndex > 0) {
            setReviewIndex(prev => prev - 1);
            setShowAnswer(false);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (reviewIndex < reviewSession.length - 1) {
            setReviewIndex(prev => prev + 1);
            setShowAnswer(false);
          }
          break;
        case 'Enter':
          e.preventDefault();
          submitReviewAndNext('success');
          break;
        case 'Backspace':
          e.preventDefault();
          submitReviewAndNext('difficult');
          break;
        case 'Delete':
          e.preventDefault();
          submitReviewAndNext('forgotten');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reviewModalVisible, reviewIndex, reviewSession.length]);

  // 跳转到学习平台知识点
  const jumpToKnowledgePoint = () => {
    const current = reviewSession[reviewIndex];
    if (!current) return;
    const kp = current.knowledge_points || current.topic;
    if (!kp) {
      message.info('该题暂无知识点');
      return;
    }
    const firstKp = kp.split(',')[0].trim();
    const url = `/learning/#kp-${encodeURIComponent(firstKp)}`;
    window.open(url, '_blank');
  };

  // 获取当前复习题目的图片
  const getCurrentReviewImage = () => {
    const current = reviewSession[reviewIndex];
    if (!current) return null;
    const path = (current as any).images_path || (current as any).imagePath;
    if (!path) return null;
    return getImageSrc(path);
  };

  const columns = [
    { title: '科目', dataIndex: 'subject', key: 'subject' },
    { title: '知识点', dataIndex: 'topic', key: 'topic' },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (d: string) => <span style={{ color: getDifficultyColor(d) }}>{d}</span>
    },
    {
      title: '复习状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <span style={{ color: getStatusColor(s), fontWeight: 'bold' }}>{s}</span>
    },
    { title: '上次复习', dataIndex: 'lastReview', key: 'lastReview' },
  ];

  const currentReview = reviewSession[reviewIndex];
  const reviewImage = getCurrentReviewImage();

  // 科目分布饼图配置
  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#aaa' } },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#1a1a1a', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: subjectPieData
    }]
  };

  // 复习趋势折线图配置
  const trendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: weeklyTrendData.dates, axisLabel: { color: '#aaa' }, axisLine: { lineStyle: { color: '#333' } } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#aaa' }, splitLine: { lineStyle: { color: '#222' } } },
    series: [{
      data: weeklyTrendData.counts,
      type: 'line',
      smooth: true,
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(14,165,233,0.3)' }, { offset: 1, color: 'rgba(14,165,233,0.02)' }] } },
      lineStyle: { color: '#0ea5e9', width: 2 },
      itemStyle: { color: '#0ea5e9' }
    }]
  };

  return (
    <div className="dashboard">
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <h1 className="page-title">学习仪表盘</h1>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="错题总数" value={todayStats.totalMistakes} prefix={<BookOutlined />} valueStyle={{ color: 'var(--accent)' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="今日已复习" value={todayStats.reviewedToday} prefix={<CheckCircleOutlined />} valueStyle={{ color: 'var(--accent)' }} />
            <Progress
              percent={Math.min(100, Math.round((todayStats.reviewedToday / Math.max(1, todayStats.upcomingReviews)) * 100))}
              size="small" style={{ marginTop: 8 }} strokeColor="var(--accent)"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="已掌握率" value={todayStats.reviewAccuracy} suffix="%" prefix={<RiseOutlined />} valueStyle={{ color: 'var(--accent)' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="待复习错题" value={todayStats.upcomingReviews} prefix={<CalendarOutlined />} valueStyle={{ color: 'var(--accent)' }} />
          </Card>
        </Col>
      </Row>

      {/* 每日复习卡片 */}
      <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24}>
          <Card style={{ background: 'linear-gradient(135deg, rgba(76,154,255,0.08) 0%, rgba(76,154,255,0.02) 100%)', borderColor: 'rgba(76,154,255,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ margin: 0, marginBottom: 4 }}>
                  <CalendarOutlined style={{ marginRight: 8, color: 'var(--accent)' }} />
                  每日错题复习
                </h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                  每天复习 10 道错题，巩固薄弱知识点
                </p>
              </div>
              <Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={startDailyReview}>
                开始今日复习
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={12} sm={6}>
          <Card hoverable style={{ textAlign: 'center' }} onClick={() => window.dispatchEvent(new CustomEvent('open-quick-upload'))}>
            <PlusOutlined style={{ fontSize: 28, color: '#0ea5e9', marginBottom: 8 }} />
            <div style={{ fontWeight: 500 }}>快速录入</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable style={{ textAlign: 'center' }} onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'mistakes' }))}>
            <BookOutlined style={{ fontSize: 28, color: '#8b5cf6', marginBottom: 8 }} />
            <div style={{ fontWeight: 500 }}>错题本</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable style={{ textAlign: 'center' }} onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'analysis' }))}>
            <BarChartOutlined style={{ fontSize: 28, color: '#f59e0b', marginBottom: 8 }} />
            <div style={{ fontWeight: 500 }}>数据分析</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable style={{ textAlign: 'center' }} onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }))}>
            <CalendarOutlined style={{ fontSize: 28, color: '#10b981', marginBottom: 8 }} />
            <div style={{ fontWeight: 500 }}>复习计划</div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24} lg={12}>
          <Card title="科目分布" size="small">
            {subjectPieData.length > 0 ? (
              <ReactECharts option={pieOption} style={{ height: 260 }} />
            ) : (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>暂无数据</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="近 7 天复习趋势" size="small">
            {weeklyTrendData.counts.some(c => c > 0) ? (
              <ReactECharts option={trendOption} style={{ height: 260 }} />
            ) : (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>暂无复习记录</div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 各科学习进度 */}
      {subjectProgress.length > 0 && (
        <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
          <Col xs={24}>
            <Card title="各科学习进度" size="small">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {subjectProgress.map((sp: any) => {
                  const masteredPct = sp.total > 0 ? Math.round(sp.mastered / sp.total * 100) : 0;
                  const reviewingPct = sp.total > 0 ? Math.round(sp.reviewing / sp.total * 100) : 0;
                  return (
                    <div key={sp.subject}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                        <span style={{ fontWeight: 500 }}>{sp.subject}</span>
                        <span style={{ color: '#888' }}>
                          <span style={{ color: '#52c41a' }}>{sp.mastered}</span> /
                          <span style={{ color: '#faad14' }}> {sp.reviewing}</span> /
                          <span style={{ color: '#1890ff' }}> {sp.pending}</span>
                          {' '}({sp.total}题)
                        </span>
                      </div>
                      <Progress
                        percent={masteredPct + reviewingPct}
                        success={{ percent: masteredPct }}
                        size="small"
                        strokeColor={{ '0%': '#52c41a', '100%': '#faad14' }}
                        showInfo={false}
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#666', textAlign: 'right' }}>
                <Tag color="green">已掌握</Tag>
                <Tag color="orange">复习中</Tag>
                <Tag color="blue">待复习</Tag>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* 最近错题表格 */}
      <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
        <Col xs={24}>
          <Card title="最近错题" extra={<Button type="link" onClick={() => window.location.hash = '#/mistakes'}>查看全部</Button>}>
            <Table dataSource={recentMistakesData} columns={columns} pagination={false} size="small" loading={loading} scroll={{ x: isMobile ? 600 : undefined }} />
          </Card>
        </Col>
      </Row>

      {/* 每日复习弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>每日错题复习</span>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal' }}>
              {reviewIndex + 1} / {reviewSession.length}
            </span>
          </div>
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={680}
        destroyOnClose
      >
        {currentReview && (
          <div style={{ padding: '12px 0' }}>
            {/* 进度条 */}
            <Progress percent={Math.round(((reviewIndex + 1) / reviewSession.length) * 100)} size="small" showInfo={false} strokeColor="#4c9aff" style={{ marginBottom: 20 }} />

            {/* 题目区域 */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>
                <EditOutlined style={{ marginRight: 6 }} />
                题目
              </h4>
              {reviewImage && (
                <div style={{ marginBottom: 12, textAlign: 'center' }}>
                  <Image src={reviewImage} style={{ maxHeight: 200, borderRadius: 6 }} />
                </div>
              )}
              <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 6, maxHeight: 150, overflow: 'auto', lineHeight: 1.6, border: '1px solid rgba(255,255,255,0.08)' }}>
                {currentReview.content || currentReview.question || '无题目内容'}
              </div>
            </div>

            {/* 答案区域（默认隐藏，眼睛图标切换） */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h4 style={{ margin: 0 }}>正确答案</h4>
                <Button
                  type="text"
                  size="small"
                  icon={showAnswer ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  onClick={() => setShowAnswer(!showAnswer)}
                  style={{ color: showAnswer ? '#52c41a' : 'rgba(255,255,255,0.45)' }}
                >
                  {showAnswer ? '隐藏' : '显示答案'}
                </Button>
              </div>
              <div style={{
                padding: 14,
                background: showAnswer ? 'rgba(82,196,26,0.08)' : 'rgba(255,255,255,0.02)',
                borderRadius: 6,
                minHeight: 44,
                maxHeight: 150,
                overflow: 'auto',
                lineHeight: 1.8,
                border: `1px solid ${showAnswer ? 'rgba(82,196,26,0.25)' : 'rgba(255,255,255,0.06)'}`,
                transition: 'all 0.3s'
              }}>
                {showAnswer ? (
                  <span style={{ fontSize: '15px' }}>{currentReview.correct_answer || '无答案'}</span>
                ) : (
                  <span style={{ letterSpacing: 6, color: 'rgba(255,255,255,0.2)', userSelect: 'none', fontSize: '16px' }}>
                    ● ● ● ● ● ● ● ● ● ● ● ●
                  </span>
                )}
              </div>
            </div>

            {/* 知识点（可点击跳转） */}
            {(currentReview.knowledge_points || currentReview.topic) && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 8 }}>知识点</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(currentReview.knowledge_points || currentReview.topic || '')
                    .split(',')
                    .map((kp: string) => kp.trim())
                    .filter((kp: string) => kp)
                    .map((kp: string, idx: number) => (
                      <Tag
                        key={idx}
                        color="blue"
                        style={{ cursor: 'pointer' }}
                        onClick={() => window.open(`/learning/#kp-${encodeURIComponent(kp)}`, '_blank')}
                      >
                        <LinkOutlined style={{ marginRight: 4 }} />
                        {kp}
                      </Tag>
                    ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
              <p style={{ marginBottom: 12, fontSize: '15px', fontWeight: 'bold' }}>这道题掌握得怎么样？</p>
              <Space size="middle" wrap>
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckOutlined />}
                  style={{ background: '#52c41a', borderColor: '#52c41a', minWidth: 100 }}
                  onClick={() => submitReviewAndNext('success')}
                >
                  已掌握
                </Button>
                <Button
                  size="large"
                  icon={<QuestionOutlined />}
                  style={{ minWidth: 100 }}
                  onClick={() => submitReviewAndNext('difficult')}
                >
                  较困难
                </Button>
                <Button
                  size="large"
                  danger
                  icon={<ExclamationCircleOutlined />}
                  style={{ minWidth: 100 }}
                  onClick={() => submitReviewAndNext('forgotten')}
                >
                  忘记了
                </Button>
                <Button
                  size="large"
                  icon={<LinkOutlined />}
                  style={{ minWidth: 100, color: '#4c9aff', borderColor: '#4c9aff' }}
                  onClick={jumpToKnowledgePoint}
                >
                  知识点
                </Button>
              </Space>
              <div style={{ marginTop: 12 }}>
                <Space>
                  <Button size="small" icon={<LeftOutlined />} disabled={reviewIndex === 0}
                    onClick={() => { setReviewIndex(prev => prev - 1); setShowAnswer(false); }}>
                    上一题
                  </Button>
                  <Button size="small" icon={<RightOutlined />} disabled={reviewIndex >= reviewSession.length - 1}
                    onClick={() => { setReviewIndex(prev => prev + 1); setShowAnswer(false); }}>
                    下一题
                  </Button>
                </Space>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
