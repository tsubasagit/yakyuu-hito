import { useGameStore } from '../../store/useGameStore'

/**
 * 大型スコア: 中継切替時の大判スコア表示（2026-05-02 リファイン）。
 * チーム名(最大3文字) + 大きなスコア + イニング表記。
 */
export default function BigScore() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)

  const awayName = (awayTeam.shortName || awayTeam.name || 'AWAY').slice(0, 3)
  const homeName = (homeTeam.shortName || homeTeam.name || 'HOME').slice(0, 3)

  return (
    <div className="bg-[#0b1220]/[0.92] backdrop-blur-sm rounded-2xl text-white select-none overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.55)] border border-white/10">
      <div className="flex items-stretch divide-x divide-white/10">
        <TeamBlock name={awayName} score={awayTotal} color={awayTeam.color} attacking={currentHalf === 'top'} />
        <TeamBlock name={homeName} score={homeTotal} color={homeTeam.color} attacking={currentHalf === 'bottom'} />
      </div>
      <div className="bg-white/5 border-t border-white/10 text-center text-sm text-gray-200 px-3 py-1.5 tracking-[0.3em] font-medium">
        {currentInning}回{currentHalf === 'top' ? '表' : '裏'}
      </div>
    </div>
  )
}

function TeamBlock({
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
    <div className="flex flex-col items-stretch min-w-[210px]">
      {/* チーム色のフルバンド */}
      <div className="flex items-center justify-center px-5 py-2 gap-2 relative" style={{ backgroundColor: color }}>
        {attacking && (
          <span className="w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.9)]" />
        )}
        <span className="text-2xl font-bold tracking-tight">{name}</span>
      </div>
      <div className="flex items-center justify-center px-6 py-3">
        <span className="text-[80px] font-black tabular-nums leading-none">{score}</span>
      </div>
    </div>
  )
}
