import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import type { HalfInning } from '../../types'
import SectionTitle from './shared/SectionTitle'
import SectionLock from './shared/SectionLock'
import { NumberInputModal } from './shared/Modal'

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

  // 得点の直接修正モーダル（prompt の置換。OBSドックでも確実に動く）
  const [editCell, setEditCell] = useState<{ inning: number; half: HalfInning; current: number } | null>(null)
  // 相手（守備側）チームの得点修正パネルの開閉。通常は攻撃側1セットのみ表示し、
  // 守備側の修正が必要なときだけ開く（上下2セットで区別しづらい問題の解消）。
  // 2026-06-09 顧客フィードバック
  const [editOtherOpen, setEditOtherOpen] = useState(false)

  // 攻撃中チーム（表=先攻 / 裏=後攻）。得点は常に攻撃側に入るため、これを主役にする。
  const attackingTeam: 'away' | 'home' = currentHalf === 'top' ? 'away' : 'home'
  const defendingTeam: 'away' | 'home' = attackingTeam === 'away' ? 'home' : 'away'
  // 名前が空欄（完全リセット直後など）でも判別できるよう先攻/後攻でフォールバック
  const teamLabel = (team: 'away' | 'home') =>
    (team === 'away' ? awayTeam.name : homeTeam.name) || (team === 'away' ? '先攻' : '後攻')
  const attackColor = (attackingTeam === 'away' ? awayTeam.color : homeTeam.color) || '#3b82f6'

  const handleScoreClick = (inning: number, half: HalfInning) => {
    const inn = innings.find((i) => i.inning === inning)
    if (!inn) return
    setEditCell({ inning, half, current: inn[half] ?? 0 })
  }

  // 「終了した（チェンジ済みの）半回」のみ 0 を表示する。進行中・未到達の半回は空欄('-')。
  // 配信オーバーレイ（InningScoreboard の isPast）と完全に同じ判定にそろえる。
  // これをそろえないと、回を戻して内部的に空欄化しても操作画面だけ 0 が残って見える。
  // （2026-06-03 顧客フィードバック: 戻しても0が消えない／オーバーレイと不一致）
  const isPlayed = (inning: number, half: HalfInning) =>
    half === 'top'
      ? inning < currentInning || (inning === currentInning && currentHalf === 'bottom')
      : inning < currentInning
  const displayScore = (inning: number, half: HalfInning, value: number | null) =>
    value ?? (isPlayed(inning, half) ? 0 : '-')

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <SectionTitle title="得点" controls={['ミニスコア', 'スコアボード', '大型スコア', 'BSOパネル']} />

      <SectionLock locked={preGameLocked}>
      {/* 攻撃中チームの得点操作（主役）。表/裏で自動切替。+1点を大きめにして主操作を明確化 */}
      <div
        className="rounded-lg border-2 p-3 space-y-2"
        style={{ borderColor: attackColor }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-white text-[11px] font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: attackColor }}
          >
            ⚾ 攻撃中
          </span>
          <span className="text-white font-bold text-sm">{teamLabel(attackingTeam)}</span>
          <span className="text-gray-400 text-xs ml-auto">
            {currentInning}回{currentHalf === 'top' ? '表' : '裏'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => subtractRun(attackingTeam)}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded text-base font-bold"
          >
            −1点
          </button>
          <button
            onClick={() => addRun(attackingTeam)}
            className="flex-[2] bg-accent hover:bg-accent/80 text-white py-3 rounded text-lg font-bold"
          >
            ＋1点
          </button>
        </div>
      </div>

      {/* 相手（守備側）チームの修正は折りたたみに格納。通常は使わないため目立たせない */}
      <div>
        <button
          onClick={() => setEditOtherOpen((v) => !v)}
          className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1.5"
        >
          <span className="text-[10px]">{editOtherOpen ? '▼' : '▶'}</span>
          相手チーム（{teamLabel(defendingTeam)}）の得点を修正
        </button>
        {editOtherOpen && (
          <div className="mt-2 flex items-center gap-2 bg-gray-900/40 border border-gray-700 rounded p-2">
            <span className="text-gray-300 text-xs font-bold flex-1 min-w-0 truncate">
              {teamLabel(defendingTeam)}（守備側）
            </span>
            <button
              onClick={() => subtractRun(defendingTeam)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-bold shrink-0"
            >
              −1点
            </button>
            <button
              onClick={() => addRun(defendingTeam)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-bold shrink-0"
            >
              ＋1点
            </button>
          </div>
        )}
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

      <NumberInputModal
        open={editCell !== null}
        title={
          editCell
            ? `${editCell.inning}回${editCell.half === 'top' ? '表' : '裏'}の得点を修正`
            : ''
        }
        label="このイニングの得点を入力してください"
        defaultValue={editCell?.current ?? 0}
        min={0}
        max={99}
        onSubmit={(value) => {
          if (editCell) setInningScore(editCell.inning, editCell.half, value)
          setEditCell(null)
        }}
        onClear={() => {
          // セルを未記入（空欄）に戻す。誤って入れた 0 を消したいケース向け。
          if (editCell) setInningScore(editCell.inning, editCell.half, null)
          setEditCell(null)
        }}
        onCancel={() => setEditCell(null)}
      />
    </div>
  )
}
