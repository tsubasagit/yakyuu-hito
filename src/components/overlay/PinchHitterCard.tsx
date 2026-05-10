import { useGameStore } from '../../store/useGameStore'

/**
 * 代打カード: 代打選手の発表表示。
 * 「代打」ラベル + チーム略称 + 選手名 のシンプル構成（2026-05-02 学年・コメント削除）。
 */
export default function PinchHitterCard() {
  const pinchHitter = useGameStore((s) => s.pinchHitter)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)

  if (!pinchHitter) return null

  const team = pinchHitter.team === 'away' ? awayTeam : homeTeam

  return (
    <div className="bg-black/85 backdrop-blur-sm rounded-lg text-white min-w-[280px] select-none overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1">
        <span
          className="inline-flex items-center justify-center w-[32px] h-[32px] rounded text-white font-bold text-lg border"
          style={{
            backgroundColor: team.color + 'cc',
            borderColor: team.color,
          }}
        >
          {team.shortName.charAt(0) || 'A'}
        </span>
        <span className="bg-gray-700 text-white text-xs font-bold px-2 py-0.5 rounded tracking-widest">
          代 打
        </span>
        <span className="text-xl font-bold flex-1">{pinchHitter.name}</span>
      </div>
    </div>
  )
}
