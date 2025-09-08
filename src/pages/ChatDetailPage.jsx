import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { chatService, profileService } from '../services';
import { formatMessageTime, formatDate } from '../utils/dateUtils';

const ChatDetailPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // Load chat data
  useEffect(() => {
    const loadChat = async () => {
      if (!chatId || !user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Get chat info and participants
        const chatInfo = await chatService.getChatInfo(chatId);
        const chatMessages = await chatService.getChatMessages(chatId);

        if (!chatInfo) {
          navigate('/chat');
          return;
        }

        // Get participant profiles
        const participantProfiles = await Promise.all(
          chatInfo.participants.map(async (participantId) => {
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
  }, [chatId, user?.id, navigate]);

  // Scroll to last message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle message sending
  const handleSendMessage = async (e) => {
    e.preventDefault();
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
            <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <i className="fas fa-spinner fa-spin text-3xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Loading Chat</h2>
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
            <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Chat</h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
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
            <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Chat Not Found</h2>
            <p className="text-text-secondary mb-8">The chat you're looking for doesn't exist or has been removed.</p>
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
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
        <button className="header-btn hover:bg-glass-bg hover:scale-110 transition-all duration-200" onClick={() => navigate('/chat')}>
          <i className="fas fa-arrow-left"></i>
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <div className={`w-12 h-12 ${chat?.startup_gradient || 'bg-gradient-to-br from-blue-300 to-blue-700'} rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300`}>
              <span className="text-white font-bold text-lg">
                {chat?.startup_logo || chat?.startup_name?.charAt(0)?.toUpperCase() || 'S'}
              </span>
            </div>
            {/* Online status */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-2 border-bg-primary rounded-full transition-all duration-300 bg-gray-500"></div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-text-primary truncate">{chat?.startup_name || 'Unknown Startup'}</h1>
            <div className="text-sm text-text-secondary">
              <span>Chat about {chat?.startup_name || 'startup'} with {otherParticipant?.full_name || 'Unknown User'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="header-btn hover:bg-glass-bg hover:scale-110 transition-all duration-200" onClick={() => setShowMessageActions(true)}>
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-bg-primary to-bg-secondary">
        {messages.map((message, index) => (
          <div key={message.id} id={`message-${message.id}`} className="mb-4 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <div className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              {message.sender_id === user?.id && (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-300 to-blue-700 rounded-full flex items-center justify-center ml-3 flex-shrink-0 shadow-lg">
                  <span className="text-white text-sm font-bold">YOU</span>
                </div>
              )}

              <div className="max-w-[75%] group">
                {/* Message Bubble */}
                <div
                  className={`relative px-4 py-3 rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer hover:shadow-2xl ${message.sender_id === user?.id
                    ? 'bg-gradient-primary text-white rounded-tr-md shadow-accent-primary/20'
                    : 'bg-bg-secondary/80 border border-glass-border text-text-primary rounded-tl-md hover:bg-bg-secondary'
                    } ${selectedMessages.includes(message.id) ? 'ring-2 ring-accent-primary animate-pulse' : ''}`}
                  onClick={() => handleMessageSelect(message.id)}
                  onDoubleClick={() => handleEmojiReaction('❤️')}
                >
                  {/* Image message - Not implemented yet */}
                  {false && (
                    <div className="mb-3">
                      <div className="w-full h-32 bg-gray-600 rounded-xl flex items-center justify-center">
                        <i className="fas fa-image text-white text-2xl"></i>
                      </div>
                    </div>
                  )}

                  {/* Voice message - Not implemented yet */}
                  {false && (
                    <div className="flex items-center gap-4 mb-2 p-4 bg-black/20 rounded-xl">
                      <button
                        onClick={() => {/* Voice playback not implemented yet */ }}
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 bg-white/20 text-white hover:bg-white/30"
                      >
                        <i className="fas fa-play"></i>
                      </button>
                      <div className="flex-1">
                        <div className="text-sm text-white/80">Voice message</div>
                        <div className="text-xs text-white/60">🎤 Tap to play</div>
                      </div>
                    </div>
                  )}

                  {/* File message - Not implemented yet */}
                  {false && (
                    <div className="flex items-center gap-3 mb-2 p-3 bg-black/20 rounded-xl">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400">
                        <i className="fas fa-file"></i>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">File name</div>
                        <div className="text-xs text-white/70">File size</div>
                      </div>
                    </div>
                  )}

                  {/* Text message */}
                  {message.body && (
                    <p className="mb-2 leading-relaxed">{message.body}</p>
                  )}

                  {/* Message Footer */}
                  <div className={`flex items-center justify-end gap-2 text-xs ${message.sender_id === user?.id ? 'text-white/70' : 'text-text-secondary'
                    }`}>
                    <span>{formatMessageTime(message.created_at)}</span>
                    {message.sender_id === user?.id && (
                      <div className="flex items-center gap-1">
                        <i className="fas fa-check text-blue-400"></i>
                      </div>
                    )}
                  </div>

                  {/* Quick reaction buttons */}
                  <div className="absolute -top-12 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 bg-bg-secondary/95 border border-glass-border rounded-full px-2 py-1 shadow-xl z-10">
                    {['👍', '❤️', '😂', '😮', '📋'].map((emoji) => (
                      <button
                        key={emoji}
                        className="w-8 h-8 hover:bg-bg-secondary rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 text-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (emoji === '📋') {
                            navigator.clipboard.writeText(message.body || '');
                            setSuccessMessage('Message copied to clipboard');
                            setShowSuccessModal(true);
                          } else {
                            handleEmojiReaction(emoji);
                          }
                        }}
                        title={emoji === '📋' ? 'Copy message' : `React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reactions - Not implemented yet */}
                {false && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-2">
                    <div className="flex items-center gap-1 bg-bg-secondary/80 border border-glass-border rounded-full px-2 py-1 text-sm">
                      <span>👍</span>
                      <span className="text-text-secondary">1</span>
                    </div>
                  </div>
                )}
              </div>

              {message.sender_id !== user?.id && (
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-lg">
                  <span className="text-white text-sm font-bold">{otherParticipant?.full_name}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-3 mb-4 animate-fade-in">
            <div className={`w-10 h-10 ${chat.startup.gradient} rounded-full flex items-center justify-center shadow-lg`}>
              <span className="text-white text-sm font-bold">{chat.startup.logo}</span>
            </div>
            <div className="bg-glass-bg border border-glass-border rounded-2xl rounded-tl-none px-4 py-3 shadow-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ChatGPT-Style Message Input */}
      <div className="shrink-0 bg-bg-primary/95 backdrop-blur-xl border-t border-glass-border px-4 py-6">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mb-4 p-4 bg-glass-bg border border-glass-border rounded-2xl shadow-2xl animate-slide-up">
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
                  className="w-10 h-10 hover:bg-glass-border rounded-xl flex items-center justify-center text-xl transition-all duration-200 hover:scale-110 active:scale-95"
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
            <form onSubmit={handleSendMessage} className="flex items-end">
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
                    type="submit"
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-300 to-blue-700 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-blue-700/30 ml-1"
                    title="Send message"
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
          <div className="w-full bg-bg-secondary rounded-t-3xl p-6 space-y-4 animate-slide-up">
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
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${action.danger
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
          <div className="w-full max-w-md bg-bg-secondary rounded-3xl p-6 animate-scale-up shadow-2xl">
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
          <div className="w-full max-w-sm bg-bg-secondary rounded-3xl p-6 animate-scale-up shadow-2xl">
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
          <div className="bg-bg-secondary/90 backdrop-blur-xl border border-glass-border rounded-2xl p-4 shadow-2xl animate-bounce">
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