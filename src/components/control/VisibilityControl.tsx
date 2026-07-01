import { useCallback, useState } from 'react'
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
  /** ON/OFF トグルをこのカードに出すか。
   *  false の場合は表示切替を別UI（打順表の「打席」「登板」ボタン）に委ね、
   *  このカードでは位置・サイズ調整のみ表示する（2026-05-31 顧客フィードバック⑨）。
   *  省略時は true 扱い。 */
  controllable?: boolean
}

/** 対応関係マスタ（VisibilityControl と ControlPage 両方で参照）。
 *  sources は「この表示パネルの中身を編集できるセクション」の網羅リスト。
 *  学生がパネルをONにした後に「中身どこで直す？」と迷わないよう、
 *  影響を受けるセクションを実情に合わせて列挙する。
 *  （2026-05-28 顧客フィードバック対応: 表示と各セクションのテキスト名整合） */
// バッター・ピッチャーは一番上に配置（2026-05-31 顧客フィードバック⑩）。
// この2枠は ON/OFF を打順表の「打席」「登板」ボタンで操作するため、
// ここではトグルを出さず位置・サイズ調整のみ表示する（同⑨ / controllable:false）。
export const TOGGLE_META: ToggleMeta[] = [
  { id: 'currentBatter',    label: 'バッター',    sources: ['打順・選手'],                                scrollTarget: 'section-lineup',     stripe: 'bg-amber-500',  controllable: false },
  { id: 'currentPitcher',   label: 'ピッチャー',  sources: ['打順・選手'],                                scrollTarget: 'section-lineup',     stripe: 'bg-red-500',    controllable: false },
  { id: 'miniScore',        label: 'ミニスコア',  sources: ['試合管理', 'イニング', '得点'],            scrollTarget: 'section-score',      stripe: 'bg-sky-500'     },
  { id: 'lineup',           label: 'スタメン',    sources: ['打順・選手'],                                scrollTarget: 'section-lineup',     stripe: 'bg-orange-500'  },
  { id: 'tournamentHeader', label: '大会名',      sources: ['大会名'],                                    scrollTarget: 'section-tournament', stripe: 'bg-violet-500'  },
  { id: 'bigScore',         label: '大型スコア',  sources: ['試合管理', 'イニング', '得点'],            scrollTarget: 'section-score',      stripe: 'bg-rose-500'    },
  { id: 'inningScoreboard', label: 'スコアボード', sources: ['試合管理', 'イニング', '得点'],            scrollTarget: 'section-score',      stripe: 'bg-emerald-500' },
  { id: 'statusPanel',      label: 'BSOパネル',   sources: ['試合管理', 'イニング', 'BSO・走者', '得点'], scrollTarget: 'section-count',      stripe: 'bg-cyan-500'    },
  // 速報テロップだけは特殊扱い: 文字入力と一体運用したいので TickerControl 内に ON/OFF・位置を統合
]

/** scrollTarget → stripe color のマップ（ControlPage で使用） */
export function stripeForSection(sectionId: string): string | null {
  const found = TOGGLE_META.find((t) => t.scrollTarget === sectionId)
  return found ? found.stripe : null
}

/** 表示パネルのラベル（例: 'BSOパネル'）→ toggle id のマップ。 */
const LABEL_TO_TOGGLE_ID: Record<string, string> = Object.fromEntries(
  TOGGLE_META.map((t) => [t.label, t.id as string]),
)

/**
 * SectionTitle の「→ パネル名」リンクから、対応する「配信画面に出すパネル」カードへ
 * スクロール＆一時ハイライトする。各コントロールセクションと表示パネルを双方向に結ぶ。
 * （2026-05-31 顧客フィードバック⑧: 各ブロックのリンクを設定）
 */
