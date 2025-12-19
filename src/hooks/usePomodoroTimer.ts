/**
 * Pomodoro Timer Hook
 * Manages pomodoro timer state, work/break cycles, and persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as pomodoroDB from '../database/pomodoro';
import { PomodoroSettings, PomodoroSession } from '../database/pomodoro';
import {
  PomodoroPhase,
  getPhaseDuration,
  getNextPhase,
  getBreakDuration,
} from '../utils/pomodoroHelpers';

const STORAGE_KEY = '@pomodoro_timer_state';

export interface PomodoroTimerState {
  phase: PomodoroPhase;
  sessionNumber: number;
  timeRemaining: number;
  totalDuration: number;
  isActive: boolean;
  isPaused: boolean;
  currentSessionId?: string;
  taskId?: string;
}

interface UsePomodoroTimerReturn {
  state: PomodoroTimerState;
  settings: PomodoroSettings | null;
  startWork: (taskId?: string) => Promise<void>;
  startBreak: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<void>;
  complete: () => Promise<void>;
  skip: () => Promise<void>;
  loadSettings: () => Promise<void>;
  resetTimer: () => void;
  setTaskId: (taskId?: string) => void;
}

export function usePomodoroTimer(): UsePomodoroTimerReturn {
  const [state, setState] = useState<PomodoroTimerState>({
    phase: 'work',
    sessionNumber: 1,
    timeRemaining: 0,
    totalDuration: 0,
    isActive: false,
    isPaused: false,
  });

  const [settings, setSettings] = useState<PomodoroSettings | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Load settings on mount
  const loadSettings = useCallback(async () => {
    try {
      const pomodoroSettings = await pomodoroDB.getPomodoroSettings();
      setSettings(pomodoroSettings);
    } catch (error) {
      console.error('Error loading pomodoro settings:', error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Load persisted state on mount
  useEffect(() => {
    loadPersistedState();
  }, []);

  // Persist state when it changes
  useEffect(() => {
    if (state.isActive || state.isPaused) {
      persistState();
    }
  }, [state]);

  // Timer tick logic
  useEffect(() => {
    if (state.isActive && !state.isPaused && state.timeRemaining > 0) {
      lastTickRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastTickRef.current) / 1000);
        lastTickRef.current = now;

        setState((prev) => {
          const newTimeRemaining = Math.max(0, prev.timeRemaining - elapsed);

          if (newTimeRemaining === 0) {
            handlePhaseComplete();
            return { ...prev, timeRemaining: 0, isActive: false };
          }

          return { ...prev, timeRemaining: newTimeRemaining };
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [state.isActive, state.isPaused, state.timeRemaining]);

  // Persist state to AsyncStorage
  const persistState = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error persisting pomodoro state:', error);
    }
  };

  // Load persisted state from AsyncStorage
  const loadPersistedState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: PomodoroTimerState = JSON.parse(stored);

        // If there's an active session, resume it
        if (parsed.isActive || parsed.isPaused) {
          setState(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading persisted pomodoro state:', error);
    }
  };

  // Clear persisted state
  const clearPersistedState = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing persisted pomodoro state:', error);
    }
  };

  // Handle phase completion
  const handlePhaseComplete = useCallback(async () => {
    if (!settings) return;

    if (state.phase === 'work') {
      // Complete work session
      if (state.currentSessionId) {
        await pomodoroDB.completePomodoroSession(state.currentSessionId);
      }

      // Auto-start break if enabled
      if (settings.autoStartBreaks) {
        startBreak();
      }
    } else {
      // Break completed
      // Auto-start next work session if enabled
      if (settings.autoStartPomodoros) {
        const nextSession = state.phase === 'long_break' ? 1 : state.sessionNumber + 1;
        setState((prev) => ({
          ...prev,
          phase: 'work',
          sessionNumber: nextSession,
        }));
        startWork(state.taskId);
      }
    }
  }, [state, settings]);

  // Start work session
  const startWork = useCallback(
    async (taskId?: string) => {
      if (!settings) {
        console.error('Settings not loaded');
        return;
      }

      const duration = getPhaseDuration('work', settings);
      const breakMinutes = getBreakDuration(state.sessionNumber, settings);

      try {
        // Create database session
        const session = await pomodoroDB.createPomodoroSession({
          taskId,
          sessionNumber: state.sessionNumber,
          durationMinutes: settings.workDuration,
          breakMinutes,
        });

        setState({
          phase: 'work',
          sessionNumber: state.sessionNumber,
          timeRemaining: duration,
          totalDuration: duration,
          isActive: true,
          isPaused: false,
          currentSessionId: session.id,
          taskId,
        });

        lastTickRef.current = Date.now();
      } catch (error) {
        console.error('Error starting work session:', error);
      }
    },
    [settings, state.sessionNumber]
  );

  // Start break
  const startBreak = useCallback(() => {
    if (!settings) return;

    const nextPhase = getNextPhase(state.sessionNumber, settings);
    const duration = getPhaseDuration(nextPhase, settings);

    setState((prev) => ({
      ...prev,
      phase: nextPhase,
      timeRemaining: duration,
      totalDuration: duration,
      isActive: true,
      isPaused: false,
      currentSessionId: undefined,
    }));

    lastTickRef.current = Date.now();
  }, [settings, state.sessionNumber]);

  // Pause timer
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  // Resume timer
  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: false }));
    lastTickRef.current = Date.now();
  }, []);

  // Stop/cancel session
  const stop = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Cancel database session if in work phase
    if (state.phase === 'work' && state.currentSessionId) {
      try {
        await pomodoroDB.cancelPomodoroSession(state.currentSessionId);
      } catch (error) {
        console.error('Error cancelling session:', error);
      }
    }

    setState({
      phase: 'work',
      sessionNumber: 1,
      timeRemaining: 0,
      totalDuration: 0,
      isActive: false,
      isPaused: false,
    });

    await clearPersistedState();
  }, [state]);

  // Complete current phase manually
  const complete = useCallback(async () => {
    if (state.phase === 'work' && state.currentSessionId) {
      try {
        await pomodoroDB.completePomodoroSession(state.currentSessionId);
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }

    handlePhaseComplete();
  }, [state, handlePhaseComplete]);

  // Skip to next phase
  const skip = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (state.phase === 'work' && state.currentSessionId) {
      // Cancel incomplete work session
      await pomodoroDB.cancelPomodoroSession(state.currentSessionId);
    }

    handlePhaseComplete();
  }, [state, handlePhaseComplete]);

  // Reset timer to initial state
  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState({
      phase: 'work',
      sessionNumber: 1,
      timeRemaining: 0,
      totalDuration: 0,
      isActive: false,
      isPaused: false,
    });

    clearPersistedState();
  }, []);

  // Set task ID without starting timer
  const setTaskId = useCallback((taskId?: string) => {
    setState((prev) => ({
      ...prev,
      taskId,
    }));
  }, []);

  return {
    state,
    settings,
    startWork,
    startBreak,
    pause,
    resume,
    stop,
    complete,
    skip,
    loadSettings,
    resetTimer,
    setTaskId,
  };
}
