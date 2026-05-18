import { useGameStore } from '../../store/useGameStore'

/**
 * 現在の打者: 攻守問わず lineupDisplayTeam で選択中のチーム・打者を表示。
 * スタッツの代わりに 1行コメント（高校名等）を表示する（2026-05-12 改修）。
 */
export default function CurrentBatter() {
  const lineupDisplayTeam = useGameStore((s) => s.lineupDisplayTeam ?? 'away')
  const awayLineup = useGameStore((s) => s.awayLineup)
  const homeLineup = useGameStore((s) => s.homeLineup)
  const awayBatterIndex = useGameStore((s) => s.awayBatterIndex)
  const homeBatterIndex = useGameStore((s) => s.homeBatterIndex)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)

  const team = lineupDisplayTeam === 'away' ? awayTeam : homeTeam
  const lineup = lineupDisplayTeam === 'away' ? awayLineup : homeLineup
  const batterIndex = lineupDisplayTeam === 'away' ? awayBatterIndex : homeBatterIndex
  const lineupPlayer = lineup[batterIndex]
  const name = lineupPlayer?.name ?? ''
  if (!name) return null

  const order = lineupPlayer?.order ?? 0
  const isPinchHit = lineupPlayer?.isPinchHit ?? false
  const positionLong = isPinchHit ? '代打' : positionLabel(lineupPlayer?.position ?? '')
  const grade = lineupPlayer?.grade ?? ''
  const comment = lineupPlayer?.comment ?? ''

  return (
    <div className="select-none min-w-[520px]">
      {/* チーム名（フル表示・枠の上） */}
      {team.name && (
        <div
          className="inline-block px-4 py-1 text-white text-sm font-bold tracking-wider rounded-t-xl"
          style={{ backgroundColor: team.color }}
        >
          {team.name}
        </div>
      )}
      <div className="bg-[#0b1220]/85 backdrop-blur-sm rounded-xl rounded-tl-none text-white overflow-hidden shadow-[0_4px_18px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="flex items-stretch">
          {/* 左: 打順バッジ（チーム色） */}
          <div
            className="flex flex-col items-center justify-center px-4 py-2 min-w-[78px] relative"
            style={{ backgroundColor: team.color }}
          >
            <span className="text-[11px] tracking-[0.25em] font-medium opacity-80">
              バッター
            </span>
            <span className="text-2xl font-black leading-tight">
              {order > 0 ? `${order}` : '—'}
              <span className="text-sm font-bold ml-0.5">番</span>
            </span>
          </div>

          {/* 中央: 守備位置 → 名前 */}
          <div className="flex flex-col justify-center gap-0.5 px-5 py-2 flex-1 min-w-0">
            <span className={`text-[12px] tracking-[0.2em] uppercase ${
              isPinchHit ? 'text-amber-300 font-bold' : 'text-gray-400'
            }`}>
              {positionLong || '　'}
            </span>
            <span className="text-3xl font-bold leading-tight tracking-tight truncate">
              {name}
            </span>
          </div>

          {/* 学年枠（コメント枠の前。常時表示・空ならプレースホルダ） */}
          <div
            className="flex flex-col items-center justify-center px-3 py-2 border-l border-white/15"
            style={{ minWidth: 64 }}
          >
            <span className="text-[9px] tracking-[0.2em] text-gray-500">学年</span>
            <span className="text-base font-bold text-amber-100 leading-tight">
              {grade || '—'}
            </span>
          </div>

          {/* コメント枠（あれば表示・なければ詰める） */}
          {comment && (
            <div
              className="flex items-center px-4 py-2 border-l border-white/15 text-sm text-gray-200 max-w-[260px]"
              title={comment}
            >
              <span className="truncate">{comment}</span>
            </div>
          )}
        </div>
      </div>
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