export function scrollToPanelCard(label: string) {
  const id = LABEL_TO_TOGGLE_ID[label]
  if (!id) return
  const el = document.getElementById(`vispanel-${id}`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.add('ring-2', 'ring-accent', 'ring-offset-2', 'ring-offset-gray-900')
  setTimeout(() => {
    el.classList.remove('ring-2', 'ring-accent', 'ring-offset-2', 'ring-offset-gray-900')
  }, 1200)
}

/** セクション名 → ControlPage 上の section アンカー id。
 *  「編集: XX」リンクから該当セクションへスクロールするのに使う。
 *  ControlPage の orderableSections と整合。 */
const SECTION_NAME_TO_ID: Record<string, string> = {
  '試合管理':       'section-game',  // PINNED セクション（id 'game' で固定描画される DOM はないが安全側で）
  'イニング':       'section-inning',
  'BSO・走者':      'section-count',
  '得点':           'section-score',
  '打順・選手':     'section-lineup',
  '速報テロップ':   'section-ticker',
  '大会名':         'section-tournament',
}

/** セクション名でスムーズスクロール。存在しないアンカーは page top 付近に fallback。 */
function scrollToSection(sectionName: string) {
  const id = SECTION_NAME_TO_ID[sectionName]
  if (!id) return
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // 視覚的にハイライト（1秒）
    el.classList.add('ring-2', 'ring-accent', 'ring-offset-2', 'ring-offset-gray-900')
    setTimeout(() => {
      el.classList.remove('ring-2', 'ring-accent', 'ring-offset-2', 'ring-offset-gray-900')
    }, 1200)
  }
}

