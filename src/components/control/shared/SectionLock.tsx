import type { ReactNode } from 'react'

/**
 * 試合前（準備中）に、得点系セクション（イニング／BSO・走者／得点）を操作不可にするラッパー。
 * - locked=true のとき: 案内バナーを出し、中身をクリック不可＋淡色表示にする
 * - 試合開始後（gameStarted）／試合終了後（isGameOver）は通常どおり操作可能
 *
 * 「試合前にイニング・BSO・得点を入れられて仕様がややこしい」という顧客フィードバック対応。
 * 試合前は『打順・選手の準備』、試合開始後に『得点・カウント入力』とフェーズを分ける。
 * （2026-05-31）
 */
export default function SectionLock({
  locked,
  children,
}: {
  locked: boolean
  children: ReactNode
}) {
  if (!locked) return <>{children}</>
  return (
    <div className="space-y-2">
      <div className="bg-gray-900/60 border border-gray-600 rounded px-3 py-1.5 text-[11px] leading-snug text-gray-300 flex items-start gap-1.5">
        <span className="shrink-0">🔒</span>
        <span>
          試合開始前は操作できません。
          <span className="text-gray-400">「試合管理 → ▶ 試合開始」を押すと入力できます。</span>
        </span>
      </div>
      <div className="pointer-events-none opacity-40 select-none" aria-disabled="true">
        {children}
      </div>
    </div>
  )
}
