import { useGameStore } from '../../store/useGameStore'
import { pickTeamLabel } from '../../lib/teamLabel'

export default function StatusPanel() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)
  const count = useGameStore((s) => s.count)
  const runners = useGameStore((s) => s.runners)

  const awayLabel = pickTeamLabel(awayTeam, 'A')
  const homeLabel = pickTeamLabel(homeTeam, 'X')
  const halfLabel = currentHalf === 'top' ? 'オモテ' : 'ウラ'

  return (
    <div
      className="select-none font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,0.5)] border-2 border-black bg-[#0b1220]/95 backdrop-blur-sm inline-flex flex-col rounded-[3px] overflow-hidden"
    >
      {/* 上段: イニング + ダイヤ。
          上段（イニング表示＋ダイヤ）を縦・横ともに詰めてコンパクト化する。
          （2026-05-31 顧客FB④: 「ここのもう少しつめたい」→ パディング/ダイヤを縮小） */}
      <div className="flex items-stretch border-b-2 border-black">
        {/* イニング表示: 添付に合わせた右肩斜めカットのタブ。
            数字を大きく・表裏（オモテ/ウラ）を小さく添える。
            斜めカットは clip-path で作り、後ろのパネル地が三角に覗くタブ風にする。
            （2026-06-14 顧客フィードバック: 添付デザインに合わせる） */}
        <div
          className="relative flex items-center justify-center gap-1 text-white pl-5 pr-6 py-0 whitespace-nowrap"
          style={{
            background: 'linear-gradient(180deg, #39414f 0%, #1a202b 55%, #11161e 100%)',
            clipPath: 'polygon(0 0, 100% 0, calc(100% - 13px) 100%, 0 100%)',
          }}
        >
          <span className="text-lg font-black leading-none tracking-tight tabular-nums">
            {currentInning}
          </span>
          <span className="text-[10px] font-bold leading-none tracking-wide">{halfLabel}</span>
        </div>
        <div className="flex items-center justify-center px-2 py-0 flex-1">
          <Diamond first={runners.first} second={runners.second} third={runners.third} />
        </div>
      </div>

      {/* 下段: 2チーム行 + BSO（右） */}
      <div className="flex items-stretch">
        <div className="flex flex-col">
          <ScoreRow
            label={awayLabel}
            color={awayTeam.color}
            score={awayTotal}
            attacking={currentHalf === 'top'}
            bottomBorder
          />
          <ScoreRow
            label={homeLabel}
            color={homeTeam.color}
            score={homeTotal}
            attacking={currentHalf === 'bottom'}
          />
        </div>
        {/* BSO枠を不透明＋上位レイヤーにして、ダイヤ下角のはみ出しをこの枠の下へ隠す。
            （2026-06-12 顧客フィードバック: はみ出した角が手前に見える→BSO枠を上に） */}
        <div className="relative z-10 flex flex-col justify-center gap-1.5 px-3 py-2 border-l-2 border-black bg-[#0b1220]">
          <BSORow
            label="B"
            count={count.balls}
            max={3}
            gradient="radial-gradient(circle at 32% 28%, #bbf7d0 0%, #22c55e 45%, #14532d 100%)"
          />
          <BSORow
            label="S"
            count={count.strikes}
            max={2}
            gradient="radial-gradient(circle at 32% 28%, #fef08a 0%, #eab308 45%, #422006 100%)"
          />
          <BSORow
            label="O"
            count={count.outs}
            max={2}
            gradient="radial-gradient(circle at 32% 28%, #fecaca 0%, #ef4444 45%, #450a0a 100%)"
          />
        </div>
      </div>
    </div>
  )
}

