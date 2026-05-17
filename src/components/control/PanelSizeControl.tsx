import { useState, useCallback } from 'react'
import { useGameStore } from '../../store/useGameStore'
import type { OverlayPosition, ElementId } from '../../types'
import { DEFAULT_ELEMENT_POSITIONS } from '../../types'

/**
 * パネルサイズ調整コントロール。
 * 表示ON/OFF（VisibilityControl）と紐づくため、その直下に配置する。
 *  - 全体スケール
 *  - 個別パネルの X / Y / 倍率（折りたたみ）
 *  - 全リセット
 */

const PANEL_LABELS: Record<ElementId, string> = {
  miniScore:        'ミニスコア',
  pinchHitter:      '代打カード',
  lineup:           'スタメン',
  tournamentHeader: '大会名ヘッダー',
  bigScore:         '大型スコア',
  inningScoreboard: 'スコアボード',
  statusPanel:      'BSO管理パネル',
  currentBatter:    '現在の打者',
  currentPitcher:   '現在の投手',
}

const PANEL_IDS = Object.keys(PANEL_LABELS) as ElementId[]

export default function PanelSizeControl() {
  const overlayScale = useGameStore((s) => s.overlayScale ?? 1)
  const setOverlayScale = useGameStore((s) => s.setOverlayScale)
  const overlayPositions = useGameStore((s) => s.overlayPositions)
  const setOverlayPosition = useGameStore((s) => s.setOverlayPosition)
  const resetOverlayPositions = useGameStore((s) => s.resetOverlayPositions)

  const [panelOpen, setPanelOpen] = useState(false)

  const updatePanelField = useCallback(
    (id: string, field: keyof OverlayPosition, value: number) => {
      setOverlayPosition(id, { [field]: value })
    },
    [setOverlayPosition],
  )

  return (
    <div className="bg-gray-800 rounded-lg p-3 space-y-3 border border-accent/30">
      <div className="flex items-center justify-between">
        <h3 className="text-accent font-bold text-sm">パネルサイズ調整</h3>
        <span className="text-[10px] text-gray-500">表示ON/OFFと連動して使うパネル</span>
      </div>

      {/* 全体スケール */}
      <div className="flex items-center gap-3">
        <span className="text-white text-xs font-bold whitespace-nowrap">全体</span>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={overlayScale}
          onChange={(e) => setOverlayScale(parseFloat(e.target.value))}
          className="flex-1 accent-accent"
        />
        <span className="text-white text-sm font-mono w-12 text-right">
          {overlayScale.toFixed(1)}x
        </span>
        <button
          onClick={() => setOverlayScale(1)}
          className="bg-gray-600 hover:bg-gray-500 text-gray-300 px-2 py-1 rounded text-xs"
        >
          1x
        </button>
      </div>

      {/* 個別パネル設定ボタン + 全リセット */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="bg-accent/20 hover:bg-accent/30 text-accent text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1"
        >
          <span>{panelOpen ? '▼' : '▶'}</span>
          個別パネル設定
        </button>
        <button
          onClick={resetOverlayPositions}
          className="bg-gray-600 hover:bg-gray-500 text-gray-300 px-3 py-1.5 rounded text-xs font-bold"
        >
          全リセット
        </button>
      </div>

      {panelOpen && (
        <div className="space-y-2 bg-gray-900/40 rounded p-2 border border-gray-700">
          {PANEL_IDS.map((id) => {
            const pos = overlayPositions?.[id]
            const def = DEFAULT_ELEMENT_POSITIONS[id] ?? { x: 0, y: 0 }
            const x = pos?.x ?? def.x
            const y = pos?.y ?? def.y
            const sc = pos?.scale ?? 1
            return (
              <div key={id} className="space-y-1 border-b border-gray-700/50 pb-2 last:border-0 last:pb-0">
                <span className="text-accent text-xs font-bold">{PANEL_LABELS[id]}</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <label className="text-gray-400 text-[10px] font-bold">X</label>
                  <input
                    type="number"
                    value={x}
                    onChange={(e) => updatePanelField(id, 'x', parseInt(e.target.value) || 0)}
                    className="w-16 bg-gray-700 text-white rounded px-1.5 py-1 text-xs font-mono text-right"
                  />
                  <label className="text-gray-400 text-[10px] font-bold">Y</label>
                  <input
                    type="number"
                    value={y}
                    onChange={(e) => updatePanelField(id, 'y', parseInt(e.target.value) || 0)}
                    className="w-16 bg-gray-700 text-white rounded px-1.5 py-1 text-xs font-mono text-right"
                  />
                  <label className="text-gray-400 text-[10px] font-bold">倍率</label>
                  <input
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={sc}
                    onChange={(e) => updatePanelField(id, 'scale', parseFloat(e.target.value) || 1)}
                    className="w-14 bg-gray-700 text-white rounded px-1.5 py-1 text-xs font-mono text-right"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
