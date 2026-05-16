import { useGameStore } from '../../store/useGameStore'

/**
 * 代打カード: 画像準拠デザイン（2026-05-16 リファイン）。
 * 上段:  [代 打 黄帯] [A 白角バッジ] [選手名] [学年]
 * 下段:  1行コメント（comment があれば表示）
 *
 * 全体は #0b1220 ベース、セル境界に白アウトラインで区切る。
 */
export default function PinchHitterCard() {
  const pinchHitter = useGameStore((s) => s.pinchHitter)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)

  if (!pinchHitter) return null

  const team = pinchHitter.team === 'away' ? awayTeam : homeTeam
  const teamLetter = team.shortName.charAt(0) || (pinchHitter.team === 'away' ? 'A' : 'H')

  return (
    <div className="select-none text-white font-bold min-w-[360px] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      {/* 上段行: 代打 + バッジ + 名前 + 学年 */}
      <div className="flex items-stretch border border-white/70 bg-[#0b1220]">
        {/* チームバッジ */}
        <div
          className="flex items-center justify-center px-3 text-xl font-black border-r border-white/70"
          style={{ backgroundColor: team.color || '#1e3a5f', minWidth: 44 }}
        >
          {teamLetter}
        </div>
        {/* 代 打 ラベル */}
        <div className="flex items-center justify-center px-3 py-1 text-base bg-[#0b1220] border-r border-white/70 tracking-[0.4em]">
          代 打
        </div>
        {/* 名前 */}
        <div className="flex items-center px-4 py-1 text-xl flex-1 whitespace-nowrap">
          {pinchHitter.name}
        </div>
        {/* 学年 */}
        {pinchHitter.grade && (
          <div className="flex items-center justify-end px-3 py-1 text-sm text-gray-300 border-l border-white/70 min-w-[56px]">
            {pinchHitter.grade}
          </div>
        )}
      </div>

      {/* 下段行: コメント */}
      {pinchHitter.comment && (
        <div className="border-x border-b border-white/70 bg-[#0b1220] text-sm text-gray-100 px-4 py-1.5 tracking-wide">
          {pinchHitter.comment}
        </div>
      )}
    </div>
  )
}
