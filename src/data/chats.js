// Тестовые данные для чатов
export const chats = [
  {
    id: 1,
    startup: {
      name: "Quantum AI",
      logo: "QA",
      gradient: "bg-gradient-primary"
    },
    messages: [
      {
        id: 1,
        text: "Hi! We're interested in your profile and would like to discuss a potential collaboration.",
        timestamp: "2023-06-15T10:30:00",
        sender: "startup"
      },
      {
        id: 2,
        text: "Hello! I'm very glad you noticed my profile. How can I be helpful to your project?",
        timestamp: "2023-06-15T10:35:00",
        sender: "user"
      },
      {
        id: 3,
        text: "We need an experienced developer for our AI project. Do you have experience with machine learning?",
        timestamp: "2023-06-15T10:40:00",
        sender: "startup"
      },
      {
        id: 4,
        text: "Yes, I have experience with TensorFlow and PyTorch. I've worked on natural language processing and computer vision projects.",
        timestamp: "2023-06-15T10:45:00",
        sender: "user"
      },
      {
        id: 5,
        text: "Great! That's exactly what we need. We're developing a data analysis system for the fintech sector. When could you join the team?",
        timestamp: "2023-06-15T10:50:00",
        sender: "startup"
      },
      {
        id: 6,
        text: "I could start in two weeks. I'd like to learn more about the project and collaboration terms.",
        timestamp: "2023-06-15T10:55:00",
        sender: "user"
      },
      {
        id: 7,
        text: "Of course! Let's organize a video call to discuss the details. How about tomorrow at 3:00 PM?",
        timestamp: "2023-06-15T11:00:00",
        sender: "startup"
      },
      {
        id: 8,
        text: "Tomorrow at 3:00 PM works for me. I'll wait for the call link.",
        timestamp: "2023-06-15T11:05:00",
        sender: "user"
      },
      {
        id: 9,
        text: "",
        timestamp: "2023-06-15T11:10:00",
        sender: "user",
        fileType: "voice",
        duration: "0:05",
        isPlaying: false
      },
      {
        id: 10,
        text: "Perfect! Here's our project overview document.",
        timestamp: "2023-06-15T11:15:00",
        sender: "startup"
      },
      {
        id: 11,
        text: "",
        timestamp: "2023-06-15T11:20:00",
        sender: "startup",
        fileType: "image",
        fileUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
        fileName: "project-overview.jpg",
        fileSize: "245.3 KB"
      }
    ]
  },
  {
    id: 2,
    startup: {
      name: "EcoTech Solutions",
      logo: "ET",
      gradient: "bg-gradient-tertiary"
    },
    messages: [
      {
        id: 1,
        text: "Hello! We're looking for a UI/UX designer for our eco-friendly startup. Your portfolio is impressive!",
        timestamp: "2023-06-10T14:20:00",
        sender: "startup"
      },
      {
        id: 2,
        text: "Hi! Thank you for your interest in my portfolio. I'm very interested in projects with an environmental focus.",
        timestamp: "2023-06-10T14:25:00",
        sender: "user"
      },
      {
        id: 3,
        text: "",
        timestamp: "2023-06-10T14:30:00",
        sender: "startup",
        fileType: "image",
        fileUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
        fileName: "eco-design.jpg",
        fileSize: "189.7 KB"
      },
      {
        id: 4,
        text: "This is exactly the kind of design we're looking for!",
        timestamp: "2023-06-10T14:35:00",
        sender: "user"
      },
      {
        id: 5,
        text: "",
        timestamp: "2023-06-10T14:40:00",
        sender: "user",
        fileType: "voice",
        duration: "0:08",
        isPlaying: false
      }
    ]
  },
  {
    id: 3,
    startup: {
      name: "FinFlow",
      logo: "FF",
      gradient: "bg-gradient-secondary"
    },
    messages: [
      {
        id: 1,
        text: "Good day! We noticed your experience in the fintech sector and would like to discuss a potential collaboration.",
        timestamp: "2023-06-05T09:15:00",
        sender: "startup"
      }
    ]
  }
];

// Функция для получения чата по ID
export const getChatById = (chatId) => {
  return chats.find(chat => chat.id === parseInt(chatId)) || null;
};

// Функция для форматирования времени сообщения
export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Функция для форматирования даты сообщения
export const formatMessageDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
};

// Функция для получения или создания чата для стартапа
export const getOrCreateChatForStartup = (startupId) => {
  // Ищем существующий чат для этого стартапа
  let existingChat = chats.find(chat => chat.startup.id === startupId);

  if (existingChat) {
    return existingChat;
  }

  // Если чат не найден, создаем новый
  const newChat = {
    id: chats.length + 1,
    startup: {
      id: startupId,
      name: "New Startup",
      logo: "NS",
      gradient: "bg-gradient-primary"
    },
    messages: []
  };

  // Добавляем новый чат в массив
  chats.push(newChat);

  return newChat;
};
