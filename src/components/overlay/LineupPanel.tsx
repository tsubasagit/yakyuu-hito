import { useGameStore } from '../../store/useGameStore'
import type { DhMode, LineupPlayer, Team } from '../../types'

/**
 * スタメン一覧。コントロールパネルの「オーバーレイの打順表示」モードに応じて
 * 表示を切り替える:
 *  - 'attacking' : 攻撃中チーム1つのみ（currentHalf で自動切替・デフォルト）
 *  - 'away'      : 先攻チームのみ（常時固定）
 *  - 'home'      : 後攻チームのみ（常時固定）
 *  - 'both'      : 両チーム並列＋VS表示
 *
 * DHモードに応じて行数を切り替える:
 *  - 'dh'     : 10行（1-9 打者 + 10 投手）
 *  - 'none'   : 9行（投手は1-9のどこかに含まれる）
 *  - 'twoWay' : 10行（DH打者と投手が同一選手可）
 */
export default function LineupPanel() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayLineup = useGameStore((s) => s.awayLineup)
  const homeLineup = useGameStore((s) => s.homeLineup)
  const awayDhMode = useGameStore((s) => s.awayDhMode ?? 'dh')
  const homeDhMode = useGameStore((s) => s.homeDhMode ?? 'dh')
  const mode = useGameStore((s) => s.lineupDisplayMode ?? 'attacking')
  const currentHalf = useGameStore((s) => s.currentHalf)

  const awayHasPlayers = awayLineup.slice(0, 9).some((p) => p.name.length > 0)
  const homeHasPlayers = homeLineup.slice(0, 9).some((p) => p.name.length > 0)
  if (!awayHasPlayers && !homeHasPlayers) return null

  const awayCard = (
    <TeamLineupCard team={awayTeam} lineup={awayLineup} dhMode={awayDhMode} label="先攻" />
  )
  const homeCard = (
    <TeamLineupCard team={homeTeam} lineup={homeLineup} dhMode={homeDhMode} label="後攻" />
  )

  if (mode === 'both') {
    return (
      <div className="flex items-stretch gap-3 select-none">
        {awayHasPlayers && awayCard}
        {awayHasPlayers && homeHasPlayers && (
          <div className="flex items-center justify-center text-white font-black text-3xl drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]">
            VS
          </div>
        )}
        {homeHasPlayers && homeCard}
      </div>
    )
  }

  if (mode === 'away') {
    return <div className="select-none">{awayHasPlayers ? awayCard : homeCard}</div>
  }
  if (mode === 'home') {
    return <div className="select-none">{homeHasPlayers ? homeCard : awayCard}</div>
  }

  // 'attacking': 攻撃中チームのみ表示。未登録ならフォールバック
  const attackingSide = currentHalf === 'top' ? 'away' : 'home'
  if (attackingSide === 'away') {
    return <div className="select-none">{awayHasPlayers ? awayCard : homeCard}</div>
  }
  return <div className="select-none">{homeHasPlayers ? homeCard : awayCard}</div>
}

function TeamLineupCard({
  team,
  lineup,
  dhMode,
  label,
}: {
  team: Team
  lineup: LineupPlayer[]
  dhMode: DhMode
  label: '先攻' | '後攻'
}) {
  const batters = lineup.slice(0, 9)
  const pitcher = lineup[9]
  const showPitcherRow = dhMode !== 'none' && pitcher && pitcher.name.length > 0

  return (
    <div className="bg-black/85 backdrop-blur-sm rounded-lg text-white min-w-[372px] overflow-hidden">
      {/* ヘッダー: チーム略称 + 先攻/後攻 */}
      <div
        className="flex items-center gap-2 px-2 py-1"
        style={{ backgroundColor: team.color + '30' }}
      >
        <span
          className="inline-flex items-center justify-center w-[28px] h-[28px] rounded text-white font-bold border"
          style={{
            backgroundColor: team.color + 'cc',
            borderColor: team.color,
          }}
        >
          {team.shortName.charAt(0) || (label === '先攻' ? 'A' : 'H')}
        </span>
        <span className="text-sm font-bold">{team.name}</span>
        <span
          className="ml-auto text-[10px] font-bold text-black px-2 py-0.5 rounded tracking-wider"
          style={{ backgroundColor: '#f5d042' }}
        >
          {label}
        </span>
      </div>

      {/* 打者テーブル（1-9番） */}
      <table className="w-full border-collapse text-sm">
        <tbody>
          {batters.map((player) => (
            <tr key={player.order} className="border-t border-gray-700/60">
              <td className="px-2 py-0.5 text-gray-400 font-bold w-[24px] text-center">
                {player.order}
              </td>
              <td className="px-2 py-0.5 text-yellow-300 w-[112px] whitespace-nowrap">
                {positionLabel(player.position)}
              </td>
              <td className="px-2 py-0.5 font-bold">{player.name || '　'}</td>
              <td className="px-2 py-0.5 text-gray-300 text-xs w-[48px] text-right">
                {player.grade || ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 10番目: 投手行（DHあり/二刀流のみ） */}
      {showPitcherRow && (
        <div className="border-t-2 border-yellow-400/40">
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="bg-red-950/40">
                <td className="px-2 py-0.5 text-red-300 font-bold w-[24px] text-center">
                  P
                </td>
                <td className="px-2 py-0.5 text-red-300 w-[112px] font-bold whitespace-nowrap">
                  ピッチャー
                </td>
                <td className="px-2 py-0.5 font-bold">{pitcher!.name}</td>
                <td className="px-2 py-0.5 text-gray-300 text-xs w-[48px] text-right">
                  {pitcher!.grade || ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
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
