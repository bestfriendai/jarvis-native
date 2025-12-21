/**
 * StartControls Component
 * Start timer with duration selection and progress tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TextInput, Modal, Animated, Alert } from 'react-native';
import { Button, Text, Card, IconButton } from 'react-native-paper';
import { MacroGoal } from '../database/dashboard';
import { HIT_SLOP } from '../constants/ui';

interface StartControlsProps {
  macroGoals: MacroGoal[];
  defaultDuration?: number;
  onStarted?: () => void;
}

export const StartControls: React.FC<StartControlsProps> = ({
  macroGoals,
  defaultDuration = 10,
  onStarted,
}) => {
  const [microWhy, setMicroWhy] = useState('');
  const [selectedMacroId, setSelectedMacroId] = useState('');
  const [activeStart, setActiveStart] = useState<{ id: string; durationSec: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [progress] = useState(new Animated.Value(0));
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = useCallback(
    (durationSec: number) => {
      if (isStarting || activeStart) return;

      // Offline mode - just start the timer locally
      const id = `start-${Date.now()}`;
      setActiveStart({ id, durationSec });
      setElapsed(0);
      setMicroWhy('');
      setSelectedMacroId('');
      onStarted?.();
    },
    [isStarting, activeStart, onStarted]
  );

  useEffect(() => {
    if (!activeStart) return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 0.1;
        if (next >= activeStart.durationSec) {
          clearInterval(interval);
          setCompletionModalVisible(true);
          setActiveStart(null);
          return activeStart.durationSec;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStart]);

  useEffect(() => {
    if (activeStart) {
      const progressValue = elapsed / activeStart.durationSec;
      Animated.timing(progress, {
        toValue: progressValue,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [elapsed, activeStart, progress]);

  const handleCompletionSubmit = () => {
    // In offline mode, just log and close
    if (completionNote) {
      console.log('[StartControls] Completion note:', completionNote);
    }
    setCompletionModalVisible(false);
    setCompletionNote('');
  };

  const progressPercent = activeStart ? (elapsed / activeStart.durationSec) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text variant="labelSmall" style={styles.label}>
            MICRO WHY
          </Text>
          <TextInput
            value={microWhy}
            onChangeText={setMicroWhy}
            placeholder="Why does this tiny start matter?"
            placeholderTextColor="#64748B"
            style={styles.input}
            editable={!activeStart}
          />
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Button
          mode="contained"
          onPress={() => handleStart(10)}
          disabled={!!activeStart || isStarting}
          style={styles.primaryButton}
          labelStyle={styles.buttonLabel}
        >
          Start 10s
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleStart(60)}
          disabled={!!activeStart || isStarting}
          style={styles.secondaryButton}
          labelStyle={styles.buttonLabel}
        >
          Start 1m
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleStart(1800)}
          disabled={!!activeStart || isStarting}
          style={styles.secondaryButton}
          labelStyle={styles.buttonLabel}
        >
          Start 30m
        </Button>
      </View>

      {activeStart && (
        <Card style={styles.progressCard}>
          <Card.Content style={styles.progressContent}>
            <View style={styles.progressCircle}>
              <Text variant="headlineLarge" style={styles.timerText}>
                {Math.ceil(activeStart.durationSec - elapsed)}s
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
          </Card.Content>
        </Card>
      )}

      <Modal
        visible={completionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCompletionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Capture the afterglow
            </Text>
            <TextInput
              value={completionNote}
              onChangeText={setCompletionNote}
              placeholder="What shifted?"
              placeholderTextColor="#64748B"
              style={styles.modalInput}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  setCompletionModalVisible(false);
                  setCompletionNote('');
                }}
                style={styles.modalButton}
              >
                Skip
              </Button>
              <Button
                mode="contained"
                onPress={handleCompletionSubmit}
                style={styles.modalButton}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  inputRow: {
    gap: 12,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#94A3B8',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 24,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 24,
    borderColor: '#334155',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressCard: {
    backgroundColor: '#1E293B',
    marginTop: 16,
  },
  progressContent: {
    alignItems: 'center',
    gap: 16,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
