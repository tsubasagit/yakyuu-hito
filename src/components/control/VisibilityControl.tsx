import { useGameStore } from '../../store/useGameStore'
import type { Visibility } from '../../types'

/**
 * 7つの表示トグルボタン（最上段固定配置）。
 * 学生がまず最初に触る「表示ON/OFF」パネル。
 * ONはオレンジ塗り、OFFはグレー。大きな長方形ボタン。
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

const SUB_TOGGLES: { id: keyof Visibility; label: string }[] = [
  { id: 'statusPanel_quickScore', label: '簡易スコア' },
  { id: 'statusPanel_diamond',    label: 'ダイヤ' },
  { id: 'statusPanel_bso',        label: 'BSO' },
]

export default function VisibilityControl() {
  const visibility = useGameStore((s) => s.visibility)
  const toggle = useGameStore((s) => s.toggleVisibility)

  return (
    <div className="bg-gray-800 rounded-lg p-3 space-y-3">
      <div>
        <div className="text-xs text-gray-300 mb-2 tracking-widest">表示ON/OFF</div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
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

      {/* 状況パネル内のサブトグル（状況パネルONのときのみ表示） */}
      {(visibility?.statusPanel ?? false) && (
        <div>
          <div className="text-xs text-gray-400 mb-2 tracking-widest">状況パネル内</div>
          <div className="grid grid-cols-3 gap-2">
            {SUB_TOGGLES.map(({ id, label }) => (
              <ToggleButton
                key={id}
                label={label}
                on={visibility?.[id] ?? false}
                onClick={() => toggle(id)}
                small
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleButton({
  label,
  on,
  onClick,
  small = false,
}: {
  label: string
  on: boolean
  onClick: () => void
  small?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${
        small ? 'min-h-[44px] text-sm' : 'min-h-[64px] text-base'
      } rounded-lg font-bold transition-colors border-2 ${
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
