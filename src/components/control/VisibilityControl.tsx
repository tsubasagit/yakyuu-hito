import { useCallback } from 'react'
import { useGameStore } from '../../store/useGameStore'
import type { LineupDisplayMode, Visibility, OverlayPosition, ElementId } from '../../types'
import { DEFAULT_ELEMENT_POSITIONS } from '../../types'

/**
 * 表示ON/OFF＋パネルサイズ調整 統合パネル。
 * 各オーバーレイ要素ごとに「表示切替」と「サイズ・位置調整」を同じカード内で操作。
 * - 学生が「ON/OFFしたあと、別の場所でサイズも探す」必要をなくす設計
 * - 2026-05-17 統合（旧 VisibilityControl + PanelSizeControl）
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

/** ElementId → ToggleMeta との対応用ラベル（pinchHitter は visibility flag 経由・分離扱い） */
const ELEMENT_TO_TOGGLE: Record<ElementId, ToggleMeta['id'] | null> = {
  miniScore:        'miniScore',
  lineup:           'lineup',
  tournamentHeader: 'tournamentHeader',
  bigScore:         'bigScore',
  inningScoreboard: 'inningScoreboard',
  statusPanel:      'statusPanel',
  currentBatter:    'currentBatter',
  currentPitcher:   'currentPitcher',
  pinchHitter:      null, // 代打カードは PinchHitterControl 側で表示制御
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
  const overlayScale = useGameStore((s) => s.overlayScale ?? 1)
  const setOverlayScale = useGameStore((s) => s.setOverlayScale)
  const overlayPositions = useGameStore((s) => s.overlayPositions)
  const setOverlayPosition = useGameStore((s) => s.setOverlayPosition)
  const resetOverlayPositions = useGameStore((s) => s.resetOverlayPositions)
  const lineupOn = visibility?.lineup ?? false

  const updatePanelField = useCallback(
    (id: string, field: keyof OverlayPosition, value: number) => {
      setOverlayPosition(id, { [field]: value })
    },
    [setOverlayPosition],
  )

  return (
    <div className="bg-gray-800 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-300 tracking-widest">表示ON/OFF ＆ サイズ調整</div>
        <div className="text-[10px] text-gray-500">パネル毎にON/OFF・サイズを同じ場所で操作</div>
      </div>

      {/* 全体スケール */}
      <div className="flex items-center gap-3 bg-gray-900/40 rounded px-3 py-2 border border-gray-700">
        <span className="text-white text-xs font-bold whitespace-nowrap">全体スケール</span>
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
        <button
          onClick={resetOverlayPositions}
          className="bg-gray-600 hover:bg-gray-500 text-gray-300 px-2 py-1 rounded text-xs"
          title="全パネルの位置・サイズを既定値に戻す"
        >
          位置リセット
        </button>
      </div>

      {/* 統合カード（ON/OFF + サイズ + 位置） */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {TOGGLE_META.map((meta) => (
          <PanelCard
            key={meta.id}
            meta={meta}
            on={visibility?.[meta.id] ?? false}
            onToggle={() => toggle(meta.id)}
            position={overlayPositions?.[ELEMENT_TO_TOGGLE_REVERSE[meta.id] ?? (meta.id as ElementId)]}
            defaultPos={DEFAULT_ELEMENT_POSITIONS[meta.id as ElementId]}
            updateField={updatePanelField}
          />
        ))}
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

/** ToggleMeta id → ElementId のリバースマップ（基本同名だが pinchHitter は対応外） */
const ELEMENT_TO_TOGGLE_REVERSE: Record<string, ElementId> = Object.fromEntries(
  Object.entries(ELEMENT_TO_TOGGLE)
    .filter(([, toggleId]) => toggleId !== null)
    .map(([elementId, toggleId]) => [toggleId as string, elementId as ElementId]),
)

/**
 * 1パネル分のカード。
 * - 上半分: ON/OFF（カード全体クリックで反転）
 * - 下半分: サイズスライダー + X/Y 入力
 */
function PanelCard({
  meta,
  on,
  onToggle,
  position,
  defaultPos,
  updateField,
}: {
  meta: ToggleMeta
  on: boolean
  onToggle: () => void
  position: OverlayPosition | undefined
  defaultPos: OverlayPosition | undefined
  updateField: (id: string, field: keyof OverlayPosition, value: number) => void
}) {
  const elementId = ELEMENT_TO_TOGGLE_REVERSE[meta.id] ?? (meta.id as ElementId)
  const x = position?.x ?? defaultPos?.x ?? 0
  const y = position?.y ?? defaultPos?.y ?? 0
  const sc = position?.scale ?? 1

  return (
    <div
      className={`relative overflow-hidden rounded-lg border-2 transition-colors ${
        on
          ? 'bg-accent/15 border-accent'
          : 'bg-gray-700/60 border-gray-600'
      }`}
    >
      {/* 左帯（対応する編集セクションの色） */}
      <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${meta.stripe}`} />

      {/* 上半分: トグル */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left pl-3 pr-2 py-2 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-white text-base font-bold leading-tight">
            {meta.label}
          </span>
          <span
            className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded ${
              on ? 'bg-accent text-white' : 'bg-gray-600 text-gray-300'
            }`}
          >
            {on ? 'ON' : 'OFF'}
          </span>
        </div>
        <div className={`text-[10px] mt-0.5 truncate ${on ? 'text-white/70' : 'text-gray-400'}`}>
          編集: {meta.sources.join(' / ')}
        </div>
      </button>

      {/* 下半分: サイズ + 位置（常時表示・コンパクト） */}
      <div className="border-t border-gray-700/70 px-3 py-2 space-y-1.5 bg-gray-900/30">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 text-[10px] font-bold w-10 shrink-0">サイズ</span>
          <input
            type="range"
            min="0.3"
            max="3"
            step="0.1"
            value={sc}
            onChange={(e) => updateField(elementId, 'scale', parseFloat(e.target.value) || 1)}
            className="flex-1 accent-accent min-w-0"
            disabled={!on}
            title={on ? `${meta.label} の倍率` : '表示ONにすると調整できます'}
          />
          <span className="text-white text-[11px] font-mono w-10 text-right shrink-0">
            {sc.toFixed(1)}x
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 text-[10px] font-bold w-10 shrink-0">位置</span>
          <label className="text-gray-500 text-[10px] font-bold">X</label>
          <input
            type="number"
            value={x}
            onChange={(e) => updateField(elementId, 'x', parseInt(e.target.value) || 0)}
            className="w-14 bg-gray-700 text-white rounded px-1 py-0.5 text-[11px] font-mono text-right disabled:opacity-40"
            disabled={!on}
          />
          <label className="text-gray-500 text-[10px] font-bold">Y</label>
          <input
            type="number"
            value={y}
            onChange={(e) => updateField(elementId, 'y', parseInt(e.target.value) || 0)}
            className="w-14 bg-gray-700 text-white rounded px-1 py-0.5 text-[11px] font-mono text-right disabled:opacity-40"
            disabled={!on}
          />
        </div>
      </div>
    </div>
  )
}
