import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { aiResumerService } from '../services/aiResumerService.js'

const AiResumerStatusContext = createContext({
  activeJob: null,
  setActiveJob: () => {},
  showToast: () => {},
})

export const AiResumerStatusProvider = ({ children }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeJob, setActiveJob] = useState(null)
  const [toast, setToast] = useState(null)
  const channelRef = useRef(null)
  const toastTimeoutRef = useRef(null)

  useEffect(() => {
    if (!user?.id) {
      setActiveJob(null)
      return
    }

    let mounted = true
    const loadActiveJob = async () => {
      try {
        const job = await aiResumerService.getActiveProcessingJob(user.id)
        if (!mounted) return
        setActiveJob(job && aiResumerService.isFreshActiveJob(job) ? job : null)
      } catch (e) {
        if (!mounted) return
        console.error('AiResumerStatusProvider: failed to load active job', e)
      }
    }

    loadActiveJob()
    return () => { mounted = false }
  }, [user?.id])

  useEffect(() => {
    if (channelRef.current) {
      aiResumerService.removeChannel(channelRef.current)
      channelRef.current = null
    }

    if (!activeJob?.id || !['queued', 'parsing', 'matching'].includes(activeJob.status)) {
      return
    }

    channelRef.current = aiResumerService.subscribeToProcessingJob(activeJob.id, (updatedJob) => {
      if (!aiResumerService.isFreshActiveJob(updatedJob) && updatedJob.status !== 'completed' && updatedJob.status !== 'failed') {
        setActiveJob(null)
        return
      }

      setActiveJob(updatedJob)

      if (updatedJob.status === 'completed') {
        setToast({
          type: 'success',
          message: 'Your job matches are ready',
          actionLabel: 'View Results',
          onAction: () => navigate('/ai-resumer/results'),
        })
        setActiveJob(null)
      } else if (updatedJob.status === 'failed') {
        setToast({
          type: 'error',
          message: updatedJob.error || 'Job matching failed',
          actionLabel: 'Try Again',
          onAction: () => navigate('/ai-resumer/results'),
        })
        setActiveJob(null)
      }
    })

    return () => {
      if (channelRef.current) {
        aiResumerService.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [activeJob?.id, activeJob?.status, navigate])

  useEffect(() => {
    if (!toast) return
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => setToast(null), 5000)
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [toast])

  const value = useMemo(() => ({
    activeJob,
    setActiveJob,
    showToast: (nextToast) => setToast(nextToast),
  }), [activeJob])

  return (
    <AiResumerStatusContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[140] w-[92vw] max-w-md">
          <div className={`rounded-2xl border px-4 py-3 backdrop-blur-xl shadow-xl ${toast.type === 'error' ? 'bg-red-500/90 border-red-300/50 text-white' : 'bg-bg-secondary/95 border-glass-border text-text-primary'}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{toast.message}</p>
              <div className="flex items-center gap-2">
                {toast.actionLabel && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.onAction?.()
                      setToast(null)
                    }}
                    className="text-xs font-semibold underline underline-offset-2"
                  >
                    {toast.actionLabel}
                  </button>
                )}
                <button type="button" onClick={() => setToast(null)} className="text-xs opacity-80 hover:opacity-100">
                  x
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AiResumerStatusContext.Provider>
  )
}

export const useAiResumerStatus = () => useContext(AiResumerStatusContext)
