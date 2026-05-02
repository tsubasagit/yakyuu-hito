import { useGameStore } from '../../store/useGameStore'

/**
 * 大会タイトル: プロ野球中継風オープニング（2026-05-02 リファイン）。
 * 大会名 / 副題 / 対戦カード / 会場・日付。
 */
export default function TournamentHeader() {
  const tournament = useGameStore((s) => s.tournament)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)

  return (
    <div className="bg-[#0b1220]/[0.92] backdrop-blur-sm rounded-xl px-8 py-5 text-white text-center min-w-[480px] select-none shadow-[0_6px_24px_rgba(0,0,0,0.5)] border border-white/10">
      {(tournament.title || tournament.subtitle) && (
        <div className="text-[11px] text-amber-300 tracking-[0.4em] uppercase mb-3 font-medium">
          {tournament.title}
          {tournament.title && tournament.subtitle && '　·　'}
          {tournament.subtitle}
        </div>
      )}
      <div className="flex items-center justify-center gap-5 text-3xl font-bold tracking-tight">
        <TeamLabel name={awayTeam.name || 'チームA'} color={awayTeam.color} />
        <span className="text-gray-500 text-2xl font-light">vs</span>
        <TeamLabel name={homeTeam.name || 'チームX'} color={homeTeam.color} />
      </div>
      {(tournament.venue || tournament.date) && (
        <div className="text-xs text-gray-400 mt-3 tracking-[0.3em]">
          {tournament.venue}
          {tournament.venue && tournament.date && '　·　'}
          {tournament.date}
        </div>
      )}
    </div>
  )
}

function TeamLabel({ name, color }: { name: string; color: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-1 h-7 rounded" style={{ backgroundColor: color }} />
      {name}
    </span>
  )
}
