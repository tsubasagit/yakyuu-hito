import { useGameStore } from '../../store/useGameStore'

export default function MiniScore() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)

  const awayLetter = (awayTeam.shortName || awayTeam.name || 'A').charAt(0)
  const homeLetter = (homeTeam.shortName || homeTeam.name || 'X').charAt(0)
  const halfLabel = currentHalf === 'top' ? 'オモテ' : 'ウラ'

  return (
    <div className="select-none text-white font-bold">
      <div className="bg-[#0b1220] px-3 py-0.5 text-white text-xs tracking-widest text-center">
        {currentInning}回 {halfLabel}
      </div>

      <div className="flex items-stretch bg-[#0b1220]">
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
  return (
    <div
      className="flex items-center justify-center text-white text-2xl font-black px-3"
      style={{ minWidth: 44 }}
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
