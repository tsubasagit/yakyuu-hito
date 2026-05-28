/**
 * チームの表示名を最大4文字に整形して返す。
 *
 * `name` と `shortName` のうち、より長い（情報量の多い）方を採用してから
 * 4文字に切り詰める。これにより、以下のいずれのケースでも極力 4文字に近い表示になる：
 *   - 旧データで `shortName` が1〜2文字に短縮済み・`name` がフルネーム
 *   - 新データで `name` も `shortName` も同値（GameControl 経由）
 *   - 何らかの編集で `name` だけ短くなっているケース
 *
 * 両方空なら `fallback` を採用。サロゲートペア（絵文字含む）は1文字として扱う。
 */
export function pickTeamLabel(
  team: { name?: string; shortName?: string } | null | undefined,
  fallback: string,
): string {
  const a = (team?.name ?? '').trim()
  const b = (team?.shortName ?? '').trim()
  const lenA = Array.from(a).length
  const lenB = Array.from(b).length

  let best: string
  if (lenA === 0 && lenB === 0) best = fallback
  else if (lenA >= lenB) best = a || b || fallback
  else best = b || a || fallback

  return Array.from(best).slice(0, 4).join('')
}
