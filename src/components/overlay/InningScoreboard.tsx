import { useGameStore } from '../../store/useGameStore'
import { pickTeamLabel } from '../../lib/teamLabel'

/**
 * イニング別スコアボード（画像準拠デザイン・2026-05-16 リファイン）。
 * 白セル + 黒太ボーダーのテレビ中継風スコアボード。
 * 1-15 + R 列、A/X 各行。延長は currentInning に応じて自動拡張。
 * （2026-06-09 顧客フィードバック⑤: タイブレーク13回の実績ありのため上限を12→15回へ）
 */
/**
 * @param preview 指定時はプレビュー描画。store の isGameOver/scoreboardCross を無視し、
 *   preview.cross に従って最終回裏に「×」を出す。
 *   試合終了ウィザードで「確定前の完成形」を見せるために使う（2026-06-09 顧客フィードバック⑥）。
 */
export default function InningScoreboard({ preview }: { preview?: { cross: boolean } } = {}) {
  const innings = useGameStore((s) => s.innings)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)
  const isGameOver = useGameStore((s) => s.isGameOver)
  const scoreboardCross = useGameStore((s) => s.scoreboardCross ?? true)

  // 「×」表示の駆動は scoreboardCross（人が試合終了ウィザードで確認・確定した値）のみ。
  //  勝敗の自動判定は render では一切使わない（＝放送に出るのは人が確認した内容だけ）。
  //  後攻勝ち推定は「ウィザードのデフォルト値・説明文」用であり、表示の真偽は人が握る。
  //  preview 指定時はウィザードの仮トグル（preview.cross）でそのまま描画する（WYSIWYG）。
  //  （2026-06-09 顧客フィードバック⑥: 誤情報ゼロ優先 → 自動判定を下書きに降格）
  const showCross = preview ? preview.cross : (isGameOver && scoreboardCross)

  const baseInnings = Math.max(9, currentInning)
  const MAX_INNINGS = Math.min(15, baseInnings)
  const displayInnings = Array.from({ length: MAX_INNINGS }, (_, i) => {
    const num = i + 1
    const existing = innings.find((inn) => inn.inning === num)
    return existing ?? { inning: num, top: null, bottom: null }
  })

  // チーム名は最大4文字。name と shortName の長い方を採用。
  const awayLetter = pickTeamLabel(awayTeam, 'A')
  const homeLetter = pickTeamLabel(homeTeam, 'X')
  // チームレター列の幅は最長文字数で揃える（1文字=36px、4文字でも収まるよう拡張）。
  const maxLen = Math.max(Array.from(awayLetter).length, Array.from(homeLetter).length)
  const letterColWidth = maxLen <= 1 ? 36 : maxLen === 2 ? 48 : maxLen === 3 ? 60 : 72

  return (
    <div className="select-none shadow-[0_4px_16px_rgba(0,0,0,0.4)] rounded-[3px] overflow-hidden">
      <table className="border-collapse tabular-nums font-bold" style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            {/* 左上角 */}
            <th className="bg-[#0b1220]/95 backdrop-blur-sm border-2 border-black" style={{ width: letterColWidth, height: 28 }} />
            {displayInnings.map((inn) => (
              <th
                key={inn.inning}
                className="border-2 border-black text-sm text-center bg-[#0b1220]/95 backdrop-blur-sm text-white"
                style={{ width: 32, height: 28 }}
              >
                {inn.inning}
              </th>
            ))}
            <th
              className="bg-[#0b1220]/95 backdrop-blur-sm text-amber-300 border-2 border-black text-base"
              style={{ width: 44, height: 28 }}
            >
              R
            </th>
          </tr>
        </thead>
        <tbody>
          <ScoreRow
            letter={awayLetter}
            color={awayTeam.color}
            innings={displayInnings}
            half="top"
            currentInning={currentInning}
            currentHalf={currentHalf}
            total={awayTotal}
            showCross={showCross}
            letterColWidth={letterColWidth}
          />
          <ScoreRow
            letter={homeLetter}
            color={homeTeam.color}
            innings={displayInnings}
            half="bottom"
            currentInning={currentInning}
            currentHalf={currentHalf}
            total={homeTotal}
            showCross={showCross}
            letterColWidth={letterColWidth}
          />
        </tbody>
      </table>
    </div>
  )
}

