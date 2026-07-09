import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import SectionTitle from './shared/SectionTitle'
import SectionLock from './shared/SectionLock'
import { ConfirmModal } from './shared/Modal'

/**
 * BSO管理パネル（旧カウント＋走者を統合）。
 * - B/S/O カウンタと一塁/二塁/三塁の走者トグルを1枠に集約
 * - 「カウントリセット」はBSO＋走者すべてをリセット
 * - デッドボールボタンは廃止（学生運用簡素化のため）
 */
export default function CountControl() {
  const count = useGameStore((s) => s.count)
  const addBall = useGameStore((s) => s.addBall)
  const addStrike = useGameStore((s) => s.addStrike)
  const addOut = useGameStore((s) => s.addOut)
  const resetCount = useGameStore((s) => s.resetCount)
  const resetBallStrike = useGameStore((s) => s.resetBallStrike)
  const subtractBall = useGameStore((s) => s.subtractBall)
  const subtractStrike = useGameStore((s) => s.subtractStrike)
  const subtractOut = useGameStore((s) => s.subtractOut)
  const runners = useGameStore((s) => s.runners)
  const setRunner = useGameStore((s) => s.setRunner)
  // 試合前（準備中）はBSO・走者操作をロック
  const preGameLocked = useGameStore((s) => !(s.gameStarted ?? false) && !s.isGameOver)

  // ファウル対策: 2ストライク2アウトで S+1 を押すと「3アウト・攻守交代」が起きる。
  // その瞬間だけ確認を挟む（ファウルを誤ってストライクに数えてチェンジする事故を防ぐ）。
  // それ以外のS+1（チェンジを伴わない三振）は確認なしでそのまま加算（操作を妨げない）。
  // （2026-06-02 顧客フィードバック①: 影響の大きいチェンジ時のみガード）
  const [confirmChange, setConfirmChange] = useState(false)
  const willChangeOnStrike = count.strikes === 2 && count.outs === 2
  const handleAddStrike = () => {
    if (willChangeOnStrike) setConfirmChange(true)
    else addStrike()
  }

  const bases = [
    { key: 'first' as const, label: '一塁' },
    { key: 'second' as const, label: '二塁' },
    { key: 'third' as const, label: '三塁' },
  ]

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <SectionTitle title="BSO・走者" controls={['BSOパネル']} />

      <SectionLock locked={preGameLocked}>
      <div className="grid grid-cols-3 gap-3">
        {/* ボール */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold text-sm">B</span>
            <span className="text-white font-mono text-2xl font-bold">
              {count.balls}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={subtractBall}
              disabled={count.balls <= 0}
              className="flex-1 bg-green-900 hover:bg-green-800 disabled:opacity-30 text-white px-2 py-2 rounded text-sm font-bold"
            >
              -1
            </button>
            <button
              onClick={addBall}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white px-2 py-2 rounded text-sm font-bold"
            >
              +1
            </button>
          </div>
        </div>

        {/* ストライク */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-bold text-sm">S</span>
            <span className="text-white font-mono text-2xl font-bold">
              {count.strikes}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={subtractStrike}
              disabled={count.strikes <= 0}
              className="flex-1 bg-yellow-900 hover:bg-yellow-800 disabled:opacity-30 text-white px-2 py-2 rounded text-sm font-bold"
            >
              -1
            </button>
            <button
              onClick={handleAddStrike}
              className="flex-1 bg-yellow-700 hover:bg-yellow-600 text-white px-2 py-2 rounded text-sm font-bold"
            >
              +1
            </button>
          </div>
        </div>

        {/* アウト */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-bold text-sm">O</span>
            <span className="text-white font-mono text-2xl font-bold">
              {count.outs}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={subtractOut}
              disabled={count.outs <= 0}
              className="flex-1 bg-red-900 hover:bg-red-800 disabled:opacity-30 text-white px-2 py-2 rounded text-sm font-bold"
            >
              -1
            </button>
            <button
              onClick={addOut}
              className="flex-1 bg-red-700 hover:bg-red-600 text-white px-2 py-2 rounded text-sm font-bold"
            >
              +1
            </button>
          </div>
        </div>
      </div>

      {/* 走者（BSO枠に統合） */}
      <div className="pt-2 border-t border-gray-700">
        <div className="text-gray-400 text-xs mb-1.5">走者</div>
        <div className="flex gap-2">
          {bases.map((base) => (
            <button
              key={base.key}
              onClick={() => setRunner(base.key, !runners[base.key])}
              className={`flex-1 px-3 py-2 rounded text-sm font-bold transition-colors ${
                runners[base.key]
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {base.label}
            </button>
          ))}
        </div>
      </div>

      {/* リセット（2種類: 打者カウントのみ / すべて） */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
        <button
          onClick={resetBallStrike}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-bold"
          title="ボール・ストライクのみリセット（アウト・走者は維持）"
        >
          打者カウントリセット（B/S）
        </button>
        <button
          onClick={resetCount}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-bold"
          title="ボール・ストライク・アウト・走者をすべてリセット"
        >
          オールリセット（B/S/アウト/走者）
        </button>
      </div>
      </SectionLock>

      <ConfirmModal
        open={confirmChange}
        title="3アウト・攻守交代になります"
        message={'このストライクで3アウト目となり、攻守交代します。\nファウルではありませんか？（2ストライク後のファウルはストライクに数えません）'}
        confirmLabel="三振でチェンジする"
        cancelLabel="やめる（ファウル等）"
        tone="danger"
        onConfirm={() => {
          addStrike()
          setConfirmChange(false)
        }}
        onCancel={() => setConfirmChange(false)}
      />
    </div>
  )
}
