'use client'

import { useEffect, useRef } from 'react'

interface ResizerProps {
  direction: 'horizontal' | 'vertical'
  onResize: (delta: number) => void
}

export function Resizer({ direction, onResize }: ResizerProps) {
  const isDragging = useRef(false)
  const startPos = useRef(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return

      const delta = direction === 'horizontal'
        ? e.clientX - startPos.current
        : e.clientY - startPos.current

      onResize(delta)
      startPos.current = direction === 'horizontal' ? e.clientX : e.clientY
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [direction, onResize])

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`bg-[#3e3e42] hover:bg-blue-500 transition-colors ${
        direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'
      }`}
    />
  )
}
