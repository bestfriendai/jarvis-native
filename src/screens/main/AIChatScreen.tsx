/**
 * AI Chat Screen
 * Primary interface for interacting with the AI assistant
 * PRODUCTION-READY with proper safe areas and typography
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Modal,
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
import { useFocusEffect } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { ChatMessage } from '../../types';
import { aiApi } from '../../services/ai.api';
import { EmptyState } from '../../components/ui';
import { typography, spacing, borderRadius, textStyles, shadows, getColors } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';
import { HIT_SLOP } from '../../constants/ui';
import * as aiChatDB from '../../database/aiChat';
import * as storage from '../../services/storage';

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
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<aiChatDB.AIConversation[]>([]);
  const [showConversationList, setShowConversationList] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  // Load current conversation from storage on mount
  useEffect(() => {
    loadCurrentConversation();
  }, []);

  // Reload conversations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadCurrentConversation = async () => {
    try {
      const savedConvId = await storage.getItem('current_conversation_id');
      if (savedConvId) {
        await loadConversation(savedConvId);
      }
    } catch (error) {
      console.error('Error loading current conversation:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await aiChatDB.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const msgs = await aiChatDB.getConversationMessages(conversationId);
      const chatMessages: ChatMessage[] = msgs.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp,
      }));
      setMessages(chatMessages);
      setCurrentConversationId(conversationId);
      await storage.setItem('current_conversation_id', conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
      Alert.alert('Error', 'Failed to load conversation');
    }
  };

  const startNewConversation = async () => {
    try {
      const newConv = await aiChatDB.createConversation();
      setMessages([]);
      setCurrentConversationId(newConv.id);
      setSessionId(undefined);
      await storage.setItem('current_conversation_id', newConv.id);
      await loadConversations();
    } catch (error) {
      console.error('Error creating new conversation:', error);
      Alert.alert('Error', 'Failed to create new conversation');
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    // Ensure we have a conversation
    let convId = currentConversationId;
    if (!convId) {
      try {
        const newConv = await aiChatDB.createConversation();
        convId = newConv.id;
        setCurrentConversationId(convId);
        await storage.setItem('current_conversation_id', convId);
        await loadConversations();
      } catch (error) {
        console.error('Error creating conversation:', error);
        Alert.alert('Error', 'Failed to create conversation');
        return;
      }
    }

    const userMessageContent = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // Save user message to database
      const userMsg = await aiChatDB.addMessage(convId, 'user', userMessageContent);

      const userMessage: ChatMessage = {
        id: userMsg.id,
        role: 'user',
        content: userMsg.content,
        timestamp: userMsg.timestamp,
      };

      setMessages((prev) => [...prev, userMessage]);

      // Get AI response
      const response = await aiApi.chat({
        message: userMessageContent,
        sessionId,
      });

      setSessionId(response.sessionId);

      // Save assistant message to database
      const assistantMsg = await aiChatDB.addMessage(
        convId,
        'assistant',
        response.message.content
      );

      const assistantMessage: ChatMessage = {
        id: assistantMsg.id,
        role: 'assistant',
        content: assistantMsg.content,
        timestamp: assistantMsg.timestamp,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Reload conversations to update titles/timestamps
      await loadConversations();

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
                hitSlop={HIT_SLOP}
                  style={styles.actionButton}
                />
              </View>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  };

  const handleDeleteConversation = async (convId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await aiChatDB.deleteConversation(convId);
              if (currentConversationId === convId) {
                setMessages([]);
                setCurrentConversationId(null);
                setSessionId(undefined);
                await storage.removeItem('current_conversation_id');
              }
              await loadConversations();
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Alert.alert('Error', 'Failed to delete conversation');
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Create styles based on current theme colors
  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <View style={styles.container}>
        {/* Header with conversation controls */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <IconButton
            icon="history"
            size={24}
            iconColor={colors.text.primary}
            onPress={() => setShowConversationList(true)}
            hitSlop={HIT_SLOP}
          />
          <Text style={styles.headerTitle}>Jarvis AI</Text>
          <IconButton
            icon="plus"
            size={24}
            iconColor={colors.text.primary}
            onPress={startNewConversation}
            hitSlop={HIT_SLOP}
          />
        </View>
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
            
                hitSlop={HIT_SLOP}/>
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
            
                hitSlop={HIT_SLOP}/>
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

        {/* Conversation History Modal */}
        <Modal
          visible={showConversationList}
          transparent
          animationType="slide"
          onRequestClose={() => setShowConversationList(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Conversations</Text>
                <IconButton
                  icon="close"
                  onPress={() => setShowConversationList(false)}
                  iconColor={colors.text.tertiary}
                  hitSlop={HIT_SLOP}
                />
              </View>

              <ScrollView style={styles.conversationList}>
                {conversations.length === 0 ? (
                  <EmptyState
                    icon="💬"
                    title="No conversations yet"
                    description="Start a new conversation to chat with Jarvis"
                  />
                ) : (
                  conversations.map((conv) => {
                    const isActive = conv.id === currentConversationId;
                    return (
                      <TouchableOpacity
                        key={conv.id}
                        style={[
                          styles.conversationItem,
                          isActive && styles.conversationItemActive,
                        ]}
                        onPress={() => {
                          loadConversation(conv.id);
                          setShowConversationList(false);
                        }}
                        onLongPress={() => handleDeleteConversation(conv.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.conversationInfo}>
                          <Text
                            style={[
                              styles.conversationTitle,
                              isActive && styles.conversationTitleActive,
                            ]}
                            numberOfLines={1}
                          >
                            {conv.title}
                          </Text>
                          <Text style={styles.conversationTime}>
                            {formatTimestamp(conv.updatedAt)}
                          </Text>
                        </View>
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor={colors.text.tertiary}
                          onPress={() => handleDeleteConversation(conv.id)}
                          hitSlop={HIT_SLOP}
                        />
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  conversationList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  conversationItemActive: {
    backgroundColor: colors.primary.light,
  },
  conversationInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  conversationTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  conversationTitleActive: {
    color: colors.primary.main,
    fontWeight: typography.weight.semibold,
  },
  conversationTime: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
});
