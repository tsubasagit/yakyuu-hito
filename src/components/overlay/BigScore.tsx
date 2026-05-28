import { useGameStore } from '../../store/useGameStore'
import { pickTeamLabel } from '../../lib/teamLabel'

/**
 * 大型スコア（画像準拠 v3・2026-05-17）。
 * - スコア数字: 純白塗り・大型（縦書きでない通常文字）
 * - チームレター: 背景・枠なしの白文字のみ
 * - 下にイニング表記（4回オモテ等・テキスト大きめ）、罫線なし
 */
export default function BigScore() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)

  // チーム名は最大4文字。name と shortName の長い方を採用（旧データで shortName
  // が短縮済みのケースでも、name にフルネームがあればそれを優先）。
  const awayLetter = pickTeamLabel(awayTeam, 'A')
  const homeLetter = pickTeamLabel(homeTeam, 'X')
  const halfLabel = currentHalf === 'top' ? 'オモテ' : 'ウラ'

  return (
    <div
      className="select-none text-white font-bold bg-[#0b1220]/95 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative rounded-[3px]"
      style={{ minWidth: 720, overflow: 'visible' }}
    >
      <div className="flex items-end justify-center gap-6 px-10 pt-6 pb-6">
        <TeamLetter letter={awayLetter} />
        <ScoreNumber value={awayTotal} />
        <Dash />
        <ScoreNumber value={homeTotal} />
        <TeamLetter letter={homeLetter} />
      </div>
      <div className="text-center pb-4">
        <span className="text-white font-black tracking-[0.3em]" style={{ fontSize: 32 }}>
          {currentInning}回{halfLabel}
        </span>
      </div>
    </div>
  )
}

function TeamLetter({ letter }: { letter: string }) {
  const len = Array.from(letter).length
  // 1文字=88px / 2文字=64px / 3文字=48px / 4文字=38px（最大4文字想定）
  const fontSize = len <= 1 ? 88 : len === 2 ? 64 : len === 3 ? 48 : 38
  // 4文字を1セルに収めるため横幅を可変に
  const minWidth = len <= 1 ? 112 : len === 2 ? 140 : len === 3 ? 168 : 200
  return (
    <div
      className="flex items-center justify-center text-white font-black tracking-tight whitespace-nowrap"
      style={{
        minWidth,
        height: 112,
        fontSize,
        lineHeight: 1,
        textShadow: '0 3px 6px rgba(0,0,0,0.55)',
      }}
    >
      {letter}
    </div>
  )
}

function ScoreNumber({ value }: { value: number }) {
  return (
    <div
      className="tabular-nums text-center leading-none text-white"
      style={{
        fontSize: 200,
        fontWeight: 900,
        minWidth: 160,
        letterSpacing: '-0.02em',
        textShadow: '0 8px 18px rgba(0,0,0,0.7), 0 0 24px rgba(0,0,0,0.4)',
        // 数字を上方にずらしてパネル上端から少しはみ出させる
        marginTop: -60,
        marginBottom: -10,
      }}
    >
      {value}
    </div>
  )
}

function Dash() {
  return (
    <div className="text-white/80 font-black leading-none" style={{ fontSize: 88 }}>
      -
    </div>
  )
}
