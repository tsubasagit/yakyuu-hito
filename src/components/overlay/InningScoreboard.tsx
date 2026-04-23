import { useGameStore } from '../../store/useGameStore'

/**
 * イニング別スコアボード: 1〜12回＋R 列の得点表。
 * モックアップ下部左相当。既存 Scoreboard.tsx からスコア表部分のみを独立化。
 */
export default function InningScoreboard() {
  const innings = useGameStore((s) => s.innings)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)

  const MAX_INNINGS = 12
  const displayInnings = Array.from({ length: MAX_INNINGS }, (_, i) => {
    const num = i + 1
    const existing = innings.find((inn) => inn.inning === num)
    return existing ?? { inning: num, top: null, bottom: null }
  })

  return (
    <div className="font-mono select-none scoreboard-main rounded-lg overflow-hidden">
      <table className="border-collapse w-full text-sm">
        <thead>
          <tr className="bg-gray-900/95">
            <th className="w-[56px]" />
            {displayInnings.map((inn) => (
              <th
                key={inn.inning}
                className={`px-1.5 py-1 text-center min-w-[26px] text-xs ${
                  inn.inning === currentInning
                    ? 'text-white bg-white/15 font-bold'
                    : 'text-gray-400'
                }`}
              >
                {inn.inning}
              </th>
            ))}
            <th className="px-3 py-1 text-center text-xs text-yellow-300 border-l border-gray-600 min-w-[40px]">R</th>
          </tr>
        </thead>
        <tbody>
          <ScoreRow
            shortName={awayTeam.shortName || 'A'}
            color={awayTeam.color}
            innings={displayInnings}
            half="top"
            currentInning={currentInning}
            currentHalf={currentHalf}
            total={awayTotal}
          />
          <ScoreRow
            shortName={homeTeam.shortName || 'X'}
            color={homeTeam.color}
            innings={displayInnings}
            half="bottom"
            currentInning={currentInning}
            currentHalf={currentHalf}
            total={homeTotal}
          />
        </tbody>
      </table>
    </div>
  )
}

function ScoreRow({
  shortName,
  color,
  innings,
  half,
  currentInning,
  currentHalf,
  total,
}: {
  shortName: string
  color: string
  innings: { inning: number; top: number | null; bottom: number | null }[]
  half: 'top' | 'bottom'
  currentInning: number
  currentHalf: 'top' | 'bottom'
  total: number
}) {
  return (
    <tr className="border-t border-gray-700/60">
      <td className="py-1 pl-2">
        <span
          className="inline-flex items-center justify-center w-[28px] h-[28px] rounded text-white font-bold border"
          style={{ backgroundColor: color + 'cc', borderColor: color }}
        >
          {shortName.charAt(0)}
        </span>
      </td>
      {innings.map((inn) => {
        const played = half === 'top'
          ? inn.inning <= currentInning
          : (inn.inning < currentInning || (inn.inning === currentInning && currentHalf === 'bottom'))
        const value = half === 'top' ? inn.top : inn.bottom
        return (
          <td
            key={inn.inning}
            className={`px-1.5 py-1 text-center text-white text-xs ${
              inn.inning === currentInning && currentHalf === half
                ? 'bg-white/10 font-bold'
                : ''
            }`}
          >
            {played
              ? (value ?? 0)
              : <span className="text-gray-600">0</span>}
          </td>
        )
      })}
      <td className="px-3 py-1 text-center font-bold text-white text-base border-l border-gray-600">
        {total}
      </td>
    </tr>
  )
}
