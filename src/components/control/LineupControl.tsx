import { useRef, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import type { DhMode, LineupPlayer, Position } from '../../types'
import { TEITO_LINEUP, SORYO_LINEUP } from '../../types'
import { parseLineupCsv, LINEUP_CSV_SAMPLE } from '../../lib/csvImport'
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

const POSITIONS_WITH_DH: Position[] = ['投', '捕', '一', '二', '三', '遊', '左', '中', '右', 'DH']
const POSITIONS_NO_DH: Position[] = ['投', '捕', '一', '二', '三', '遊', '左', '中', '右']

/** 学年候補。通常学部1-4年＋6年制学部の5・6年＋大学院。datalist で候補提示しつつ自由入力も許可 */
const GRADE_OPTIONS = ['1年', '2年', '3年', '4年', '5年', '6年', '院1', '院2', '院3'] as const
const GRADE_DATALIST_ID = 'yakyuu-grade-options'

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
        className="bg-gray-700 text-white rounded px-1 py-1 text-xs w-12 shrink-0"
        value={player.position}
        onChange={(e) => onChange({ ...player, position: e.target.value as Position })}
        disabled={player.isPinchHit}
        title={player.isPinchHit ? '代打中は守備位置の代わりに「代打」を表示します' : ''}
      >
        <option value="">--</option>
        {positions.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <input
        className="bg-gray-700 text-white rounded px-2 py-1 text-xs flex-1 min-w-[100px]"
        placeholder="名前"
        value={player.name}
        onChange={(e) => onChange({ ...player, name: e.target.value })}
      />
      <input
        className="bg-gray-700 text-white rounded px-2 py-1 text-xs w-16 shrink-0"
        placeholder="学年"
        list={GRADE_DATALIST_ID}
        value={player.grade ?? ''}
        onChange={(e) => onChange({ ...player, grade: e.target.value })}
        title="学年（プルダウンから選択 or 自由入力）"
      />
      <input
        className="bg-gray-700 text-white rounded px-2 py-1 text-xs flex-1 min-w-[120px]"
        placeholder="コメント（打者テロップに表示）"
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
  currentPitcherVisible,
  onSelect,
  onChange,
}: {
  player: LineupPlayer
  isCurrent: boolean
  currentPitcherVisible: boolean
  onSelect: () => void
  onChange: (p: LineupPlayer) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm rounded px-1.5 py-1 bg-red-900/20 border border-red-800/30">
      <span className="text-red-400 w-4 text-center text-xs shrink-0 font-bold">
        P
      </span>
      <span className="text-red-400 text-xs w-12 shrink-0 text-center font-bold">
        投
      </span>
      <input
        className="bg-gray-700 text-white rounded px-2 py-1 text-xs flex-1 min-w-[100px]"
        placeholder="投手名"
        value={player.name}
        onChange={(e) => onChange({ ...player, name: e.target.value })}
      />
      <input
        className="bg-gray-700 text-white rounded px-2 py-1 text-xs w-16 shrink-0"
        placeholder="学年"
        list={GRADE_DATALIST_ID}
        value={player.grade ?? ''}
        onChange={(e) => onChange({ ...player, grade: e.target.value })}
        title="学年（プルダウンから選択 or 自由入力）"
      />
      <input
        className="bg-gray-700 text-white rounded px-2 py-1 text-xs flex-1 min-w-[120px]"
        placeholder="コメント（投手テロップに表示）"
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
  const dhMode = useGameStore((s) => side === 'away' ? s.awayDhMode : s.homeDhMode)
  const setLineupPlayer = useGameStore((s) => s.setLineupPlayer)
  const setLineup = useGameStore((s) => s.setLineup)
  const selectBatter = useGameStore((s) => s.selectBatter)
  const nextBatter = useGameStore((s) => s.nextBatter)
  const prevBatter = useGameStore((s) => s.prevBatter)
  const setLineupDisplayTeam = useGameStore((s) => s.setLineupDisplayTeam)
  const lineupDisplayTeam = useGameStore((s) => s.lineupDisplayTeam ?? 'away')
  const setDhMode = useGameStore((s) => s.setDhMode)
  const copyDhToPitcher = useGameStore((s) => s.copyDhToPitcher)
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
  const handleBatterButton = (idx: number) => {
    const isAlreadyCurrent = idx === batterIdx && lineupDisplayTeam === side
    if (isAlreadyCurrent) {
      toggleVisibility('currentBatter')
    } else {
      selectBatter(side, idx)
      if (!currentBatterVisible) toggleVisibility('currentBatter')
    }
  }

  // 登板ボタン: 攻守問わず動作。同じ投手（同チーム）なら currentPitcher パネルを ON/OFF 切替、
  // 別チームの投手なら選択 + パネルを ON。
  const handlePitcherButton = () => {
    const isAlreadyCurrent = lineupDisplayTeam === side
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
          ? 'bg-yellow-900/20 border-2 border-yellow-500/50'
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
            <span className="text-yellow-400 text-xs font-bold animate-pulse">攻撃中</span>
          )}
          {!isAttacking && (
            <span className="text-gray-500 text-xs">守備中</span>
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

      {/* CSV / プリセット */}
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
            className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold"
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
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs"
          >
            プリセット：帝都大学
          </button>
          <button
            onClick={() => setLineup(side, [...SORYO_LINEUP])}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs"
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

      {/* DH制モード切替 */}
      <div className="flex items-center gap-2 bg-gray-900/40 rounded px-2 py-1.5 border border-gray-700">
        <span className="text-gray-300 text-[11px] font-bold shrink-0">DH制:</span>
        <div className="flex gap-1">
          {([
            { key: 'dh', label: 'DHあり（10名）', hint: '10番目=投手' },
            { key: 'none', label: 'DHなし（9名）', hint: '投手も打席' },
            { key: 'twoWay', label: '二刀流（10名）', hint: '大谷ルール' },
          ] as { key: DhMode; label: string; hint: string }[]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDhMode(side, opt.key)}
              title={opt.hint}
              className={`text-[11px] px-2 py-1 rounded font-bold transition-colors ${
                dhMode === opt.key
                  ? 'bg-accent text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* バリデーション警告 */}
      {dhMode === 'none' && !hasPitcherInBatters && (
        <div className="bg-yellow-900/40 border border-yellow-600/60 rounded px-3 py-1.5 text-yellow-200 text-[11px]">
          ⚠ DHなしモードでは 1-9番のいずれかに <span className="font-bold">投</span> を指定してください
        </div>
      )}
      {(dhMode === 'dh' || dhMode === 'twoWay') && !hasDhInBatters && (
        <div className="bg-yellow-900/40 border border-yellow-600/60 rounded px-3 py-1.5 text-yellow-200 text-[11px]">
          ⚠ DHありモードでは 1-9番のいずれかに <span className="font-bold">DH</span> を指定してください
        </div>
      )}

      {/* ラインナップ（1-9番打者） */}
      <div className="space-y-0.5">
        {/* 列ヘッダ */}
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 px-1.5 pt-1 pb-0.5 border-b border-gray-700">
          <span className="w-4 text-center shrink-0">順番</span>
          <span className="w-12 text-center shrink-0">守備</span>
          <span className="flex-1 min-w-0">名前</span>
          <span className="w-16 text-center shrink-0">学年</span>
          <span className="flex-1 min-w-0">コメント</span>
          <span className="shrink-0 w-12 text-center">代打</span>
          <span className="shrink-0 w-[60px] text-center">　</span>
        </div>
        {lineup.slice(0, 9).map((player, idx) => (
          <BatterRow
            key={player.order}
            player={player}
            isCurrent={idx === batterIdx && lineupDisplayTeam === side}
            dhMode={dhMode}
            currentBatterVisible={currentBatterVisible}
            onSelect={() => handleBatterButton(idx)}
            onChange={(p) => setLineupPlayer(side, idx, p)}
          />
        ))}
      </div>

      {/* 投手（10番目）— DHなしモードでは非表示 */}
      {dhMode !== 'none' && lineup[9] && (
        <>
          {dhMode === 'twoWay' && hasDhInBatters && (
            <button
              onClick={() => copyDhToPitcher(side)}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white px-2 py-1 rounded text-[11px] font-bold"
              title="DH打者と投手を同一人物にする（大谷ルール）"
            >
              ⚾ DH打者を投手行にコピー（大谷ルール）
            </button>
          )}
          {/* 列ヘッダ（投手用） */}
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
            isCurrent={lineupDisplayTeam === side}
            currentPitcherVisible={currentPitcherVisible}
            onSelect={handlePitcherButton}
            onChange={(p) => setLineupPlayer(side, 9, p)}
          />
        </>
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
      {/* 学年プルダウン候補（datalist は input から list 属性で参照される） */}
      <datalist id={GRADE_DATALIST_ID}>
        {GRADE_OPTIONS.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
      <TeamLineupPanel side="away" />
      <TeamLineupPanel side="home" />
    </div>
  )
}
