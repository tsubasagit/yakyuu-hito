import { useGameStore } from '../../store/useGameStore'

export default function TournamentHeader() {
  const tournament = useGameStore((s) => s.tournament)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)

  const hasTitle = tournament.title || tournament.subtitle
  const hasFooter = tournament.venue || tournament.date

  const teamCellStyle: React.CSSProperties = { minWidth: 240 }

  return (
    <div
      className="select-none text-white font-bold border border-white/70 bg-[#0b1220]/95 backdrop-blur-sm shadow-[0_6px_24px_rgba(0,0,0,0.5)] px-8 py-4 text-center rounded-[3px]"
      style={{ minWidth: 600 }}
    >
      {hasTitle && (
        <div className="text-gray-100 mb-3 tracking-[0.4em] text-center">
          {tournament.title && <div className="text-base">{tournament.title}</div>}
          {tournament.subtitle && (
            <div className="text-sm mt-0.5">{tournament.subtitle}</div>
          )}
        </div>
      )}
      <div className="flex items-center justify-center gap-6 text-3xl font-black tracking-tight whitespace-nowrap">
        <span
          className="inline-block text-center border-b-2 border-white pb-1"
          style={teamCellStyle}
        >
          {awayTeam.name || 'チームA'}
        </span>
        <span className="text-gray-400 text-2xl font-bold">×</span>
        <span
          className="inline-block text-center border-b-2 border-white pb-1"
          style={teamCellStyle}
        >
          {homeTeam.name || 'チームX'}
        </span>
      </div>
      {hasFooter && (
        <div className="text-xs text-gray-300 mt-3 tracking-[0.25em] text-center">
          {tournament.venue}
          {tournament.venue && tournament.date && '　'}
          {tournament.date}
        </div>
      )}
    </div>
  )
}
