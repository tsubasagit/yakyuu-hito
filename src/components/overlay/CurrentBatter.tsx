import { useGameStore } from '../../store/useGameStore'

/**
 * 現在の打者: 打席に立っている選手を大きく表示するロワーサード。
 * - 打順は currentHalf から攻撃側を判定し、{away,home}BatterIndex を参照
 * - ポジション・学年は lineup から取得
 * - 背番号・名前・スタッツは store.batter（selectBatter で同期される）
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
    <div className="bg-black/85 backdrop-blur-sm rounded-lg text-white min-w-[480px] select-none overflow-hidden">
      <div className="flex items-stretch">
        <div
          className="flex flex-col items-center justify-center px-3 py-2 min-w-[64px]"
          style={{ backgroundColor: team.color + 'cc' }}
        >
          <span className="text-[10px] tracking-widest font-bold opacity-90">
            {order > 0 ? `${order}番` : '打者'}
          </span>
          <span className="text-xs font-bold leading-tight">{positionLong || '　'}</span>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 flex-1">
          {batter.number && (
            <span className="text-yellow-300 font-mono font-bold text-2xl tabular-nums leading-none">
              #{batter.number}
            </span>
          )}
          <span className="text-3xl font-bold leading-tight">{batter.name}</span>
          {grade && (
            <span className="text-yellow-200 text-sm ml-auto">{grade}</span>
          )}
        </div>
      </div>

      {batter.stat && (
        <div className="bg-gray-800/80 px-4 py-1 text-xs text-gray-100 tracking-wider border-t border-white/10">
          {batter.statLabel ? `${batter.statLabel} ` : ''}{batter.stat}
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
