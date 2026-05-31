import { useGameStore } from '../../store/useGameStore'
import { pickTeamLabel } from '../../lib/teamLabel'

export default function StatusPanel() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)
  const count = useGameStore((s) => s.count)
  const runners = useGameStore((s) => s.runners)

  const awayLabel = pickTeamLabel(awayTeam, 'A')
  const homeLabel = pickTeamLabel(homeTeam, 'X')
  const halfLabel = currentHalf === 'top' ? '表' : '裏'

  return (
    <div
      className="select-none font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,0.5)] border-2 border-black bg-[#0b1220]/95 backdrop-blur-sm inline-flex flex-col rounded-[3px] overflow-hidden"
    >
      {/* 上段: イニング + ダイヤ。
          上段（イニング表示＋ダイヤ）を縦・横ともに詰めてコンパクト化する。
          （2026-05-31 顧客FB④: 「ここのもう少しつめたい」→ パディング/ダイヤを縮小） */}
      <div className="flex items-stretch border-b-2 border-black">
        <div className="flex items-center text-white text-sm font-bold tracking-wider px-3 py-0.5 border-r-2 border-black whitespace-nowrap">
          {currentInning}回{halfLabel}
        </div>
        <div className="flex items-center justify-center px-2 py-0 flex-1">
          <Diamond first={runners.first} second={runners.second} third={runners.third} />
        </div>
      </div>

      {/* 下段: 2チーム行 + BSO（右） */}
      <div className="flex items-stretch">
        <div className="flex flex-col">
          <ScoreRow
            label={awayLabel}
            score={awayTotal}
            attacking={currentHalf === 'top'}
            bottomBorder
          />
          <ScoreRow
            label={homeLabel}
            score={homeTotal}
            attacking={currentHalf === 'bottom'}
          />
        </div>
        <div className="flex flex-col justify-center gap-1.5 px-3 py-2 border-l-2 border-black">
          <BSORow
            label="B"
            count={count.balls}
            max={3}
            gradient="radial-gradient(circle at 32% 28%, #bbf7d0 0%, #22c55e 45%, #14532d 100%)"
          />
          <BSORow
            label="S"
            count={count.strikes}
            max={2}
            gradient="radial-gradient(circle at 32% 28%, #fef08a 0%, #eab308 45%, #422006 100%)"
          />
          <BSORow
            label="O"
            count={count.outs}
            max={2}
            gradient="radial-gradient(circle at 32% 28%, #fecaca 0%, #ef4444 45%, #450a0a 100%)"
          />
        </div>
      </div>
    </div>
  )
}

function ScoreRow({
  label,
  score,
  attacking,
  bottomBorder,
}: {
  label: string
  score: number
  attacking: boolean
  bottomBorder?: boolean
}) {
  const len = Array.from(label).length
  // 文字数に応じて自動縮小（最大4文字想定）
  const fontSize = len >= 4 ? 13 : len === 3 ? 15 : len === 2 ? 17 : 20
  return (
    <div className={`flex items-stretch ${bottomBorder ? 'border-b-2 border-black' : ''}`}>
      <div
        style={{
          width: 4,
          backgroundColor: attacking ? '#ef4444' : 'transparent',
        }}
      />
      <div
        className="flex items-center justify-center font-black border-r-2 border-black bg-[#0b1220] text-white tracking-tight"
        style={{ minWidth: 64, paddingInline: 6, height: 36, fontSize, lineHeight: 1 }}
      >
        {label}
      </div>
      <div
        className="text-center text-3xl font-black tabular-nums bg-white text-black"
        style={{ width: 56, height: 36, lineHeight: '36px' }}
      >
        {score}
      </div>
    </div>
  )
}

function Diamond({
  first,
  second,
  third,
}: {
  first: boolean
  second: boolean
  third: boolean
}) {
  const baseCls = 'absolute w-[16px] h-[16px] rotate-45'
  const cls = (on: boolean) =>
    on
      ? 'bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.9)]'
      : 'bg-transparent border border-white/60'
  // 4点のひし形（2塁=上 / 3塁=左 / 1塁=右 / 本塁=下は白枠の基準点）。
  // ボックス全体に配置して上下の余白をなくし、ダイヤを大きく見せる（2026-05-31 顧客FB）。
  return (
    <div className="relative" style={{ width: 60, height: 52 }}>
      <div className={`${baseCls} ${cls(second)}`} style={{ left: 22, top: 0 }} />
      <div className={`${baseCls} ${cls(third)}`} style={{ left: 2, top: 18 }} />
      <div className={`${baseCls} ${cls(first)}`} style={{ right: 2, top: 18 }} />
      <div className={`${baseCls} bg-transparent border border-white/35`} style={{ left: 22, top: 36 }} />
    </div>
  )
}

function BSORow({
  label,
  count,
  max,
  gradient,
}: {
  label: string
  count: number
  max: number
  gradient: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[15px] font-black text-white w-4 leading-none">{label}</span>
      <div className="flex gap-1.5">
        {Array.from({ length: max }, (_, i) => {
          const lit = i < count
          return (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: 17,
                height: 17,
                background: lit ? gradient : 'transparent',
                border: lit ? 'none' : '1px solid rgba(255,255,255,0.35)',
                boxShadow: lit
                  ? 'inset 0 -1.5px 1.5px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.55)'
                  : 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
