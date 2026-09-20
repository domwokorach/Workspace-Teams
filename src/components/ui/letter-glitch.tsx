"use client"

import clsx from "clsx"
import { useCallback, useEffect, useRef } from "react"

interface LetterGlitchProps {
  glitchColors?: string[]
  glitchSpeed?: number
  centerVignette?: boolean
  outerVignette?: boolean
  smooth?: boolean
  className?: string
}

interface Letter {
  char: string
  color: string
  targetColor: string
  colorProgress: number
}

const FONT_SIZE = 16
const CHAR_WIDTH = 10
const CHAR_HEIGHT = 20

const LETTERS_AND_SYMBOLS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "!", "@", "#", "$", "&", "*", "(", ")", "-", "_", "+", "=", "/",
  "[", "]", "{", "}", ";", ":", "<", ">", ",", "0", "1", "2", "3",
  "4", "5", "6", "7", "8", "9",
]

const getRandomChar = () =>
  LETTERS_AND_SYMBOLS[Math.floor(Math.random() * LETTERS_AND_SYMBOLS.length)]

const getRandomColor = (glitchColors: string[]) =>
  glitchColors[Math.floor(Math.random() * glitchColors.length)]

const hexToRgb = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  const fullHex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b)

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

const interpolateColor = (
  start: { r: number; g: number; b: number },
  end: { r: number; g: number; b: number },
  factor: number
) => {
  const result = {
    r: Math.round(start.r + (end.r - start.r) * factor),
    g: Math.round(start.g + (end.g - start.g) * factor),
    b: Math.round(start.b + (end.b - start.b) * factor),
  }
  return `rgb(${result.r}, ${result.g}, ${result.b})`
}

const calculateGrid = (width: number, height: number) => ({
  columns: Math.ceil(width / CHAR_WIDTH),
  rows: Math.ceil(height / CHAR_HEIGHT),
})

export const LetterGlitch: React.FC<LetterGlitchProps> = ({
  glitchColors = ["#2b4539", "#61dca3", "#61b3dc"],
  glitchSpeed = 50,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const animationRef = useRef<number | null>(null)
  const lettersRef = useRef<Letter[]>([])
  const gridRef = useRef({ columns: 0, rows: 0 })
  const lastGlitchTimeRef = useRef(Date.now())
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const glitchColorsRef = useRef(glitchColors)
  const glitchSpeedRef = useRef(glitchSpeed)
  const smoothRef = useRef(smooth)
  glitchColorsRef.current = glitchColors
  glitchSpeedRef.current = glitchSpeed
  smoothRef.current = smooth

  const initializeLetters = useCallback((columns: number, rows: number) => {
    gridRef.current = { columns, rows }
    const totalLetters = columns * rows
    lettersRef.current = Array.from({ length: totalLetters }, () => ({
      char: getRandomChar(),
      color: getRandomColor(glitchColorsRef.current),
      targetColor: getRandomColor(glitchColorsRef.current),
      colorProgress: 1,
    }))
  }, [])

  const drawLetters = useCallback(() => {
    const ctx = contextRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas || lettersRef.current.length === 0) return

    const { width, height } = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, width, height)
    ctx.font = `${FONT_SIZE}px monospace`
    ctx.textBaseline = "top"

    lettersRef.current.forEach((letter, index) => {
      const x = (index % gridRef.current.columns) * CHAR_WIDTH
      const y = Math.floor(index / gridRef.current.columns) * CHAR_HEIGHT
      ctx.fillStyle = letter.color
      ctx.fillText(letter.char, x, y)
    })
  }, [])

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const dpr = window.devicePixelRatio || 1

    const parentWidth = parent.offsetWidth || window.innerWidth
    const parentHeight = parent.offsetHeight || window.innerHeight

    const width = Math.max(parentWidth, 300)
    const height = Math.max(parentHeight, 300)

    canvas.width = width * dpr
    canvas.height = height * dpr

    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    if (contextRef.current) {
      contextRef.current.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const { columns, rows } = calculateGrid(width, height)
    initializeLetters(columns, rows)
    drawLetters()
  }, [drawLetters, initializeLetters])

  const updateLetters = useCallback(() => {
    const letters = lettersRef.current
    if (letters.length === 0) return

    const updateCount = Math.max(1, Math.floor(letters.length * 0.05))

    for (let i = 0; i < updateCount; i++) {
      const index = Math.floor(Math.random() * letters.length)
      const letter = letters[index]
      if (!letter) continue

      letter.char = getRandomChar()
      letter.targetColor = getRandomColor(glitchColorsRef.current)

      if (!smoothRef.current) {
        letter.color = letter.targetColor
        letter.colorProgress = 1
      } else {
        letter.colorProgress = 0
      }
    }
  }, [])

  const handleSmoothTransitions = useCallback(() => {
    let needsRedraw = false
    lettersRef.current.forEach((letter) => {
      if (letter.colorProgress < 1) {
        letter.colorProgress += 0.05
        if (letter.colorProgress > 1) letter.colorProgress = 1

        const startRgb = hexToRgb(letter.color)
        const endRgb = hexToRgb(letter.targetColor)
        if (startRgb && endRgb) {
          letter.color = interpolateColor(startRgb, endRgb, letter.colorProgress)
          needsRedraw = true
        }
      }
    })

    if (needsRedraw) {
      drawLetters()
    }
  }, [drawLetters])

  const animate = useCallback(() => {
    const now = Date.now()
    if (now - lastGlitchTimeRef.current >= glitchSpeedRef.current) {
      updateLetters()
      drawLetters()
      lastGlitchTimeRef.current = now
    }

    if (smoothRef.current) {
      handleSmoothTransitions()
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [drawLetters, handleSmoothTransitions, updateLetters])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    contextRef.current = canvas.getContext("2d")
    resizeCanvas()
    animationRef.current = requestAnimationFrame(animate)

    const handleResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current)
      resizeTimeoutRef.current = setTimeout(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        resizeCanvas()
        animationRef.current = requestAnimationFrame(animate)
      }, 100)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current)
      window.removeEventListener("resize", handleResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    animationRef.current = requestAnimationFrame(animate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glitchSpeed, smooth])

  return (
    <div className={clsx("relative overflow-hidden", className)}>
      <canvas ref={canvasRef} className="absolute left-0 top-0 h-full w-full" />

      {outerVignette && (
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle,rgba(0,0,0,0)_60%,rgba(0,0,0,1)_100%)]" />
      )}

      {centerVignette && (
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0)_60%)]" />
      )}
    </div>
  )
}
