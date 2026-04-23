import { useGameStore } from '../../store/useGameStore'

/**
 * 代打カード: 代打選手の発表表示。
 * モックアップ右上相当（代打 / チーム略称 / 選手名 / 学年 / 一行コメント）。
 */
export default function PinchHitterCard() {
  const pinchHitter = useGameStore((s) => s.pinchHitter)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)

  if (!pinchHitter) return null

  const team = pinchHitter.team === 'away' ? awayTeam : homeTeam

  return (
    <div className="bg-black/85 backdrop-blur-sm rounded-lg text-white min-w-[280px] select-none overflow-hidden">
      {/* ヘッダー: チーム略称 + 「代打」ラベル */}
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
        {pinchHitter.grade && (
          <span className="text-sm text-yellow-300">{pinchHitter.grade}</span>
        )}
      </div>
      {/* コメント */}
      {pinchHitter.comment && (
        <div className="bg-gray-800/80 px-3 py-1 text-xs text-gray-100 tracking-wider">
          {pinchHitter.comment}
        </div>
      )}
    </div>
  )
}
