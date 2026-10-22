import React, { useState } from 'react'
import { motion, useTime, useTransform, MotionValue } from 'framer-motion'
import { CheckSquare, RefreshCw, Timer, Brain } from 'lucide-react'

interface NodeConfig {
  id: string
  name: string
  subtitle: string
  icon: React.ReactNode
  color: string
  glowColor: string
  borderColor: string
  phaseOffset: number // radians
}

const NODES: NodeConfig[] = [
  {
    id: 'action',
    name: 'Action Hub',
    subtitle: 'GTD & Execution',
    icon: <CheckSquare className="w-5 h-5 text-sky-400" />,
    color: 'text-sky-400',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    borderColor: 'border-sky-400/50',
    phaseOffset: 0, // 0 deg
  },
  {
    id: 'recall',
    name: 'Recall Loop',
    subtitle: 'Smart Retention',
    icon: <RefreshCw className="w-5 h-5 text-emerald-400" />,
    color: 'text-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.45)',
    borderColor: 'border-emerald-400/50',
    phaseOffset: (2 * Math.PI) / 3, // 120 deg
  },
  {
    id: 'focus',
    name: 'Focus',
    subtitle: 'Deep Work & Timeline',
    icon: <Timer className="w-5 h-5 text-amber-400" />,
    color: 'text-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.45)',
    borderColor: 'border-amber-400/50',
    phaseOffset: (4 * Math.PI) / 3, // 240 deg
  },
]

// Orbital Geometry Parameters
const Rx = 180 // Semi-major axis (horizontal reach)
const Ry = 70 // Semi-minor axis (vertical reach - tilted perspective)
const TILT_DEG = -12 // Slanted elliptical orbit inclination angle
const TILT_RAD = (TILT_DEG * Math.PI) / 180
const cosTilt = Math.cos(TILT_RAD)
const sinTilt = Math.sin(TILT_RAD)
const ORBIT_PERIOD_MS = 20000 // 20s per full 360 revolution

interface OrbitNodeProps {
  node: NodeConfig
  time: MotionValue<number>
  isHovered: boolean
  onHover: (id: string | null) => void
}

