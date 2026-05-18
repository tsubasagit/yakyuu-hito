import { useGameStore } from '../../store/useGameStore'

/**
 * イニング別スコアボード（画像準拠デザイン・2026-05-16 リファイン）。
 * 白セル + 黒太ボーダーのテレビ中継風スコアボード。
 * 1-12 + R 列、A/X 各行。延長は currentInning に応じて自動拡張。
 */
export default function InningScoreboard() {
  const innings = useGameStore((s) => s.innings)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)
  const isGameOver = useGameStore((s) => s.isGameOver)

  const baseInnings = Math.max(9, currentInning)
  const MAX_INNINGS = Math.min(12, baseInnings)
  const displayInnings = Array.from({ length: MAX_INNINGS }, (_, i) => {
    const num = i + 1
    const existing = innings.find((inn) => inn.inning === num)
    return existing ?? { inning: num, top: null, bottom: null }
  })

  const awayLetter = (awayTeam.shortName || awayTeam.name || 'A').charAt(0)
  const homeLetter = (homeTeam.shortName || homeTeam.name || 'X').charAt(0)

  return (
    <div className="select-none shadow-[0_4px_16px_rgba(0,0,0,0.4)] rounded-xl overflow-hidden">
      <table className="border-collapse tabular-nums font-bold" style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            {/* 左上角 */}
            <th className="bg-[#0b1220]/85 backdrop-blur-sm border-2 border-black" style={{ width: 36, height: 28 }} />
            {displayInnings.map((inn) => (
              <th
                key={inn.inning}
                className="border-2 border-black text-sm text-center bg-[#0b1220]/85 backdrop-blur-sm text-white"
                style={{ width: 32, height: 28 }}
              >
                {inn.inning}
              </th>
            ))}
            <th
              className="bg-[#0b1220]/85 backdrop-blur-sm text-amber-300 border-2 border-black text-base"
              style={{ width: 44, height: 28 }}
            >
              R
            </th>
          </tr>
        </thead>
        <tbody>
          <ScoreRow
            letter={awayLetter}
            color={awayTeam.color}
            innings={displayInnings}
            half="top"
            currentInning={currentInning}
            currentHalf={currentHalf}
            total={awayTotal}
            isGameOver={isGameOver}
            homeTotal={homeTotal}
            awayTotal={awayTotal}
          />
          <ScoreRow
            letter={homeLetter}
            color={homeTeam.color}
            innings={displayInnings}
            half="bottom"
            currentInning={currentInning}
            currentHalf={currentHalf}
            total={homeTotal}
            isGameOver={isGameOver}
            homeTotal={homeTotal}
            awayTotal={awayTotal}
          />
        </tbody>
      </table>
    </div>
  )
}

function ScoreRow({
  letter,
  color,
  innings,
  half,
  currentInning,
  currentHalf,
  total,
  isGameOver,
  homeTotal,
  awayTotal,
}: {
  letter: string
  color: string
  innings: { inning: number; top: number | null; bottom: number | null }[]
  half: 'top' | 'bottom'
  currentInning: number
  currentHalf: 'top' | 'bottom'
  total: number
  isGameOver: boolean
  homeTotal: number
  awayTotal: number
}) {
  // 試合終了時、後攻が勝っているなら「最終裏」セルに × を出す。
  //  - 裏を未プレイ（攻撃なし: コールド・無得点勝ち）: "×" のみ
  //  - 裏を得点で打ち切り（サヨナラ）: "{得点}×"
  const homeWon = isGameOver && homeTotal > awayTotal
  return (
    <tr>
      {/* チームレターセル */}
      <td
        className="border-2 border-black text-white text-center text-lg font-black"
        style={{
          backgroundColor: color || '#1e3a5f',
          width: 36,
          height: 36,
        }}
      >
        {letter}
      </td>
      {innings.map((inn) => {
        const played =
          half === 'top'
            ? inn.inning <= currentInning
            : inn.inning < currentInning ||
              (inn.inning === currentInning && currentHalf === 'bottom')
        const value = half === 'top' ? inn.top : inn.bottom
        const isLastBottomCell = half === 'bottom' && homeWon && inn.inning === currentInning
        let display: React.ReactNode
        if (isLastBottomCell) {
          if (value === null || value === undefined) {
            display = <span className="text-amber-300">×</span>
          } else {
            display = (
              <span>
                {value}
                <span className="text-amber-300 ml-0.5">×</span>
              </span>
            )
          }
        } else {
          display = played ? value ?? 0 : ''
        }
        return (
          <td
            key={inn.inning}
            className="border-2 border-black text-center text-base bg-[#0b1220]/85 backdrop-blur-sm text-white"
            style={{ width: 32, height: 36 }}
          >
            {display}
          </td>
        )
      })}
      <td
        className="border-2 border-black text-center text-xl font-black bg-white text-black"
        style={{ width: 44, height: 36 }}
      >
        {total}
      </td>
    </tr>
  )
}
