import { useState, type FormEvent } from 'react'
import { GreenApiCredentials } from '../types'
import { GreenApiService } from '../services/greenApi'
import { KeyRound, Server, AlertCircle, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react'

interface AuthModalProps {
  initialCredentials: GreenApiCredentials | null
  onLogin: (credentials: GreenApiCredentials) => void
}

export function AuthModal({ initialCredentials, onLogin }: AuthModalProps) {
  const [idInstance, setIdInstance] = useState(initialCredentials?.idInstance || '')
  const [apiTokenInstance, setApiTokenInstance] = useState(initialCredentials?.apiTokenInstance || '')
  const [apiUrl, setApiUrl] = useState(initialCredentials?.apiUrl || 'https://api.green-api.com')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!idInstance.trim()) {
      setError('Введите idInstance')
      return
    }

    if (!apiTokenInstance.trim()) {
      setError('Введите apiTokenInstance')
      return
    }

    setIsLoading(true)

    const creds: GreenApiCredentials = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: apiUrl.trim() || 'https://api.green-api.com'
    }

    try {
      // Validate credentials by checking instance state
      const stateRes = await GreenApiService.getStateInstance(creds)
      
      if (stateRes && stateRes.stateInstance) {
        onLogin(creds)
      } else {
        // Even if status format varies, if request succeeded we proceed
        onLogin(creds)
      }
    } catch (err: any) {
      console.error('Login validation error:', err)
      setError(
        err.message?.includes('401')
          ? 'Неверный idInstance или apiTokenInstance. Проверьте данные в кабинете GREEN-API.'
          : (err.message || 'Ошибка соединения с сервером GREEN-API.')
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with MAX brand blue accent */}
        <div className="bg-gradient-to-r from-[#0066FF] to-[#0052CC] p-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md mb-3 shadow-inner">
            <svg className="w-8 h-8 fill-white" viewBox="0 0 100 100">
              <path d="M25 72V28h12l13 22 13-22h12v44h-11V44L50 64 36 44v28z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Вход в MAX Web</h2>
          <p className="text-blue-100 text-sm mt-1">
            Подключение через шлюз <span className="font-semibold text-white">GREEN-API</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              idInstance <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={idInstance}
                onChange={(e) => setIdInstance(e.target.value)}
                placeholder="Например: 1101823456"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              apiTokenInstance <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                value={apiTokenInstance}
                onChange={(e) => setApiTokenInstance(e.target.value)}
                placeholder="Токен инстанса из кабинета GREEN-API"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent text-sm transition font-mono"
              />
            </div>
          </div>

          {/* Advanced Server Settings toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition"
            >
              <span>{showAdvanced ? '▲ Скрыть адрес API' : '▼ Расширенные настройки (API URL)'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-2.5 pt-2 border-t border-slate-100 animate-in fade-in">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Базовый URL сервера API:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Server className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://api.green-api.com"
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-[#0066FF] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  По умолчанию используется https://api.green-api.com
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#0066FF] hover:bg-[#0055DD] active:bg-[#0048BB] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition duration-150 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Проверка авторизации...</span>
              </>
            ) : (
              <>
                <span>Подключиться к чату</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Help toggle */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-xs text-[#0066FF] hover:underline inline-flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Где получить idInstance и apiTokenInstance?</span>
            </button>
          </div>

          {showHelp && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-slate-700 space-y-1.5">
              <p className="font-semibold text-blue-900">Инструкция для GREEN-API:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>
                  Зарегистрируйтесь в{' '}
                  <a
                    href="https://console.green-api.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0066FF] font-medium underline"
                  >
                    console.green-api.com
                  </a>
                </li>
                <li>Создайте инстанс (тариф “Разработчик” — бесплатно)</li>
                <li>Пройдите авторизацию инстанса по QR-коду в MAX / WhatsApp</li>
                <li>Скопируйте <b>idInstance</b> и <b>apiTokenInstance</b></li>
              </ol>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
