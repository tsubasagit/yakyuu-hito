import { useGameStore } from '../../store/useGameStore'
import type { DhMode, LineupPlayer, Team } from '../../types'
import { positionLabel } from '../../lib/positionLabel'

/** "2学年" や "2年生" のような表記から「学」「生」を除去し "2年" 形式に正規化 */
function normalizeGrade(raw: string): string {
  return raw.replace(/学(?=年)/g, '').replace(/年生/g, '年').trim()
}

/**
 * スタメン一覧（画像準拠デザイン・2026-05-16 リファイン）。
 *
 * 表示モード:
 *  - 'attacking' : 攻撃中チーム1つのみ（currentHalf で自動切替・デフォルト）
 *  - 'away'      : 先攻チームのみ
 *  - 'home'      : 後攻チームのみ
 *  - 'both'      : 両チーム並列＋VS表示
 *
 * 各行は番号/ポジション/名前/学年の4セルを白アウトラインで区切ったテーブル風レイアウト。
 */
export default function LineupPanel() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayLineup = useGameStore((s) => s.awayLineup)
  const homeLineup = useGameStore((s) => s.homeLineup)
  // DH制は両チーム共通。旧データ互換のため away/home フィールドも fallback として参照。
  const dhMode = useGameStore((s) => s.dhMode ?? s.awayDhMode ?? s.homeDhMode ?? 'dh')
  const mode = useGameStore((s) => s.lineupDisplayMode ?? 'attacking')
  const currentHalf = useGameStore((s) => s.currentHalf)

  const awayHasPlayers = awayLineup.slice(0, 9).some((p) => p.name.length > 0)
  const homeHasPlayers = homeLineup.slice(0, 9).some((p) => p.name.length > 0)
  if (!awayHasPlayers && !homeHasPlayers) return null

  const awayCard = (
    <TeamLineupCard team={awayTeam} lineup={awayLineup} dhMode={dhMode} label="先攻" />
  )
  const homeCard = (
    <TeamLineupCard team={homeTeam} lineup={homeLineup} dhMode={dhMode} label="後攻" />
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
    <div className="text-white font-bold shadow-[0_6px_24px_rgba(0,0,0,0.55)] rounded-[3px] overflow-hidden">
      {/* ヘッダー行: チーム名（チームカラー背景）+ スターティングメンバー黄帯 */}
      <div className="flex items-stretch border border-white/70">
        <div
          className="flex items-center px-5 py-3 flex-1 text-3xl font-black tracking-wide text-white"
          style={{
            backgroundColor: team.color || '#0b1220',
            textShadow: '0 2px 4px rgba(0,0,0,0.55)',
          }}
        >
          {team.name || (label === '先攻' ? 'チームA' : 'チームX')}
        </div>
        <div
          className="flex items-end justify-end px-3 pb-1 bg-[#0b1220]/95 backdrop-blur-sm"
          style={{ minWidth: 160 }}
        >
          <span
            className="text-black text-[11px] font-black tracking-widest px-3 py-1 leading-none"
            style={{ backgroundColor: '#f5d042' }}
          >
            スターティングメンバー
          </span>
        </div>
      </div>

      {/* 打者行 1-9 */}
      {batters.map((player) => (
        <LineupRow key={player.order} player={player} />
      ))}

      {/* 10番目: 投手行（DHあり/二刀流のみ） */}
      {showPitcherRow && <LineupRow player={pitcher!} pitcherRow />}
    </div>
  )
}

function LineupRow({
  player,
  pitcherRow = false,
}: {
  player: LineupPlayer
  pitcherRow?: boolean
}) {
  const orderLabel = pitcherRow ? 'P' : String(player.order)
  const positionText = pitcherRow
    ? 'ピッチャー'
    : player.isPinchHit
      ? '代打'
      : positionLabel(player.position)
  return (
    <div className="flex items-stretch border border-t-0 border-white/70">
      {/* 番号セル */}
      <div
        className={`flex items-center justify-center text-base font-black border-r border-white/70 ${
          pitcherRow ? 'bg-[#5b1d1d] text-red-200' : 'bg-white text-[#0b1220]'
        }`}
        style={{ minWidth: 36 }}
      >
        {orderLabel}
      </div>
      {/* ポジションセル（白文字。代打はオレンジ強調） */}
      <div
        className={`flex items-center px-3 py-1 text-[13px] tracking-wide border-r border-white/70 whitespace-nowrap bg-[#0b1220]/95 backdrop-blur-sm ${
          player.isPinchHit ? 'text-amber-300 font-black' : 'text-white'
        }`}
        style={{ minWidth: 116 }}
      >
        {positionText}
      </div>
      {/* 名前セル */}
      <div
        className="flex items-center px-3 py-1 text-[16px] bg-[#0b1220]/95 backdrop-blur-sm border-r border-white/70 whitespace-nowrap"
        style={{ minWidth: 180 }}
      >
        {player.name || '　'}
      </div>
      {/* 学年セル（コメント廃止 → 学年に置換）
          flex-1 で右端まで広がり、ヘッダーの「スターティングメンバー」帯と
          打者行の右端を揃える（学年が空でも背景は伸びるため右側余白が消える）。
          「2学年」「2年生」等の表記揺れは "2年" に正規化して表示。
          （2026-05-21 顧客フィードバック: 「学」不要 / 2026-05-24: 右側余白解消） */}
      <div
        className="flex items-center px-3 py-1 text-[14px] text-amber-100 bg-[#0b1220]/95 backdrop-blur-sm whitespace-nowrap flex-1"
        style={{ minWidth: 88 }}
      >
        {normalizeGrade(player.grade || '')}
      </div>
    </div>
  )
}

