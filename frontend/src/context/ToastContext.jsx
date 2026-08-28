import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback((message, type = 'info') => {
    const id = ++idCounter
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => dismiss(id), 4500)
  }, [dismiss])

  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
    error: <XCircle size={18} className="text-coral-400 shrink-0" />,
    info: <Info size={18} className="text-indigo-500 shrink-0" />,
  }

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[320px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-2 bg-white border border-slate-200 shadow-card rounded-xl px-4 py-3 text-sm animate-[fadein_0.2s_ease-out]"
          >
            {icons[t.type]}
            <p className="flex-1 text-navy-800">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
