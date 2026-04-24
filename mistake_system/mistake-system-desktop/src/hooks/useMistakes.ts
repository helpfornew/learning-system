/**
 * 错题数据管理 Hook
 * 封装错题的获取、刷新、筛选等操作
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getMistakes, refreshMistakes, deleteMistake, updateMistake, addMistake } from '../services/dataService';
import type { Mistake, MistakeInput, MistakeUpdate, MistakeStats, Subject, ReviewStatus } from '../types';

interface UseMistakesOptions {
  autoLoad?: boolean;
}

export function useMistakes(options: UseMistakesOptions = {}) {
  const { autoLoad = true } = options;

  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载错题数据
  const loadMistakes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMistakes();
      setMistakes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      console.error('加载错题失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 刷新错题数据（强制重新获取）
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await refreshMistakes();
      setMistakes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新失败');
      console.error('刷新错题失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 自动加载
  useEffect(() => {
    if (autoLoad) {
      loadMistakes();
    }
  }, [autoLoad, loadMistakes]);

  // 监听数据更新事件
  useEffect(() => {
    const handleDataUpdate = () => {
      refresh();
    };

    window.addEventListener('mistakes-updated', handleDataUpdate);
    return () => window.removeEventListener('mistakes-updated', handleDataUpdate);
  }, [refresh]);

  // 统计数据
  const stats: MistakeStats = useMemo(() => {
    const total = mistakes.length;
    const pendingReview = mistakes.filter(m => {
      const status = getReviewStatus(m.review_count, m.mastery_level);
      return status === '待复习';
    }).length;
    const mastered = mistakes.filter(m => {
      const status = getReviewStatus(m.review_count, m.mastery_level);
      return status === '已掌握';
    }).length;
    const needsAnalysis = mistakes.filter(m => {
      const hasKnowledgePoints = m.knowledge_points && m.knowledge_points !== '待分析' && m.knowledge_points !== '';
      const hasTopic = m.topic && m.topic !== '待分析' && m.topic !== '';
      return !hasKnowledgePoints && !hasTopic;
    }).length;

    return { total, pendingReview, mastered, needsAnalysis };
  }, [mistakes]);

  // 按科目筛选
  const filterBySubject = useCallback((subjectId: number) => {
    return mistakes.filter(m => m.subject_id === subjectId);
  }, [mistakes]);

  // 按状态筛选
  const filterByStatus = useCallback((status: ReviewStatus) => {
    return mistakes.filter(m => getReviewStatus(m.review_count, m.mastery_level) === status);
  }, [mistakes]);

  // 搜索错题
  const searchMistakes = useCallback((keyword: string) => {
    const lowerKeyword = keyword.toLowerCase();
    return mistakes.filter(m =>
      m.content?.toLowerCase().includes(lowerKeyword) ||
      m.correct_answer?.toLowerCase().includes(lowerKeyword) ||
      m.knowledge_points?.toLowerCase().includes(lowerKeyword) ||
      m.topic?.toLowerCase().includes(lowerKeyword)
    );
  }, [mistakes]);

  // 删除错题
  const removeMistake = useCallback(async (id: number) => {
    try {
      await deleteMistake(id);
      setMistakes(prev => prev.filter(m => m.id !== id));
      return true;
    } catch (err) {
      console.error('删除错题失败:', err);
      return false;
    }
  }, []);

  // 更新错题
  const update = useCallback(async (id: number, updates: MistakeUpdate) => {
    try {
      const result = await updateMistake(id, updates);
      if (result.success) {
        setMistakes(prev => prev.map(m =>
          m.id === id ? { ...m, ...updates } : m
        ));
      }
      return result;
    } catch (err) {
      console.error('更新错题失败:', err);
      return { success: false, error: err instanceof Error ? err.message : '更新失败' };
    }
  }, []);

  // 添加错题
  const add = useCallback(async (mistake: MistakeInput) => {
    try {
      const result = await addMistake(mistake);
      if (result.success) {
        await refresh();
      }
      return result;
    } catch (err) {
      console.error('添加错题失败:', err);
      return { success: false, error: err instanceof Error ? err.message : '添加失败' };
    }
  }, [refresh]);

  // 获取今日复习数
  const getTodayReviewedCount = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return mistakes.filter(m => {
      const reviewDate = m.last_reviewed?.split('T')[0];
      return reviewDate === today;
    }).length;
  }, [mistakes]);

  // 获取准确率
  const getAccuracyRate = useCallback(() => {
    const total = mistakes.length;
    if (total === 0) return 0;
    const mastered = mistakes.filter(m => (m.mastery_level || 0) > 70).length;
    return Math.round((mastered / total) * 100);
  }, [mistakes]);

  return {
    mistakes,
    loading,
    error,
    stats,
    loadMistakes,
    refresh,
    filterBySubject,
    filterByStatus,
    searchMistakes,
    removeMistake,
    update,
    add,
    getTodayReviewedCount,
    getAccuracyRate,
  };
}

// 辅助函数：根据复习次数和掌握程度获取状态
function getReviewStatus(reviewCount: number = 0, masteryLevel: number = 0): ReviewStatus {
  if (masteryLevel > 70) return '已掌握';
  if (reviewCount > 0) return '复习中';
  return '待复习';
}

// 辅助函数：获取科目名称
export function getSubjectName(subjectId: number): Subject {
  const subjects: Subject[] = ['未知', '数学', '物理', '化学', '英语', '语文', '政治'];
  return subjects[subjectId] || '未知';
}

// 辅助函数：获取难度标签
export function getDifficultyLabel(difficulty: number): '简单' | '中等' | '困难' {
  if (difficulty <= 2) return '简单';
  if (difficulty <= 4) return '中等';
  return '困难';
}

export default useMistakes;
