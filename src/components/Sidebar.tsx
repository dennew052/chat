import { useState } from 'react'
import { Chat, GreenApiCredentials } from '../types'
import { PollingStatus } from '../hooks/useNotificationPolling'
import { formatChatTimestamp, getAvatarDetails } from '../utils/format'
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Radio, 
  CheckCheck,
  AlertCircle
} from 'lucide-react'

interface SidebarProps {
  chats: Chat[]
  selectedChatId: string | null
  onSelectChat: (chatId: string) => void
  onOpenNewChat: () => void
  onOpenSettings: () => void
  onLogout: () => void
  credentials: GreenApiCredentials
  pollingStatus: PollingStatus
  pollingError: string | null
}

export function Sidebar({
  chats,
  selectedChatId,
  onSelectChat,
  onOpenNewChat,
  onOpenSettings,
  onLogout,
  credentials,
  pollingStatus,
  pollingError
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredChats = chats.filter((chat) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      chat.name.toLowerCase().includes(q) ||
      chat.phoneNumber.includes(q) ||
      chat.id.toLowerCase().includes(q)
    )
  })

  // Sort chats by last activity
  const sortedChats = [...filteredChats].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-white border-r border-slate-200 select-none flex-shrink-0">
      {/* Top Header */}
      <div className="h-16 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo / App Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-[#0066FF] flex items-center justify-center text-white shadow-sm font-bold text-lg">
              <svg className="w-6 h-6 fill-white" viewBox="0 0 100 100">
                <path d="M25 72V28h12l13 22 13-22h12v44h-11V44L50 64 36 44v28z" />
              </svg>
            </div>
            {/* Live Polling Status Indicator */}
            <span
              title={
                pollingStatus === 'listening'
                  ? 'Синхронизация активна: ожидание входящих сообщений'
                  : pollingStatus === 'receiving'
                  ? 'Получение сообщения...'
                  : pollingStatus === 'error'
                  ? `Ошибка: ${pollingError || 'Сбой сети'}`
                  : 'Остановлено'
              }
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                pollingStatus === 'listening'
                  ? 'bg-emerald-500 animate-pulse'
                  : pollingStatus === 'receiving'
                  ? 'bg-amber-400 animate-spin'
                  : pollingStatus === 'error'
                  ? 'bg-red-500'
                  : 'bg-slate-400'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-800 text-sm tracking-tight">MAX Web</h1>
              <span className="px-1.5 py-0.5 bg-blue-100 text-[#0066FF] text-[10px] font-semibold rounded">
                API
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              ID: {credentials.idInstance.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNewChat}
            title="Новый диалог"
            className="p-2 text-slate-600 hover:text-[#0066FF] hover:bg-slate-200/70 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenSettings}
            title="Настройки подключения"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onLogout}
            title="Выйти из аккаунта"
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Polling status banner if error */}
      {pollingStatus === 'error' && (
        <div className="px-3 py-1.5 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span className="truncate flex-1">
            Ошибка HTTP API: {pollingError || 'проверьте токен'}
          </span>
        </div>
      )}

      {/* Search Input */}
      <div className="p-3 border-b border-slate-100 bg-white">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск диалогов..."
            className="w-full pl-9 pr-3 py-2 bg-slate-100 hover:bg-slate-200/70 focus:bg-white border border-transparent focus:border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {sortedChats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              {searchQuery ? 'Ничего не найдено' : 'Диалогов пока нет'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
              {searchQuery
                ? 'Попробуйте изменить поисковый запрос'
                : 'Нажмите кнопку +, чтобы отправить первое сообщение в MAX'}
            </p>
            {!searchQuery && (
              <button
                onClick={onOpenNewChat}
                className="mt-4 px-4 py-2 bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Начать диалог</span>
              </button>
            )}
          </div>
        ) : (
          sortedChats.map((chat) => {
            const isSelected = chat.id === selectedChatId
            const { initials, bgColor } = getAvatarDetails(chat.name || chat.phoneNumber)

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition select-none ${
                  isSelected
                    ? 'bg-blue-50/80 border-l-4 border-[#0066FF]'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Contact Avatar */}
                <div
                  className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm`}
                >
                  {initials}
                </div>

                {/* Info & Last message snippet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-slate-800 truncate">
                      {chat.name}
                    </h4>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">
                      {formatChatTimestamp(chat.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate pr-2">
                      {chat.lastMessage ? (
                        chat.lastMessage.type === 'outgoing' ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckCheck className="w-3.5 h-3.5 text-[#0066FF]" />
                            <span className="text-slate-600">
                              {chat.lastMessage.text}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-700">
                            {chat.lastMessage.text}
                          </span>
                        )
                      ) : (
                        <span className="italic text-slate-400">Чат создан</span>
                      )}
                    </span>

                    {chat.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-[#0066FF] text-white text-[11px] font-bold rounded-full min-w-5 text-center flex-shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer Info Pill */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Radio
            className={`w-3.5 h-3.5 ${
              pollingStatus === 'listening'
                ? 'text-emerald-500 animate-pulse'
                : 'text-slate-400'
            }`}
          />
          <span>Служба HTTP API:</span>
        </div>
        <span
          className={`font-medium ${
            pollingStatus === 'listening'
              ? 'text-emerald-600'
              : pollingStatus === 'receiving'
              ? 'text-amber-600'
              : pollingStatus === 'error'
              ? 'text-red-600'
              : 'text-slate-400'
          }`}
        >
          {pollingStatus === 'listening'
            ? 'Активна'
            : pollingStatus === 'receiving'
            ? 'Чтение...'
            : pollingStatus === 'error'
            ? 'Ошибка'
            : 'Отключена'}
        </span>
      </div>
    </aside>
  )
}
