import type { LineupPlayer, Position } from '../types'

const VALID_POSITIONS: Position[] = ['投', '捕', '一', '二', '三', '遊', '左', '中', '右', 'DH']

/** CSV ヘッダー行（順番固定。インポートも同じ列順を期待）。学年・コメントは任意列 */
export const LINEUP_CSV_HEADER = '順番,名前,守備,学年,コメント'

/** ダウンロード用のサンプルCSV（大学野球・10名・DHあり想定）。
 *  - 学年: "1年"〜"6年"・"院1"等を想定（自由文字列・空欄可）
 *  - コメント: 打者テロップに表示される1行情報（空欄可）
 */
export const LINEUP_CSV_SAMPLE = [
  LINEUP_CSV_HEADER,
  '1,三輪 蓮,中,3年,東農大三高出身',
  '2,古谷 颯太,遊,4年,主将・通算打率.328',
  '3,上條 蒼真,左,2年,',
  '4,神宮 大和,一,4年,リーグ通算8HR',
  '5,久保田 凌,右,3年,',
  '6,武藤 光輝,DH,1年,高校時代に甲子園出場',
  '7,桐山 直人,二,3年,',
  '8,河合 篤,捕,4年,正捕手・打率.301',
  '9,梶 拓海,三,2年,',
  '10,倉本 龍之介,投,4年,左腕エース・防御率1.85',
  '',
].join('\n')

/**
 * CSV テキストから LineupPlayer[] をパースする。
 *
 * 期待フォーマット（ヘッダー行あり）:
 *   順番,名前,守備,学年,コメント
 *
 * - 1〜9行目: 野手
 * - 10行目: 投手
 * - ヘッダー行は自動スキップ（1列目が数値でなければヘッダーと判定）
 * - 学年・コメントは任意列。3列CSV（旧フォーマット）も互換読み込み
 * - 旧フォーマット（背番号や打率列を含む9列CSV）も互換読み込み: 余分な列は無視
 */
export function parseLineupCsv(text: string): LineupPlayer[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) {
    throw new Error('CSVが空です')
  }

  // ヘッダー行をスキップ
  const firstCol = lines[0]!.split(',')[0]!.trim()
  const dataLines = /^\d+$/.test(firstCol) ? lines : lines.slice(1)

  if (dataLines.length === 0) {
    throw new Error('データ行がありません')
  }

  const players: LineupPlayer[] = []

  for (const line of dataLines) {
    const cols = line.split(',').map((c) => c.trim())
    const order = parseInt(cols[0] ?? '', 10)
    if (isNaN(order) || order < 1 || order > 10) continue

    const name = cols[1] ?? ''
    const posRaw = cols[2] ?? ''
    const position = (VALID_POSITIONS.includes(posRaw as Position) ? posRaw : '') as Position
    const grade = cols[3] ?? ''
    const comment = cols[4] ?? ''

    const base: LineupPlayer = {
      order,
      name,
      number: '',
      position: order === 10 ? (position || '投') : position,
    }
    if (grade) base.grade = grade
    if (comment) base.comment = comment
    players.push(base)
  }

  // 不足分を空行で埋める（10人分）
  for (let i = 1; i <= 10; i++) {
    if (!players.find((p) => p.order === i)) {
      players.push({
        order: i,
        name: '',
        number: '',
        position: (i === 10 ? '投' : '') as Position,
      })
    }
  }

  // order 順にソート
  players.sort((a, b) => a.order - b.order)

  return players
}
