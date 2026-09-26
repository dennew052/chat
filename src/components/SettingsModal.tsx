import React, { useState, useEffect } from 'react'
import { GreenApiCredentials, InstanceState } from '../types'
import { GreenApiService } from '../services/greenApi'
import { 
  X, 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Trash2,
  ExternalLink
} from 'lucide-react'

interface SettingsModalProps {
  credentials: GreenApiCredentials
  onClose: () => void
  onLogout: () => void
  onClearHistory: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  credentials,
  onClose,
  onLogout,
  onClearHistory
}) => {
  const [instanceState, setInstanceState] = useState<InstanceState | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)

  const checkState = async () => {
    setIsChecking(true)
    setCheckError(null)
    try {
      const res = await GreenApiService.getStateInstance(credentials)
      setInstanceState(res?.stateInstance || 'unknown')
    } catch (err: any) {
      setCheckError(err.message || 'Ошибка проверки')
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkState()
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Настройки подключения</h3>
              <p className="text-xs text-slate-500">Параметры GREEN-API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Instance Info Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Статус инстанса:
              </span>
              <button
                onClick={checkState}
                disabled={isChecking}
                className="text-xs text-[#0066FF] hover:underline flex items-center gap-1 font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>Обновить</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {instanceState === 'authorized' ? (
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Авторизован (Готов к работе)</span>
                </div>
              ) : instanceState ? (
                <div className="flex items-center gap-1.5 text-amber-600 font-semibold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{instanceState}</span>
                </div>
              ) : checkError ? (
                <div className="text-red-600 text-xs font-medium">
                  {checkError}
                </div>
              ) : (
                <span className="text-xs text-slate-400">Проверка...</span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="font-sans text-slate-400">idInstance:</span>
                <span className="text-slate-800 font-medium">{credentials.idInstance}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-400">apiUrl:</span>
                <span className="text-slate-800 truncate max-w-[200px]" title={credentials.apiUrl}>
                  {credentials.apiUrl}
                </span>
              </div>
            </div>
          </div>

          {/* Quick link to console */}
          <a
            href="https://console.green-api.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-medium transition"
          >
            <span>Открыть личный кабинет GREEN-API</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Danger / Action zones */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                if (window.confirm('Очистить всю историю сообщений и список чатов на этом устройстве?')) {
                  onClearHistory()
                  onClose()
                }
              }}
              className="w-full py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition"
            >
              <Trash2 className="w-4 h-4 text-slate-400" />
              <span>Очистить локальную историю</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Вы действительно хотите выйти из текущего аккаунта?')) {
                  onLogout()
                  onClose()
                }
              }}
              className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Выйти из учетной записи</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
