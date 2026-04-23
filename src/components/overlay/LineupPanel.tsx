import { useGameStore } from '../../store/useGameStore'

/**
 * スタメン一覧: 指定チームの1〜9番を学年・ポジション付きで表示。
 * モックアップ左側相当。打率などの詳細スタッツは非表示。
 */
export default function LineupPanel() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayLineup = useGameStore((s) => s.awayLineup)
  const homeLineup = useGameStore((s) => s.homeLineup)
  const currentHalf = useGameStore((s) => s.currentHalf)
  const displayTeam = useGameStore((s) => s.lineupDisplayTeam ?? (currentHalf === 'top' ? 'away' : 'home'))

  const team = displayTeam === 'away' ? awayTeam : homeTeam
  const lineup = displayTeam === 'away' ? awayLineup : homeLineup
  const batters = lineup.slice(0, 9)
  const hasPlayers = batters.some((p) => p.name.length > 0)
  if (!hasPlayers) return null

  return (
    <div className="bg-black/85 backdrop-blur-sm rounded-lg text-white min-w-[340px] select-none overflow-hidden">
      {/* ヘッダー: チーム略称 + スターティングメンバー */}
      <div className="flex items-center gap-2 px-2 py-1">
        <span
          className="inline-flex items-center justify-center w-[28px] h-[28px] rounded text-white font-bold border"
          style={{
            backgroundColor: team.color + 'cc',
            borderColor: team.color,
          }}
        >
          {team.shortName.charAt(0) || 'A'}
        </span>
        <span className="text-sm font-bold">{team.name}</span>
        <span
          className="ml-auto text-[10px] font-bold text-black px-2 py-0.5 rounded tracking-wider"
          style={{ backgroundColor: '#f5d042' }}
        >
          スターティングメンバー
        </span>
      </div>
      {/* テーブル */}
      <table className="w-full border-collapse text-sm">
        <tbody>
          {batters.map((player) => {
            if (!player.name) return null
            return (
              <tr key={player.order} className="border-t border-gray-700/60">
                <td className="px-2 py-0.5 text-gray-400 font-bold w-[24px] text-center">
                  {player.order}
                </td>
                <td className="px-2 py-0.5 text-yellow-300 w-[64px]">
                  {positionLabel(player.position)}
                </td>
                <td className="px-2 py-0.5 font-bold">{player.name}</td>
                <td className="px-2 py-0.5 text-gray-300 text-xs w-[48px] text-right">
                  {player.grade || ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** ポジション記号を長ラベルに変換（モックアップの「ショート」等に合わせる） */
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
    default: return position
  }
}
