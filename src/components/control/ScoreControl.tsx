import { useGameStore } from '../../store/useGameStore'
import type { HalfInning } from '../../types'
import SectionTitle from './shared/SectionTitle'
import SectionLock from './shared/SectionLock'

export default function ScoreControl() {
  const innings = useGameStore((s) => s.innings)
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)
  const addRun = useGameStore((s) => s.addRun)
  const subtractRun = useGameStore((s) => s.subtractRun)
  const setInningScore = useGameStore((s) => s.setInningScore)
  // 試合前（準備中）は得点操作をロック
  const preGameLocked = useGameStore((s) => !(s.gameStarted ?? false) && !s.isGameOver)

  const handleScoreClick = (inning: number, half: HalfInning) => {
    const inn = innings.find((i) => i.inning === inning)
    if (!inn) return
    const current = inn[half] ?? 0
    const input = prompt(`${inning}回${half === 'top' ? '表' : '裏'}の得点:`, String(current))
    if (input === null) return
    const score = parseInt(input, 10)
    if (!isNaN(score) && score >= 0) {
      setInningScore(inning, half, score)
    }
  }

  // プレイ済みイニングは null でも「0」として表示する。
  // オーバーレイ側と同じロジックで、攻撃が終わった半回には 0 を自動表示。
  // （2026-05-21 顧客フィードバック対応）
  const isPlayed = (inning: number, half: HalfInning) =>
    half === 'top'
      ? inning <= currentInning
      : inning < currentInning || (inning === currentInning && currentHalf === 'bottom')
  const displayScore = (inning: number, half: HalfInning, value: number | null) =>
    value ?? (isPlayed(inning, half) ? 0 : '-')

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <SectionTitle title="得点" controls={['ミニスコア', 'スコアボード', '大型スコア', 'BSOパネル']} />

      <SectionLock locked={preGameLocked}>
      {/* クイック操作ボタン — アウェイ */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => subtractRun('away')}
          className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-2 rounded text-xs font-bold"
        >
          {awayTeam.name} -1点
        </button>
        <button
          onClick={() => addRun('away')}
          className="bg-accent hover:bg-accent/80 text-white px-2 py-2 rounded text-xs font-bold"
        >
          {awayTeam.name} +1点
        </button>
      </div>
      {/* クイック操作ボタン — ホーム */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => subtractRun('home')}
          className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-2 rounded text-xs font-bold"
        >
          {homeTeam.name} -1点
        </button>
        <button
          onClick={() => addRun('home')}
          className="bg-accent hover:bg-accent/80 text-white px-2 py-2 rounded text-xs font-bold"
        >
          {homeTeam.name} +1点
        </button>
      </div>

      {/* スコアグリッド */}
      <div className="overflow-x-auto">
        <table className="text-white text-sm font-mono border-collapse w-full">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left text-gray-400">チーム</th>
              {innings.map((inn) => (
                <th
                  key={inn.inning}
                  className={`px-2 py-1 text-center ${
                    inn.inning === currentInning
                      ? 'text-accent'
                      : 'text-gray-400'
                  }`}
                >
                  {inn.inning}
                </th>
              ))}
              <th className="px-2 py-1 text-center text-yellow-400">R</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-1 font-bold">{awayTeam.name}</td>
              {innings.map((inn) => (
                <td
                  key={inn.inning}
                  className={`px-2 py-1 text-center cursor-pointer hover:bg-gray-600 rounded ${
                    inn.inning === currentInning && currentHalf === 'top'
                      ? 'bg-gray-700'
                      : ''
                  }`}
                  onClick={() => handleScoreClick(inn.inning, 'top')}
                >
                  {displayScore(inn.inning, 'top', inn.top)}
                </td>
              ))}
              <td className="px-2 py-1 text-center text-yellow-400 font-bold">
                {awayTotal}
              </td>
            </tr>
            <tr>
              <td className="px-2 py-1 font-bold">{homeTeam.name}</td>
              {innings.map((inn) => (
                <td
                  key={inn.inning}
                  className={`px-2 py-1 text-center cursor-pointer hover:bg-gray-600 rounded ${
                    inn.inning === currentInning && currentHalf === 'bottom'
                      ? 'bg-gray-700'
                      : ''
                  }`}
                  onClick={() => handleScoreClick(inn.inning, 'bottom')}
                >
                  {displayScore(inn.inning, 'bottom', inn.bottom)}
                </td>
              ))}
              <td className="px-2 py-1 text-center text-yellow-400 font-bold">
                {homeTotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-gray-500 text-xs">※ セルをクリックで数値を直接修正</p>
      </SectionLock>
    </div>
  )
}
