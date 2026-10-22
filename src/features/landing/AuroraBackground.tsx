import React from 'react'
import { motion } from 'framer-motion'

export const AuroraBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Deep dark canvas base */}
      <div className="absolute inset-0 bg-[#090D16]" />

      {/* Subtle Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Glowing Blob 1 - Emerald / Mint (Top Center-Left) */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -35, 20, 0],
          scale: [1, 1.12, 0.95, 1],
          opacity: [0.18, 0.28, 0.2, 0.18],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-32 left-1/4 w-[550px] h-[550px] rounded-full bg-emerald-500/25 blur-[140px]"
      />

      {/* Glowing Blob 2 - Cyan / Sky (Center Hero) */}
      <motion.div
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.92, 1.08, 1],
          opacity: [0.16, 0.25, 0.15, 0.16],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 -right-20 w-[600px] h-[600px] rounded-full bg-sky-500/20 blur-[150px]"
      />

      {/* Glowing Blob 3 - Violet / Indigo (Mid-Bottom Center) */}
      <motion.div
        animate={{
          x: [0, 50, -40, 0],
          y: [0, -40, 35, 0],
          scale: [1, 1.15, 0.92, 1],
          opacity: [0.12, 0.22, 0.14, 0.12],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-2/3 left-1/3 w-[650px] h-[650px] rounded-full bg-indigo-600/18 blur-[160px]"
      />

      {/* Glowing Blob 4 - Amber Accent (Bottom Left) */}
      <motion.div
        animate={{
          x: [0, -25, 35, 0],
          y: [0, 25, -20, 0],
          scale: [1, 1.08, 0.96, 1],
          opacity: [0.1, 0.18, 0.12, 0.1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-10 left-10 w-[450px] h-[450px] rounded-full bg-amber-500/15 blur-[130px]"
      />

      {/* Subtle Vignette gradient mask */}
      <div className="absolute inset-0 bg-radial-vignette opacity-60" />
    </div>
  )
}