const OrbitNode: React.FC<OrbitNodeProps> = ({ node, time, isHovered, onHover }) => {
  // Continuous orbital angle theta (0 to 2*PI)
  const theta = useTransform(time, (t) => {
    return ((t / ORBIT_PERIOD_MS) * 2 * Math.PI + node.phaseOffset) % (2 * Math.PI)
  })

  // 3D Cartesian coordinates with tilted ellipse projection
  const x = useTransform(theta, (th) => {
    const u = Rx * Math.cos(th)
    const v = Ry * Math.sin(th)
    return u * cosTilt - v * sinTilt
  })

  const y = useTransform(theta, (th) => {
    const u = Rx * Math.cos(th)
    const v = Ry * Math.sin(th)
    return u * sinTilt + v * cosTilt
  })

  // Z-Axis Depth of Field: sin(th) determines front vs back position
  // sin(th) < 0 => Back half (behind Central Core)
  // sin(th) >= 0 => Front half (in front of Central Core)
  const scale = useTransform(theta, (th) => {
    const s = Math.sin(th)
    // Range: 0.70 (farthest behind) to 1.25 (closest in front)
    return s < 0 ? 0.95 + s * 0.25 : 0.95 + s * 0.30
  })

  const opacity = useTransform(theta, (th) => {
    const s = Math.sin(th)
    // Range: 0.40 (behind) to 1.0 (front)
    return s < 0 ? 0.70 + s * 0.30 : 0.70 + s * 0.30
  })

  const filter = useTransform(theta, (th) => {
    const s = Math.sin(th)
    if (s >= 0) return 'blur(0px)'
    const blurPx = Math.abs(s) * 2.5
    return `blur(${blurPx.toFixed(1)}px)`
  })

  // Layering: Core sphere is at z-index: 20
  // Behind core => z-index: 10, In front of core => z-index: 30
  const zIndex = useTransform(theta, (th) => {
    return Math.sin(th) < 0 ? 10 : 30
  })

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        x,
        y,
        scale,
        opacity,
        filter,
        zIndex,
      }}
      className="pointer-events-auto"
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2 group cursor-pointer select-none">
        {/* Node Body with Glow */}
        <div
          style={{
            boxShadow: isHovered
              ? `0 0 35px ${node.glowColor}`
              : `0 0 20px ${node.glowColor}`,
          }}
          className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full p-[1.5px] bg-gradient-to-b from-white/35 to-white/5 transition-transform duration-200 group-hover:scale-110 active:scale-95`}
        >
          <div
            className={`w-full h-full rounded-full bg-[#0C1220]/90 backdrop-blur-xl border ${node.borderColor} flex items-center justify-center shadow-inner`}
          >
            {node.icon}
          </div>
        </div>

        {/* Floating Node Label Pill */}
        <div
          className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/15 text-[10px] font-mono whitespace-nowrap transition-all duration-200 shadow-md ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-80 scale-95'
          }`}
        >
          <span className={`font-semibold ${node.color}`}>{node.name}</span>
        </div>
      </div>
    </motion.div>
  )
}

export const InteractiveCore: React.FC = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const time = useTime()

  return (
    <div
      style={{ perspective: '1000px' }}
      className="relative flex items-center justify-center w-full max-w-[460px] aspect-square mx-auto select-none"
    >
      {/* Ambient Radial Under-Glow in background */}
      <div className="absolute w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-emerald-500/20 via-sky-500/15 to-purple-500/20 blur-[90px] pointer-events-none z-0" />

      {/* SVG 3D-Tilted Elliptical Orbit Paths */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
        viewBox="-230 -230 460 460"
      >
        <defs>
          <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
            <stop offset="50%" stopColor="rgba(52, 211, 153, 0.5)" />
            <stop offset="100%" stopColor="rgba(251, 191, 36, 0.4)" />
          </linearGradient>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(52, 211, 153, 0.3)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Tilted Elliptical Orbit Rings */}
        <g transform={`rotate(${TILT_DEG})`}>
          {/* Outer Faint Orbit Guide */}
          <ellipse
            cx="0"
            cy="0"
            rx={Rx + 28}
            ry={Ry + 14}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />

          {/* Main Elliptical Orbit Track (Dashed) */}
          <ellipse
            cx="0"
            cy="0"
            rx={Rx}
            ry={Ry}
            fill="none"
            stroke="url(#orbitGradient)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            opacity="0.65"
          />

          {/* Inner Accent Track */}
          <ellipse
            cx="0"
            cy="0"
            rx={Rx - 35}
            ry={Ry - 16}
            fill="none"
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        </g>
      </svg>

      {/* Physics of Shadows: Gradient Drop Shadow below the Central Core */}
      <motion.div
        animate={{
          scaleX: [1, 1.15, 0.95, 1],
          scaleY: [1, 1.08, 0.92, 1],
          opacity: [0.45, 0.65, 0.45],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[calc(50%+65px)] left-1/2 -translate-x-1/2 w-44 h-11 rounded-[50%] bg-gradient-to-r from-emerald-900/40 via-black/90 to-sky-900/40 blur-md pointer-events-none z-10"
      />

      {/* Orbiting Nodes (render at z-10 when behind, z-30 when in front) */}
      {NODES.map((node) => (
        <OrbitNode
          key={node.id}
          node={node}
          time={time}
          isHovered={hoveredNode === node.id}
          onHover={setHoveredNode}
        />
      ))}

      {/* Central Core Sphere (Layered at z-index: 20 between back and front nodes) */}
      <motion.div
        animate={{
          y: [-6, 6, -6],
          scale: [1, 1.025, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ zIndex: 20 }}
        className="relative group cursor-pointer"
      >
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full p-[2px] bg-gradient-to-br from-white/40 via-white/10 to-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.35)] transition-all duration-300 group-hover:shadow-[0_0_80px_rgba(16,185,129,0.55)]">
          {/* Glass Sphere Body */}
          <div className="w-full h-full rounded-full bg-white/[0.06] backdrop-blur-2xl border border-white/20 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_2px_14px_rgba(255,255,255,0.3),inset_0_-8px_18px_rgba(0,0,0,0.6)]">
            {/* Top Curvature Glass Specular Highlight */}
            <div className="absolute top-1.5 inset-x-4 h-8 rounded-full bg-gradient-to-b from-white/35 to-transparent blur-[1px] pointer-events-none" />

            {/* Glowing Center Nucleus */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.5, 0.9, 0.5],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-12 h-12 rounded-full bg-emerald-400/35 blur-md"
              />
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.6)]">
                <Brain className="w-5 h-5 text-[#090D16]" />
              </div>
            </div>

            <span className="mt-2 text-[11px] font-mono font-bold tracking-wider text-white/90">
              CORE
            </span>
            <span className="text-[9px] font-mono text-emerald-400/90 tracking-widest">
              ACTIVE
            </span>
          </div>
        </div>

        {/* Hover Tooltip / Status Pill */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-mono text-white/80 shadow-lg">
            OBOiFY Cognitive Core
          </div>
        </div>
      </motion.div>
    </div>
  )
}
