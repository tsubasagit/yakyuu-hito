import { useGameStore } from '../../store/useGameStore'

/**
 * 状況パネル: イニング表記 + 走者ダイヤ + BSOランプ + A/X簡易スコア。
 * モックアップ右下相当。
 *
 * サブトグル:
 * - visibility.statusPanel_diamond
 * - visibility.statusPanel_bso
 * - visibility.statusPanel_quickScore
 */
export default function StatusPanel() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)
  const count = useGameStore((s) => s.count)
  const runners = useGameStore((s) => s.runners)
  const showDiamond = useGameStore((s) => s.visibility?.statusPanel_diamond ?? true)
  const showBSO = useGameStore((s) => s.visibility?.statusPanel_bso ?? true)
  const showQuickScore = useGameStore((s) => s.visibility?.statusPanel_quickScore ?? true)

  return (
    <div className="bg-black/85 backdrop-blur-sm rounded-lg text-white min-w-[220px] select-none p-2">
      {/* イニング表記 */}
      <div className="text-center text-sm font-bold tracking-widest mb-1">
        {currentInning}回{currentHalf === 'top' ? 'オモテ' : 'ウラ'}
      </div>

      <div className="flex gap-3 items-start">
        {/* 左: 簡易スコア */}
        {showQuickScore && (
          <div className="flex flex-col gap-0.5 text-sm font-mono">
            <ScoreLine shortName={awayTeam.shortName || 'A'} color={awayTeam.color} total={awayTotal} />
            <ScoreLine shortName={homeTeam.shortName || 'X'} color={homeTeam.color} total={homeTotal} />
          </div>
        )}

        {/* 中: ダイヤモンド */}
        {showDiamond && (
          <div className="flex items-center justify-center">
            <Diamond first={runners.first} second={runners.second} third={runners.third} />
          </div>
        )}

        {/* 右: BSO */}
        {showBSO && (
          <div className="flex flex-col gap-1 text-xs ml-auto">
            <BSORow label="B" count={count.balls} max={4} color="bg-green-500" />
            <BSORow label="S" count={count.strikes} max={3} color="bg-yellow-400" />
            <BSORow label="O" count={count.outs} max={3} color="bg-red-500" />
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreLine({ shortName, color, total }: { shortName: string; color: string; total: number }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center justify-center w-[22px] h-[22px] rounded text-white font-bold text-xs border"
        style={{ backgroundColor: color + 'cc', borderColor: color }}
      >
        {shortName.charAt(0)}
      </span>
      <span className="tabular-nums font-bold">{total}</span>
    </div>
  )
}

function Diamond({ first, second, third }: { first: boolean; second: boolean; third: boolean }) {
  const base = (on: boolean) =>
    `w-3 h-3 rotate-45 ${on ? 'bg-yellow-400' : 'bg-gray-700'}`
  return (
    <div className="relative w-[40px] h-[40px]">
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${base(second)}`} />
      <div className={`absolute top-1/2 left-0 -translate-y-1/2 ${base(third)}`} />
      <div className={`absolute top-1/2 right-0 -translate-y-1/2 ${base(first)}`} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white/10 border border-gray-500" />
    </div>
  )
}

function BSORow({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-400 text-[10px] font-bold w-3">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${i < count ? color : 'bg-gray-700'}`}
          />
        ))}
      </div>
    </div>
  )
}
