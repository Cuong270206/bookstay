import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chatApi } from '../../lib/api';
import { formatTime } from '../../lib/utils';
import { Conversation, Message } from '../../types';

export default function ChatScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      startPolling();
    }
    return () => stopPolling();
  }, [selectedConv]);

  const startPolling = () => {
    pollIntervalRef.current = setInterval(() => {
      if (selectedConv) fetchMessages(selectedConv.id, true);
    }, 5000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await chatApi.getConversations();
      setConversations(res.data.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (bookingId: string, silent = false) => {
    try {
      const res = await chatApi.getMessages(bookingId);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    try {
      const res = await chatApi.sendMessage(selectedConv.id, newMessage.trim());
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.convItem, selectedConv?.id === item.id && styles.convItemActive]}
      onPress={() => setSelectedConv(item)}
    >
      <View style={styles.convAvatar}>
        <Text style={styles.convAvatarText}>
          {item.otherUser?.name?.[0]?.toUpperCase() || 'U'}
        </Text>
      </View>
      <View style={styles.convContent}>
        <View style={styles.convHeader}>
          <Text style={styles.convName}>{item.otherUser?.name}</Text>
          <Text style={styles.convTime}>{formatTime(item.lastMessageAt)}</Text>
        </View>
        <Text style={styles.convTitle} numberOfLines={1}>{item.listingTitle}</Text>
        <Text style={styles.convMessage} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === conversations[0]?.otherUser?.id;
    return (
      <View style={[styles.messageBubble, isOwn ? styles.messageOwn : styles.messageOther]}>
        <Text style={[styles.messageText, isOwn ? styles.messageTextOwn : styles.messageTextOther]}>
          {item.content}
        </Text>
        <Text style={[styles.messageTime, isOwn ? styles.messageTimeOwn : styles.messageTimeOther]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#db2777" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Conversation List */}
      {!selectedConv && (
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Tin nhắn</Text>
          </View>
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
              </View>
            }
          />
        </View>
      )}

      {/* Chat Area */}
      {selectedConv && (
        <View style={styles.chatContainer}>
          {/* Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setSelectedConv(null)}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderName}>{selectedConv.otherUser?.name}</Text>
              <Text style={styles.chatHeaderTitle} numberOfLines={1}>{selectedConv.listingTitle}</Text>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
              </View>
            }
          />

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Nhập tin nhắn..."
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Text style={styles.sendButtonText}>Gửi</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  convItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  convItemActive: {
    backgroundColor: '#fce7f3',
  },
  convAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  convAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  convContent: {
    flex: 1,
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  convName: {
    fontSize: 15,
    fontWeight: '600',
  },
  convTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  convTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  convMessage: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#db2777',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#9ca3af',
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 24,
    marginRight: 12,
    color: '#374151',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
  },
  chatHeaderTitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  messageOwn: {
    alignSelf: 'flex-end',
    backgroundColor: '#db2777',
    borderBottomRightRadius: 4,
  },
  messageOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
  },
  messageTextOwn: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  messageTimeOther: {
    color: '#9ca3af',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#db2777',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
