/**
 * AI Chat Screen
 * Primary interface for interacting with the AI assistant
 * PRODUCTION-READY with proper safe areas and typography
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput as RNTextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  IconButton,
  Text,
  Card,
  ActivityIndicator,
  FAB,
  Chip,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { ChatMessage } from '../../types';
import { aiApi } from '../../services/ai.api';
import { EmptyState } from '../../components/ui';
import { typography, spacing, borderRadius, textStyles, shadows } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

const QUICK_PROMPTS = [
  { id: '1', icon: '✅', label: 'What should I focus on today?', prompt: 'Based on my tasks and schedule, what should I focus on today?' },
  { id: '2', icon: '💪', label: 'Habit streak tips', prompt: 'Give me tips to maintain my habit streaks' },
  { id: '3', icon: '💰', label: 'Budget insights', prompt: 'Analyze my spending patterns and give me budget recommendations' },
  { id: '4', icon: '📅', label: 'Schedule conflicts', prompt: 'Check my calendar for any scheduling conflicts or time management issues' },
  { id: '5', icon: '🎯', label: 'Weekly review', prompt: 'Help me do a weekly review of my tasks, habits, and goals' },
  { id: '6', icon: '⏰', label: 'Time blocking', prompt: 'Suggest a time-blocking schedule for my day based on my tasks' },
];

export default function AIChatScreen() {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await aiApi.chat({
        message: userMessage.content,
        sessionId,
      });

      setSessionId(response.sessionId);
      setMessages((prev) => [...prev, response.message]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    // TODO: Implement voice input in Phase 4
    Alert.alert('Voice Input', 'Voice input will be available in the next update');
  };

  const speakMessage = (text: string) => {
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 1.0,
    });
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        <Card
          style={[
            styles.messageCard,
            isUser ? styles.userMessageCard : styles.assistantMessageCard,
          ]}
        >
          <Card.Content style={styles.messageContent}>
            <Text
              variant="bodyMedium"
              style={isUser ? styles.userMessageText : styles.assistantMessageText}
            >
              {item.content}
            </Text>

            {!isUser && (
              <View style={styles.messageActions}>
                <IconButton
                  icon="volume-high"
                  size={18}
                  iconColor={colors.text.tertiary}
                  onPress={() => speakMessage(item.content)}
                  style={styles.actionButton}
                />
              </View>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <View style={styles.container}>
        {messages.length === 0 ? (
          <ScrollView
            style={styles.emptyScrollView}
            contentContainerStyle={[styles.emptyContainer, { paddingTop: insets.top + spacing.xl }]}
            showsVerticalScrollIndicator={false}
          >
            <EmptyState
              icon="💬"
              title="Hi, I'm Jarvis"
              description="Your AI-powered personal assistant. I can help you manage tasks, track habits, schedule events, plan finances, and organize your life. Ask me anything to get started!"
            />

            {/* Quick Prompts */}
            <View style={styles.quickPromptsContainer}>
              <Text style={styles.quickPromptsTitle}>Quick Prompts</Text>
              <View style={styles.quickPromptsGrid}>
                {QUICK_PROMPTS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.promptCard}
                    onPress={() => handleQuickPrompt(item.prompt)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.promptIcon}>{item.icon}</Text>
                    <Text style={styles.promptLabel} numberOfLines={2}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.messageList, { paddingBottom: spacing.lg }]}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.inputWrapper}>
            <IconButton
              icon="microphone"
              onPress={handleVoiceInput}
              disabled={isLoading}
              iconColor={colors.text.tertiary}
              size={22}
              style={styles.iconButton}
            />
            <RNTextInput
              placeholder="Ask Jarvis anything..."
              placeholderTextColor={colors.text.placeholder}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!isLoading}
              style={styles.input}
              onSubmitEditing={handleSend}
            />
            <IconButton
              icon="send"
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              iconColor={inputText.trim() && !isLoading ? colors.primary.main : colors.text.disabled}
              size={22}
              style={styles.iconButton}
            />
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary.main} />
            <Text variant="bodySmall" style={styles.loadingText}>
              Jarvis is thinking...
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  emptyScrollView: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  quickPromptsContainer: {
    width: '100%',
    marginTop: spacing.xl,
  },
  quickPromptsTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.base,
    paddingHorizontal: spacing.sm,
  },
  quickPromptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  promptCard: {
    width: '45%',
    minWidth: 140,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  promptIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  promptLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: typography.size.sm * 1.4,
  },
  messageList: {
    padding: spacing.lg,
    paddingTop: spacing.base,
  },
  messageContainer: {
    marginBottom: spacing.base,
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageCard: {
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  userMessageCard: {
    backgroundColor: colors.primary.main,
  },
  assistantMessageCard: {
    backgroundColor: colors.background.secondary,
  },
  messageContent: {
    padding: spacing.sm,
  },
  userMessageText: {
    color: colors.primary.contrast,
    fontSize: typography.size.base,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
    fontWeight: typography.weight.regular,
  },
  assistantMessageText: {
    ...textStyles.body,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  actionButton: {
    margin: 0,
  },
  inputContainer: {
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    ...shadows.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.xs,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    color: colors.text.primary,
    fontSize: typography.size.base,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
    fontWeight: typography.weight.regular,
  },
  iconButton: {
    margin: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
  },
  loadingText: {
    ...textStyles.caption,
    marginLeft: spacing.md,
  },
});
