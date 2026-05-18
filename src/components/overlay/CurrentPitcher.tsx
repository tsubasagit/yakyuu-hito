import { useGameStore } from '../../store/useGameStore'

/**
 * 現在の投手: lineupDisplayTeam で選択中チームの投手を表示。
 * 投球数・登板中バッジは表示しない（学生運用簡素化）。
 */
export default function CurrentPitcher() {
  const awayLineup = useGameStore((s) => s.awayLineup)
  const homeLineup = useGameStore((s) => s.homeLineup)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const currentHalf = useGameStore((s) => s.currentHalf)

  // 表中=後攻が守備、裏中=先攻が守備。常に「守備中チーム」のピッチャーを表示する。
  // 旧仕様では lineupDisplayTeam に追従していたため、攻撃側ピッチャーが出るバグがあった。
  const defendingSide: 'away' | 'home' = currentHalf === 'top' ? 'home' : 'away'
  const team = defendingSide === 'away' ? awayTeam : homeTeam
  const lineup = defendingSide === 'away' ? awayLineup : homeLineup
  const pitcherPlayer = lineup[9]
  const name = pitcherPlayer?.name ?? ''
  if (!name) return null

  const grade = pitcherPlayer?.grade ?? ''
  const comment = pitcherPlayer?.comment ?? ''

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
          {/* 左: ピッチャー バッジ（チーム色） */}
          <div
            className="flex flex-col items-center justify-center px-4 py-2 min-w-[78px] relative"
            style={{ backgroundColor: team.color }}
          >
            <span className="text-[11px] tracking-[0.25em] font-medium opacity-80">
              ピッチャー
            </span>
            <span className="text-xl font-black leading-tight mt-1">投</span>
          </div>

          {/* 中央: 守備位置 → 名前 */}
          <div className="flex flex-col justify-center gap-0.5 px-5 py-2 flex-1 min-w-0">
            <span className="text-[12px] tracking-[0.2em] text-gray-400 uppercase">
              ピッチャー
            </span>
            <span className="text-3xl font-bold leading-tight tracking-tight truncate">
              {name}
            </span>
          </div>

          {/* 学年枠（コメント枠の前。常時表示） */}
          <div
            className="flex flex-col items-center justify-center px-3 py-2 border-l border-white/15"
            style={{ minWidth: 64 }}
          >
            <span className="text-[9px] tracking-[0.2em] text-gray-500">学年</span>
            <span className="text-base font-bold text-amber-100 leading-tight">
              {grade || '—'}
            </span>
          </div>

          {/* コメント枠 */}
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
