import { useGameStore } from '../../store/useGameStore'
import { pickTeamLabel } from '../../lib/teamLabel'

/** チーム名セルの自動縮小フォント（省略名は最大5文字想定）。 */
function labelFontSize(len: number): number {
  return len >= 4 ? 13 : len === 3 ? 15 : len === 2 ? 17 : 20
}

/** 左右チームのうち長い方の省略名に合わせた共通セル幅。
 *  省略名の文字数が左右で違っても、両行のスコア（0）の白枠が縦一直線に揃うよう、
 *  チーム名セルの幅を左右で統一する（各行が中身に応じて別々に伸びるのを防ぐ）。 */
function teamLabelCellWidth(a: string, b: string): number {
  const need = (s: string) => {
    const len = Array.from(s).length
    return Math.ceil(len * labelFontSize(len) * 1.06) + 12 // 文字幅＋paddingInline(6×2)
  }
  return Math.max(64, need(a), need(b))
}

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
  // 両行のチーム名セル幅を統一 → スコア（0）の白枠が縦一直線に揃う
  const labelCellWidth = teamLabelCellWidth(awayLabel, homeLabel)

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
          <span className="text-xl font-black leading-none tracking-tight tabular-nums">
            {currentInning}
          </span>
          <span className="text-[11px] font-bold leading-none tracking-wide">{halfLabel}</span>
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
            cellWidth={labelCellWidth}
            bottomBorder
          />
          <ScoreRow
            label={homeLabel}
            color={homeTeam.color}
            score={homeTotal}
            attacking={currentHalf === 'bottom'}
            cellWidth={labelCellWidth}
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
  cellWidth,
  bottomBorder,
}: {
  label: string
  color: string
  score: number
  attacking: boolean
  cellWidth: number
  bottomBorder?: boolean
}) {
  const len = Array.from(label).length
  // 文字数に応じて自動縮小（省略名は最大5文字想定）
  const fontSize = labelFontSize(len)
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
        style={{ width: cellWidth, paddingInline: 6, height: 36, fontSize, lineHeight: 1, backgroundColor: color || '#0b1220' }}
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
  // 横に広いダイヤ配置。塁マーカーを各頂点（2塁=上 / 1塁=右 / 3塁=左）に大きく載せる。
  // 内枠（薄いダイヤ枠線）は無し — 大きく鮮やかな塁マーカー自体でダイヤの向きが読める。
  // ランナーの有無を一目で読めるよう、占有塁=ベタ塗りの鮮やかな赤、
  // 空塁=ほぼ黒の暗いソケットにしてコントラストを最大化する。
  // 2塁(上)と1塁・3塁(下)の上下差を大きめに取り、立体的に見やすくする。
  // 横長・正方形寄りのひし形に。塁どうしの間隔を詰めて、3塁が密集した
  // コンパクトなダイヤに見えるよう中心座標を寄せる（2塁=上中央 / 1塁=右 /
  // 3塁=左）。各塁マーカーは正方形（回転＝きれいなひし形）のまま。
  // 形・大きさ・間隔は維持しつつ、各塁の頂点（回転後の対角＝約15.6）が
  // viewBox 内に余白約2.4で全部収まるよう中心を寄せ、頂点欠け/はみ出しをなくす。
  // （2026-06-15 顧客フィードバック: もっと横長に・正方形寄り・塁どうしを詰める→
  //   ひし形を全部枠の中に収める）
  // 各塁の間隔を気持ち広げる（中心間で約2単位≒実機約1.8px）。枠内余白は
  // 上下左右とも約1.4を確保（2026-06-15 顧客フィードバック: 赤ベース間を1〜2px開ける）
  const S = 22 // 塁マーカーの一辺（大きめの正方形＝きれいなひし形）
  // 各塁は45°回転の正方形なので辺の傾きは常に±1。隣り合う塁の中心を「45°線上」
  // （横の差＝縦の差＝中心間隔 k）に置くと、辺が同じ角度のまま揃う。
  //   k = d（半対角）→ 辺どうしが接して一本線／k = d + gap/√2 → 同じ45°線上のまま
  //   各塁の頂点間に gap ぶんの均等な余白が空く（中心はずらさない）。
  // （2026-07-01 顧客FB: 直線に揃えたうえで各四角に少し余白を → 中心を45°線上に保ち外へ広げる）
  const d = (S / 2) * Math.SQRT2 // 半対角 ≈ 15.56
  const gap = 4 // 塁どうしの余白（頂点間・viewBox単位）。0で接する。大きいほど広い
  const k = d + gap / Math.SQRT2 // 中心間隔（横=縦）。45°線上を保ったまま外側へ広げる
  const cx = 40 // 横中央
  const y2 = 17.8 // 2塁（上中央）の中心Y。上下端に均等な余白が残る高さ
  const pts = {
    second: { x: cx, y: y2 }, // 上中央
    third: { x: cx - k, y: y2 + k }, // 左下（2塁から45°）
    first: { x: cx + k, y: y2 + k }, // 右下（2塁から45°）
  }
  // 白い外枠を全塁で共通（色・太さ）にして「白い線」を揃える。
  // 空塁でもはっきり太い白枠でひし形が読めるので、走者ゼロでも1塁/3塁が判別できる。
  // （2026-07-01 顧客フィードバック①②: 白線を揃える・枠線を太く・空塁の視認性向上）
  const STROKE = 'rgba(255,255,255,0.92)'
  const STROKE_W = 2.2
  const Base = ({ p, on }: { p: { x: number; y: number }; on: boolean }) => (
    <rect
      x={p.x - S / 2}
      y={p.y - S / 2}
      width={S}
      height={S}
      rx={2}
      transform={`rotate(45 ${p.x} ${p.y})`}
      fill={on ? '#f5251d' : '#12161c'}
      stroke={STROKE}
      strokeWidth={STROKE_W}
      strokeLinejoin="round"
      style={on ? { filter: 'drop-shadow(0 0 1.5px rgba(245,37,29,0.85))' } : undefined}
    />
  )
  return (
    <svg
      viewBox="0 0 80 54"
      width={72}
      height={49}
      className="block"
    >
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
