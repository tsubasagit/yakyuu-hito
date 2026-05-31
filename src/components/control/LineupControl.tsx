import { useRef, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import type { DhMode, LineupPlayer, Position } from '../../types'
import { TEITO_LINEUP, SORYO_LINEUP } from '../../types'
import { parseLineupCsv, LINEUP_CSV_SAMPLE } from '../../lib/csvImport'
import { positionLabel, POSITIONS_WITH_DH, POSITIONS_NO_DH } from '../../lib/positionLabel'
import SectionTitle from './shared/SectionTitle'

function downloadCsvSample() {
  // BOM付きでExcelの文字化け回避
  const blob = new Blob(['﻿' + LINEUP_CSV_SAMPLE], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'lineup_sample.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 学年候補。通常学部1-4年＋6年制学部の5・6年＋大学院。常時フルリスト表示のため select で固定 */
const GRADE_OPTIONS = ['1年', '2年', '3年', '4年', '5年', '6年', '院1', '院2', '院3'] as const

/** select 用にプリセット候補と過去値（CSV由来の自由入力など）をマージ */
function gradeOptionsWith(current: string | undefined): readonly string[] {
  if (current && !GRADE_OPTIONS.includes(current as (typeof GRADE_OPTIONS)[number])) {
    return [current, ...GRADE_OPTIONS]
  }
  return GRADE_OPTIONS
}

function BatterRow({
  player,
  isCurrent,
  dhMode,
  currentBatterVisible,
  onSelect,
  onChange,
}: {
  player: LineupPlayer
  isCurrent: boolean
  dhMode: DhMode
  currentBatterVisible: boolean
  onSelect: () => void
  onChange: (p: LineupPlayer) => void
}) {
  const positions = dhMode === 'none' ? POSITIONS_NO_DH : POSITIONS_WITH_DH
  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 text-sm rounded px-1.5 py-1 ${
        isCurrent ? 'bg-accent/30 ring-1 ring-accent' : ''
      } ${player.isPinchHit ? 'bg-amber-900/20 ring-1 ring-amber-500/40' : ''}`}
    >
      <span className="text-gray-500 w-4 text-center text-xs shrink-0">
        {player.order}
      </span>
      <select
        className="bg-gray-700 text-white rounded px-1 py-1 text-xs w-24 shrink-0"
        value={player.position}
        // 代打中でも守備位置を選べる。位置を選んだ瞬間に代打フラグを自動解除
        // （代打選手がそのまま守備につく運用に対応／2026-05-21 顧客フィードバック）
        onChange={(e) =>
          onChange({
            ...player,
            position: e.target.value as Position,
            isPinchHit: false,
          })
        }
        title={player.isPinchHit ? '守備位置を選ぶと代打表示は自動解除されます' : ''}
      >
        <option value="">--</option>
        {positions.map((p) => (
          <option key={p} value={p}>{positionLabel(p)}</option>
        ))}
      </select>
      <input
        className="bg-gray-700 text-white rounded px-2 py-1 text-xs flex-1 min-w-[100px]"
        placeholder="名前"
        value={player.name}
        onChange={(e) => onChange({ ...player, name: e.target.value })}
      />
      <select
        className="bg-gray-700 text-white rounded px-1 py-1 text-xs w-16 shrink-0"
        value={player.grade ?? ''}
        onChange={(e) => onChange({ ...player, grade: e.target.value })}
        title="学年（プルダウンから選択）"
      >
        <option value="">学年</option>
        {gradeOptionsWith(player.grade).map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <textarea
        className="bg-gray-700 text-white rounded px-2 py-1 text-xs flex-1 min-w-[120px] resize-y leading-snug"
        placeholder="コメント（打者テロップに表示・Enterで改行）"
        rows={2}
        value={player.comment ?? ''}
        onChange={(e) => onChange({ ...player, comment: e.target.value })}
      />
      <label
        className={`flex items-center gap-1 px-1.5 py-1 rounded shrink-0 text-[11px] font-bold cursor-pointer ${
          player.isPinchHit
            ? 'bg-amber-500 text-black'
            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
        }`}
        title="ON にすると守備位置の代わりに「代打」が表示されます"
      >
        <input
          type="checkbox"
          className="accent-amber-500"
          checked={player.isPinchHit ?? false}
          onChange={(e) => onChange({ ...player, isPinchHit: e.target.checked })}
        />
        代打
      </label>
      <button
        onClick={onSelect}
        className={`text-xs px-2 py-1 rounded shrink-0 font-bold ${
          isCurrent && currentBatterVisible
            ? 'bg-accent text-white'
            : isCurrent && !currentBatterVisible
            ? 'bg-gray-600 text-gray-300 ring-1 ring-accent'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }`}
        title={
          isCurrent && currentBatterVisible
            ? '打者パネルを非表示にする'
            : isCurrent && !currentBatterVisible
            ? '打者パネルを表示する'
            : 'この打者を選択して表示'
        }
      >
        打席
        {isCurrent && (
          <span className="ml-1 text-[9px] opacity-80">
            {currentBatterVisible ? 'ON' : 'OFF'}
          </span>
        )}
      </button>
    </div>
  )
}

function PitcherRow({
  player,
  isCurrent,
  isDefending,
  currentPitcherVisible,
  onSelect,
  onChange,
}: {
  player: LineupPlayer
  isCurrent: boolean
  /** このチームが守備中か。守備中の投手は実際にマウンドに立つため強調表示する */
  isDefending: boolean
  currentPitcherVisible: boolean
  onSelect: () => void
  onChange: (p: LineupPlayer) => void
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 text-sm rounded px-1.5 py-1 transition-colors ${
        isDefending
          ? 'bg-red-700/40 border-2 border-red-500 ring-1 ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.25)]'
          : 'bg-red-900/15 border border-red-800/20 opacity-70'
      }`}
    >
      <span className="text-red-300 w-4 text-center text-xs shrink-0 font-bold">
        P
      </span>
      <span className="text-red-300 text-xs w-24 shrink-0 text-center font-bold flex items-center justify-center gap-1">
        ピッチャー
        {isDefending && (
          <span className="bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full animate-pulse shrink-0">登板中</span>
        )}
      </span>
      <input
        className="bg-gray-700 text-white rounded px-2 py-1 text-xs flex-1 min-w-[100px]"
        placeholder="投手名"
        value={player.name}
        onChange={(e) => onChange({ ...player, name: e.target.value })}
      />
      <select
        className="bg-gray-700 text-white rounded px-1 py-1 text-xs w-16 shrink-0"
        value={player.grade ?? ''}
        onChange={(e) => onChange({ ...player, grade: e.target.value })}
        title="学年（プルダウンから選択）"
      >
        <option value="">学年</option>
        {gradeOptionsWith(player.grade).map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <textarea
        className="bg-gray-700 text-white rounded px-2 py-1 text-xs flex-1 min-w-[120px] resize-y leading-snug"
        placeholder="コメント（投手テロップに表示・Enterで改行）"
        rows={2}
        value={player.comment ?? ''}
        onChange={(e) => onChange({ ...player, comment: e.target.value })}
      />
      <button
        onClick={onSelect}
        className={`text-xs px-2 py-1 rounded shrink-0 font-bold ${
          isCurrent && currentPitcherVisible
            ? 'bg-red-600 text-white'
            : isCurrent && !currentPitcherVisible
            ? 'bg-gray-600 text-gray-300 ring-1 ring-red-500'
            : 'bg-red-800 hover:bg-red-700 text-white'
        }`}
        title={
          isCurrent && currentPitcherVisible
            ? '投手パネルを非表示にする'
            : isCurrent && !currentPitcherVisible
            ? '投手パネルを表示する'
            : 'この投手を選択して表示'
        }
      >
        登板
        {isCurrent && (
          <span className="ml-1 text-[9px] opacity-80">
            {currentPitcherVisible ? 'ON' : 'OFF'}
          </span>
        )}
      </button>
    </div>
  )
}

/** 1チーム分の打順パネル */
function TeamLineupPanel({ side }: { side: 'away' | 'home' }) {
  const [csvError, setCsvError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const team = useGameStore((s) => side === 'away' ? s.awayTeam : s.homeTeam)
  const lineup = useGameStore((s) => side === 'away' ? s.awayLineup : s.homeLineup)
  const batterIdx = useGameStore((s) => side === 'away' ? s.awayBatterIndex : s.homeBatterIndex)
  const currentHalf = useGameStore((s) => s.currentHalf)
  // DH制は両チーム共通。旧データ互換のため away/home フィールドも fallback として参照。
  const dhMode = useGameStore((s) => s.dhMode ?? s.awayDhMode ?? s.homeDhMode ?? 'dh')
  // 試合開始フラグ。true の間は DH制・打順並び替え・選手追加削除・CSV をロック。
  const gameStarted = useGameStore((s) => s.gameStarted ?? false)
  const setLineupPlayer = useGameStore((s) => s.setLineupPlayer)
  const setLineup = useGameStore((s) => s.setLineup)
  const selectBatter = useGameStore((s) => s.selectBatter)
  const nextBatter = useGameStore((s) => s.nextBatter)
  const prevBatter = useGameStore((s) => s.prevBatter)
  const setLineupDisplayTeam = useGameStore((s) => s.setLineupDisplayTeam)
  // 打者/投手テロップの表示元チーム（完全手動・攻守独立）。「打席」「登板」ボタンで切替。
  const batterDisplayTeam = useGameStore((s) => s.batterDisplayTeam ?? 'away')
  const pitcherDisplayTeam = useGameStore((s) => s.pitcherDisplayTeam ?? 'home')
  const currentBatterVisible = useGameStore((s) => s.visibility?.currentBatter ?? false)
  const currentPitcherVisible = useGameStore((s) => s.visibility?.currentPitcher ?? false)
  const toggleVisibility = useGameStore((s) => s.toggleVisibility)

  // DHなしモード: 投手が1-9番に居ないと警告
  const hasPitcherInBatters = lineup.slice(0, 9).some((p) => p.position === '投')
  // DHあり/二刀流モード: DH指名選手が1-9番に居ないと警告
  const hasDhInBatters = lineup.slice(0, 9).some((p) => p.position === 'DH')

  const isAttacking = (side === 'away' && currentHalf === 'top') ||
    (side === 'home' && currentHalf === 'bottom')
  const label = side === 'away' ? '先攻' : '後攻'

  // 打席ボタン: 攻守問わず動作。同じ打者（同チーム&同インデックス）なら currentBatter パネルを ON/OFF 切替、
  // 別打者・別チームなら選択 + パネルを ON。
  // 打者OFFに切り替わるタイミングで、その打者の代打フラグも一緒に解除する
  //（代打→打席ON→OFFで代打表示が残るのを防ぐ／2026-05-21 顧客フィードバック）
  const handleBatterButton = (idx: number) => {
    const isAlreadyCurrent = idx === batterIdx && batterDisplayTeam === side
    if (isAlreadyCurrent) {
      const willBeOff = currentBatterVisible
      toggleVisibility('currentBatter')
      if (willBeOff) {
        const player = lineup[idx]
        if (player?.isPinchHit) {
          setLineupPlayer(side, idx, { ...player, isPinchHit: false })
        }
      }
    } else {
      selectBatter(side, idx)
      if (!currentBatterVisible) toggleVisibility('currentBatter')
    }
  }

  // 登板ボタン: 攻守問わず動作。同じ投手（同チーム）なら currentPitcher パネルを ON/OFF 切替、
  // 別チームの投手なら選択 + パネルを ON。
  const handlePitcherButton = () => {
    const isAlreadyCurrent = pitcherDisplayTeam === side
    if (isAlreadyCurrent) {
      toggleVisibility('currentPitcher')
    } else {
      selectBatter(side, 9)
      if (!currentPitcherVisible) toggleVisibility('currentPitcher')
    }
  }

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const players = parseLineupCsv(reader.result as string)
        setLineup(side, players)
        setCsvError(null)
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : 'CSV読み込みに失敗しました')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div
      className={`rounded-lg p-3 space-y-2 ${
        isAttacking
          ? 'bg-orange-500/15 border-2 border-orange-400/70 ring-1 ring-orange-400/30'
          : 'bg-gray-800 border border-gray-700'
      }`}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 rounded" style={{ backgroundColor: team.color }} />
          <span className="text-white font-bold text-sm">{team.name}</span>
          <span className="text-gray-400 text-xs">（{label}）</span>
          {isAttacking && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">⚾ 攻撃中</span>
          )}
          {!isAttacking && (
            <span className="bg-gray-700 text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">🛡 守備中</span>
          )}
        </div>
        {isAttacking && (
          <div className="flex gap-1">
            <button
              onClick={() => { setLineupDisplayTeam(side); prevBatter() }}
              className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1.5 rounded text-xs font-bold"
            >
              ← 前の打者
            </button>
            <button
              onClick={() => { setLineupDisplayTeam(side); nextBatter() }}
              className="bg-accent hover:bg-accent/80 text-white px-3 py-1.5 rounded text-xs font-bold"
            >
              次の打者 →
            </button>
          </div>
        )}
      </div>

      {/* 試合中ロック中のお知らせバナー */}
      {gameStarted && (
        <div className="bg-orange-900/40 border border-orange-500/60 rounded px-3 py-1.5 text-orange-200 text-[11px] leading-snug">
          🔒 試合中：オーダーロック中（DH制・CSV・プリセットは変更不可）。
          名前・学年・コメント・守備位置・代打・投手交代は試合中でも編集できます。
        </div>
      )}

      {/* CSV / プリセット（試合中はロック） */}
      <div className="bg-gray-900/40 rounded p-2 space-y-1.5 border border-gray-700">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={gameStarted}
            className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            title={gameStarted ? '試合中はオーダー一括変更はできません' : ''}
          >
            CSV読込
          </button>
          <button
            onClick={downloadCsvSample}
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded text-xs font-bold"
            title="入力例つきのサンプルCSVをダウンロード"
          >
            ⬇ サンプルCSV
          </button>
          <button
            onClick={() => setLineup(side, [...TEITO_LINEUP])}
            disabled={gameStarted}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            title={gameStarted ? '試合中はオーダー一括変更はできません' : ''}
          >
            プリセット：帝都大学
          </button>
          <button
            onClick={() => setLineup(side, [...SORYO_LINEUP])}
            disabled={gameStarted}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            title={gameStarted ? '試合中はオーダー一括変更はできません' : ''}
          >
            プリセット：早凌大学
          </button>
        </div>
      </div>
      {csvError && (
        <div className="bg-red-900/50 border border-red-500 rounded px-3 py-1.5 text-red-300 text-xs">
          {csvError}
        </div>
      )}

      {/* DH制の表示は廃止。試合概要（GameControl 上部）にまとめて表示する。
          選択は「▶ 試合開始」ウィザードに一本化（2026-05-28）。 */}

      {/* バリデーション警告 */}
      {dhMode === 'none' && !hasPitcherInBatters && (
        <div className="bg-yellow-900/40 border border-yellow-600/60 rounded px-3 py-1.5 text-yellow-200 text-[11px]">
          ⚠ DHなしモードでは 1-9番のいずれかに <span className="font-bold">ピッチャー</span> を指定してください
        </div>
      )}
      {(dhMode === 'dh' || dhMode === 'twoWay') && !hasDhInBatters && (
        <div className="bg-yellow-900/40 border border-yellow-600/60 rounded px-3 py-1.5 text-yellow-200 text-[11px]">
          ⚠ DHありモードでは 1-9番のいずれかに <span className="font-bold">DH</span> を指定してください
        </div>
      )}

      {/* ラインナップ（1-9番打者） */}
      <div className="space-y-0.5">
        {/* 列ヘッダ（代打はデータ行内のチェックボックスで操作するため列としては出さない） */}
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 px-1.5 pt-1 pb-0.5 border-b border-gray-700">
          <span className="w-4 text-center shrink-0">順番</span>
          <span className="w-12 text-center shrink-0">守備</span>
          <span className="flex-1 min-w-0">名前</span>
          <span className="w-16 text-center shrink-0">学年</span>
          <span className="flex-1 min-w-0">コメント</span>
          <span className="shrink-0 w-[60px] text-center">　</span>
        </div>
        {lineup.slice(0, 9).map((player, idx) => (
          <BatterRow
            key={player.order}
            player={player}
            isCurrent={idx === batterIdx && batterDisplayTeam === side}
            dhMode={dhMode}
            currentBatterVisible={currentBatterVisible}
            onSelect={() => handleBatterButton(idx)}
            onChange={(p) => setLineupPlayer(side, idx, p)}
          />
        ))}
      </div>

      {/* 投手（10番目）。
          - DHなしモード: 10番行は非表示（投手は1-9番打順内）
          - DHありモード: 通常の編集可能行 + 登板ON/OFFボタン
          - 二刀流モード: DH選手と同一人物のため、編集不可の同期表示のみ。
            DH選手の編集が即 10番行に反映される（store で自動同期）。
            登板ON/OFFは上部「表示ON/OFF」パネルから操作する。 */}
      {dhMode === 'dh' && lineup[9] && (
        <>
          <div className="flex items-center gap-1.5 text-[10px] text-red-300/80 px-1.5 pt-1 pb-0.5 border-b border-red-800/40">
            <span className="w-4 text-center shrink-0">10</span>
            <span className="w-12 text-center shrink-0">守備</span>
            <span className="flex-1 min-w-0">名前</span>
            <span className="w-16 text-center shrink-0">学年</span>
            <span className="flex-1 min-w-0">コメント</span>
            <span className="shrink-0 w-[60px] text-center">　</span>
          </div>
          <PitcherRow
            player={lineup[9]}
            isCurrent={pitcherDisplayTeam === side}
            isDefending={!isAttacking}
            currentPitcherVisible={currentPitcherVisible}
            onSelect={handlePitcherButton}
            onChange={(p) => setLineupPlayer(side, 9, p)}
          />
        </>
      )}
      {dhMode === 'twoWay' && lineup[9] && (
        <div className="rounded border border-purple-700/40 bg-purple-900/15 px-2.5 py-2 text-[11px] text-purple-100 flex items-center gap-2">
          <span className="text-purple-300 font-bold tracking-wide">10 P</span>
          <span className="text-gray-400">二刀流中・DH選手と同期：</span>
          <span className="text-white font-bold truncate">
            {lineup[9].name || '（DH選手未入力）'}
          </span>
          <span className="ml-auto text-[10px] text-purple-300/70">
            編集は6番DH行で／表示切替は上部「表示ON/OFF」から
          </span>
        </div>
      )}
    </div>
  )
}

export default function LineupControl() {
  return (
    <div className="space-y-3">
      <SectionTitle title="打順・選手" controls={['スタメン', 'バッター', 'ピッチャー']} />
      <div className="text-[11px] text-gray-500 -mt-1">
        ※ オーバーレイの表示モード（自動/先攻/後攻/VS）は上部「表示ON/OFF」枠で切替
      </div>
      <TeamLineupPanel side="away" />
      <TeamLineupPanel side="home" />
    </div>
  )
}
