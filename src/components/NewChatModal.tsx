import React, { useState } from 'react'
import { GreenApiCredentials, Chat } from '../types'
import { GreenApiService } from '../services/greenApi'
import { formatPhoneNumber } from '../utils/format'
import { X, UserPlus, Phone, User, CheckCircle2, AlertTriangle, Search } from 'lucide-react'

interface NewChatModalProps {
  credentials: GreenApiCredentials
  onClose: () => void
  onChatCreated: (chat: Chat) => void
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  credentials,
  onClose,
  onChatCreated
}) => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [contactName, setContactName] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<{
    tested: boolean
    exist?: boolean
    chatId?: string
    error?: string
  }>({ tested: false })

  const cleanDigits = phoneNumber.replace(/\D/g, '')

  const handleCheckAccount = async () => {
    if (cleanDigits.length < 10) {
      setCheckResult({ tested: true, error: 'Введите корректный номер (минимум 10 цифр)' })
      return
    }

    setIsChecking(true)
    setCheckResult({ tested: false })

    try {
      const res = await GreenApiService.checkAccount(credentials, cleanDigits)
      setCheckResult({
        tested: true,
        exist: res.exist,
        chatId: res.chatId
      })
    } catch (err: any) {
      setCheckResult({
        tested: true,
        error: err.message || 'Ошибка проверки аккаунта'
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (cleanDigits.length < 10) {
      setCheckResult({ tested: true, error: 'Введите номер телефона (минимум 10 цифр)' })
      return
    }

    // Determine target chatId:
    // If checkAccount gave a specific chatId, use it.
    // Otherwise, if WhatsApp format standard: cleanDigits + "@c.us"
    // In MAX, it can also be raw chatId or cleanDigits@c.us
    let chatId = checkResult.chatId
    if (!chatId) {
      // Default standard format for personal chats in GREEN-API
      chatId = cleanDigits.includes('@') ? cleanDigits : `${cleanDigits}@c.us`
    }

    const newChat: Chat = {
      id: chatId,
      name: contactName.trim() || formatPhoneNumber(cleanDigits),
      phoneNumber: cleanDigits,
      unreadCount: 0,
      updatedAt: Date.now()
    }

    onChatCreated(newChat)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-[#0066FF] rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Новый диалог</h3>
              <p className="text-xs text-slate-500">Введите номер контакта в MAX</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Номер телефона <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  autoFocus
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value)
                    setCheckResult({ tested: false })
                  }}
                  placeholder="Например: 79991234567"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleCheckAccount}
                disabled={isChecking || cleanDigits.length < 10}
                title="Проверить наличие контакта через CheckAccount"
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isChecking ? (
                  <svg className="animate-spin h-4 w-4 text-[#0066FF]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Проверить</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Укажите номер в международном формате с кодом страны (например, 79001234567)
            </p>
          </div>

          {/* Check result badge */}
          {checkResult.tested && (
            <div className="animate-in fade-in">
              {checkResult.exist ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Пользователь найден в сети!</span>
                    {checkResult.chatId && (
                      <span className="block text-[11px] text-emerald-600 font-mono mt-0.5">
                        chatId: {checkResult.chatId}
                      </span>
                    )}
                  </div>
                </div>
              ) : checkResult.error ? (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <span>{checkResult.error}</span>
                    <span className="block text-[11px] text-amber-700 mt-0.5">
                      (Можно создать чат напрямую по номеру)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Пользователь не найден в базе, но вы можете начать диалог</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Имя собеседника <span className="text-slate-400 font-normal lowercase">(необязательно)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Например: Иван Иванов"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-xl text-sm transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={cleanDigits.length < 10}
              className="px-5 py-2.5 bg-[#0066FF] hover:bg-[#0055DD] text-white font-semibold rounded-xl text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Начать чат
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
