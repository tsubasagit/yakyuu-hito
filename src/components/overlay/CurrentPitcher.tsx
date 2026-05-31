import { useGameStore } from '../../store/useGameStore'

/**
 * 現在の投手テロップ。表示元チームは「登板」ボタンで選んだ pitcherDisplayTeam を
 * そのまま使う（完全手動・攻守と独立）。打者テロップとは別チームを同時に出せる。
 * 投球数・登板中バッジは表示しない（学生運用簡素化）。
 * （2026-05-31 顧客フィードバック①: 攻守問わず投手テロップを出せるように。
 *  旧来は表示モード'attacking'で守備側に強制追従し、手動選択を無視していた）
 */
export default function CurrentPitcher() {
  const awayLineup = useGameStore((s) => s.awayLineup)
  const homeLineup = useGameStore((s) => s.homeLineup)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  // DH制は両チーム共通。旧データ互換のため away/home フィールドも fallback として参照。
  const dhMode = useGameStore((s) => s.dhMode ?? s.awayDhMode ?? s.homeDhMode ?? 'dh')
  const pitcherSide = useGameStore((s) => s.pitcherDisplayTeam ?? 'home')
  const team = pitcherSide === 'away' ? awayTeam : homeTeam
  const lineup = pitcherSide === 'away' ? awayLineup : homeLineup

  // 投手データの取得元を DH モードで切り替える：
  //  - DHあり/二刀流: lineup[9]（10番目=投手専用枠）
  //  - DHなし:        打順1〜9番のうち position==='投' の選手
  //                   （DHなし時に lineup[9] を見ると、過去の試合の残骸データを
  //                    「どこにも属さない人」として誤表示する問題があったため）
  // （2026-05-25 顧客フィードバック対応）
  const pitcherPlayer =
    dhMode === 'none'
      ? lineup.slice(0, 9).find((p) => p.position === '投')
      : lineup[9]
  const name = pitcherPlayer?.name ?? ''
  if (!name) return null

  const grade = pitcherPlayer?.grade ?? ''
  const comment = pitcherPlayer?.comment ?? ''

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

          {/* 学年枠（コメント枠の前。常時表示）
              ラベル「学年」は撤去し値のみ表示（例: "2年"）。
              （2026-05-21 顧客フィードバック: 「学」不要） */}
          <div
            className="flex flex-col items-center justify-center px-3 py-2 border-l border-white/15"
            style={{ minWidth: 64 }}
          >
            <span className="text-lg font-bold text-amber-100 leading-tight">
              {normalizeGrade(grade) || '—'}
            </span>
          </div>

          {/* コメント枠（長文は自動改行：手入力改行は尊重、長単語も折返し）
              幅 200px に揃えて短文でも自動的に折返しやすくする。 */}
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