function ScoreRow({
  letter,
  color,
  innings,
  half,
  currentInning,
  currentHalf,
  total,
  showCross,
  letterColWidth,
}: {
  letter: string
  color: string
  innings: { inning: number; top: number | null; bottom: number | null }[]
  half: 'top' | 'bottom'
  currentInning: number
  currentHalf: 'top' | 'bottom'
  total: number
  showCross: boolean
  letterColWidth: number
}) {
  // 文字数に応じてフォントを自動縮小（最大4文字想定）
  const len = Array.from(letter).length
  const letterFontSize = len <= 1 ? 18 : len === 2 ? 15 : len === 3 ? 13 : 11
  // 最終回の裏セルに × を出す（showCross=true のときのみ＝試合終了×ON×後攻勝ち）。
  //  - 裏セルが空欄 or 0（後攻が裏を攻撃しなかった: リード継続でゲーム終了）: "×" のみ
  //  - 裏セルに得点 1以上（逆転サヨナラ等）: "{得点}×"
  // 最終プレイ回の特定:
  //   - currentHalf === 'bottom' : 裏進行中 or 裏終了直後 → 最終回 = currentInning
  //   - currentHalf === 'top'    : 誤って次回表まで進めた後 → 最終回 = currentInning - 1
  //  ※ 後攻が裏を攻撃せず勝った場合、表終了で自動的に「同回の裏」に遷移するため
  //    通常運用では currentHalf==='bottom' で着地する（top 分岐は進め過ぎの保険）。
  const gameEnded = showCross
  const lastPlayedInning = currentHalf === 'bottom'
    ? currentInning
    : Math.max(1, currentInning - 1)
  return (
    <tr>
      {/* チームレターセル（最大4文字、列幅とフォントは自動調整） */}
      <td
        className="border-2 border-black text-white text-center font-black tracking-tight whitespace-nowrap"
        style={{
          backgroundColor: color || '#1e3a5f',
          width: letterColWidth,
          height: 36,
          fontSize: letterFontSize,
          paddingInline: 4,
        }}
      >
        {letter}
      </td>
      {innings.map((inn) => {
        const value = half === 'top' ? inn.top : inn.bottom
        // その半回が「すでに終了した（チェンジ済み）回」かどうか。
        //  - 終了した回のみ 0 を表示する。進行中の回は得点が入るまで空欄。
        //  （2026-05-31 顧客フィードバック③: 1回表開始時点で0が入る→チェンジ後に0が入るように）
        const isPast =
          half === 'top'
            ? inn.inning < currentInning ||
              (inn.inning === currentInning && currentHalf === 'bottom')
            : inn.inning < currentInning
        const hasValue = value !== null && value !== undefined
        const isLastBottomCell = half === 'bottom' && gameEnded && inn.inning === lastPlayedInning
        let display: React.ReactNode
        if (isLastBottomCell) {
          // 得点 0 または空欄 → 「×」のみ。1以上 → 「{得点}×」。
          // （2026-06-09 顧客指定: 得点0は×のみ、1以上は併記）
          const runs = value ?? 0
          if (runs >= 1) {
            display = (
              <span>
                {runs}
                <span className="text-amber-300 ml-0.5">×</span>
              </span>
            )
          } else {
            display = <span className="text-amber-300">×</span>
          }
        } else {
          // 値があれば表示、無ければ終了済みの回のみ 0、進行中・未到達は空欄
          display = hasValue ? value : isPast ? 0 : ''
        }
        return (
          <td
            key={inn.inning}
            className="border-2 border-black text-center text-base bg-[#0b1220]/95 backdrop-blur-sm text-white"
            style={{ width: 32, height: 36 }}
          >
            {display}
          </td>
        )
      })}
      <td
        className="border-2 border-black text-center text-xl font-black bg-white text-black"
        style={{ width: 44, height: 36 }}
      >
        {total}
      </td>
    </tr>
  )
}
