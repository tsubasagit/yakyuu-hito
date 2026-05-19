import type { Position } from '../types'

export function positionLabel(position: string): string {
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
    default: return position || '　'
  }
}

export const POSITIONS_WITH_DH: Position[] = ['投', '捕', '一', '二', '三', '遊', '左', '中', '右', 'DH']
export const POSITIONS_NO_DH: Position[] = ['投', '捕', '一', '二', '三', '遊', '左', '中', '右']
