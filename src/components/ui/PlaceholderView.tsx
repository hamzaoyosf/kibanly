import React from 'react'

interface PlaceholderViewProps {
  title: string
  subtitle?: string
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, subtitle }) => {
  return (
    <div className="card p-6 md:p-8 min-h-[320px] flex flex-col justify-center items-center text-center">
      <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-text">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-sm text-text-muted max-w-md">
          {subtitle}
        </p>
      )}
    </div>
  )
}
