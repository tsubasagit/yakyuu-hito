import { useGameStore } from '../../store/useGameStore'

/**
 * 速報テロップ。
 * - OverlayPanel でラップされ、位置・サイズ（scale）は表示ON/OFFパネルから操作可能
 * - 幅は 1920x1080 キャンバスに対して 1840 を既定（画面内に収まる中央バナー）
 * - 高さ・文字サイズは従来の約2倍（h-20 / 文字 約2倍）を「実寸1.0」として固定する。
 *   以前は OverlayPanel の baseScale=2 で全体を2倍にしていたが、横幅まで3680pxに膨らみ
 *   画面外へ大きくはみ出していたため、本体側で高さ・文字だけ2倍にする方式へ変更。
 *   （2026-06-09 QA #4: 全幅はみ出し＆スライダー表示と実寸の乖離の解消）
 * - 透過は他テロップと統一（bg-black/95 + backdrop-blur）
 * - 文字は移動させず、中央揃えで固定表示する（2026-05-31 顧客フィードバック⑬）
 */
export default function Ticker() {
  const ticker = useGameStore((s) => s.ticker)

  if (!ticker) return null

  return (
    <div
      className="bg-black/95 backdrop-blur-sm overflow-hidden h-20 flex items-center justify-center rounded-[3px] shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
      style={{ width: 1840 }}
    >
      <div className="whitespace-nowrap text-white text-3xl font-bold px-8 text-center truncate">
        {ticker}
      </div>
    </div>
  )
}
