// Chat data - empty for production
export const chats = []

// Function to get chat by ID
export const getChatById = (chatId) => {
  return chats.find(chat => chat.id === parseInt(chatId)) || null;
};

// Function to format message time
export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Function to format message date
export const formatMessageDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
};

// Function to get or create chat for startup
export const getOrCreateChatForStartup = (startupId, startupData = null) => {
  // Look for existing chat for this startup
  let existingChat = chats.find(chat => chat.startup.id === startupId);

  if (existingChat) {
    return existingChat;
  }

  // If chat not found, create new one
  const newChat = {
    id: chats.length + 1,
    startup: startupData ? {
      id: startupId,
      name: startupData.name,
      logo: startupData.logo,
      gradient: startupData.gradient || "bg-gradient-primary"
    } : {
      id: startupId,
      name: "New Startup",
      logo: "NS",
      gradient: "bg-gradient-primary"
    },
    messages: []
  };

  // Add new chat to array
  chats.push(newChat);

  return newChat;
};
