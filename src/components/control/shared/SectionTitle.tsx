import { scrollToPanelCard } from '../VisibilityControl'

/**
 * 各コントロールセクションの共通タイトル。
 * - タイトルを大きく目立たせる
 * - 「→ 対応するオーバーレイ表示」リンクで上の表示ON/OFFとの関係を可視化＋ワンクリック移動
 *
 * controls には VisibilityControl のラベル文字列（例: 'BSOパネル' / 'スタメン' / 'バッター'）
 * をそのまま渡す。下のセクション名と上のトグル名が違っても、対応関係が一目で分かる。
 * クリックすると該当の「配信画面に出すパネル」カードへスクロール＆ハイライトする。
 * （2026-05-31 顧客フィードバック⑧: 各ブロックのリンクを設定）
 */
export default function SectionTitle({
  title,
  controls = [],
}: {
  title: string
  /** このセクションが影響を与える「表示ON/OFF」のラベル一覧 */
  controls?: string[]
}) {
  return (
    <div className="mb-3 pb-2 border-b border-gray-700">
      <h2 className="text-white font-bold text-xl tracking-tight leading-tight">
        {title}
      </h2>
      {controls.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {controls.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => scrollToPanelCard(label)}
              className="inline-flex items-center text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-bold border border-accent/40 hover:bg-accent hover:text-white transition-colors cursor-pointer"
              title={`「${label}」の表示パネル設定へ移動`}
            >
              <span className="opacity-70 mr-0.5">→</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
