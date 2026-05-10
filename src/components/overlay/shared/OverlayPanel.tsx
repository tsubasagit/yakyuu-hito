import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../../store/useGameStore'
import type { ElementId, OverlayPosition } from '../../../types'
import { setGlobalDragActive } from '../../../lib/dragState'

interface OverlayPanelProps {
  id: ElementId
  defaultPos: OverlayPosition
  children: React.ReactNode
  scale?: number
}

/**
 * 7要素共通ラッパー。
 * - visibility[id] が false なら null を返す
 * - overlayPositions[id] が未設定なら defaultPos にフォールバック
 * - ドラッグ中はローカル state で即時描画し、mouseUp で store に書き戻す
 */
export default function OverlayPanel({ id, defaultPos, children, scale: panelScale = 1 }: OverlayPanelProps) {
  const visible = useGameStore((s) => s.visibility?.[id] ?? true)

  const storeX = useGameStore((s) => s.overlayPositions?.[id]?.x)
  const storeY = useGameStore((s) => s.overlayPositions?.[id]?.y)
  const setOverlayPosition = useGameStore((s) => s.setOverlayPosition)

  const effectiveX = storeX ?? defaultPos.x
  const effectiveY = storeY ?? defaultPos.y

  const [localPos, setLocalPos] = useState({ x: effectiveX, y: effectiveY })
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })
  const localPosRef = useRef(localPos)
  localPosRef.current = localPos

  useEffect(() => {
    if (!dragging.current) {
      setLocalPos({ x: effectiveX, y: effectiveY })
    }
  }, [effectiveX, effectiveY])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    setGlobalDragActive(true)
    const cur = localPosRef.current
    offset.current = { x: e.clientX - cur.x, y: e.clientY - cur.y }
    e.preventDefault()
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setLocalPos({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
      })
    }
    const onMouseUp = () => {
      if (!dragging.current) return
      dragging.current = false
      setGlobalDragActive(false)
      setOverlayPosition(id, localPosRef.current)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [id, setOverlayPosition])

  if (!visible) return null

  return (
    <div
      className="absolute pointer-events-auto drag-handle"
      style={{
        left: localPos.x,
        top: localPos.y,
        transform: panelScale !== 1 ? `scale(${panelScale})` : undefined,
        transformOrigin: 'top left',
      }}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  )
}
