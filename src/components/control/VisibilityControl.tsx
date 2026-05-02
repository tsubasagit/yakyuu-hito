import { useGameStore } from '../../store/useGameStore'
import type { Visibility } from '../../types'

/**
 * 表示トグルボタン（最上段固定配置）。
 * 学生がまず最初に触る「表示ON/OFF」パネル。
 * ONはオレンジ塗り、OFFはグレー。大きな長方形ボタン。
 *
 * 状況パネル内（簡易スコア/ダイヤ/BSO）は単独トグルにせず、
 * 状況パネル ON/OFF でまとめて切替（原田様要望: 2026-05-02）。
 */
const MAIN_TOGGLES: { id: keyof Visibility; label: string }[] = [
  { id: 'miniScore',        label: 'ミニスコア' },
  { id: 'pinchHitter',      label: '代打' },
  { id: 'lineup',           label: 'スタメン' },
  { id: 'tournamentHeader', label: '大会名' },
  { id: 'bigScore',         label: '大型スコア' },
  { id: 'inningScoreboard', label: 'イニング別' },
  { id: 'statusPanel',      label: '状況パネル' },
]

export default function VisibilityControl() {
  const visibility = useGameStore((s) => s.visibility)
  const toggle = useGameStore((s) => s.toggleVisibility)

  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="text-xs text-gray-300 mb-2 tracking-widest">表示ON/OFF</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {MAIN_TOGGLES.map(({ id, label }) => (
          <ToggleButton
            key={id}
            label={label}
            on={visibility?.[id] ?? false}
            onClick={() => toggle(id)}
          />
        ))}
      </div>
    </div>
  )
}

function ToggleButton({
  label,
  on,
  onClick,
}: {
  label: string
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[64px] text-base rounded-lg font-bold transition-colors border-2 ${
        on
          ? 'bg-accent text-white border-accent shadow-[0_0_0_2px_rgba(255,255,255,0.1)]'
          : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
      }`}
    >
      {label}
      <div className={`text-[10px] mt-0.5 ${on ? 'text-yellow-200' : 'text-gray-500'}`}>
        {on ? 'ON' : 'OFF'}
      </div>
    </button>
  )
}
