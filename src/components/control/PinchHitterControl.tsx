import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import type { PinchHitter } from '../../types'

/**
 * 代打コントロール: チーム選択・選手名を入力して代打カードに反映する。
 * 「代打として表示」で visibility.pinchHitter を ON。
 *
 * 学生運用のため、入力は最小（チーム + 名前のみ）。
 * 学年・コメント・サンプル補完は野手側に存在しないため不要（2026-05-02 削除）。
 */
export default function PinchHitterControl() {
  const pinchHitter = useGameStore((s) => s.pinchHitter)
  const setPinchHitter = useGameStore((s) => s.setPinchHitter)
  const setVisibility = useGameStore((s) => s.setVisibility)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)

  const [team, setTeam] = useState<'away' | 'home'>(pinchHitter?.team ?? 'away')
  const [name, setName] = useState(pinchHitter?.name ?? '')

  const teamLabel = team === 'away' ? awayTeam.name : homeTeam.name

  const applyAndShow = () => {
    const payload: PinchHitter = { team, name: name.trim() }
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

      {/* チーム選択 */}
      <div className="flex gap-2">
        <TeamRadio label={awayTeam.name} active={team === 'away'} onClick={() => setTeam('away')} />
        <TeamRadio label={homeTeam.name} active={team === 'home'} onClick={() => setTeam('home')} />
      </div>

      <Field label="選手名" value={name} onChange={setName} placeholder="例: 加藤 陸" />

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={applyAndShow}
          disabled={!name.trim()}
          className="flex-1 bg-accent hover:bg-accent/80 disabled:opacity-40 text-white font-bold py-2 rounded"
        >
          代打として表示（{teamLabel}）
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

function TeamRadio({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded font-bold text-sm border-2 ${
        active
          ? 'bg-accent text-white border-accent'
          : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-xs text-gray-300 mb-1 block">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-accent focus:outline-none"
      />
    </label>
  )
}
