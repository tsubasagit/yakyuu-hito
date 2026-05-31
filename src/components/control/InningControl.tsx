import { useGameStore } from '../../store/useGameStore'
import SectionTitle from './shared/SectionTitle'
import SectionLock from './shared/SectionLock'

export default function InningControl() {
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)
  const advanceInning = useGameStore((s) => s.advanceInning)
  const rewindInning = useGameStore((s) => s.rewindInning)
  // 試合前（準備中）はイニング操作をロック（試合開始後 or 終了後は操作可）
  const preGameLocked = useGameStore((s) => !(s.gameStarted ?? false) && !s.isGameOver)

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <SectionTitle title="イニング" controls={['BSOパネル', 'スコアボード', 'ミニスコア', '大型スコア']} />

      <SectionLock locked={preGameLocked}>
      <div className="flex items-center gap-4">
        <button
          onClick={rewindInning}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-bold"
          disabled={currentInning <= 1 && currentHalf === 'top'}
        >
          ← 戻す
        </button>
        <div className="bg-gray-700 rounded px-4 py-2 text-white font-mono text-xl font-bold">
          {currentInning}回{currentHalf === 'top' ? '表' : '裏'}
        </div>
        <button
          onClick={advanceInning}
          className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded text-sm font-bold"
        >
          次へ →
        </button>
      </div>
      </SectionLock>
    </div>
  )
}
