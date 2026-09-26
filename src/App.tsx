import React, { useState, useEffect, useCallback } from 'react'
import { GreenApiCredentials, Chat, Message } from './types'
import { GreenApiService } from './services/greenApi'
import { useNotificationPolling } from './hooks/useNotificationPolling'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { EmptyChatState } from './components/EmptyChatState'
import { AuthModal } from './components/AuthModal'
import { NewChatModal } from './components/NewChatModal'
import { SettingsModal } from './components/SettingsModal'

const STORAGE_KEYS = {
  CREDENTIALS: 'max_green_api_credentials',
  CHATS: 'max_green_api_chats',
  MESSAGES: 'max_green_api_messages'
}

export const App: React.FC = () => {
  // Load saved credentials from localStorage
  const [credentials, setCredentials] = useState<GreenApiCredentials | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CREDENTIALS)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Load saved chats
  const [chats, setChats] = useState<Chat[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHATS)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Load saved messages
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Persist state updates to localStorage
  useEffect(() => {
    if (credentials) {
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials))
    } else {
      localStorage.removeItem(STORAGE_KEYS.CREDENTIALS)
    }
  }, [credentials])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats))
  }, [chats])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages))
  }, [messages])

  // Handle incoming notification message
  const handleIncomingMessage = useCallback(
    (newMsg: Message) => {
      setMessages((prev) => {
        // Prevent duplicate messages by idMessage
        if (prev.some((m) => m.idMessage === newMsg.idMessage)) {
          return prev
        }
        return [...prev, newMsg]
      })

      setChats((prevChats) => {
        const existingChatIndex = prevChats.findIndex(
          (c) => c.id === newMsg.chatId || (newMsg.chatId && c.id.startsWith(newMsg.chatId.replace(/\D/g, '')))
        )

        const isCurrentChat = selectedChatId === newMsg.chatId

        if (existingChatIndex >= 0) {
          const updated = [...prevChats]
          const chat = updated[existingChatIndex]
          updated[existingChatIndex] = {
            ...chat,
            lastMessage: newMsg,
            unreadCount: isCurrentChat || newMsg.type === 'outgoing' ? 0 : chat.unreadCount + 1,
            updatedAt: newMsg.timestamp
          }
          return updated
        } else {
          // If message is from a new contact not yet in chat list, create chat
          const cleanPhone = newMsg.chatId.replace(/\D/g, '')
          const newChat: Chat = {
            id: newMsg.chatId,
            name: newMsg.senderName || (cleanPhone ? `+${cleanPhone}` : newMsg.chatId),
            phoneNumber: cleanPhone,
            lastMessage: newMsg,
            unreadCount: isCurrentChat ? 0 : 1,
            updatedAt: newMsg.timestamp
          }
          return [newChat, ...prevChats]
        }
      })
    },
    [selectedChatId]
  )

  // HTTP API Notification Polling Worker
  const { status: pollingStatus, lastError: pollingError } = useNotificationPolling({
    credentials,
    isEnabled: !!credentials,
    onMessageReceived: handleIncomingMessage
  })

  // Select chat and clear unread count
  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId)
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    )
  }

  // Send message
  const handleSendMessage = async (chatId: string, text: string) => {
    if (!credentials) throw new Error('Не авторизован')

    const tempId = `temp_${Date.now()}`
    const now = Date.now()

    const pendingMsg: Message = {
      idMessage: tempId,
      chatId,
      text,
      timestamp: now,
      type: 'outgoing',
      status: 'pending'
    }

    // Optimistically add to UI
    setMessages((prev) => [...prev, pendingMsg])
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, lastMessage: pendingMsg, updatedAt: now }
          : c
      )
    )

    try {
      const response = await GreenApiService.sendMessage(credentials, chatId, text)

      // Update message with real idMessage from API
      setMessages((prev) =>
        prev.map((m) =>
          m.idMessage === tempId
            ? { ...m, idMessage: response.idMessage || tempId, status: 'sent' }
            : m
        )
      )

      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                lastMessage: {
                  ...pendingMsg,
                  idMessage: response.idMessage || tempId,
                  status: 'sent'
                },
                updatedAt: now
              }
            : c
        )
      )
    } catch (err: any) {
      // Mark message with error status
      setMessages((prev) =>
        prev.map((m) =>
          m.idMessage === tempId
            ? { ...m, status: 'error', errorMessage: err.message }
            : m
        )
      )
      throw err
    }
  }

  // Create new chat
  const handleChatCreated = (newChat: Chat) => {
    setChats((prev) => {
      if (prev.some((c) => c.id === newChat.id)) {
        return prev
      }
      return [newChat, ...prev]
    })
    setSelectedChatId(newChat.id)
  }

  // Delete chat
  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId))
    setMessages((prev) => prev.filter((m) => m.chatId !== chatId))
    if (selectedChatId === chatId) {
      setSelectedChatId(null)
    }
  }

  // Logout
  const handleLogout = () => {
    setCredentials(null)
    setSelectedChatId(null)
  }

  // Clear local history
  const handleClearHistory = () => {
    setChats([])
    setMessages([])
    setSelectedChatId(null)
    localStorage.removeItem(STORAGE_KEYS.CHATS)
    localStorage.removeItem(STORAGE_KEYS.MESSAGES)
  }

  const selectedChat = chats.find((c) => c.id === selectedChatId)

  return (
    <div className="flex w-full h-full bg-slate-100 overflow-hidden font-sans">
      {/* Auth Modal if no credentials */}
      {!credentials && (
        <AuthModal
          initialCredentials={credentials}
          onLogin={(creds) => setCredentials(creds)}
        />
      )}

      {/* Main Messenger Layout */}
      {credentials && (
        <div className="flex w-full h-full overflow-hidden">
          {/* Left Sidebar: hidden on small screens when a chat is open */}
          <div
            className={`w-full md:w-auto h-full ${
              selectedChatId ? 'hidden md:flex' : 'flex'
            }`}
          >
            <Sidebar
              chats={chats}
              selectedChatId={selectedChatId}
              onSelectChat={handleSelectChat}
              onOpenNewChat={() => setIsNewChatOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onLogout={handleLogout}
              credentials={credentials}
              pollingStatus={pollingStatus}
              pollingError={pollingError}
            />
          </div>

          {/* Right Main Area: hidden on small screens when no chat is open */}
          <div
            className={`flex-1 h-full ${
              !selectedChatId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {selectedChat ? (
              <ChatArea
                chat={selectedChat}
                messages={messages}
                credentials={credentials}
                onSendMessage={handleSendMessage}
                onDeleteChat={handleDeleteChat}
                onBack={() => setSelectedChatId(null)}
              />
            ) : (
              <EmptyChatState onOpenNewChat={() => setIsNewChatOpen(true)} />
            )}
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {isNewChatOpen && credentials && (
        <NewChatModal
          credentials={credentials}
          onClose={() => setIsNewChatOpen(false)}
          onChatCreated={handleChatCreated}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && credentials && (
        <SettingsModal
          credentials={credentials}
          onClose={() => setIsSettingsOpen(false)}
          onLogout={handleLogout}
          onClearHistory={handleClearHistory}
        />
      )}
    </div>
  )
}
export default App
