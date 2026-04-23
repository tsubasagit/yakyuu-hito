import { useGameStore } from '../../store/useGameStore'

/**
 * 大会タイトル: 大会名 / 副題 / 対戦カード / 会場・日付。
 * 試合前・試合後・オープニング等で表示。
 */
export default function TournamentHeader() {
  const tournament = useGameStore((s) => s.tournament)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)

  return (
    <div className="bg-black/85 backdrop-blur-sm rounded-lg px-6 py-4 text-white text-center min-w-[420px] select-none">
      {(tournament.title || tournament.subtitle) && (
        <div className="text-sm text-gray-200 tracking-widest mb-2">
          {tournament.title}
          {tournament.title && tournament.subtitle && '　'}
          {tournament.subtitle}
        </div>
      )}
      <div className="flex items-center justify-center gap-4 text-2xl font-bold">
        <span>{awayTeam.name || 'チームA'}</span>
        <span className="text-gray-400 text-xl">×</span>
        <span>{homeTeam.name || 'チームX'}</span>
      </div>
      {(tournament.venue || tournament.date) && (
        <div className="text-xs text-gray-300 mt-2 tracking-wider">
          {tournament.venue}
          {tournament.venue && tournament.date && '　'}
          {tournament.date}
        </div>
      )}
    </div>
  )
}
