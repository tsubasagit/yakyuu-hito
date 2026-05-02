import { useGameStore } from '../../store/useGameStore'

/**
 * ミニスコア: プロ野球中継風の上部小型スコアボード（2026-05-02 リファイン）。
 * チーム色のアクセントバー + 略称(最大3文字) + 大きめスコア + イニング。
 */
export default function MiniScore() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)

  const awayName = (awayTeam.shortName || awayTeam.name || 'AWAY').slice(0, 3)
  const homeName = (homeTeam.shortName || homeTeam.name || 'HOME').slice(0, 3)

  return (
    <div className="bg-[#0b1220]/[0.92] backdrop-blur-sm rounded-lg text-white shadow-[0_4px_16px_rgba(0,0,0,0.4)] border border-white/10 select-none overflow-hidden">
      <div className="flex flex-col">
        <ScoreLine
          name={awayName}
          score={awayTotal}
          color={awayTeam.color}
          attacking={currentHalf === 'top'}
        />
        <div className="h-px bg-white/10" />
        <ScoreLine
          name={homeName}
          score={homeTotal}
          color={homeTeam.color}
          attacking={currentHalf === 'bottom'}
        />
      </div>
      <div className="bg-white/5 border-t border-white/10 text-center text-[11px] text-gray-300 px-3 py-1 tracking-[0.2em] font-medium">
        {currentInning}回{currentHalf === 'top' ? '表' : '裏'}
      </div>
    </div>
  )
}

function ScoreLine({
  name,
  score,
  color,
  attacking,
}: {
  name: string
  score: number
  color: string
  attacking: boolean
}) {
  return (
    <div className="flex items-stretch min-w-[200px]">
      {/* チーム色のアクセントバー */}
      <span className="w-1 shrink-0" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-2 px-3 py-1.5 flex-1">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            attacking ? 'bg-amber-300 shadow-[0_0_4px_rgba(252,211,77,0.9)]' : 'bg-transparent'
          }`}
        />
        <span className="font-bold text-base leading-none tracking-tight" style={{ minWidth: '3.2rem' }}>
          {name}
        </span>
        <span className="ml-auto text-2xl font-black tabular-nums leading-none">{score}</span>
      </div>
    </div>
  )
}