function ScoreRow({
  label,
  color,
  score,
  attacking,
  bottomBorder,
}: {
  label: string
  color: string
  score: number
  attacking: boolean
  bottomBorder?: boolean
}) {
  const len = Array.from(label).length
  // 文字数に応じて自動縮小（最大4文字想定）
  const fontSize = len >= 4 ? 13 : len === 3 ? 15 : len === 2 ? 17 : 20
  return (
    <div className={`flex items-stretch ${bottomBorder ? 'border-b-2 border-black' : ''}`}>
      <div
        style={{
          width: 4,
          backgroundColor: attacking ? '#ef4444' : 'transparent',
        }}
      />
      {/* 攻撃バーとチーム名セルの間の余白（3px・パネル地の濃紺）。
          大学カラーが赤系のとき攻撃バー（赤）と同化して境目が見えづらいため分離する。
          2026-06-09 顧客フィードバック */}
      <div style={{ width: 3 }} />
      {/* チームレターセルに大学カラーを反映（イニング別スコアボードと統一）。
          色未設定時は従来の濃紺にフォールバック。2026-06-09 顧客フィードバック③ */}
      <div
        className="flex items-center justify-center font-black border-r-2 border-black text-white tracking-tight"
        style={{ minWidth: 64, paddingInline: 6, height: 36, fontSize, lineHeight: 1, backgroundColor: color || '#0b1220' }}
      >
        {label}
      </div>
      <div
        className="text-center text-3xl font-black tabular-nums bg-white text-black"
        style={{ width: 56, height: 36, lineHeight: '36px' }}
      >
        {score}
      </div>
    </div>
  )
}

function Diamond({
  first,
  second,
  third,
}: {
  first: boolean
  second: boolean
  third: boolean
}) {
  // 横に広く・縦に低い「平たいひし形」の内野ダイヤ。3塁マーカー（2塁=上 /
  // 3塁=左 / 1塁=右）を左右対称に配置し、占有塁=明るい赤で点灯、空塁=暗い赤の
  // ソケット。高さをイニング文字とほぼ同じに抑えるため、横長の扁平ひし形にする。
  // （2026-06-14 顧客フィードバック: もっと横に広く・縦をイニング文字くらい低く）
  // 横に広い扁平ダイヤ。塁マーカーを各頂点（2塁=上 / 1塁=右 / 3塁=左）に大きく載せ、
  // 内野枠線が塁マーカーの中心を通る（枠と塁が一致）。下の頂点=本塁はマーカー無し。
  const pts = {
    second: { x: 65, y: 11 }, // 上
    third: { x: 13, y: 17 }, // 左
    first: { x: 117, y: 17 }, // 右
  }
  const S = 13 // 塁マーカーの一辺（大きめ）
  const Base = ({ p, on }: { p: { x: number; y: number }; on: boolean }) => (
    <rect
      x={p.x - S / 2}
      y={p.y - S / 2}
      width={S}
      height={S}
      rx={2.5}
      transform={`rotate(45 ${p.x} ${p.y})`}
      fill={on ? '#f23b35' : '#3a0d0d'}
      stroke={on ? '#ff9a93' : 'rgba(255,255,255,0.32)'}
      strokeWidth={1.5}
      style={on ? { filter: 'drop-shadow(0 0 2.5px rgba(242,59,53,0.95))' } : undefined}
    />
  )
  return (
    <svg
      viewBox="0 0 130 34"
      width={100}
      height={26}
      className="block"
    >
      {/* 内野ダイヤの薄い枠（上=2塁 / 右=1塁 / 下=本塁 / 左=3塁の4頂点）。
          塗りは薄い灰色（赤系は目立ちすぎるため）。 */}
      <polygon
        points="65,11 117,17 65,23 13,17"
        fill="rgba(205,211,219,0.18)"
        stroke="rgba(255,255,255,0.32)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Base p={pts.third} on={third} />
      <Base p={pts.first} on={first} />
      <Base p={pts.second} on={second} />
    </svg>
  )
}

function BSORow({
  label,
  count,
  max,
  gradient,
}: {
  label: string
  count: number
  max: number
  gradient: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[15px] font-black text-white w-4 leading-none">{label}</span>
      <div className="flex gap-1.5">
        {Array.from({ length: max }, (_, i) => {
          const lit = i < count
          return (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: 17,
                height: 17,
                background: lit ? gradient : 'transparent',
                border: lit ? 'none' : '1px solid rgba(255,255,255,0.35)',
                boxShadow: lit
                  ? 'inset 0 -1.5px 1.5px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.55)'
                  : 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
