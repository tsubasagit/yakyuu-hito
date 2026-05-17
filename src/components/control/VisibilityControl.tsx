import { useGameStore } from '../../store/useGameStore'
import type { LineupDisplayMode, Visibility } from '../../types'

/**
 * 表示トグルボタン（最上段固定配置）。
 * 学生がまず最初に触る「表示ON/OFF」パネル。
 *
 * 各トグルに左帯の色＋編集元サブラベルを表示し、
 * 下の編集セクションも同色の左帯で対応関係を視覚化する（2026-05-02 改善）。
 *
 * BSOパネル内（簡易スコア/ダイヤ/BSO）は単独トグルにせず、
 * BSOパネル ON/OFF でまとめて切替（原田様要望: 2026-05-02）。
 */
export interface ToggleMeta {
  id: keyof Visibility
  label: string
  /** 編集元セクション名（下のパネル名と一致） */
  sources: string[]
  /** ControlPage で同色の帯を出す対象セクションid（section- プレフィックス付き） */
  scrollTarget: string
  /** 帯の色（Tailwind ユーティリティで指定） */
  stripe: string
}

/** 対応関係マスタ（VisibilityControl と ControlPage 両方で参照） */
export const TOGGLE_META: ToggleMeta[] = [
  { id: 'miniScore',        label: 'ミニスコア',  sources: ['試合管理', '得点'],     scrollTarget: 'section-score',      stripe: 'bg-sky-500'     },
  { id: 'lineup',           label: 'スタメン',    sources: ['打順・選手'],            scrollTarget: 'section-lineup',     stripe: 'bg-orange-500'  },
  { id: 'tournamentHeader', label: '大会名',      sources: ['大会名'],                scrollTarget: 'section-tournament', stripe: 'bg-violet-500'  },
  { id: 'bigScore',         label: '大型スコア',  sources: ['試合管理', '得点'],     scrollTarget: 'section-score',      stripe: 'bg-rose-500'    },
  { id: 'inningScoreboard', label: 'スコアボード', sources: ['得点'],                  scrollTarget: 'section-score',      stripe: 'bg-emerald-500' },
  { id: 'statusPanel',      label: 'BSOパネル',   sources: ['イニング', 'BSOパネル'], scrollTarget: 'section-count',      stripe: 'bg-cyan-500'    },
  { id: 'currentBatter',    label: 'バッター',    sources: ['打順・選手'],            scrollTarget: 'section-lineup',     stripe: 'bg-amber-500'   },
  { id: 'currentPitcher',   label: 'ピッチャー',  sources: ['打順・選手'],            scrollTarget: 'section-lineup',     stripe: 'bg-red-500'     },
]

/** scrollTarget → stripe color のマップ（ControlPage で使用） */
export function stripeForSection(sectionId: string): string | null {
  const found = TOGGLE_META.find((t) => t.scrollTarget === sectionId)
  return found ? found.stripe : null
}

const LINEUP_MODES: { key: LineupDisplayMode; label: string; hint: string }[] = [
  { key: 'attacking', label: '自動（攻撃中）', hint: '攻撃中チームのみ自動表示' },
  { key: 'away',      label: '先攻のみ',       hint: '先攻チームの打順を常時表示' },
  { key: 'home',      label: '後攻のみ',       hint: '後攻チームの打順を常時表示' },
  { key: 'both',      label: '両チーム（VS）', hint: '両チーム並列＋VS表示' },
]

export default function VisibilityControl() {
  const visibility = useGameStore((s) => s.visibility)
  const toggle = useGameStore((s) => s.toggleVisibility)
  const lineupMode = useGameStore((s) => s.lineupDisplayMode ?? 'attacking')
  const setLineupMode = useGameStore((s) => s.setLineupDisplayMode)
  const lineupOn = visibility?.lineup ?? false

  return (
    <div className="bg-gray-800 rounded-lg p-3 space-y-3">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-300 tracking-widest">表示ON/OFF</div>
          <div className="text-[10px] text-gray-500">
            色帯 = 下の編集セクションと対応
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {TOGGLE_META.map((meta) => (
            <ToggleButton
              key={meta.id}
              meta={meta}
              on={visibility?.[meta.id] ?? false}
              onClick={() => toggle(meta.id)}
            />
          ))}
        </div>
      </div>

      {/* スタメン表示モード（表示ON時のみ操作可） */}
      <div className="border-t border-gray-700 pt-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-xs text-gray-300">
            スタメン表示モード
            {!lineupOn && (
              <span className="ml-2 text-[10px] text-gray-500">（スタメンOFF中）</span>
            )}
          </div>
          <div className="text-[10px] text-gray-500">
            {LINEUP_MODES.find((m) => m.key === lineupMode)?.hint}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {LINEUP_MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setLineupMode(m.key)}
              disabled={!lineupOn}
              title={m.hint}
              className={`text-xs px-2 py-1.5 rounded font-bold transition-colors ${
                !lineupOn
                  ? 'bg-gray-700/40 text-gray-500 cursor-not-allowed'
                  : lineupMode === m.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ToggleButton({
  meta,
  on,
  onClick,
}: {
  meta: ToggleMeta
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden min-h-[64px] text-left rounded-lg font-bold border-2 transition-colors pl-3 pr-2 py-2 ${
        on
          ? 'bg-accent text-white border-accent shadow-[0_0_0_2px_rgba(255,255,255,0.1)]'
          : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
      }`}
    >
      {/* 左帯（対応する編集セクションの色） */}
      <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${meta.stripe}`} />

      <div className="text-base">
        {meta.label}
        <span className={`ml-1 text-[10px] ${on ? 'text-yellow-200' : 'text-gray-500'}`}>
          {on ? 'ON' : 'OFF'}
        </span>
      </div>
      <div className={`text-[10px] mt-0.5 truncate ${on ? 'text-white/80' : 'text-gray-400'}`}>
        編集: {meta.sources.join(' / ')}
      </div>
    </button>
  )
}
