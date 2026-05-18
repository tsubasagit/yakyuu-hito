import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { DEFAULT_ELEMENT_POSITIONS } from '../../types'
import SectionTitle from './shared/SectionTitle'

/**
 * 速報テロップ。テキスト入力と一体的に運用したいため、
 * ON/OFF・サイズ・位置 もこのパネル内に集約している（他要素は上部 VisibilityControl）。
 */
export default function TickerControl() {
  const ticker = useGameStore((s) => s.ticker)
  const setTicker = useGameStore((s) => s.setTicker)
  const visible = useGameStore((s) => s.visibility?.ticker ?? false)
  const toggleVisibility = useGameStore((s) => s.toggleVisibility)
  const position = useGameStore((s) => s.overlayPositions?.ticker)
  const setOverlayPosition = useGameStore((s) => s.setOverlayPosition)

  const [text, setText] = useState(ticker)

  const defaultPos = DEFAULT_ELEMENT_POSITIONS.ticker
  const x = position?.x ?? defaultPos.x
  const y = position?.y ?? defaultPos.y
  const sc = position?.scale ?? 1

  const apply = () => setTicker(text)
  const clear = () => {
    setText('')
    setTicker('')
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle title="速報テロップ" controls={['速報テロップ']} />
        <button
          onClick={() => toggleVisibility('ticker')}
          className={`shrink-0 text-xs font-bold px-3 py-1 rounded transition-colors ${
            visible
              ? 'bg-yellow-500 text-black hover:bg-yellow-400'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="速報テロップの表示ON/OFF"
        >
          {visible ? 'ON' : 'OFF'}
        </button>
      </div>

      <input
        className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
        placeholder="テロップテキストを入力..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
      />
      <div className="flex gap-2">
        <button
          onClick={apply}
          className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded text-sm font-bold"
        >
          表示
        </button>
        <button
          onClick={clear}
          className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm font-bold"
        >
          クリア
        </button>
      </div>
      {ticker && (
        <div className="text-gray-400 text-xs truncate">
          表示中: {ticker}
        </div>
      )}

      {/* 位置・サイズ */}
      <div className="border-t border-gray-700 pt-3 space-y-2">
        <div className="text-[11px] text-gray-400 tracking-widest">位置・サイズ</div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-[11px] font-bold w-10 shrink-0">サイズ</span>
          <input
            type="range"
            min="0.3"
            max="3"
            step="0.1"
            value={sc}
            onChange={(e) =>
              setOverlayPosition('ticker', { scale: parseFloat(e.target.value) || 1 })
            }
            className="flex-1 accent-yellow-500 min-w-0"
            disabled={!visible}
            title={visible ? 'テロップ枠の倍率' : '表示ONにすると調整できます'}
          />
          <span className="text-white text-[11px] font-mono w-10 text-right shrink-0">
            {sc.toFixed(1)}x
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-[11px] font-bold w-10 shrink-0">位置</span>
          <label className="text-gray-500 text-[11px] font-bold">X</label>
          <input
            type="number"
            value={x}
            onChange={(e) =>
              setOverlayPosition('ticker', { x: parseInt(e.target.value) || 0 })
            }
            className="w-20 bg-gray-700 text-white rounded px-2 py-1 text-xs font-mono text-right disabled:opacity-40"
            disabled={!visible}
          />
          <label className="text-gray-500 text-[11px] font-bold">Y</label>
          <input
            type="number"
            value={y}
            onChange={(e) =>
              setOverlayPosition('ticker', { y: parseInt(e.target.value) || 0 })
            }
            className="w-20 bg-gray-700 text-white rounded px-2 py-1 text-xs font-mono text-right disabled:opacity-40"
            disabled={!visible}
          />
          <span className="text-[10px] text-gray-500 ml-auto">
            ※ オーバーレイ上でドラッグしても移動できます
          </span>
        </div>
      </div>
    </div>
  )
}
