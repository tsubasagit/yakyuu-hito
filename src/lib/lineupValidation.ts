import type { DhMode, LineupPlayer } from '../types'

export interface LineupCheck {
  /** 試合開始可能（必須項目がすべて埋まっている）か */
  complete: boolean
  /** 不足内容の説明（日本語・簡潔） */
  issues: string[]
  /** 名前＋守備位置が埋まった打者数（1〜9番） */
  filledBatters: number
  /** 必要打者数（常に 9） */
  requiredBatters: number
}

/**
 * 1チームの打順・選手登録が、選択中の DH 制で「試合開始できる完成度」かを判定する。
 *
 * 必須（ゲート）:
 *  - 1〜9番すべてに「名前」と「守備位置」が入っている
 *  - DHあり/二刀流: 1〜9番に DH が1人、かつ 10番（投手）の名前が入っている
 *  - DHなし: 1〜9番に投手（守備=投）が1人いる
 * 学年・コメント・背番号は任意（ゲート対象外）。
 * （2026-05-31 顧客フィードバック: 試合開始前に全項目埋まっているか判定して開始）
 */
export function validateTeamLineup(lineup: LineupPlayer[], dhMode: DhMode): LineupCheck {
  const issues: string[] = []
  const batters = lineup.slice(0, 9)
  let filled = 0

  batters.forEach((p, i) => {
    const order = i + 1
    const hasName = !!p.name?.trim()
    const hasPos = !!p.position
    if (hasName && hasPos) {
      filled++
    } else {
      const miss: string[] = []
      if (!hasName) miss.push('名前')
      if (!hasPos) miss.push('守備')
      issues.push(`${order}番: ${miss.join('・')}未入力`)
    }
  })

  if (dhMode === 'none') {
    const hasPitcher = batters.some((p) => p.position === '投')
    if (!hasPitcher) issues.push('投手（守備=投）が打順にいません')
  } else {
    // dh / twoWay
    const hasDh = batters.some((p) => p.position === 'DH')
    if (!hasDh) issues.push('DH（守備=DH）が打順にいません')
    const pitcher = lineup[9]
    if (!pitcher?.name?.trim()) issues.push('投手（10番）の名前が未入力')
  }

  return {
    complete: issues.length === 0,
    issues,
    filledBatters: filled,
    requiredBatters: 9,
  }
}
