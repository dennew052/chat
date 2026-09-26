import React from 'react'
import { Plus, MessageSquare, ShieldCheck, Zap } from 'lucide-react'

interface EmptyChatStateProps {
  onOpenNewChat: () => void
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({ onOpenNewChat }) => {
  return (
    <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#F8FAFC] border-b-4 border-b-[#0066FF] p-8 text-center select-none">
      <div className="max-w-md flex flex-col items-center animate-in fade-in duration-300">
        {/* Emblem */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#0066FF] to-[#3B82F6] flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-6">
          <svg className="w-14 h-14 fill-white" viewBox="0 0 100 100">
            <path d="M25 72V28h12l13 22 13-22h12v44h-11V44L50 64 36 44v28z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          MAX Web
        </h2>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
          Быстрый веб-интерфейс для отправки и получения текстовых сообщений через стабильный шлюз <span className="font-semibold text-slate-700">GREEN-API</span>.
        </p>

        {/* Action Button */}
        <button
          onClick={onOpenNewChat}
          className="mt-6 px-6 py-3 bg-[#0066FF] hover:bg-[#0055DD] active:bg-[#0048BB] text-white font-semibold rounded-2xl shadow-md hover:shadow-lg transition duration-150 flex items-center gap-2 text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Начать новый диалог</span>
        </button>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-3 mt-10 w-full text-left">
          <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-sm flex items-start gap-2.5">
            <div className="p-1.5 bg-blue-50 text-[#0066FF] rounded-lg">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-800">HTTP API</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Мгновенное получение ответов через очередь уведомлений
              </p>
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-sm flex items-start gap-2.5">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-800">GREEN-API</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Авторизованный шлюз для мессенджера MAX
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
