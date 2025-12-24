/**
 * AI Chat Database Operations
 * CRUD operations for AI conversations and messages with offline-first support
 */

import {
  generateId,
  getCurrentTimestamp,
  executeQuery,
  executeQuerySingle,
  executeWrite,
} from './index';

export interface AIConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  synced: boolean;
}

interface ConversationRow {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  synced: number;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  timestamp: string;
  synced: number;
}

/**
 * Convert database row to AIConversation object
 */
function rowToConversation(row: ConversationRow): AIConversation {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    synced: row.synced === 1,
  };
}

/**
 * Convert database row to AIMessage object
 */
function rowToMessage(row: MessageRow): AIMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as 'user' | 'assistant',
    content: row.content,
    timestamp: row.timestamp,
    synced: row.synced === 1,
  };
}

/**
 * Generate conversation title from first user message
 * Takes first 50 characters of the message
 */
function generateConversationTitle(firstMessage: string): string {
  const maxLength = 50;
  if (firstMessage.length <= maxLength) {
    return firstMessage;
  }
  return firstMessage.substring(0, maxLength) + '...';
}

/**
 * Get all conversations ordered by most recent
 */
export async function getConversations(): Promise<AIConversation[]> {
  const sql = 'SELECT * FROM ai_conversations ORDER BY updated_at DESC';
  const rows = await executeQuery<ConversationRow>(sql);
  return rows.map(rowToConversation);
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(id: string): Promise<AIConversation | null> {
  const sql = 'SELECT * FROM ai_conversations WHERE id = ?';
  const row = await executeQuerySingle<ConversationRow>(sql, [id]);
  return row ? rowToConversation(row) : null;
}

/**
 * Create a new conversation
 */
export async function createConversation(title?: string): Promise<AIConversation> {
  const id = generateId();
  const now = getCurrentTimestamp();
  const conversationTitle = title || 'New Conversation';

  const sql = `
    INSERT INTO ai_conversations (
      id, title, created_at, updated_at, synced
    ) VALUES (?, ?, ?, ?, 0)
  `;

  await executeWrite(sql, [id, conversationTitle, now, now]);

  const conversation = await getConversation(id);
  if (!conversation) {
    throw new Error('Failed to create conversation');
  }

  return conversation;
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  id: string,
  title: string
): Promise<AIConversation> {
  const now = getCurrentTimestamp();

  const sql = `
    UPDATE ai_conversations
    SET title = ?, updated_at = ?, synced = 0
    WHERE id = ?
  `;

  await executeWrite(sql, [title, now, id]);

  const conversation = await getConversation(id);
  if (!conversation) {
    throw new Error('Conversation not found after update');
  }

  return conversation;
}

/**
 * Update conversation's updated_at timestamp
 * Called when new messages are added
 */
export async function touchConversation(id: string): Promise<void> {
  const now = getCurrentTimestamp();

  const sql = `
    UPDATE ai_conversations
    SET updated_at = ?, synced = 0
    WHERE id = ?
  `;

  await executeWrite(sql, [now, id]);
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(id: string): Promise<void> {
  // Messages will be deleted automatically via CASCADE
  const sql = 'DELETE FROM ai_conversations WHERE id = ?';
  await executeWrite(sql, [id]);
}

/**
 * Get all messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string
): Promise<AIMessage[]> {
  const sql = `
    SELECT * FROM ai_messages
    WHERE conversation_id = ?
    ORDER BY timestamp ASC
  `;

  const rows = await executeQuery<MessageRow>(sql, [conversationId]);
  return rows.map(rowToMessage);
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<AIMessage> {
  const id = generateId();
  const now = getCurrentTimestamp();

  const sql = `
    INSERT INTO ai_messages (
      id, conversation_id, role, content, timestamp, synced
    ) VALUES (?, ?, ?, ?, ?, 0)
  `;

  await executeWrite(sql, [id, conversationId, role, content, now]);

  // Update conversation's updated_at timestamp
  await touchConversation(conversationId);

  // If this is the first user message, update conversation title
  const messages = await getConversationMessages(conversationId);
  const userMessages = messages.filter(m => m.role === 'user');

  if (userMessages.length === 1 && role === 'user') {
    const title = generateConversationTitle(content);
    await updateConversationTitle(conversationId, title);
  }

  const sql2 = 'SELECT * FROM ai_messages WHERE id = ?';
  const row = await executeQuerySingle<MessageRow>(sql2, [id]);

  if (!row) {
    throw new Error('Failed to create message');
  }

  return rowToMessage(row);
}

/**
 * Get message count for a conversation
 */
export async function getMessageCount(conversationId: string): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count FROM ai_messages
    WHERE conversation_id = ?
  `;

  const result = await executeQuerySingle<{ count: number }>(sql, [conversationId]);
  return result?.count || 0;
}

/**
 * Delete all messages in a conversation (but keep the conversation)
 */
export async function clearConversationMessages(conversationId: string): Promise<void> {
  const sql = 'DELETE FROM ai_messages WHERE conversation_id = ?';
  await executeWrite(sql, [conversationId]);

  // Update conversation timestamp
  await touchConversation(conversationId);
}

/**
 * Search conversations by title
 */
export async function searchConversations(query: string): Promise<AIConversation[]> {
  const sql = `
    SELECT * FROM ai_conversations
    WHERE title LIKE ?
    ORDER BY updated_at DESC
    LIMIT 20
  `;

  const searchParam = `%${query}%`;
  const rows = await executeQuery<ConversationRow>(sql, [searchParam]);
  return rows.map(rowToConversation);
}

export default {
  getConversations,
  getConversation,
  createConversation,
  updateConversationTitle,
  deleteConversation,
  getConversationMessages,
  addMessage,
  getMessageCount,
  clearConversationMessages,
  searchConversations,
};
