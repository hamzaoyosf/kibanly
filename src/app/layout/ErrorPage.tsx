import React from 'react'
import { useRouteError, isRouteErrorResponse, Link, useNavigate } from 'react-router-dom'
import { Compass, AlertTriangle, ArrowLeft, RefreshCw, Sparkles, Home } from 'lucide-react'

interface ErrorPageProps {
  isNotFound?: boolean
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ isNotFound: propIsNotFound }) => {
  const error = useRouteError()
  const navigate = useNavigate()

  let statusCode = 404
  let title = 'Sector Coordinate Not Found'
  let message =
    "The requested coordinate does not exist in the KiBANLY OS matrix or was redirected to an unregistered path."
  let details: string | null = null

  if (propIsNotFound) {
    statusCode = 404
    title = 'Sector Coordinate Not Found'
    message =
      "The requested coordinate does not exist in the KiBANLY OS matrix or was redirected to an unregistered path."
  } else if (isRouteErrorResponse(error)) {
    statusCode = error.status
    if (error.status === 404) {
      title = 'Sector Coordinate Not Found'
      message =
        "The requested route does not match any registered module or hub in the system."
    } else {
      title = `Application Error (${error.status})`
      message = error.statusText || 'An unexpected operational anomaly occurred.'
      details = typeof error.data === 'string' ? error.data : JSON.stringify(error.data, null, 2)
    }
  } else if (error instanceof Error) {
    statusCode = 500
    title = 'Application Anomaly Detected'
    message = error.message || 'An unhandled exception occurred within the runtime.'
    details = error.stack || null
  }

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-action/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-knowledge/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-surface/90 border border-[rgba(255,255,255,0.08)] backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center animate-fade-in space-y-6">
        {/* Status Indicator Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-surface-2 border border-[rgba(255,255,255,0.1)] flex items-center justify-center relative shadow-[0_0_30px_rgba(34,211,238,0.2)]">
          {statusCode === 404 ? (
            <Compass className="w-8 h-8 text-action animate-pulse" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-capital animate-pulse" />
          )}
          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-surface-3 border border-[rgba(255,255,255,0.12)] text-[10px] font-mono font-bold text-action">
            {statusCode}
          </span>
        </div>

        {/* Header & Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-1.5 text-xs font-mono text-text-faint tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-capital" />
            <span>KiBANLY OS — System Sentinel</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-md mx-auto">
            {message}
          </p>
        </div>

        {/* Collapsible Error Details if present */}
        {details && (
          <div className="text-left">
            <details className="text-[11px] font-mono bg-black/60 border border-[rgba(255,255,255,0.06)] rounded-xl p-3 text-text-faint overflow-x-auto">
              <summary className="cursor-pointer text-text-muted hover:text-text focus:outline-none">
                Diagnostics Details
              </summary>
              <pre className="mt-2 text-[10px] leading-relaxed whitespace-pre-wrap text-danger/80">
                {details}
              </pre>
            </details>
          </div>
        )}

        {/* Primary Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            replace
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-action text-black font-semibold text-xs font-mono flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to Command Deck</span>
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-text border border-[rgba(255,255,255,0.08)] text-xs font-mono flex items-center justify-center space-x-2 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Step Back</span>
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-text-faint hover:text-text border border-[rgba(255,255,255,0.06)] text-xs font-mono flex items-center justify-center space-x-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reboot Link</span>
          </button>
        </div>

        {/* Quick Hub Teleports */}
        <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-faint mb-2.5">
            Operational Hub Teleports
          </p>
          <div className="grid grid-cols-4 gap-2 text-[11px] font-mono">
            <Link
              to="/action"
              className="p-1.5 rounded-lg bg-surface-2/60 hover:bg-surface-2 border border-[rgba(255,255,255,0.04)] hover:border-action/40 text-text-muted hover:text-action transition-all truncate"
            >
              Action
            </Link>
            <Link
              to="/growth"
              className="p-1.5 rounded-lg bg-surface-2/60 hover:bg-surface-2 border border-[rgba(255,255,255,0.04)] hover:border-growth/40 text-text-muted hover:text-growth transition-all truncate"
            >
              Growth
            </Link>
            <Link
              to="/capital"
              className="p-1.5 rounded-lg bg-surface-2/60 hover:bg-surface-2 border border-[rgba(255,255,255,0.04)] hover:border-capital/40 text-text-muted hover:text-capital transition-all truncate"
            >
              Capital
            </Link>
            <Link
              to="/knowledge"
              className="p-1.5 rounded-lg bg-surface-2/60 hover:bg-surface-2 border border-[rgba(255,255,255,0.04)] hover:border-knowledge/40 text-text-muted hover:text-knowledge transition-all truncate"
            >
              Vault
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
