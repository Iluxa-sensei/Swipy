import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatById, formatMessageTime, formatMessageDate } from '../data/chats';

const ChatDetailPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chat, setChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Emoji list for picker
  const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯', '😎', '🙌', '👏', '💪', '🚀', '🎉', '✨'];

  // Загружаем данные чата
  useEffect(() => {
    const timer = setTimeout(() => {
      const chatData = getChatById(chatId);
      if (chatData) {
        // Добавляем дополнительные свойства к сообщениям
        const enhancedChat = {
          ...chatData,
          messages: chatData.messages.map((msg, index) => ({
            ...msg,
            reactions: index % 3 === 0 ? [{ emoji: '👍', users: ['user1'], count: 1 }] : [],
            isRead: msg.sender === 'user' ? true : Math.random() > 0.3,
            status: msg.sender === 'user' ? (Math.random() > 0.5 ? 'delivered' : 'read') : null
          }))
        };
        setChat(enhancedChat);
      } else {
        navigate('/chat');
      }
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [chatId, navigate]);

  // Симуляция набора текста
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(prev => Math.random() > 0.8 ? !prev : prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  // Очистка аудио при размонтировании
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      setAudioProgress(0);
    };
  }, [currentAudio]);

  // Обработка отправки сообщения
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    // Создаем новое сообщение
    const newMessageObj = {
      id: chat.messages.length + 1,
      text: newMessage,
      timestamp: new Date().toISOString(),
      sender: 'user',
      reactions: [],
      isRead: false,
      status: 'sending'
    };

    // Обновляем чат с новым сообщением
    setChat({
      ...chat,
      messages: [...chat.messages, newMessageObj]
    });

    // Очищаем поле ввода
    setNewMessage('');

    // Симуляция доставки
    setTimeout(() => {
      setChat(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === newMessageObj.id
            ? { ...msg, status: 'delivered' }
            : msg
        )
      }));
    }, 1000);

    // Симуляция прочтения
    setTimeout(() => {
      setChat(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === newMessageObj.id
            ? { ...msg, status: 'read' }
            : msg
        )
      }));
    }, 3000);
  };

  // Добавление реакции
  const addReaction = (messageId, emoji) => {
    setChat(prev => ({
      ...prev,
      messages: prev.messages.map(msg => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions.find(r => r.emoji === emoji);
          if (existingReaction) {
            // Toggle reaction
            return {
              ...msg,
              reactions: msg.reactions.filter(r => r.emoji !== emoji)
            };
          } else {
            // Add reaction
            return {
              ...msg,
              reactions: [...msg.reactions, { emoji, users: ['current-user'], count: 1 }]
            };
          }
        }
        return msg;
      })
    }));
  };

  // Выбор сообщения
  const toggleMessageSelection = (messageId) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  // Показать успешное сообщение
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2000);
  };

  // Показать подтверждение
  const showConfirm = (message, action) => {
    setConfirmAction({ message, action });
    setShowConfirmModal(true);
  };

  // Обработка файлов
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Проверка размера файла (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showSuccess('❌ Файл слишком большой. Максимальный размер: 5MB');
      return;
    }

    // Создаем URL для файла
    const fileUrl = URL.createObjectURL(file);

    const fileMessage = {
      id: chat.messages.length + 1,
      text: file.type.startsWith('image/') ? '' : `📎 ${file.name}`,
      timestamp: new Date().toISOString(),
      sender: 'user',
      reactions: [],
      isRead: false,
      status: 'sending',
      fileType: file.type.startsWith('image/') ? 'image' : 'file',
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(1) + ' KB',
      fileUrl: fileUrl
    };

    setChat(prev => ({
      ...prev,
      messages: [...prev.messages, fileMessage]
    }));

    // Симуляция загрузки
    setTimeout(() => {
      setChat(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === fileMessage.id
            ? { ...msg, status: 'delivered' }
            : msg
        )
      }));
    }, 1500);
  };

  // Обработка голосового сообщения
  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      // Создаем голосовое сообщение
      const voiceMessage = {
        id: chat.messages.length + 1,
        text: '',
        timestamp: new Date().toISOString(),
        sender: 'user',
        reactions: [],
        isRead: false,
        status: 'delivered',
        fileType: 'voice',
        duration: '0:05',
        isPlaying: false
      };

      setChat(prev => ({
        ...prev,
        messages: [...prev.messages, voiceMessage]
      }));
    } else {
      setIsRecording(true);
      // Останавливаем запись через 5 секунд
      setTimeout(() => {
        if (isRecording) {
          handleVoiceRecord();
        }
      }, 5000);
    }
  };

  // Поиск в чате
  const handleSearchInChat = () => {
    setShowSearchModal(true);
  };

  // Выполнить поиск
  const performSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const foundMessages = chat.messages.filter(msg =>
      msg.text.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(msg => ({
      ...msg,
      highlightedText: msg.text.replace(
        new RegExp(searchQuery, 'gi'),
        match => `<mark class="bg-yellow-300 text-black">${match}</mark>`
      )
    }));

    setSearchResults(foundMessages);
  };

  // Прокрутить к сообщению
  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-message');
      setTimeout(() => element.classList.remove('highlight-message'), 3000);
      setShowSearchModal(false);
    }
  };

  // Отключение уведомлений
  const toggleMute = () => {
    setIsMuted(!isMuted);
    showSuccess(isMuted ? '🔔 Уведомления включены' : '🔕 Уведомления отключены');
  };

  // Добавление в избранное
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    showSuccess(isFavorite ? '💔 Удалено из избранного' : '⭐ Добавлено в избранное');
  };

  // Архивирование чата
  const archiveChat = () => {
    showConfirm('Архивировать этот чат?', () => {
      // Сохраняем в localStorage
      const archivedChats = JSON.parse(localStorage.getItem('archivedChats') || '[]');
      archivedChats.push({ ...chat, archivedAt: new Date().toISOString() });
      localStorage.setItem('archivedChats', JSON.stringify(archivedChats));

      showSuccess('📁 Чат архивирован');
      setTimeout(() => navigate('/chat'), 1000);
    });
  };

  // Воспроизведение голосового сообщения
  const toggleVoicePlayback = (messageId) => {
    // Останавливаем текущее воспроизведение
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setAudioProgress(0);
    }

    setChat(prev => ({
      ...prev,
      messages: prev.messages.map(msg => {
        if (msg.fileType === 'voice') {
          const isThisMessage = msg.id === messageId;
          const shouldPlay = isThisMessage && !msg.isPlaying;

          if (shouldPlay) {
            // Создаем новый аудио элемент для симуляции
            const audio = new Audio();
            // Используем простой звуковой сигнал
            audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
            audio.volume = 0.5;

            setCurrentAudio(audio);

            // Начинаем воспроизведение
            audio.play().catch(error => {
              console.log('Audio play failed:', error);
              // Если воспроизведение не удалось, просто симулируем
              setAudioProgress(0);
              const progressInterval = setInterval(() => {
                setAudioProgress(prev => {
                  if (prev >= 100) {
                    clearInterval(progressInterval);
                    setChat(prevChat => ({
                      ...prevChat,
                      messages: prevChat.messages.map(m => ({
                        ...m,
                        isPlaying: false
                      }))
                    }));
                    setCurrentAudio(null);
                    return 0;
                  }
                  return prev + 2;
                });
              }, 100);
            });

            // Анимация прогресса
            setAudioProgress(0);
            const progressInterval = setInterval(() => {
              setAudioProgress(prev => {
                if (prev >= 100) {
                  clearInterval(progressInterval);
                  setChat(prevChat => ({
                    ...prevChat,
                    messages: prevChat.messages.map(m => ({
                      ...m,
                      isPlaying: false
                    }))
                  }));
                  setCurrentAudio(null);
                  return 0;
                }
                return prev + 2;
              });
            }, 100);
          }

          return {
            ...msg,
            isPlaying: isThisMessage ? shouldPlay : false
          };
        }
        return msg;
      })
    }));
  };

  // Удаление чата
  const deleteChat = () => {
    showConfirm('Удалить этот чат? Это действие нельзя отменить.', () => {
      showSuccess('🗑️ Чат удален');
      setTimeout(() => navigate('/chat'), 1000);
    });
  };

  // Копирование сообщения
  const copyMessage = (message) => {
    let textToCopy = message.text;

    if (message.fileType === 'image') {
      textToCopy = '📷 Изображение';
    } else if (message.fileType === 'voice') {
      textToCopy = '🎤 Голосовое сообщение';
    } else if (message.fileType === 'file') {
      textToCopy = `📎 ${message.fileName}`;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      showSuccess('📋 Сообщение скопировано');
    });
  };

  // Группировка сообщений по дате
  const groupMessagesByDate = (messages) => {
    const groups = {};

    messages.forEach(message => {
      const date = formatMessageDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages
    }));
  };

  if (loading) {
    return (
      <div className="screen active flex flex-col">
        <div className="header">
          <button className="header-btn" onClick={() => navigate('/chat')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Loading...</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse">
            <i className="fas fa-spinner fa-spin text-4xl text-accent-primary"></i>
          </div>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="screen active flex flex-col">
        <div className="header">
          <button className="header-btn" onClick={() => navigate('/chat')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Chat not found</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
            <p className="text-text-secondary">Chat not found or has been deleted</p>
          </div>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(chat.messages);

  return (
    <div className="screen active chat-detail flex flex-col h-full">
      {/* Enhanced Chat Header */}
      <div className="header shrink-0 bg-bg-primary/95 backdrop-blur-xl border-b border-glass-border/50 shadow-lg">
        <button className="header-btn hover:bg-glass-bg hover:scale-110 transition-all duration-200" onClick={() => navigate('/chat')}>
          <i className="fas fa-arrow-left"></i>
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <div className={`w-12 h-12 ${chat.startup.gradient} rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300`}>
              <span className="text-white font-bold text-lg">{chat.startup.logo}</span>
            </div>
            {/* Online status */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-bg-primary rounded-full transition-all duration-300 ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
              }`}></div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-text-primary truncate">{chat.startup.name}</h1>
            <div className="text-sm text-text-secondary">
              {isTyping ? (
                <div className="flex items-center gap-2 text-accent-primary">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-accent-primary rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>typing...</span>
                </div>
              ) : isOnline ? (
                <span className="text-green-400">Online</span>
              ) : (
                <span>Last seen 2h ago</span>
              )}
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
        {messageGroups.map((group, groupIndex) => (
          <div key={group.date} className="mb-6">
            {/* Date Separator */}
            <div className="flex justify-center mb-6">
              <div className="bg-glass-bg/80 backdrop-blur-sm border border-glass-border px-6 py-3 rounded-full text-sm text-text-secondary font-medium shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                {group.date}
              </div>
            </div>

            {/* Messages */}
            {group.messages.map((message, index) => (
              <div key={message.id} id={`message-${message.id}`} className="mb-4 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.sender === 'startup' && (
                    <div className={`w-10 h-10 ${chat.startup.gradient} rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-lg`}>
                      <span className="text-white text-sm font-bold">{chat.startup.logo}</span>
                    </div>
                  )}

                  <div className="max-w-[75%] group">
                    {/* Message Bubble */}
                    <div
                      className={`relative px-4 py-3 rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer hover:shadow-2xl ${message.sender === 'user'
                        ? 'bg-gradient-primary text-white rounded-tr-md shadow-accent-primary/20'
                        : 'bg-bg-secondary/80 border border-glass-border text-text-primary rounded-tl-md hover:bg-bg-secondary'
                        } ${selectedMessages.includes(message.id) ? 'ring-2 ring-accent-primary animate-pulse' : ''}`}
                      onClick={() => toggleMessageSelection(message.id)}
                      onDoubleClick={() => addReaction(message.id, '❤️')}
                    >
                      {/* Image message */}
                      {message.fileType === 'image' && message.fileUrl && (
                        <div className="mb-3">
                          <img
                            src={message.fileUrl}
                            alt="Shared image"
                            className="max-w-full rounded-xl cursor-pointer hover:scale-105 transition-transform duration-200"
                            onClick={() => window.open(message.fileUrl, '_blank')}
                          />
                        </div>
                      )}

                      {/* Voice message */}
                      {message.fileType === 'voice' && (
                        <div className="flex items-center gap-4 mb-2 p-4 bg-black/20 rounded-xl">
                          <button
                            onClick={() => toggleVoicePlayback(message.id)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${message.isPlaying
                                ? 'bg-white text-black'
                                : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                          >
                            <i className={`fas ${message.isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                          </button>
                          <div className="flex-1">
                            <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                              <div
                                className={`bg-white h-2 rounded-full transition-all duration-300 ${message.isPlaying ? `w-[${audioProgress}%]` : 'w-0'
                                  }`}
                                style={{
                                  width: message.isPlaying ? `${audioProgress}%` : '0%'
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-white/80">{message.duration}</div>
                              <div className="text-xs text-white/60">🎤 Voice message</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* File message */}
                      {message.fileType === 'file' && (
                        <div className="flex items-center gap-3 mb-2 p-3 bg-black/20 rounded-xl">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400">
                            <i className="fas fa-file"></i>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white">{message.fileName}</div>
                            <div className="text-xs text-white/70">{message.fileSize}</div>
                          </div>
                        </div>
                      )}

                      {/* Text message */}
                      {message.text && (
                        <p className="mb-2 leading-relaxed">{message.text}</p>
                      )}

                      {/* Message Footer */}
                      <div className={`flex items-center justify-end gap-2 text-xs ${message.sender === 'user' ? 'text-white/70' : 'text-text-secondary'
                        }`}>
                        <span>{formatMessageTime(message.timestamp)}</span>
                        {message.sender === 'user' && (
                          <div className="flex items-center gap-1">
                            {message.status === 'sending' && <i className="fas fa-clock animate-pulse"></i>}
                            {message.status === 'delivered' && <i className="fas fa-check"></i>}
                            {message.status === 'read' && <i className="fas fa-check-double text-blue-400"></i>}
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
                                copyMessage(message);
                              } else {
                                addReaction(message.id, emoji);
                              }
                            }}
                            title={emoji === '📋' ? 'Copy message' : `React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reactions */}
                    {message.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 ml-2">
                        {message.reactions.map((reaction, reactionIndex) => (
                          <button
                            key={reactionIndex}
                            className="flex items-center gap-1 bg-bg-secondary/80 border border-glass-border rounded-full px-2 py-1 text-sm hover:bg-bg-secondary transition-all duration-200"
                            onClick={() => addReaction(message.id, reaction.emoji)}
                          >
                            <span>{reaction.emoji}</span>
                            <span className="text-text-secondary">{reaction.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {message.sender === 'user' && (
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center ml-3 flex-shrink-0 shadow-lg">
                      <span className="text-white text-sm font-bold">YOU</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
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

              {/* Voice Button */}
              <button
                type="button"
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-transparent hover:bg-bg-secondary/50 text-text-primary hover:text-accent-primary'
                  }`}
                onClick={handleVoiceRecord}
                title={isRecording ? 'Stop recording' : 'Voice message'}
              >
                <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} text-lg`}></i>
              </button>

              {/* Send Button */}
              {newMessage.trim() ? (
                <button
                  type="submit"
                  className="w-10 h-10 rounded-2xl bg-gradient-primary text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-accent-primary/30 ml-1"
                  title="Send message"
                >
                  <i className="fas fa-paper-plane text-lg"></i>
                </button>
              ) : (
                <div className="w-10 h-10 ml-1"></div>
              )}
            </div>
          </form>
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
              { icon: 'fas fa-search', label: 'Search in conversation', action: handleSearchInChat },
              { icon: `fas ${isMuted ? 'fa-bell' : 'fa-bell-slash'}`, label: `${isMuted ? 'Unmute' : 'Mute'} notifications`, action: toggleMute },
              { icon: `fas fa-star${isFavorite ? ' text-yellow-400' : ''}`, label: `${isFavorite ? 'Remove from' : 'Add to'} favorites`, action: toggleFavorite },
              { icon: 'fas fa-archive', label: 'Archive chat', action: archiveChat },
              { icon: 'fas fa-trash', label: 'Delete chat', action: deleteChat, danger: true },
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
                  performSearch();
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
                    <div className="text-text-primary text-sm" dangerouslySetInnerHTML={{ __html: result.highlightedText }} />
                    <div className="text-text-secondary text-xs mt-1">{formatMessageTime(result.timestamp)}</div>
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
                onClick={() => {
                  confirmAction.action();
                  setShowConfirmModal(false);
                }}
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