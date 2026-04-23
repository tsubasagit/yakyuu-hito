import { useGameStore } from '../../store/useGameStore'

/**
 * 大型スコア: 中央に大きく配置するスコア表示。
 * イニング間・グランド整備中にミニスコアを拡大表示したい運用向け。
 */
export default function BigScore() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)

  return (
    <div className="bg-black/85 backdrop-blur-sm rounded-lg px-8 py-4 text-white font-mono select-none">
      <div className="flex items-center gap-6">
        <BigBadge shortName={awayTeam.shortName || 'A'} color={awayTeam.color} />
        <span className="text-6xl font-bold tabular-nums">{awayTotal}</span>
        <span className="text-3xl text-gray-400">-</span>
        <span className="text-6xl font-bold tabular-nums">{homeTotal}</span>
        <BigBadge shortName={homeTeam.shortName || 'X'} color={homeTeam.color} />
      </div>
      <div className="text-center text-lg text-gray-200 mt-2 tracking-widest">
        {currentInning}回{currentHalf === 'top' ? 'オモテ' : 'ウラ'}
      </div>
    </div>
  )
}

function BigBadge({ shortName, color }: { shortName: string; color: string }) {
  return (
    <span
      className="inline-flex items-center justify-center min-w-[64px] h-[64px] px-3 rounded-lg text-white text-4xl font-bold border-2"
      style={{
        backgroundColor: color + 'cc',
        borderColor: color,
      }}
    >
      {shortName.charAt(0)}
    </span>
  )
}
