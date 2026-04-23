import { useEffect, useState } from 'react'
import SyncStatus from '../components/control/SyncStatus'
import GameControl from '../components/control/GameControl'
import InningControl from '../components/control/InningControl'
import CountControl from '../components/control/CountControl'
import RunnerControl from '../components/control/RunnerControl'
import ScoreControl from '../components/control/ScoreControl'
import LineupControl from '../components/control/LineupControl'
import VisibilityControl from '../components/control/VisibilityControl'
import TournamentControl from '../components/control/TournamentControl'
import PinchHitterControl from '../components/control/PinchHitterControl'
import { useGameStore, extractGameState } from '../store/useGameStore'
import { broadcastState, onStateRequest } from '../lib/sync'

/** コントロール側から定期的にフルステートをブロードキャストする */
function usePeriodicBroadcast() {
  useEffect(() => {
    const id = setInterval(() => {
      broadcastState(extractGameState(useGameStore.getState()))
    }, 2000)
    return () => clearInterval(id)
  }, [])
}

interface Section {
  id: string
  label: string
  component: React.ReactNode
}

const STORAGE_KEY = 'yakyuu-section-order'

function loadOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveOrder(order: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)) } catch { /* ignore */ }
}

/** 保存済み並び順に、旧IDを除去しつつ新IDを末尾に追加したリストを返す */
function mergeOrder(saved: string[] | null, defaults: string[]): string[] {
  if (!saved) return defaults
  const valid = saved.filter((id) => defaults.includes(id))
  const missing = defaults.filter((id) => !valid.includes(id))
  return [...valid, ...missing]
}

export default function ControlPage() {
  useEffect(() => {
    return onStateRequest(() => {
      broadcastState(extractGameState(useGameStore.getState()))
    })
  }, [])

  usePeriodicBroadcast()

  const allSections: Section[] = [
    { id: 'count',       label: 'カウント',    component: <CountControl /> },
    { id: 'runner',      label: '走者',        component: <RunnerControl /> },
    { id: 'inning',      label: 'イニング',    component: <InningControl /> },
    { id: 'score',       label: '得点・安打',  component: <ScoreControl /> },
    { id: 'pinchhitter', label: '代打',        component: <PinchHitterControl /> },
    { id: 'lineup',      label: '打順・選手',  component: <LineupControl /> },
    { id: 'tournament',  label: '大会情報',    component: <TournamentControl /> },
    { id: 'game',        label: '試合管理',    component: <GameControl /> },
  ]

  const defaultOrder = allSections.map((s) => s.id)
  const [order, setOrder] = useState<string[]>(() => mergeOrder(loadOrder(), defaultOrder))

  // 初期化時に古い並び順を正規化
  useEffect(() => {
    saveOrder(order)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sorted = order
    .map((id) => allSections.find((s) => s.id === id))
    .filter((s): s is Section => !!s)

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= sorted.length) return
    const next = [...order]
    const tmp = next[idx]!
    next[idx] = next[target]!
    next[target] = tmp
    setOrder(next)
    saveOrder(next)
  }

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4">
      <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4">
        <header className="flex items-center justify-between gap-2">
          <h1 className="text-white text-lg sm:text-2xl font-bold">
            yakyuu-hito コントロール
          </h1>
          <div className="flex items-center gap-3">
            <SyncStatus />
            <a
              href="#/overlay"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent/80 text-xs sm:text-sm underline whitespace-nowrap"
            >
              オーバーレイ →
            </a>
          </div>
        </header>

        {/* 最上段固定: 7要素の表示トグル */}
        <VisibilityControl />

        {/* セクション群（2カラムレイアウト・並び替え可能） */}
        <div className="columns-1 lg:columns-2 gap-4 space-y-3">
          {sorted.map((section, idx) => (
            <div key={section.id} className="relative break-inside-avoid">
              <div className="absolute -left-1 top-1 flex flex-col gap-0.5 z-10">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none px-1"
                  title="上へ移動"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === sorted.length - 1}
                  className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none px-1"
                  title="下へ移動"
                >
                  ▼
                </button>
              </div>
              <div className="ml-4">
                {section.component}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
