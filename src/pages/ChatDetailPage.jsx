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
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Emoji list for picker
  const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯', '😎', '🙌', '👏', '💪', '🚀', '🎉', '✨'];

  // Load chat data
  useEffect(() => {
    const timer = setTimeout(() => {
      const chatData = getChatById(chatId);
      if (chatData) {
        // Add additional properties to messages
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

  // Simulate typing
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(prev => Math.random() > 0.8 ? !prev : prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Scroll to last message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      setAudioProgress(0);
      setRecordingTime(0);
    };
  }, [currentAudio, recordingInterval, mediaRecorder]);

  // Handle message sending
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    // Create new message
    const newMessageObj = {
      id: chat.messages.length + 1,
      text: newMessage,
      timestamp: new Date().toISOString(),
      sender: 'user',
      reactions: [],
      isRead: false,
      status: 'sending'
    };

    // Update chat with new message
    setChat({
      ...chat,
      messages: [...chat.messages, newMessageObj]
    });

    // Clear input field
    setNewMessage('');

    // Simulate delivery
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

    // Simulate reading
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

  // Add reaction
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

  // Select message
  const toggleMessageSelection = (messageId) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  // Show success message
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2000);
  };

  // Show confirmation
  const showConfirm = (message, action) => {
    setConfirmAction({ message, action });
    setShowConfirmModal(true);
  };

  // Handle files
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showSuccess('File too large. Maximum size: 5MB');
      return;
    }

    // Create URL for file
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

    // Simulate upload
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

  // Check microphone permissions
  const checkMicrophonePermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' });
      return result.state;
    } catch (error) {
      console.warn('Permission API not supported, trying direct access');
      return 'unknown';
    }
  };

  // Handle voice message
  const handleVoiceRecord = async () => {
    if (isRecording) {
      // Stop recording
      stopRecording();
    } else {
      // Check permissions before starting recording
      const permission = await checkMicrophonePermission();

      if (permission === 'denied') {
        alert('Microphone access is denied. Please enable it in your browser settings.');
        return;
      }

      // Start recording
      startRecording();
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      // Check MediaDevices support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported');
      }

      // Request microphone access permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      const chunks = [];

      recorder.ondataavailable = (e) => {
        console.log('Data available:', e.data.size, 'bytes');
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        console.log('Recording stopped, processing data...');
        console.log('Chunks length:', chunks.length);

        if (chunks.length === 0) {
          console.error('No audio data recorded');
          alert('No audio data recorded. Please try again.');
          return;
        }

        const blob = new Blob(chunks, { type: recorder.mimeType });
        console.log('Blob size:', blob.size, 'bytes');

        if (blob.size === 0) {
          console.error('Empty audio blob');
          alert('Recording failed. Please try again.');
          return;
        }

        const audioUrl = URL.createObjectURL(blob);
        console.log('Audio URL created:', audioUrl);

        // Get current recording time
        const finalRecordingTime = recordingTime;

        // Create voice message
        const voiceMessage = {
          id: chat.messages.length + 1,
          text: '',
          timestamp: new Date().toISOString(),
          sender: 'user',
          reactions: [],
          isRead: false,
          status: 'delivered',
          fileType: 'voice',
          fileUrl: audioUrl,
          duration: formatTime(finalRecordingTime),
          isPlaying: false
        };

        console.log('Voice message created:', voiceMessage);

        setChat(prev => ({
          ...prev,
          messages: [...prev.messages, voiceMessage]
        }));

        // Stop all tracks
        stream.getTracks().forEach(track => {
          console.log('Stopping track in onstop:', track.kind);
          track.stop();
        });
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        alert('Recording failed. Please try again.');
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onstart = () => {
        console.log('Recording started');
      };

      recorder.onpause = () => {
        console.log('Recording paused');
      };

      recorder.onresume = () => {
        console.log('Recording resumed');
      };

      setMediaRecorder(recorder);
      setRecordedChunks(chunks);
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);

      recorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);

      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access in your browser settings and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotSupportedError') {
        alert('Recording is not supported in this browser. Please use a modern browser.');
      } else {
        alert('Failed to access microphone. Please check your browser settings and try again.');
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    console.log('Stopping recording...');

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('MediaRecorder state:', mediaRecorder.state);
      mediaRecorder.stop();
    }

    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }

    // Stop all stream tracks
    if (mediaRecorder && mediaRecorder.stream) {
      mediaRecorder.stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
    }

    setIsRecording(false);
    setRecordingTime(0);
  };

  // Cancel recording
  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }

    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }

    setIsRecording(false);
    setRecordingTime(0);
    setRecordedChunks([]);
  };

  // Time formatting
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Search in chat
  const handleSearchInChat = () => {
    setShowSearchModal(true);
  };

  // Execute search
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

  // Scroll to message
  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-message');
      setTimeout(() => element.classList.remove('highlight-message'), 3000);
      setShowSearchModal(false);
    }
  };

  // Disable notifications
  const toggleMute = () => {
    setIsMuted(!isMuted);
    showSuccess(isMuted ? '🔔 Notifications enabled' : '🔕 Notifications disabled');
  };

  // Add to favorites
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    showSuccess(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  // Archive chat
  const archiveChat = () => {
    showConfirm('Archive this chat?', () => {
      // Save to localStorage
      const archivedChats = JSON.parse(localStorage.getItem('archivedChats') || '[]');
      archivedChats.push({ ...chat, archivedAt: new Date().toISOString() });
      localStorage.setItem('archivedChats', JSON.stringify(archivedChats));

      showSuccess('📁 Chat archived');
      setTimeout(() => navigate('/chat'), 1000);
    });
  };

  // Play voice message
  const toggleVoicePlayback = (messageId) => {
    const message = chat.messages.find(msg => msg.id === messageId);
    if (!message || message.fileType !== 'voice') return;

    // Stop current playback
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setAudioProgress(0);
    }

    setChat(prev => ({
      ...prev,
      messages: prev.messages.map(msg => ({
        ...msg,
        isPlaying: msg.id === messageId ? !msg.isPlaying : false
      }))
    }));

    const isPlaying = !message.isPlaying;

    if (isPlaying && message.fileUrl) {
      const audio = new Audio(message.fileUrl);
      audio.volume = 0.7;

      audio.addEventListener('loadedmetadata', () => {
        setCurrentAudio(audio);
        setAudioProgress(0);
      });

      audio.addEventListener('timeupdate', () => {
        if (audio.duration > 0) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      });

      audio.addEventListener('ended', () => {
        setChat(prev => ({
          ...prev,
          messages: prev.messages.map(msg => ({
            ...msg,
            isPlaying: false
          }))
        }));
        setCurrentAudio(null);
        setAudioProgress(0);
      });

      audio.play().catch(error => {
        console.error('Audio play failed:', error);
        setChat(prev => ({
          ...prev,
          messages: prev.messages.map(msg => ({
            ...msg,
            isPlaying: false
          }))
        }));
      });
    }
  };

  // Handle audio position change
  const handleAudioSeek = (messageId, newProgress) => {
    const message = chat.messages.find(msg => msg.id === messageId);
    if (!message || !currentAudio) return;

    const newTime = (newProgress / 100) * currentAudio.duration;
    currentAudio.currentTime = newTime;
    setAudioProgress(newProgress);
  };

  // Delete chat
  const deleteChat = () => {
    showConfirm('Delete this chat? This action cannot be undone.', () => {
      showSuccess('Chat deleted');
      setTimeout(() => navigate('/chat'), 1000);
    });
  };

  // Copy message
  const copyMessage = (message) => {
    let textToCopy = message.text;

    if (message.fileType === 'image') {
      textToCopy = '📷 Image';
    } else if (message.fileType === 'voice') {
      textToCopy = '🎤 Voice message';
    } else if (message.fileType === 'file') {
      textToCopy = `📎 ${message.fileName}`;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      showSuccess('📋 Message copied');
    });
  };

  // Group messages by date
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
            <i className="fas fa-spinner fa-spin text-4xl text-blue-400"></i>
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
                            <div className="relative w-full bg-white/20 rounded-full h-2 mb-2">
                              <div
                                className="bg-white h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: message.isPlaying ? `${audioProgress}%` : '0%'
                                }}
                              ></div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={message.isPlaying ? audioProgress : 0}
                                onChange={(e) => handleAudioSeek(message.id, parseInt(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                style={{ WebkitAppearance: 'none' }}
                              />
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
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-300 to-blue-700 rounded-full flex items-center justify-center ml-3 flex-shrink-0 shadow-lg">
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
          {isRecording ? (
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