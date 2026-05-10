import { useGameStore } from '../../store/useGameStore'

/**
 * イニング別スコアボード: プロ野球中継風（2026-05-02 リファイン）。
 * 9回までを基本表示、延長は自動でカラム拡張。
 * チーム色のアクセントバー + チーム略称(最大3文字) + R列を強調。
 */
export default function InningScoreboard() {
  const innings = useGameStore((s) => s.innings)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)

  // 9回までを基本にして、延長戦に応じて拡張（最大12回）
  const baseInnings = Math.max(9, currentInning)
  const MAX_INNINGS = Math.min(12, baseInnings)
  const displayInnings = Array.from({ length: MAX_INNINGS }, (_, i) => {
    const num = i + 1
    const existing = innings.find((inn) => inn.inning === num)
    return existing ?? { inning: num, top: null, bottom: null }
  })

  const awayName = (awayTeam.shortName || awayTeam.name || 'AWAY').slice(0, 3)
  const homeName = (homeTeam.shortName || homeTeam.name || 'HOME').slice(0, 3)

  return (
    <div className="bg-[#0b1220]/[0.92] backdrop-blur-sm rounded-lg overflow-hidden text-white shadow-[0_4px_16px_rgba(0,0,0,0.4)] border border-white/10 select-none">
      <table className="border-collapse w-full text-sm tabular-nums">
        <thead>
          <tr className="bg-white/5">
            <th className="w-[88px] text-left px-3 py-1 text-[10px] tracking-[0.2em] text-gray-400 font-medium uppercase">
              Team
            </th>
            {displayInnings.map((inn) => (
              <th
                key={inn.inning}
                className={`px-2 py-1 text-center min-w-[24px] text-[11px] font-medium ${
                  inn.inning === currentInning
                    ? 'text-amber-300'
                    : 'text-gray-400'
                }`}
              >
                {inn.inning}
              </th>
            ))}
            <th className="px-3 py-1 text-center text-[11px] text-amber-300 border-l border-white/15 min-w-[44px] font-bold tracking-widest">
              R
            </th>
          </tr>
        </thead>
        <tbody>
          <ScoreRow
            name={awayName}
            color={awayTeam.color}
            innings={displayInnings}
            half="top"
            currentInning={currentInning}
            currentHalf={currentHalf}
            total={awayTotal}
          />
          <ScoreRow
            name={homeName}
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
  name,
  color,
  innings,
  half,
  currentInning,
  currentHalf,
  total,
}: {
  name: string
  color: string
  innings: { inning: number; top: number | null; bottom: number | null }[]
  half: 'top' | 'bottom'
  currentInning: number
  currentHalf: 'top' | 'bottom'
  total: number
}) {
  const isAttacking = currentHalf === half
  return (
    <tr className="border-t border-white/10">
      <td className="py-1 pl-0 pr-2">
        <div className="flex items-center gap-2 pl-0">
          <span className="w-1 h-7 rounded-r" style={{ backgroundColor: color }} />
          <span
            className={`text-base font-bold tracking-tight ${isAttacking ? 'text-white' : 'text-gray-300'}`}
            style={{ minWidth: '3.2rem' }}
          >
            {name}
          </span>
        </div>
      </td>
      {innings.map((inn) => {
        const played =
          half === 'top'
            ? inn.inning <= currentInning
            : inn.inning < currentInning ||
              (inn.inning === currentInning && currentHalf === 'bottom')
        const value = half === 'top' ? inn.top : inn.bottom
        const isCurrent = inn.inning === currentInning && currentHalf === half
        return (
          <td
            key={inn.inning}
            className={`px-2 py-1 text-center text-sm font-medium ${
              isCurrent ? 'bg-white/10 text-amber-300 font-bold' : 'text-white'
            }`}
          >
            {played ? value ?? 0 : <span className="text-gray-600">·</span>}
          </td>
        )
      })}
      <td className="px-3 py-1 text-center font-black text-lg text-white border-l border-white/15">
        {total}
      </td>
    </tr>
  )
}
