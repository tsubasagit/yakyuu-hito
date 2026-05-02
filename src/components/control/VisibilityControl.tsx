import { useGameStore } from '../../store/useGameStore'
import type { Visibility } from '../../types'

/**
 * 表示トグルボタン（最上段固定配置）。
 * 学生がまず最初に触る「表示ON/OFF」パネル。
 *
 * 上のトグル（オーバーレイの表示要素）と下の編集セクションの対応関係を
 * 視覚的に分かりやすくする（2026-05-02 改善）:
 *  - 各トグルに「編集: 〇〇」サブラベルを表示
 *  - トグル左帯と編集セクション左帯を同色で揃える
 *  - サブラベルクリックで該当セクションへスクロール
 *
 * 状況パネル内（簡易スコア/ダイヤ/BSO）は単独トグルにせず、
 * 状況パネル ON/OFF でまとめて切替（原田様要望: 2026-05-02）。
 */
export interface ToggleMeta {
  id: keyof Visibility
  label: string
  /** 編集元セクション名（下のパネル名と一致） */
  sources: string[]
  /** scrollIntoView 対象のセクションid */
  scrollTarget: string
  /** 帯の色（Tailwind ユーティリティで指定） */
  stripe: string
  /** サブラベル文字色 */
  text: string
}

/** 対応関係マスタ（VisibilityControl と ControlPage 両方で参照） */
export const TOGGLE_META: ToggleMeta[] = [
  {
    id: 'miniScore',
    label: 'ミニスコア',
    sources: ['試合管理', '得点・安打・失策'],
    scrollTarget: 'section-score',
    stripe: 'bg-sky-500',
    text: 'text-sky-300',
  },
  {
    id: 'currentBatter',
    label: '現在の打者',
    sources: ['打順・選手'],
    scrollTarget: 'section-lineup',
    stripe: 'bg-amber-500',
    text: 'text-amber-300',
  },
  {
    id: 'lineup',
    label: 'スタメン',
    sources: ['打順・選手'],
    scrollTarget: 'section-lineup',
    stripe: 'bg-orange-500',
    text: 'text-orange-300',
  },
  {
    id: 'tournamentHeader',
    label: '大会名',
    sources: ['大会情報'],
    scrollTarget: 'section-tournament',
    stripe: 'bg-violet-500',
    text: 'text-violet-300',
  },
  {
    id: 'bigScore',
    label: '大型スコア',
    sources: ['試合管理', '得点・安打・失策'],
    scrollTarget: 'section-score',
    stripe: 'bg-rose-500',
    text: 'text-rose-300',
  },
  {
    id: 'inningScoreboard',
    label: 'イニング別',
    sources: ['得点・安打・失策'],
    scrollTarget: 'section-score',
    stripe: 'bg-emerald-500',
    text: 'text-emerald-300',
  },
  {
    id: 'statusPanel',
    label: '状況パネル',
    sources: ['イニング', 'カウント', '走者'],
    scrollTarget: 'section-count',
    stripe: 'bg-cyan-500',
    text: 'text-cyan-300',
  },
]

/** scrollTarget → stripe color のマップ（ControlPage で使用） */
export function stripeForSection(sectionId: string): string | null {
  const found = TOGGLE_META.find((t) => t.scrollTarget === sectionId)
  return found ? found.stripe : null
}

export default function VisibilityControl() {
  const visibility = useGameStore((s) => s.visibility)
  const toggle = useGameStore((s) => s.toggleVisibility)

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-300 tracking-widest">表示ON/OFF</div>
        <div className="text-[10px] text-gray-500">
          色帯 = 下の編集セクションと対応
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {TOGGLE_META.map((meta) => (
          <ToggleButton
            key={meta.id}
            meta={meta}
            on={visibility?.[meta.id] ?? false}
            onClick={() => toggle(meta.id)}
            onJump={() => scrollTo(meta.scrollTarget)}
          />
        ))}
      </div>
    </div>
  )
}

function ToggleButton({
  meta,
  on,
  onClick,
  onJump,
}: {
  meta: ToggleMeta
  on: boolean
  onClick: () => void
  onJump: () => void
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border-2 transition-colors ${
        on
          ? 'bg-accent text-white border-accent shadow-[0_0_0_2px_rgba(255,255,255,0.1)]'
          : 'bg-gray-700 text-gray-300 border-gray-600'
      }`}
    >
      {/* 左帯（対応する編集セクションの色） */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${meta.stripe}`} />

      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left pl-3 pr-2 pt-2 pb-1 font-bold text-base ${
          on ? '' : 'hover:bg-gray-600'
        }`}
      >
        {meta.label}
        <span className={`ml-1 text-[10px] ${on ? 'text-yellow-200' : 'text-gray-500'}`}>
          {on ? 'ON' : 'OFF'}
        </span>
      </button>

      <button
        type="button"
        onClick={onJump}
        className={`w-full text-left pl-3 pr-2 pb-1.5 text-[10px] truncate hover:underline ${
          on ? 'text-white/85' : meta.text
        }`}
        title={`下の「${meta.sources.join('・')}」を開く`}
      >
        編集 ↓ {meta.sources.join(' / ')}
      </button>
    </div>
  )
}
