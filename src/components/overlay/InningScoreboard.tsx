import { useGameStore } from '../../store/useGameStore'
import { pickTeamLabel } from '../../lib/teamLabel'

/**
 * イニング別スコアボード（画像準拠デザイン・2026-05-16 リファイン）。
 * 白セル + 黒太ボーダーのテレビ中継風スコアボード。
 * 1-12 + R 列、A/X 各行。延長は currentInning に応じて自動拡張。
 */
export default function InningScoreboard() {
  const innings = useGameStore((s) => s.innings)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)
  const isGameOver = useGameStore((s) => s.isGameOver)

  const baseInnings = Math.max(9, currentInning)
  const MAX_INNINGS = Math.min(12, baseInnings)
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
            isGameOver={isGameOver}
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
            isGameOver={isGameOver}
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
  isGameOver,
  letterColWidth,
}: {
  letter: string
  color: string
  innings: { inning: number; top: number | null; bottom: number | null }[]
  half: 'top' | 'bottom'
  currentInning: number
  currentHalf: 'top' | 'bottom'
  total: number
  isGameOver: boolean
  letterColWidth: number
}) {
  // 文字数に応じてフォントを自動縮小（最大4文字想定）
  const len = Array.from(letter).length
  const letterFontSize = len <= 1 ? 18 : len === 2 ? 15 : len === 3 ? 13 : 11
  // 試合終了時、最終回の裏セルに × を出す（home勝ち / away勝ち / 引き分け 共通）。
  //  - 裏を未プレイ（home コールド勝ち等）: "×" のみ
  //  - 裏を得点 or 0で打ち切り: "{得点}×"
  // 2026-05-24 仕様変更: 旧来は「homeリード時のみ」だったが、
  // 「試合終了マーカーとして×を出したい」という顧客要望（原田氏）に合わせて全パターン共通化。
  // 2026-05-25 修正: 裏まで打ち切って次回表に遷移済みの状態（先攻勝ち等）で
  // currentInning が +1 されている場合、isLastBottomCell の判定がズレて × が出ない問題を修正。
  //   - currentHalf === 'bottom' : 裏進行中 or 裏終了直後 → 最終プレイ回 = currentInning
  //   - currentHalf === 'top'    : 次回表に進んだ後 → 最終プレイ回 = currentInning - 1
  const gameEnded = isGameOver
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
        const played =
          half === 'top'
            ? inn.inning <= currentInning
            : inn.inning < currentInning ||
              (inn.inning === currentInning && currentHalf === 'bottom')
        const value = half === 'top' ? inn.top : inn.bottom
        const isLastBottomCell = half === 'bottom' && gameEnded && inn.inning === lastPlayedInning
        let display: React.ReactNode
        if (isLastBottomCell) {
          if (value === null || value === undefined) {
            display = <span className="text-amber-300">×</span>
          } else {
            display = (
              <span>
                {value}
                <span className="text-amber-300 ml-0.5">×</span>
              </span>
            )
          }
        } else {
          display = played ? value ?? 0 : ''
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
