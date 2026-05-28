import { useGameStore } from '../../store/useGameStore'
import { pickTeamLabel } from '../../lib/teamLabel'

export default function MiniScore() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)

  // チーム名は最大4文字。name と shortName の長い方を採用。
  const awayLetter = pickTeamLabel(awayTeam, 'A')
  const homeLetter = pickTeamLabel(homeTeam, 'X')
  const halfLabel = currentHalf === 'top' ? 'オモテ' : 'ウラ'

  return (
    <div className="select-none text-white font-bold rounded-[3px] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
      <div className="bg-[#0b1220]/95 backdrop-blur-sm px-3 py-0.5 text-white text-xs tracking-widest text-center">
        {currentInning}回 {halfLabel}
      </div>

      <div className="flex items-stretch bg-[#0b1220]/95 backdrop-blur-sm">
        <TeamCell letter={awayLetter} />
        <ScoreCell value={awayTotal} />
        <div className="flex items-center justify-center text-2xl font-black px-2 text-white">
          -
        </div>
        <ScoreCell value={homeTotal} />
        <TeamCell letter={homeLetter} />
      </div>
    </div>
  )
}

function TeamCell({ letter }: { letter: string }) {
  // 文字数に応じてフォント・最小幅を自動調整（最大4文字想定）
  const len = Array.from(letter).length
  const fontSize = len <= 1 ? 24 : len === 2 ? 20 : len === 3 ? 16 : 14
  const minWidth = len <= 1 ? 44 : len === 2 ? 56 : len === 3 ? 68 : 80
  return (
    <div
      className="flex items-center justify-center text-white font-black px-3 whitespace-nowrap tracking-tight"
      style={{ minWidth, fontSize }}
    >
      {letter}
    </div>
  )
}

function ScoreCell({ value }: { value: number }) {
  return (
    <div
      className="flex items-center justify-center text-3xl font-black tabular-nums px-4 text-white"
      style={{ minWidth: 60 }}
    >
      {value}
    </div>
  )
}
