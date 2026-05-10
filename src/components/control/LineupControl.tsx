import { useRef, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import type { DhMode, LineupPlayer, Position } from '../../types'
import { CARP_LINEUP, HAWKS_LINEUP, formatInningsPitched } from '../../types'
import { parseLineupCsv, LINEUP_CSV_SAMPLE } from '../../lib/csvImport'

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
      className={`flex items-center gap-1.5 text-sm rounded px-1.5 py-1 ${
        isCurrent ? 'bg-accent/30 ring-1 ring-accent' : ''
      }`}
    >
      <span className="text-gray-500 w-4 text-center text-xs shrink-0">
        {player.order}
      </span>
      <select
        className="bg-gray-700 text-white rounded px-1 py-1 text-xs w-12 shrink-0"
        value={player.position}
        onChange={(e) => onChange({ ...player, position: e.target.value as Position })}
      >
        <option value="">--</option>
        {positions.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <input
        className="bg-gray-700 text-white rounded px-2 py-1 text-xs flex-1 min-w-0"
        placeholder="名前"
        value={player.name}
        onChange={(e) => onChange({ ...player, name: e.target.value })}
      />
      <input
        className="bg-gray-700 text-white rounded px-1 py-1 text-xs w-12 shrink-0"
        placeholder="打率"
        value={player.battingAvg || ''}
        onChange={(e) => onChange({ ...player, battingAvg: e.target.value })}
      />
      <input
        className="bg-gray-700 text-white rounded px-1 py-1 text-xs w-10 shrink-0"
        placeholder="HR"
        value={player.homeRuns || ''}
        onChange={(e) => onChange({ ...player, homeRuns: e.target.value })}
      />
      <input
        className="bg-gray-700 text-white rounded px-1 py-1 text-xs w-10 shrink-0"
        placeholder="打点"
        value={player.rbi || ''}
        onChange={(e) => onChange({ ...player, rbi: e.target.value })}
      />
      <input
        className="bg-gray-700 text-white rounded px-1 py-1 text-xs w-14 shrink-0"
        placeholder="OPS"
        value={player.ops || ''}
        onChange={(e) => onChange({ ...player, ops: e.target.value })}
      />
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
  side,
  onSelect,
  onChange,
}: {
  player: LineupPlayer
  side: 'away' | 'home'
  onSelect: () => void
  onChange: (p: LineupPlayer) => void
}) {
  const history = useGameStore(s =>
    side === 'away' ? s.awayPitcherHistory : s.homePitcherHistory
  )
  const setTeamPitchCount = useGameStore(s => s.setTeamPitchCount)
  const archived = history.filter(p => !p.isActive)
  const active = history.find(p => p.isActive)

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-sm rounded px-1.5 py-1 bg-red-900/20 border border-red-800/30">
        <span className="text-red-400 w-4 text-center text-xs shrink-0 font-bold">
          P
        </span>
        <span className="text-red-400 text-xs w-12 shrink-0 text-center font-bold">
          投
        </span>
        <input
          className="bg-gray-700 text-white rounded px-2 py-1 text-xs flex-1 min-w-0"
          placeholder="投手名"
          value={player.name}
          onChange={(e) => onChange({ ...player, name: e.target.value })}
        />
        <input
          className="bg-gray-700 text-white rounded px-1 py-1 text-xs w-10 shrink-0"
          placeholder="登板"
          value={player.appearances || ''}
          onChange={(e) => onChange({ ...player, appearances: e.target.value })}
        />
        <input
          className="bg-gray-700 text-white rounded px-1 py-1 text-xs w-20 shrink-0"
          placeholder="勝敗"
          value={player.record || ''}
          onChange={(e) => onChange({ ...player, record: e.target.value })}
        />
        <button
          onClick={onSelect}
          className="text-xs px-2 py-1 rounded shrink-0 bg-red-700 hover:bg-red-600 text-white font-bold"
          title="この投手を登板"
        >
          登板
        </button>
      </div>
      {/* 投手交代履歴 */}
      {(archived.length > 0 || active) && (
        <div className="text-[10px] text-gray-400 px-2 space-y-0.5">
          {archived.map((p, i) => (
            <div key={p.id} className="flex gap-2">
              <span className="text-gray-500">{i === 0 ? '先発' : `${i}番手`}</span>
              <span className="text-gray-300">{p.name}</span>
              <span>{formatInningsPitched(p.outsRecorded)}回</span>
              <span>{p.pitchCount}球</span>
            </div>
          ))}
          {active && (
            <div className="space-y-1">
              <div className="flex gap-2 text-green-400">
                <span>{archived.length === 0 ? '先発' : `${archived.length}番手`}</span>
                <span>{active.name}</span>
                <span>{formatInningsPitched(active.outsRecorded)}回</span>
                <span className="font-bold">{active.pitchCount}球</span>
                <span className="animate-pulse">登板中</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTeamPitchCount(side, Math.max(0, active.pitchCount - 1))}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-1.5 py-0.5 rounded text-[10px]"
                >-1</button>
                <button
                  onClick={() => setTeamPitchCount(side, active.pitchCount + 1)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-1.5 py-0.5 rounded text-[10px]"
                >+1</button>
                <button
                  onClick={() => setTeamPitchCount(side, active.pitchCount + 10)}
                  className="bg-blue-700 hover:bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold"
                >+10</button>
                <button
                  onClick={() => setTeamPitchCount(side, 0)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-1.5 py-0.5 rounded text-[10px]"
                >リセット</button>
              </div>
            </div>
          )}
        </div>
      )}
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
  const setDhMode = useGameStore((s) => s.setDhMode)
  const copyDhToPitcher = useGameStore((s) => s.copyDhToPitcher)
  const currentBatterVisible = useGameStore((s) => s.visibility?.currentBatter ?? false)
  const toggleVisibility = useGameStore((s) => s.toggleVisibility)

  // DHなしモード: 投手が1-9番に居ないと警告
  const hasPitcherInBatters = lineup.slice(0, 9).some((p) => p.position === '投')
  // DHあり/二刀流モード: DH指名選手が1-9番に居ないと警告
  const hasDhInBatters = lineup.slice(0, 9).some((p) => p.position === 'DH')

  const isAttacking = (side === 'away' && currentHalf === 'top') ||
    (side === 'home' && currentHalf === 'bottom')
  const label = side === 'away' ? '先攻' : '後攻'

  // 打席ボタン: 同じ打者が現在選択中なら currentBatter パネルを ON/OFF 切替、
  // 別打者なら選択 + パネルを ON。
  const handleBatterButton = (idx: number) => {
    const isAlreadyCurrent = idx === batterIdx && isAttacking
    if (isAlreadyCurrent) {
      toggleVisibility('currentBatter')
    } else {
      selectBatter(side, idx)
      if (!currentBatterVisible) toggleVisibility('currentBatter')
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
            onClick={() => setLineup(side, [...CARP_LINEUP])}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs"
          >
            プリセット：広島カープ
          </button>
          <button
            onClick={() => setLineup(side, [...HAWKS_LINEUP])}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs"
          >
            プリセット：ソフトバンク
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
        {/* 列ヘッダ（CSV項目名と一致） */}
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 px-1.5 pt-1 pb-0.5 border-b border-gray-700">
          <span className="w-4 text-center shrink-0">順番</span>
          <span className="w-12 text-center shrink-0">守備</span>
          <span className="flex-1 min-w-0">名前</span>
          <span className="w-12 text-center shrink-0">打率</span>
          <span className="w-10 text-center shrink-0">HR</span>
          <span className="w-10 text-center shrink-0">打点</span>
          <span className="w-14 text-center shrink-0">OPS</span>
          <span className="shrink-0 w-[40px] text-center">　</span>
        </div>
        {lineup.slice(0, 9).map((player, idx) => (
          <BatterRow
            key={player.order}
            player={player}
            isCurrent={idx === batterIdx && isAttacking}
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
          {/* 列ヘッダ（投手用 = 順番,守備,名前,登板数,勝敗） */}
          <div className="flex items-center gap-1.5 text-[10px] text-red-300/80 px-1.5 pt-1 pb-0.5 border-b border-red-800/40">
            <span className="w-4 text-center shrink-0">10</span>
            <span className="w-12 text-center shrink-0">守備</span>
            <span className="flex-1 min-w-0">名前</span>
            <span className="w-10 text-center shrink-0">登板数</span>
            <span className="w-20 text-center shrink-0">勝敗</span>
            <span className="shrink-0 w-[40px] text-center">　</span>
          </div>
          <PitcherRow
            player={lineup[9]}
            side={side}
            onSelect={() => selectBatter(side, 9)}
            onChange={(p) => setLineupPlayer(side, 9, p)}
          />
        </>
      )}
    </div>
  )
}

function LineupDisplayModeToggle() {
  const mode = useGameStore((s) => s.lineupDisplayMode ?? 'attacking')
  const setMode = useGameStore((s) => s.setLineupDisplayMode)

  const modes: { key: 'attacking' | 'away' | 'home' | 'both'; label: string; hint: string }[] = [
    { key: 'attacking', label: '自動（攻撃中）', hint: '攻撃中チームのみ自動表示' },
    { key: 'away',      label: '先攻のみ',       hint: '先攻チームの打順を常時表示' },
    { key: 'home',      label: '後攻のみ',       hint: '後攻チームの打順を常時表示' },
    { key: 'both',      label: '両チーム（VS）', hint: '両チーム並列＋VS表示' },
  ]
  const current = modes.find((m) => m.key === mode) ?? modes[0]!

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 space-y-2">
      <div>
        <div className="text-white text-sm font-bold">オーバーレイの打順表示</div>
        <div className="text-gray-400 text-[11px]">{current.hint}</div>
      </div>
      <div className="flex flex-wrap gap-1">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            title={m.hint}
            className={`text-[11px] px-2 py-1 rounded font-bold transition-colors ${
              mode === m.key
                ? 'bg-accent text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function LineupControl() {
  return (
    <div className="space-y-3">
      <h2 className="text-white font-bold text-lg">打順・選手</h2>
      <LineupDisplayModeToggle />
      <TeamLineupPanel side="away" />
      <TeamLineupPanel side="home" />
    </div>
  )
}
