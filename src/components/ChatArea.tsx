import { useState, useEffect, useRef, Fragment, type ChangeEvent, type KeyboardEvent } from 'react'
import { Chat, Message, GreenApiCredentials } from '../types'
import { 
  formatMessageTime, 
  formatDateDivider, 
  formatPhoneNumber, 
  getAvatarDetails 
} from '../utils/format'
import { 
  Send, 
  CheckCheck, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  Trash2
} from 'lucide-react'

interface ChatAreaProps {
  chat: Chat
  messages: Message[]
  credentials: GreenApiCredentials
  onSendMessage: (chatId: string, text: string) => Promise<void>
  onDeleteChat: (chatId: string) => void
  onBack: () => void
}

export function ChatArea({
  chat,
  messages,
  credentials,
  onSendMessage,
  onDeleteChat,
  onBack
}: ChatAreaProps) {
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Filter messages for current chat
  const chatMessages = messages.filter((m) => m.chatId === chat.id)

  // Auto-scroll to bottom on new message
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto'
    })
  }

  useEffect(() => {
    scrollToBottom(false)
  }, [chat.id])

  useEffect(() => {
    scrollToBottom(true)
  }, [chatMessages.length])

  // Auto-resize textarea
  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  const handleSend = async () => {
    const text = inputText.trim()
    if (!text || isSending) return

    setIsSending(true)
    setSendError(null)

    try {
      await onSendMessage(chat.id, text)
      setInputText('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (err: any) {
      console.error('Error sending message:', err)
      setSendError(err.message || 'Ошибка отправки сообщения')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const { initials, bgColor } = getAvatarDetails(chat.name || chat.phoneNumber)

  return (
    <main className="flex-1 flex flex-col h-full bg-[#EFEAE2] relative overflow-hidden">
      {/* Top Header */}
      <header className="h-16 px-4 bg-white border-b border-slate-200 flex items-center justify-between z-10 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          <button
            onClick={onBack}
            className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Contact Avatar */}
          <div
            className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0`}
          >
            {initials}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-800 leading-tight">
              {chat.name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-mono text-[11px]">
                {chat.phoneNumber ? formatPhoneNumber(chat.phoneNumber) : chat.id}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-medium">MAX</span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (window.confirm(`Удалить диалог с ${chat.name}?`)) {
                onDeleteChat(chat.id)
              }
            }}
            title="Удалить чат"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 chat-background">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-sm border border-slate-200/60 max-w-sm">
              <p className="text-xs text-slate-600 font-medium">
                Начало диалога в мессенджере MAX
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Отправьте текстовое сообщение получателю. Входящие ответы появятся здесь в реальном времени.
              </p>
            </div>
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const isOutgoing = msg.type === 'outgoing'
            const prevMsg = chatMessages[index - 1]
            const showDateDivider =
              !prevMsg ||
              formatDateDivider(prevMsg.timestamp) !== formatDateDivider(msg.timestamp)

            return (
              <Fragment key={msg.idMessage || `${msg.timestamp}_${index}`}>
                {showDateDivider && (
                  <div className="flex justify-center my-4">
                    <span className="bg-white/70 backdrop-blur-sm text-slate-600 text-[11px] font-medium px-3 py-1 rounded-full shadow-sm border border-slate-200/40">
                      {formatDateDivider(msg.timestamp)}
                    </span>
                  </div>
                )}

                <div
                  className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} animate-in fade-in duration-100`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] lg:max-w-[60%] px-3.5 py-2 rounded-2xl shadow-sm text-sm relative break-words ${
                      isOutgoing
                        ? 'bubble-outgoing shadow-blue-500/10'
                        : 'bubble-incoming shadow-slate-300/40'
                    }`}
                  >
                    {/* Incoming sender name if available */}
                    {!isOutgoing && msg.senderName && (
                      <span className="block text-[11px] font-semibold text-[#0066FF] mb-0.5">
                        {msg.senderName}
                      </span>
                    )}

                    {/* Message text */}
                    <div className="whitespace-pre-wrap leading-relaxed select-text">
                      {msg.text}
                    </div>

                    {/* Timestamp & Delivery status */}
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                        isOutgoing ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      <span>{formatMessageTime(msg.timestamp)}</span>

                      {isOutgoing && (
                        <span>
                          {msg.status === 'pending' ? (
                            <Clock className="w-3 h-3 text-blue-200 animate-spin" />
                          ) : msg.status === 'error' ? (
                            <AlertCircle className="w-3 h-3 text-red-300" />
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Fragment>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send Error Alert */}
      {sendError && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{sendError}</span>
          </div>
          <button
            onClick={() => setSendError(null)}
            className="text-red-500 hover:text-red-700 text-xs font-semibold ml-2"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Message Input Footer */}
      <footer className="p-3 bg-white border-t border-slate-200 z-10 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-end gap-2">
          {/* Text input area */}
          <div className="flex-1 bg-slate-100 hover:bg-slate-200/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0066FF] focus-within:border-transparent border border-slate-200 rounded-2xl p-1.5 transition">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение в MAX... (Enter для отправки)"
              className="w-full px-3 py-1.5 bg-transparent border-0 focus:outline-none text-slate-800 text-sm placeholder:text-slate-400 resize-none max-h-32 leading-relaxed"
            />
            {inputText.length > 3500 && (
              <div className="text-[10px] text-right text-slate-400 px-2 pb-0.5">
                {inputText.length} / 20 000
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            title="Отправить (Enter)"
            className="w-11 h-11 rounded-full bg-[#0066FF] hover:bg-[#0055DD] active:bg-[#0048BB] disabled:opacity-40 disabled:hover:bg-[#0066FF] text-white flex items-center justify-center shadow-md transition duration-150 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSending ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <Send className="w-5 h-5 -ml-0.5" />
            )}
          </button>
        </div>
      </footer>
    </main>
  )
}
