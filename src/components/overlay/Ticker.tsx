import { useGameStore } from '../../store/useGameStore'

/**
 * 速報テロップ。
 * - OverlayPanel でラップされ、位置・サイズ（scale）は表示ON/OFFパネルから操作可能
 * - 幅は 1920x1080 キャンバスに対して 1840 を既定とする
 * - 透過は他テロップと統一（bg-black/95 + backdrop-blur）
 * - 文字は移動させず、中央揃えで固定表示する
 *   （2026-05-31 顧客フィードバック⑬: スクロール開始位置が途中からになるため固定・センター揃えに変更）
 */
export default function Ticker() {
  const ticker = useGameStore((s) => s.ticker)

  if (!ticker) return null

  return (
    <div
      className="bg-black/95 backdrop-blur-sm overflow-hidden h-10 flex items-center justify-center rounded-[3px] shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
      style={{ width: 1840 }}
    >
      <div className="whitespace-nowrap text-white text-base font-bold px-4 text-center truncate">
        {ticker}
      </div>
    </div>
  )
}
