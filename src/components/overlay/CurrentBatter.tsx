import { useGameStore } from '../../store/useGameStore'

/**
 * 現在の打者: プロ野球中継風ロワーサード（2026-05-02 リファイン）。
 * 左にチーム色バッジ（打順 + ポジション）、右に背番号・名前・学年。
 */
export default function CurrentBatter() {
  const currentHalf = useGameStore((s) => s.currentHalf)
  const awayLineup = useGameStore((s) => s.awayLineup)
  const homeLineup = useGameStore((s) => s.homeLineup)
  const awayBatterIndex = useGameStore((s) => s.awayBatterIndex)
  const homeBatterIndex = useGameStore((s) => s.homeBatterIndex)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const batter = useGameStore((s) => s.batter)

  if (!batter.name) return null

  const isAway = currentHalf === 'top'
  const team = isAway ? awayTeam : homeTeam
  const lineupPlayer = isAway ? awayLineup[awayBatterIndex] : homeLineup[homeBatterIndex]
  const order = lineupPlayer?.order ?? 0
  const positionLong = positionLabel(lineupPlayer?.position ?? '')
  const grade = lineupPlayer?.grade ?? ''

  return (
    <div className="bg-[#0b1220]/[0.92] backdrop-blur-sm rounded-lg text-white min-w-[520px] select-none overflow-hidden shadow-[0_4px_18px_rgba(0,0,0,0.5)] border border-white/10">
      <div className="flex items-stretch">
        {/* 左: 打順バッジ（チーム色） */}
        <div
          className="flex flex-col items-center justify-center px-4 py-2 min-w-[78px] relative"
          style={{ backgroundColor: team.color }}
        >
          <span className="text-[10px] tracking-[0.25em] font-medium opacity-80 uppercase">
            BATTER
          </span>
          <span className="text-2xl font-black leading-tight">
            {order > 0 ? `${order}` : '—'}
            <span className="text-sm font-bold ml-0.5">番</span>
          </span>
        </div>

        {/* 中央: 名前 */}
        <div className="flex items-center gap-3 px-5 py-2 flex-1">
          {batter.number && (
            <span className="font-mono text-amber-300 font-black text-2xl tabular-nums leading-none">
              {batter.number}
            </span>
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] tracking-[0.2em] text-gray-400 uppercase">
              {positionLong || '　'}
            </span>
            <span className="text-3xl font-bold leading-tight tracking-tight truncate">
              {batter.name}
            </span>
          </div>
          {grade && (
            <span className="text-sm text-gray-300 ml-auto self-start mt-0.5 font-medium">
              {grade}
            </span>
          )}
        </div>
      </div>

      {batter.stat && (
        <div className="bg-white/5 border-t border-white/10 px-5 py-1 text-xs text-gray-200 tracking-wider tabular-nums">
          {batter.statLabel ? `${batter.statLabel}  ` : ''}{batter.stat}
        </div>
      )}
    </div>
  )
}

function positionLabel(position: string): string {
  switch (position) {
    case '投': return 'ピッチャー'
    case '捕': return 'キャッチャー'
    case '一': return 'ファースト'
    case '二': return 'セカンド'
    case '三': return 'サード'
    case '遊': return 'ショート'
    case '左': return 'レフト'
    case '中': return 'センター'
    case '右': return 'ライト'
    case 'DH': return 'DH'
    default: return ''
  }
}
