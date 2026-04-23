import { useGameStore } from '../../store/useGameStore'

/**
 * ミニスコア: 上部小型の「A 0-0 X / 9回ウラ」表示。
 * モックアップ左上相当。
 */
export default function MiniScore() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)

  return (
    <div className="bg-black/85 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white font-mono select-none">
      <div className="flex items-center gap-3 text-lg">
        <TeamBadge shortName={awayTeam.shortName || 'A'} color={awayTeam.color} />
        <span className="font-bold text-xl tabular-nums">{awayTotal}</span>
        <span className="text-gray-400 text-base">-</span>
        <span className="font-bold text-xl tabular-nums">{homeTotal}</span>
        <TeamBadge shortName={homeTeam.shortName || 'X'} color={homeTeam.color} />
      </div>
      <div className="text-center text-[11px] text-gray-300 mt-0.5 tracking-wider">
        {currentInning}回{currentHalf === 'top' ? 'オモテ' : 'ウラ'}
      </div>
    </div>
  )
}

function TeamBadge({ shortName, color }: { shortName: string; color: string }) {
  return (
    <span
      className="inline-flex items-center justify-center min-w-[28px] h-[28px] px-1 rounded text-white text-sm font-bold border"
      style={{
        backgroundColor: color + 'cc',
        borderColor: color,
      }}
    >
      {shortName.charAt(0)}
    </span>
  )
}
