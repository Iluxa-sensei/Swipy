import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { chatService, profileService } from '../services';
import { formatMessageTime, formatDate } from '../utils/dateUtils';
import Loader from '../components/Loader.jsx';

const ChatDetailPage = () => {
  const { chatId: initialChatId, nickname, startup_name } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [chatId, setChatId] = useState(initialChatId);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Emoji list for picker
  const emojis = ['👍', '👎', '❤️', '🔥', '💯', '😎', '🙌', '👏', '💪', '🚀', '🎉', '✨'];

  // Helper function to check if string is a valid UUID
  const isValidUUID = (str) => {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Initial ID resolution if nickname/startup_name is used
  useEffect(() => {
    const resolveChatId = async () => {
      // If initialChatId is not a valid UUID, treat it as nickname
      if (initialChatId && !isValidUUID(initialChatId)) {
        // This looks like a nickname or slug, handle it as nickname
        if (user?.id) {
          setLoading(true);
          try {
            const resolvedId = await chatService.getChatByPrettyParams(user.id, initialChatId, startup_name);
            if (resolvedId) {
              setChatId(resolvedId);
            } else {
              setError('Could not find or create this chat.');
              setLoading(false);
            }
          } catch (err) {
            console.error('Error resolving chat ID:', err);
            setError('Failed to load chat details.');
            setLoading(false);
          }
        }
        return;
      }

      // If it's a valid UUID, use it directly
      if (initialChatId && isValidUUID(initialChatId)) {
        setChatId(initialChatId);
        return;
      }

      // If we have nickname, use it
      if (nickname && user?.id) {
        setLoading(true);
        try {
          const resolvedId = await chatService.getChatByPrettyParams(user.id, nickname, startup_name);
          if (resolvedId) {
            setChatId(resolvedId);
          } else {
            setError('Could not find or create this chat.');
            setLoading(false);
          }
        } catch (err) {
          console.error('Error resolving chat ID:', err);
          setError('Failed to load chat details.');
          setLoading(false);
        }
      }
    };

    resolveChatId();
  }, [initialChatId, nickname, startup_name, user?.id]);

  // Load chat data
  useEffect(() => {
    const loadChat = async () => {
      if (!chatId || !user?.id) return;

      // Don't try to load if chatId is not a valid UUID (still resolving)
      if (!isValidUUID(chatId)) {
        console.log('ChatId is not a valid UUID yet, waiting for resolution:', chatId);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get chat info and participants
        console.log('Loading chat info for chatId:', chatId)
        let chatInfo = await chatService.getChatInfo(chatId);

        if (!chatInfo) {
          console.warn('Chat info is null for chatId:', chatId, '- retrying...')
          // Try to wait a bit and retry once (chat might still be creating)
          await new Promise(resolve => setTimeout(resolve, 1000))
          chatInfo = await chatService.getChatInfo(chatId)

          if (!chatInfo) {
            console.error('Chat still not found after retry for chatId:', chatId)
            setError(`Chat not found. Chat ID: ${chatId}`)
            return
          }
          console.log('Chat found on retry:', chatInfo)
        }

        console.log('Chat info loaded:', chatInfo)

        if (!chatInfo.participants || chatInfo.participants.length === 0) {
          console.error('Chat has no participants:', chatInfo)
          setError('Chat has no participants')
          return
        }

        const chatMessages = await chatService.getChatMessages(chatId);
        console.log('Chat messages loaded:', chatMessages.length)

        // Get participant profiles
        const participantProfiles = await Promise.all(
          (chatInfo.participants || []).map(async (participantId) => {
            if (participantId === user.id) {
              return { id: user.id, full_name: user.user_metadata?.full_name || 'You' };
            }
            const profile = await profileService.getProfile(participantId);
            return profile || { id: participantId, full_name: 'Unknown User' };
          })
        );

        setChat(chatInfo);
        setMessages(chatMessages);
        setParticipants(participantProfiles);

      } catch (err) {
        console.error('Error loading chat:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [chatId, user?.id]);

  // Scroll to last message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle message sending
  const handleSendMessage = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newMessage.trim() || !user?.id || !chatId) return;

    try {
      setSending(true);

      // Send message to Supabase
      const message = await chatService.sendMessage(chatId, user.id, newMessage.trim());

      // Add message to local state
      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Scroll to bottom
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.id || !chatId) return;

    try {
      setSending(true);

      // For now, we'll just send a text message about the file
      // In a real app, you'd upload to Supabase Storage first
      const message = await chatService.sendMessage(
        chatId,
        user.id,
        `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
      );

      setMessages(prev => [...prev, message]);

    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle emoji reaction
  const handleEmojiReaction = (emoji) => {
    setShowEmojiPicker(false);
    // In a real app, you'd save reactions to Supabase
    console.log('Emoji reaction:', emoji);
  };

  // Handle message selection
  const handleMessageSelect = (messageId) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  // Handle message actions
  const handleMessageAction = (action) => {
    if (selectedMessages.length === 0) return;

    switch (action) {
      case 'delete':
        setConfirmAction({ type: 'delete', message: 'Delete selected messages?' });
        setShowConfirmModal(true);
        break;
      case 'copy':
        const selectedText = messages
          .filter(msg => selectedMessages.includes(msg.id))
          .map(msg => msg.body)
          .join('\n');
        navigator.clipboard.writeText(selectedText);
        setSuccessMessage('Messages copied to clipboard');
        setShowSuccessModal(true);
        break;
      default:
        break;
    }
    setShowMessageActions(false);
    setSelectedMessages([]);
  };

  // Confirm action
  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'delete') {
        // In a real app, you'd delete messages from Supabase
        setMessages(prev => prev.filter(msg => !selectedMessages.includes(msg.id)));
        setSuccessMessage('Messages deleted successfully');
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error('Error performing action:', err);
      setError('Failed to perform action. Please try again.');
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
      setSelectedMessages([]);
    }
  };

  // Search messages
  const searchMessages = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results = messages.filter(msg =>
      msg.body.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
  };

  // Get other participant (not current user)
  const otherParticipant = participants.find(p => p.id !== user?.id);
  const chatName = chat?.startup_name || otherParticipant?.full_name || otherParticipant?.username || 'Unknown';
  const chatAvatar = chat?.startup_logo || otherParticipant?.avatar_url;
  const chatGradient = chat?.startup_gradient || 'bg-gradient-to-br from-blue-300 to-blue-700';

  // Group messages by date (Copied from desktop version for consistency)
  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    msgs.forEach((message) => {
      const messageDate = formatDate(message.created_at);
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  // Copy message function
  const copyMessage = (message) => {
    navigator.clipboard.writeText(message.body || '');
    setSuccessMessage('Message copied to clipboard');
    setShowSuccessModal(true);
  };

  // Scroll to message function
  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-message');
      setTimeout(() => element.classList.remove('highlight-message'), 3000);
      setShowSearchModal(false);
    }
  };

  // Realtime: subscribe to new messages in this chat
  useEffect(() => {
    if (!chatId) return;

    console.log('Setting up realtime subscription for chat:', chatId);

    const channel = chatService.subscribeToMessages(chatId, async (payload) => {
      if (payload.eventType === 'INSERT') {
        const newMsg = payload.new;
        console.log('Realtime message received:', newMsg);
        
        // Don't add if it's from the current user (we already added it locally)
        // or if it already exists in messages
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
            console.log('Message already exists, skipping');
            return prev;
          }
          
          // Try to find the sender profile from participants
          const senderProfile = participants.find(p => p.id === newMsg.sender_id);
          const messageWithProfile = {
            ...newMsg,
            profiles: senderProfile || null
          };
          
          console.log('Adding new realtime message to state');
          return [...prev, messageWithProfile];
        });

        // Scroll to bottom after new message
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    });

    return () => {
      console.log('Cleaning up realtime subscription for chat:', chatId);
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    };
  }, [chatId, participants]);

  // Show loading state
  if (loading) {
    return (
      <div className="screen active">
        <div className="header">
          <button className="header-btn" onClick={() => navigate('/chat')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Loading...</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader />
            <h2 className="text-2xl font-bold text-text-primary mt-4 mb-4">Loading Chat</h2>
            <p className="text-text-secondary">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="screen active">
        <div className="header">
          <button className="header-btn" onClick={() => navigate('/chat')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Error</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="state-icon state-icon-red">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Chat</h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <button
              className="btn-icon-style px-8 py-3 rounded-2xl font-semibold"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show chat not found
  if (!chat) {
    return (
      <div className="screen active">
        <div className="header">
          <button className="header-btn" onClick={() => navigate('/chat')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Chat Not Found</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="state-icon state-icon-red">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Chat Not Found</h2>
            <p className="text-text-secondary mb-8">The chat you're looking for doesn't exist or has been removed.</p>
            <button
              className="btn-icon-style px-8 py-3 rounded-2xl font-semibold"
              onClick={() => navigate('/chat')}
            >
              Back to Chats
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen active chat-detail flex flex-col h-full">
      {/* Enhanced Chat Header */}
      <div className="header shrink-0 bg-bg-primary/95 backdrop-blur-xl border-b border-glass-border/50 shadow-lg">
        <button className="header-btn hover:bg-glass-bg transition-all duration-200" onClick={() => navigate('/chat')}>
          <i className="fas fa-arrow-left"></i>
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <div className={`w-10 h-10 ${chatGradient} rounded-xl flex items-center justify-center shadow-lg`}>
              {chatAvatar ? (
                <img src={chatAvatar} alt={chatName} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <span className="text-white font-bold text-base">
                  {chatName?.charAt(0)?.toUpperCase() || 'S'}
                </span>
              )}
            </div>
            {/* Online status indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-bg-primary rounded-full bg-accent-secondary"></div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-text-primary truncate">{chatName}</h1>
            <div className="text-xs text-text-secondary truncate">
              {chat?.startup_name ? `Chat about ${chat.startup_name}` : 'Direct Message'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="header-btn hover:bg-glass-bg transition-all duration-200" onClick={() => setShowMessageActions(true)}>
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-bg-primary to-bg-secondary space-y-6">
        {messageGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <div className="w-16 h-16 bg-glass-bg rounded-2xl flex items-center justify-center mb-4">
              <i className="fas fa-comments text-2xl text-text-secondary"></i>
            </div>
            <p className="text-text-secondary">No messages yet</p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-6">
                <div className="px-4 py-1 bg-bg-secondary/50 border border-glass-border rounded-full text-[10px] uppercase tracking-wider text-text-secondary">
                  {group.date}
                </div>
              </div>

              {/* Messages in group */}
              <div className="space-y-4">
                {group.messages.map((message, index) => {
                  const isOwnMessage = message.sender_id === user?.id;
                  const senderProfile = participants.find(p => p.id === message.sender_id);
                  const showSenderInfo = index === 0 || group.messages[index - 1]?.sender_id !== message.sender_id;

                  return (
                    <div 
                      key={message.id} 
                      id={`message-${message.id}`} 
                      className={`flex items-end gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar for received messages */}
                      {!isOwnMessage ? (
                        <div className="flex-shrink-0 mb-1">
                          {showSenderInfo ? (
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">
                              {senderProfile?.avatar_url ? (
                                <img src={senderProfile.avatar_url} alt={senderProfile.full_name} className="w-full h-full rounded-lg object-cover" />
                              ) : (
                                <span>{(senderProfile?.full_name || 'U')?.[0]?.toUpperCase()}</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-8"></div>
                          )}
                        </div>
                      ) : (
                        <div className="w-2"></div>
                      )}

                      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[80%]`}>
                        {/* Sender Name */}
                        {!isOwnMessage && showSenderInfo && (
                          <span className="text-[10px] font-semibold text-text-secondary mb-1 ml-1 uppercase tracking-wide">
                            {senderProfile?.full_name || senderProfile?.username || 'User'}
                          </span>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${
                            isOwnMessage
                              ? 'bg-gradient-primary text-white rounded-br-none'
                              : 'bg-bg-tertiary border border-glass-border text-text-primary rounded-bl-none'
                          } ${selectedMessages.includes(message.id) ? 'ring-2 ring-accent-primary' : ''}`}
                          onClick={() => handleMessageSelect(message.id)}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.body}</p>
                          
                          <div className={`flex items-center justify-end gap-1.5 mt-1 text-[9px] ${
                            isOwnMessage ? 'text-white/60' : 'text-text-secondary'
                          }`}>
                            <span>{formatMessageTime(message.created_at)}</span>
                            {isOwnMessage && <i className="fas fa-check"></i>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* ChatGPT-Style Message Input */}
      <div className="shrink-0 bg-bg-primary/95 backdrop-blur-xl border-t border-glass-border px-4 py-6">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mb-4 p-4 bg-glass-bg border border-glass-border rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-text-primary font-medium">Emojis</h3>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="w-8 h-8 rounded-full hover:bg-glass-border flex items-center justify-center text-text-secondary transition-all duration-200"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  className="w-10 h-10 hover:bg-glass-border rounded-xl flex items-center justify-center text-xl transition-all duration-200"
                  onClick={() => {
                    setNewMessage(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Input Container */}
        <div className="bg-bg-secondary/80 border border-glass-border/50 rounded-3xl shadow-2xl overflow-hidden">
          {sending ? (
            /* Recording Interface */
            <div className="flex items-center p-4">
              <div className="flex-1 bg-red-500/20 border border-red-500/30 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-500 font-semibold">Recording...</span>
                  <span className="text-red-400 font-mono">{formatTime(recordingTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    onClick={stopRecording}
                    title="Stop recording"
                  >
                    <i className="fas fa-stop text-sm"></i>
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    onClick={cancelRecording}
                    title="Cancel recording"
                  >
                    <i className="fas fa-times text-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Normal Input Interface */
            <form onSubmit={handleSendMessage} className="flex items-end" noValidate>
              {/* Left Actions */}
              <div className="flex items-center p-2">
                <button
                  type="button"
                  className="w-10 h-10 rounded-2xl bg-transparent hover:bg-bg-secondary/50 flex items-center justify-center text-text-primary hover:text-accent-primary transition-all duration-200 hover:scale-105 active:scale-95"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                >
                  <i className="fas fa-plus text-lg"></i>
                </button>
              </div>

              {/* Message Input */}
              <div className="flex-1 py-3">
                <textarea
                  className="w-full bg-transparent outline-none text-text-primary resize-none min-h-[28px] max-h-32 leading-7 text-base placeholder-text-secondary px-2"
                  placeholder="Message..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    // Auto-resize textarea
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  rows="1"
                  style={{ height: '28px' }}
                />
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-1 p-2">
                {/* Emoji Button */}
                <button
                  type="button"
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${showEmojiPicker
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'bg-transparent hover:bg-bg-secondary/50 text-text-primary hover:text-accent-primary'
                    }`}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Add emoji"
                >
                  <i className="far fa-smile text-lg"></i>
                </button>

                {/* Voice Button - Not implemented yet */}
                <button
                  type="button"
                  className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent hover:bg-bg-secondary/50 text-text-primary hover:text-accent-primary"
                  onClick={() => console.log('Voice recording not implemented')}
                  title="Voice message (not implemented)"
                >
                  <i className="fas fa-microphone text-lg"></i>
                </button>

                {/* Send Button */}
                {newMessage.trim() ? (
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    className="w-10 h-10 rounded-2xl btn-icon-style flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ml-1"
                    title="Send message"
                    disabled={sending}
                  >
                    <i className="fas fa-paper-plane text-lg"></i>
                  </button>
                ) : (
                  <div className="w-10 h-10 ml-1"></div>
                )}
              </div>
            </form>
          )}
        </div>


      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileUpload}
      />

      {/* Message Actions Modal */}
      {showMessageActions && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowMessageActions(false)}>
          <div className="w-full bg-bg-secondary rounded-t-3xl p-6 space-y-4">
            <div className="w-12 h-1 bg-glass-border rounded-full mx-auto mb-4"></div>

            {[
              { icon: 'fas fa-search', label: 'Search in conversation', action: () => setShowSearchModal(true) },
              { icon: 'fas fa-bell', label: 'Mute notifications', action: () => console.log('Mute not implemented') },
              { icon: 'fas fa-star', label: 'Add to favorites', action: () => console.log('Favorites not implemented') },
              { icon: 'fas fa-archive', label: 'Archive chat', action: () => console.log('Archive not implemented') },
              { icon: 'fas fa-trash', label: 'Delete chat', action: () => console.log('Delete not implemented'), danger: true },
            ].map((action) => (
              <button
                key={action.label}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${action.danger
                  ? 'hover:bg-red-500/20 text-red-400'
                  : 'hover:bg-glass-bg text-text-primary'
                  }`}
                onClick={() => {
                  action.action();
                  setShowMessageActions(false);
                }}
              >
                <i className={action.icon}></i>
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-bg-secondary rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-primary">Search Messages</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="w-8 h-8 rounded-full hover:bg-glass-bg flex items-center justify-center text-text-secondary transition-all duration-200"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search in conversation..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchMessages();
                }}
                className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                autoFocus
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <i className="fas fa-search text-text-secondary"></i>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-2">
                <p className="text-text-secondary text-sm mb-2">Found {searchResults.length} messages:</p>
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 bg-glass-bg rounded-xl cursor-pointer hover:bg-glass-border transition-all duration-200"
                    onClick={() => scrollToMessage(result.id)}
                  >
                    <div className="text-text-primary text-sm">{result.body}</div>
                    <div className="text-text-secondary text-xs mt-1">{formatMessageTime(result.created_at)}</div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8">
                <i className="fas fa-search text-4xl text-text-secondary mb-2"></i>
                <p className="text-text-secondary">No messages found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-bg-secondary rounded-3xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl text-red-400"></i>
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Confirm Action</h3>
              <p className="text-text-secondary">{confirmAction.message}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 px-4 bg-glass-bg text-text-primary rounded-xl font-medium hover:bg-glass-border transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all duration-200"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-bg-secondary/90 backdrop-blur-xl border border-glass-border rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-green-400"></i>
              </div>
              <span className="text-text-primary font-medium">{successMessage}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatDetailPage;