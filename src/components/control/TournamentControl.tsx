import { useGameStore } from '../../store/useGameStore'

/**
 * 大会情報コントロール: tournamentHeader 用の4フィールド入力。
 */
export default function TournamentControl() {
  const tournament = useGameStore((s) => s.tournament)
  const setTournament = useGameStore((s) => s.setTournament)

  return (
    <div className="bg-gray-800 rounded-lg p-3 space-y-2">
      <h3 className="text-white font-bold text-sm">大会情報</h3>
      <Field
        label="大会名"
        value={tournament.title}
        placeholder="例: 全国クラブ野球選手権大会"
        onChange={(v) => setTournament({ title: v })}
      />
      <Field
        label="副題"
        value={tournament.subtitle}
        placeholder="例: 決勝戦"
        onChange={(v) => setTournament({ subtitle: v })}
      />
      <Field
        label="会場"
        value={tournament.venue}
        placeholder="例: ドリーム競技場"
        onChange={(v) => setTournament({ venue: v })}
      />
      <Field
        label="日付"
        value={tournament.date}
        placeholder="例: 2026年1月1日"
        onChange={(v) => setTournament({ date: v })}
      />
    </div>
  )
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs text-gray-300 mb-1 block">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-accent focus:outline-none"
      />
    </label>
  )
}
