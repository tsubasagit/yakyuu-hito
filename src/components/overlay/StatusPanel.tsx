import { useGameStore } from '../../store/useGameStore'

/**
 * BSOパネル: ミニスコアと同系統の黒地ベース（2026-05-10 配色刷新）。
 *  - 上段: イニング表記
 *  - 左ブロック: 2チームの略称(最大3文字)＋総得点。攻撃中の行に黄色マーカー
 *  - 右ブロック: 走者ダイヤ + BSO ランプ
 *
 * 簡易スコア / ダイヤ / BSO は親トグル（visibility.statusPanel）で
 * 一括 ON/OFF（原田様要望: 2026-05-02）。
 */
export default function StatusPanel() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)
  const count = useGameStore((s) => s.count)
  const runners = useGameStore((s) => s.runners)

  const awayName = (awayTeam.shortName || awayTeam.name || 'A').slice(0, 3)
  const homeName = (homeTeam.shortName || homeTeam.name || 'H').slice(0, 3)

  return (
    <div className="bg-[#0b1220]/[0.92] backdrop-blur-sm rounded-lg text-white select-none shadow-[0_4px_16px_rgba(0,0,0,0.4)] overflow-hidden border border-white/10">
      {/* 上段: イニング */}
      <div className="px-3 pt-1.5 pb-1 text-[11px] tracking-[0.2em] text-gray-300 font-medium">
        {currentInning}回{currentHalf === 'top' ? '表' : '裏'}
      </div>

      <div className="flex items-stretch px-3 pb-2 gap-3">
        {/* 左: チームスコア2行 */}
        <div className="flex flex-col gap-1 justify-center min-w-[148px]">
          <ScoreLine
            name={awayName}
            score={awayTotal}
            attacking={currentHalf === 'top'}
          />
          <ScoreLine
            name={homeName}
            score={homeTotal}
            attacking={currentHalf === 'bottom'}
          />
        </div>

        {/* 右: ダイヤ + BSO */}
        <div className="flex items-center gap-2 pl-2 ml-auto bg-white/5 border border-white/10 rounded-lg px-2 py-1">
          <Diamond first={runners.first} second={runners.second} third={runners.third} />
          <div className="flex flex-col gap-0.5">
            <BSORow label="B" count={count.balls} max={3} color="#22c55e" />
            <BSORow label="S" count={count.strikes} max={2} color="#eab308" />
            <BSORow label="O" count={count.outs} max={2} color="#ef4444" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreLine({
  name,
  score,
  attacking,
}: {
  name: string
  score: number
  attacking: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${
          attacking ? 'bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.9)]' : 'bg-transparent'
        }`}
      />
      <span
        className="font-bold text-2xl tracking-tight leading-none"
        style={{ minWidth: '3.6rem' }}
      >
        {name}
      </span>
      <span className="text-3xl font-black tabular-nums ml-auto leading-none">
        {score}
      </span>
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
  const cls = (on: boolean) =>
    `w-2.5 h-2.5 rotate-45 ${on ? 'bg-[#facc15] shadow-[0_0_3px_rgba(250,204,21,0.7)]' : 'bg-transparent border border-white/40'}`
  return (
    <div className="relative w-[36px] h-[36px]">
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${cls(second)}`} />
      <div className={`absolute top-1/2 left-0 -translate-y-1/2 ${cls(third)}`} />
      <div className={`absolute top-1/2 right-0 -translate-y-1/2 ${cls(first)}`} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-transparent border border-white/40" />
    </div>
  )
}

function BSORow({
  label,
  count,
  max,
  color,
}: {
  label: string
  count: number
  max: number
  color: string
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-bold text-gray-300 w-3">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: i < count ? color : 'transparent',
              border: i < count ? 'none' : '1px solid rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
