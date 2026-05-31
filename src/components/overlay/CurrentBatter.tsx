import { useGameStore } from '../../store/useGameStore'

/**
 * 現在の打者テロップ。表示元チームは「打席」ボタンで選んだ batterDisplayTeam を
 * そのまま使う（完全手動・攻守と独立）。
 *  - 攻撃中でも守備中でも、操作者が選んだチームの打者を表示できる
 *  - 投手テロップ（pitcherDisplayTeam）とは独立して別チームを出せる
 * スタッツの代わりに 1行コメント（高校名等）を表示する。
 * （2026-05-31 顧客フィードバック①: 攻守問わず打者テロップを出せるように。
 *  旧来は表示モード'attacking'で currentHalf に強制追従し、手動選択を無視していた）
 */
export default function CurrentBatter() {
  const awayLineup = useGameStore((s) => s.awayLineup)
  const homeLineup = useGameStore((s) => s.homeLineup)
  const awayBatterIndex = useGameStore((s) => s.awayBatterIndex)
  const homeBatterIndex = useGameStore((s) => s.homeBatterIndex)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const displayTeam = useGameStore((s) => s.batterDisplayTeam ?? 'away')

  const team = displayTeam === 'away' ? awayTeam : homeTeam
  const lineup = displayTeam === 'away' ? awayLineup : homeLineup
  const batterIndex = displayTeam === 'away' ? awayBatterIndex : homeBatterIndex
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
          className="inline-block px-4 py-1 text-white text-sm font-bold tracking-wider rounded-t-[3px]"
          style={{ backgroundColor: team.color }}
        >
          {team.name}
        </div>
      )}
      <div className="bg-[#0b1220]/95 backdrop-blur-sm rounded-[3px] rounded-tl-none text-white overflow-hidden shadow-[0_4px_18px_rgba(0,0,0,0.5)] border border-white/10">
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

          {/* 学年枠（コメント枠の前。常時表示・空ならプレースホルダ）
              ラベル「学年」は撤去し値のみ表示（例: "2年"）。
              ストア値に「学」が紛れた場合は除去して "2年" 表示に正規化する。
              （2026-05-21 顧客フィードバック: 「学」不要） */}
          <div
            className="flex flex-col items-center justify-center px-3 py-2 border-l border-white/15"
            style={{ minWidth: 64 }}
          >
            <span className="text-lg font-bold text-amber-100 leading-tight">
              {normalizeGrade(grade) || '—'}
            </span>
          </div>

          {/* コメント枠（あれば表示・なければ詰める）。
              - 幅は最大 200px（短文でも 14〜16 文字程度で自動折返しが効くサイズ）
              - whitespace-pre-wrap: 手入力の改行（\n）はそのまま尊重
              - break-words: 長単語・URL・英数字も枠内で折り返す
              - 「 / 」「、」「。」「・」 区切りでも視認性確保のため leading-snug */}
          {comment && (
            <div
              className="flex items-center px-4 py-2 border-l border-white/15 text-sm text-gray-200"
              style={{ maxWidth: 200 }}
              title={comment}
            >
              <span className="whitespace-pre-wrap break-words leading-snug">{comment}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** "2学年" や "2年生" のような表記から「学」「生」を除去し "2年" 形式に正規化 */
function normalizeGrade(raw: string): string {
  return raw.replace(/学(?=年)/g, '').replace(/年生/g, '年').trim()
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
