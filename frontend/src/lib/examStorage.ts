/**
 * Exam State Persistence Layer
 * Handles saving/loading exam state to/from IndexedDB via localforage
 */

import localforage from 'localforage';

// Configure IndexedDB storage
const examStore = localforage.createInstance({
  name: 'OnlineExamSystem',
  storeName: 'examSessions',
  description: 'Persistent storage for exam sessions'
});

export interface PersistedExamState {
  examId: string;
  attemptId: string;
  answers: { [questionId: string]: string };
  startTime: string; // ISO string
  lastActivity: string; // ISO string
  duration: number; // in minutes
  currentQuestion: number;
  examTitle?: string;
}

/**
 * Save exam state to IndexedDB
 */
export async function saveExamState(state: PersistedExamState): Promise<void> {
  try {
    const key = `exam_${state.examId}_${state.attemptId}`;
    await examStore.setItem(key, {
      ...state,
      lastActivity: new Date().toISOString()
    });
    console.log('✓ Exam state saved to IndexedDB:', key);
  } catch (error) {
    console.error('✗ Failed to save exam state:', error);
  }
}

/**
 * Load exam state from IndexedDB
 */
export async function loadExamState(examId: string, attemptId: string): Promise<PersistedExamState | null> {
  try {
    const key = `exam_${examId}_${attemptId}`;
    const state = await examStore.getItem<PersistedExamState>(key);
    
    if (state) {
      console.log('✓ Exam state loaded from IndexedDB:', key);
      return state;
    }
    
    return null;
  } catch (error) {
    console.error('✗ Failed to load exam state:', error);
    return null;
  }
}

/**
 * Get all saved exam sessions
 */
export async function getAllExamStates(): Promise<PersistedExamState[]> {
  try {
    const states: PersistedExamState[] = [];
    await examStore.iterate<PersistedExamState, void>((value) => {
      states.push(value);
    });
    return states;
  } catch (error) {
    console.error('✗ Failed to get all exam states:', error);
    return [];
  }
}

/**
 * Clear exam state after successful submission
 */
export async function clearExamState(examId: string, attemptId: string): Promise<void> {
  try {
    const key = `exam_${examId}_${attemptId}`;
    await examStore.removeItem(key);
    console.log('✓ Exam state cleared from IndexedDB:', key);
  } catch (error) {
    console.error('✗ Failed to clear exam state:', error);
  }
}

/**
 * Clear all old/expired exam sessions
 * Removes sessions older than 24 hours
 */
export async function clearExpiredSessions(): Promise<void> {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    await examStore.iterate<PersistedExamState, void>((value, _key) => {
      const lastActivity = new Date(value.lastActivity);
      if (lastActivity < oneDayAgo) {
        examStore.removeItem(_key);
        console.log('✓ Removed expired session:', _key);
      }
    });
  } catch (error) {
    console.error('✗ Failed to clear expired sessions:', error);
  }
}

/**
 * Find active session for an exam (if exists)
 */
export async function findActiveSession(examId: string): Promise<PersistedExamState | null> {
  try {
    let activeSession: PersistedExamState | null = null;
    
    await examStore.iterate<PersistedExamState, void>((value) => {
      if (value.examId === examId) {
        // Check if session is still recent (within last hour)
        const lastActivity = new Date(value.lastActivity);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (lastActivity > oneHourAgo) {
          activeSession = value;
          return; // Break iteration
        }
      }
    });
    
    return activeSession;
  } catch (error) {
    console.error('✗ Failed to find active session:', error);
    return null;
  }
}

const examStorageAPI = {
  saveExamState,
  loadExamState,
  getAllExamStates,
  clearExamState,
  clearExpiredSessions,
  findActiveSession
};

export default examStorageAPI;
