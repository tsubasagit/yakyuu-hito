/**
 * 各コントロールセクションの共通タイトル。
 * - タイトルを大きく目立たせる
 * - 「→ 対応するオーバーレイ表示」バッジで上の表示ON/OFFとの関係を可視化
 *
 * controls には VisibilityControl のラベル文字列（例: 'BSOパネル' / 'スタメン' / 'バッター'）
 * をそのまま渡す。下のセクション名と上のトグル名が違っても、対応関係が一目で分かる。
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
            <span
              key={label}
              className="inline-flex items-center text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-bold border border-accent/40"
              title={`このセクションを編集すると「${label}」の表示内容が変わります`}
            >
              <span className="opacity-70 mr-0.5">→</span>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
