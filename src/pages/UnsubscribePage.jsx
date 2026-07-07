import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { unsubscribeByToken } from '../services/newsletterService.js'

const SUPPORT_EMAIL = 'support@swipy.space'
const SWIPY_HOME = 'https://swipy.space'

const STATE_COPY = {
  loading: {
    title: 'Processing your request…',
    message: 'Please wait while we update your email preferences.',
    icon: 'fa-spinner fa-spin',
  },
  success: {
    title: 'You have been unsubscribed from Swipy emails.',
    message: 'You will no longer receive marketing or newsletter messages from us.',
    icon: 'fa-check-circle',
  },
  already_unsubscribed: {
    title: 'You are already unsubscribed.',
    message: 'This email address is not on our active newsletter list.',
    icon: 'fa-info-circle',
  },
  invalid_token: {
    title: 'This unsubscribe link is invalid or expired.',
    message: 'The link may be broken or no longer valid. Contact us if you need help.',
    icon: 'fa-exclamation-circle',
  },
  error: {
    title: 'Something went wrong.',
    message: `Please contact ${SUPPORT_EMAIL}.`,
    icon: 'fa-times-circle',
  },
}

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams()
  const [pageState, setPageState] = useState('loading')

  useEffect(() => {
    document.documentElement.classList.add('unsubscribe-page-active')
    document.body.classList.add('unsubscribe-page-active')

    return () => {
      document.documentElement.classList.remove('unsubscribe-page-active')
      document.body.classList.remove('unsubscribe-page-active')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const token = searchParams.get('token')

    const run = async () => {
      setPageState('loading')
      const result = await unsubscribeByToken(token)
      if (!cancelled) {
        setPageState(result)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [searchParams])

  const copy = STATE_COPY[pageState] || STATE_COPY.error
  const isError = pageState === 'error' || pageState === 'invalid_token'
  const isMuted = pageState === 'already_unsubscribed'

  return (
    <>
      <style>{`
        html.unsubscribe-page-active,
        body.unsubscribe-page-active {
          margin: 0;
          padding: 0;
          min-height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          background: #1C1C1E;
        }

        body.unsubscribe-page-active #root {
          min-height: 100vh;
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-bg-primary relative overflow-hidden">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(72, 128, 255, 0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(10, 132, 255, 0.08) 0%, transparent 50%)',
          }}
        />

        <div className="relative w-full max-w-md bg-bg-secondary/90 backdrop-blur-xl border border-glass-border rounded-3xl shadow-heavy px-8 py-10 text-center">
          <div className="text-3xl font-bold text-accent-primary tracking-tight mb-8">
            Swipy
          </div>

          <div
            className={`text-5xl mb-5 ${
              isError
                ? 'text-accent-danger'
                : isMuted
                  ? 'text-text-secondary'
                  : 'text-accent-primary'
            }`}
            aria-hidden="true"
          >
            <i className={`fas ${copy.icon}`} />
          </div>

          <h1 className="text-xl font-semibold text-text-primary leading-snug mb-3">
            {copy.title}
          </h1>
          <p className="text-[15px] leading-relaxed text-text-secondary mb-7">
            {copy.message}
          </p>

          {pageState !== 'loading' && (
            <a
              className="inline-block bg-accent-primary text-white text-[15px] font-semibold px-7 py-3 rounded-2xl transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:scale-95"
              href={SWIPY_HOME}
            >
              Back to Swipy
            </a>
          )}

          <p className="mt-7 text-sm text-text-secondary">
            Questions?{' '}
            <a
              className="text-accent-primary hover:underline transition-colors"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </>
  )
}

export default UnsubscribePage