/** ElementId → ToggleMeta との対応用ラベル（pinchHitter は廃止・打順内チェックで代用） */
const ELEMENT_TO_TOGGLE: Record<ElementId, ToggleMeta['id'] | null> = {
  miniScore:        'miniScore',
  lineup:           'lineup',
  tournamentHeader: 'tournamentHeader',
  bigScore:         'bigScore',
  inningScoreboard: 'inningScoreboard',
  statusPanel:      'statusPanel',
  currentBatter:    'currentBatter',
  currentPitcher:   'currentPitcher',
  pinchHitter:      null, // 代打カードは廃止（2026-05-18）。打順行の代打チェックで代替
  ticker:           'ticker',
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

  // 各パネルの「サイズ・位置」欄の開閉。初回セットアップ以降はほぼ触らないため、
  // 既定は閉じてカードをコンパクトにし、必要なときだけまとめて開く。
  // （2026-07-01 顧客フィードバック⑦: サイズ・位置はトグルで開閉できるように）
  const [sizeEditOpen, setSizeEditOpen] = useState(false)

  const updatePanelField = useCallback(
    (id: string, field: keyof OverlayPosition, value: number) => {
      setOverlayPosition(id, { [field]: value })
    },
    [setOverlayPosition],
  )

  return (
    <div className="bg-gray-800 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <div className="text-sm text-white font-bold tracking-tight">
          🎬 配信画面に出すパネルを選ぶ
        </div>
        <div className="text-[10px] text-gray-400">
          ON/OFF をパネル毎に操作 ／ ⓘ「編集: ○○」をクリックすると編集場所へ移動
        </div>
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

      {/* サイズ・位置の一括開閉バー。パネル一覧の直上に全幅で置き、見つけやすくする。
          初期設定以降はほぼ触らないため既定は閉じ、必要なときだけ開く。
          （2026-07-01 顧客FB: ヘッダー右上は分かりにくい→一覧のすぐ上へ移動） */}
      <button
        type="button"
        onClick={() => setSizeEditOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded border transition-colors ${
          sizeEditOpen
            ? 'bg-accent/15 border-accent text-white'
            : 'bg-gray-700/70 border-gray-600 text-gray-200 hover:bg-gray-700'
        }`}
        title="各パネルのサイズ・位置の入力欄をまとめて開閉します（初期設定のときだけ開けばOK）"
      >
        <span className="flex items-center gap-2 text-xs font-bold">
          <span className="text-sm leading-none">{sizeEditOpen ? '▼' : '▶'}</span>
          各パネルのサイズ・位置を{sizeEditOpen ? '隠す' : '調整'}
        </span>
        <span className="text-[10px] text-gray-400 font-normal">
          {sizeEditOpen ? '調整欄を表示中' : '通常は閉じたままでOK（初期設定時のみ開く）'}
        </span>
      </button>

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
            sizeEditOpen={sizeEditOpen}
          />
        ))}
      </div>

      {/* スタメン表示モード（OFF状態でも事前設定できるように常時操作可） */}
      <div className="border-t border-gray-700 pt-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-xs text-gray-300">
            スタメン表示モード
            {!lineupOn && (
              <span className="ml-2 text-[10px] text-gray-500">
                （OFF中・ON時に反映）
              </span>
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
              title={m.hint}
              className={`text-xs px-2 py-1.5 rounded font-bold transition-colors ${
                lineupMode === m.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              } ${!lineupOn ? 'opacity-75' : ''}`}
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
  sizeEditOpen,
}: {
  meta: ToggleMeta
  on: boolean
  onToggle: () => void
  position: OverlayPosition | undefined
  defaultPos: OverlayPosition | undefined
  updateField: (id: string, field: keyof OverlayPosition, value: number) => void
  sizeEditOpen: boolean
}) {
  const elementId = ELEMENT_TO_TOGGLE_REVERSE[meta.id] ?? (meta.id as ElementId)
  const x = position?.x ?? defaultPos?.x ?? 0
  const y = position?.y ?? defaultPos?.y ?? 0
  const sc = position?.scale ?? 1
  // controllable=false（バッター/ピッチャー）はこのカードに ON/OFF を出さない。
  // 表示切替は打順表の「打席」「登板」ボタンで行い、ここでは位置・サイズのみ調整する。
  const controllable = meta.controllable !== false
  // 位置・サイズの入力可否。トグル付きカードは ON 中のみ、トグル無しカードは常時可。
  const editable = controllable ? on : true

  return (
    <div
      id={`vispanel-${meta.id}`}
      className={`relative overflow-hidden rounded-lg border-2 transition-colors scroll-mt-4 ${
        on
          ? 'bg-accent/15 border-accent'
          : 'bg-gray-700/60 border-gray-600'
      }`}
    >
      {/* 左帯（対応する編集セクションの色） */}
      <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${meta.stripe}`} />

      {/* 上半分: トグル本体（クリックで ON/OFF）。
          バッター/ピッチャー（controllable=false）はトグルを出さず、ラベルのみ静的表示。 */}
      {controllable ? (
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
        </button>
      ) : (
        <div className="pl-3 pr-2 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-white text-base font-bold leading-tight">
              {meta.label}
            </span>
            <span className="shrink-0 text-[10px] text-gray-300 px-2 py-0.5 rounded bg-gray-600/70">
              表示は打順表で
            </span>
          </div>
        </div>
      )}
      {/* 編集セクションへのジャンプリンク。
          学生が「このパネルの中身どこで直す？」と迷ったら、ここから1クリックで該当セクションへ。
          トグルボタンの中に入れると onClick がバブリングしてしまうので外出し。
          （2026-05-28 顧客フィードバック対応: 表示と各セクションの導線強化） */}
      <div className={`pl-3 pr-2 pb-1.5 flex flex-wrap items-center gap-1 text-[10px] ${on ? 'text-white/70' : 'text-gray-400'}`}>
        <span className="opacity-70 shrink-0">編集:</span>
        {meta.sources.map((src) => (
          <button
            key={src}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              scrollToSection(src)
            }}
            className="px-1.5 py-0.5 rounded bg-gray-800/60 hover:bg-accent hover:text-white border border-gray-700/60 transition-colors"
            title={`${src} セクションへ移動`}
          >
            {src} ↗
          </button>
        ))}
      </div>

      {/* 下半分: サイズ + 位置。初期設定以降は触らないため、
          「サイズ・位置を調整」トグルが ON のときだけ表示する（顧客フィードバック⑦）。 */}
      {sizeEditOpen && (
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
            disabled={!editable}
            title={editable ? `${meta.label} の倍率` : '表示ONにすると調整できます'}
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
            disabled={!editable}
          />
          <label className="text-gray-500 text-[10px] font-bold">Y</label>
          <input
            type="number"
            value={y}
            onChange={(e) => updateField(elementId, 'y', parseInt(e.target.value) || 0)}
            className="w-14 bg-gray-700 text-white rounded px-1 py-0.5 text-[11px] font-mono text-right disabled:opacity-40"
            disabled={!editable}
          />
        </div>
      </div>
      )}
    </div>
  )
}
