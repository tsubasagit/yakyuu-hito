/**
 * コンパクトなスコア表示（ミニスコア/BSOパネル/イニングスコアボード/大型スコア）用の
 * チーム省略名を最大4文字に整形して返す。
 *
 * 省略名（`shortName`）を最優先で採用する。省略名が未入力なら `name`（フルネーム）を
 * 4文字に切り詰めてフォールバックし、それも空なら `fallback` を使う。
 *   - 大会名ヘッダー・打順パネルはフルネーム（team.name）を直接表示するため本関数を通さない
 *   - 省略名の入力欄（GameControl）は4文字以内を推奨。念のためここでも4文字に丸める
 *
 * サロゲートペア（絵文字含む）は1文字として扱う。
 * （2026-07-01 顧客フィードバック⑤⑥: フルネームと省略名を分離し、狭い枠は省略名で表示）
 */
export function pickTeamLabel(
  team: { name?: string; shortName?: string } | null | undefined,
  fallback: string,
): string {
  const short = (team?.shortName ?? '').trim()
  const full = (team?.name ?? '').trim()
  const best = short || full || fallback
  return Array.from(best).slice(0, 4).join('')
}
