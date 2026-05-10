import type { LineupPlayer, Position } from '../types'

const VALID_POSITIONS: Position[] = ['投', '捕', '一', '二', '三', '遊', '左', '中', '右', 'DH']

/** CSV ヘッダー行（順番固定。インポートも同じ列順を期待） */
export const LINEUP_CSV_HEADER = '順番,名前,守備'

/** ダウンロード用のサンプルCSV（10名・DHあり想定） */
export const LINEUP_CSV_SAMPLE = [
  LINEUP_CSV_HEADER,
  '1,秋山 翔吾,左',
  '2,野間 峻祥,中',
  '3,小園 海斗,遊',
  '4,坂倉 将吾,捕',
  '5,末包 昇大,右',
  '6,マクブルーム,一',
  '7,菊池 涼介,二',
  '8,上本 崇司,三',
  '9,田村 俊介,DH',
  '10,森下 暢仁,投',
  '',
].join('\n')

/**
 * CSV テキストから LineupPlayer[] をパースする。
 *
 * 期待フォーマット（ヘッダー行あり）:
 *   順番,名前,守備
 *
 * - 1〜9行目: 野手
 * - 10行目: 投手
 * - ヘッダー行は自動スキップ（1列目が数値でなければヘッダーと判定）
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

    if (order === 10) {
      players.push({
        order,
        name,
        number: '',
        position: position || '投',
      })
    } else {
      players.push({
        order,
        name,
        number: '',
        position,
      })
    }
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
