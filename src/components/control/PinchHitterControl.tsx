import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import type { PinchHitter } from '../../types'

/**
 * 代打コントロール: 選手名入力のみ。
 * チームは攻撃中チーム（currentHalf）を自動採用。
 * 学年・コメント・サンプル補完は野手側UIに無いため不要（2026-05-02）。
 */
export default function PinchHitterControl() {
  const pinchHitter = useGameStore((s) => s.pinchHitter)
  const setPinchHitter = useGameStore((s) => s.setPinchHitter)
  const setVisibility = useGameStore((s) => s.setVisibility)
  const currentHalf = useGameStore((s) => s.currentHalf)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)

  const [name, setName] = useState(pinchHitter?.name ?? '')

  const attackingTeamSide: 'away' | 'home' = currentHalf === 'top' ? 'away' : 'home'
  const attackingTeam = attackingTeamSide === 'away' ? awayTeam : homeTeam

  const applyAndShow = () => {
    const payload: PinchHitter = { team: attackingTeamSide, name: name.trim() }
    if (!payload.name) return
    setPinchHitter(payload)
    setVisibility('pinchHitter', true)
  }

  const end = () => {
    setPinchHitter(null)
    setVisibility('pinchHitter', false)
  }

  return (
    <div className="bg-gray-800 rounded-lg p-3 space-y-2">
      <h3 className="text-white font-bold text-sm">代打</h3>

      <div className="text-[11px] text-gray-400">
        現在の攻撃: <span className="text-white font-bold">{attackingTeam.name}</span>
      </div>

      <label className="block">
        <span className="text-xs text-gray-300 mb-1 block">選手名</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 加藤 陸"
          className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-accent focus:outline-none"
        />
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={applyAndShow}
          disabled={!name.trim()}
          className="flex-1 bg-accent hover:bg-accent/80 disabled:opacity-40 text-white font-bold py-2 rounded"
        >
          代打として表示
        </button>
        <button
          type="button"
          onClick={end}
          className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
        >
          終了
        </button>
      </div>

      {pinchHitter && (
        <div className="text-[11px] text-gray-400">
          表示中: {pinchHitter.team === 'away' ? awayTeam.name : homeTeam.name} / {pinchHitter.name}
        </div>
      )}
    </div>
  )
}
