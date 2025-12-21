/**
 * Custom hook for exam state persistence
 * Handles auto-save and recovery of exam sessions
 */

import { useEffect, useCallback } from 'react';
import { saveExamState, loadExamState, clearExamState, findActiveSession, type PersistedExamState } from '@/lib/examStorage';

interface UseExamPersistenceProps {
  examId: string | null;
  attemptId: string | null;
  answers: { [key: string]: string };
  currentQuestion: number;
  duration: number;
  examTitle?: string;
  startTime?: Date;
  enabled?: boolean;
}

export function useExamPersistence({
  examId,
  attemptId,
  answers,
  currentQuestion,
  duration,
  examTitle,
  startTime,
  enabled = true
}: UseExamPersistenceProps) {
  
  /**
   * Auto-save exam state whenever answers change
   */
  const saveState = useCallback(async () => {
    if (!enabled || !examId || !attemptId) return;

    const state: PersistedExamState = {
      examId,
      attemptId,
      answers,
      currentQuestion,
      duration,
      examTitle,
      startTime: startTime?.toISOString() || new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    await saveExamState(state);
  }, [examId, attemptId, answers, currentQuestion, duration, examTitle, startTime, enabled]);

  /**
   * Auto-save on answers change (debounced)
   */
  useEffect(() => {
    if (!enabled) return;

    const timeoutId = setTimeout(() => {
      saveState();
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [answers, saveState, enabled]);

  /**
   * Also save on currentQuestion change
   */
  useEffect(() => {
    if (!enabled) return;
    saveState();
  }, [currentQuestion, saveState, enabled]);

  /**
   * Load saved state on mount
   */
  const loadSavedState = useCallback(async (examId: string, attemptId: string) => {
    const savedState = await loadExamState(examId, attemptId);
    return savedState;
  }, []);

  /**
   * Find any active session for this exam
   */
  const findSession = useCallback(async (examId: string) => {
    const session = await findActiveSession(examId);
    return session;
  }, []);

  /**
   * Clear state after submission
   */
  const clearState = useCallback(async () => {
    if (!examId || !attemptId) return;
    await clearExamState(examId, attemptId);
  }, [examId, attemptId]);

  return {
    saveState,
    loadSavedState,
    findSession,
    clearState
  };
}
