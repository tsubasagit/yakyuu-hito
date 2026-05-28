import { useEffect, useRef, useState } from 'react'
import SyncStatus from '../components/control/SyncStatus'
import GameControl from '../components/control/GameControl'
import InningControl from '../components/control/InningControl'
import CountControl from '../components/control/CountControl'
import ScoreControl from '../components/control/ScoreControl'
import LineupControl from '../components/control/LineupControl'
import VisibilityControl, { stripeForSection } from '../components/control/VisibilityControl'
import TournamentControl from '../components/control/TournamentControl'
import TickerControl from '../components/control/TickerControl'
import { useGameStore, extractGameState, withBroadcastApply } from '../store/useGameStore'
import { broadcastState, onStateRequest, onStateUpdate, TAB_ID } from '../lib/sync'

/** コントロール側から定期的にフルステートをブロードキャストする */
function usePeriodicBroadcast() {
  useEffect(() => {
    const id = setInterval(() => {
      broadcastState(extractGameState(useGameStore.getState()))
    }, 2000)
    return () => clearInterval(id)
  }, [])
}

/**
 * 複数の Control タブが開かれている状況に対応するため、
 * 他タブの broadcast を受信して自タブも追従する。
 *
 * 旧実装: Control は他タブからの broadcast を受信しなかった。
 * → 複数 Control タブが独立した state を持ち、それぞれが古い state を
 *   2秒ごとに送り続けてオーバーレイで新旧スコアが交互に入れ替わるバグの原因に。
 * (2026-05-21 顧客フィードバック対応)
 */
function useMultiTabControlSync() {
  const lastAppliedTsRef = useRef<number>(Date.now())
  const replaceState = useGameStore((s) => s.replaceState)
  useEffect(() => {
    // 自タブの state 変更時にも lastAppliedTs を更新する。
    // これがないと、自タブが操作した直後に他タブの古い periodic broadcast を
    // 「より新しい」と誤判定して受け入れ、自タブの変更が消える事故が起きる。
    const unsubLocal = useGameStore.subscribe(() => {
      lastAppliedTsRef.current = Date.now()
    })
    const unsubBroadcast = onStateUpdate((state, meta) => {
      // 自タブ発のメッセージは無視
      if (meta.tabId === TAB_ID) return
      // 古いメッセージ（自タブの直近変更より古い）は無視（last-write-wins）
      if (meta.ts < lastAppliedTsRef.current) return
      lastAppliedTsRef.current = meta.ts
      // 受信由来の適用中は再ブロードキャストしない（エコーループ防止）
      withBroadcastApply(() => replaceState(state))
    })
    return () => {
      unsubLocal()
      unsubBroadcast()
    }
  }, [replaceState])
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
  useMultiTabControlSync()

  /** 試合管理は最上段固定（並び替え不可）。それ以外を試合進行順にデフォルト配置 */
  const PINNED: Section = {
    id: 'game', label: '試合管理', component: <GameControl />,
  }

  const orderableSections: Section[] = [
    { id: 'inning',      label: 'イニング',          component: <InningControl /> },
    { id: 'count',       label: 'BSO・走者',         component: <CountControl /> },
    { id: 'score',       label: '得点',              component: <ScoreControl /> },
    { id: 'lineup',      label: '打順・選手',        component: <LineupControl /> },
    { id: 'ticker',      label: '速報テロップ',      component: <TickerControl /> },
    { id: 'tournament',  label: '大会名',            component: <TournamentControl /> },
  ]

  /** 表示トグルとの対応色（左帯）— stripeForSection の引数は section-{id} 形式 */
  const sectionStripe = (id: string): string | null =>
    stripeForSection(`section-${id}`)

  const defaultOrder = orderableSections.map((s) => s.id)
  const [order, setOrder] = useState<string[]>(() => mergeOrder(loadOrder(), defaultOrder))

  // 初期化時に古い並び順を正規化（旧 'game' エントリは固定化に伴い除去）
  useEffect(() => {
    saveOrder(order)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sorted = order
    .map((id) => orderableSections.find((s) => s.id === id))
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
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <a
              href="https://hito-inc.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded px-3 py-1.5 hover:opacity-80 transition-opacity inline-flex items-center"
              title="株式会社ひと 公式サイト"
            >
              <img
                src="https://hito-inc.jp/wp-content/uploads/2023/10/header_title_20231020x.png"
                alt="株式会社ひと"
                className="h-7 sm:h-8 w-auto"
                loading="eager"
              />
            </a>
            <div className="leading-tight">
              <h1 className="text-white text-base sm:text-xl font-bold">
                配信コントロールパネル
              </h1>
              <p className="text-gray-400 text-[10px] sm:text-xs">
                大学野球オンライン配信オーバーレイ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <SyncStatus />
            <a
              href="./guide.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white text-xs sm:text-sm underline whitespace-nowrap"
              title="OBS設定ガイド"
            >
              使い方 ?
            </a>
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

        {/* 最上段固定: 表示ON/OFF + サイズ調整（統合パネル） */}
        <VisibilityControl />

        {/* 試合管理（最上段固定・並び替え不可） */}
        <div>{PINNED.component}</div>

        {/* セクション群（2カラムレイアウト・▲/▼ で常時並び替え可能） */}
        <div className="columns-1 lg:columns-2 gap-4 space-y-3">
          {sorted.map((section, idx) => {
            const stripe = sectionStripe(section.id)
            return (
              <div
                key={section.id}
                id={`section-${section.id}`}
                className="relative break-inside-avoid scroll-mt-4"
              >
                <div className="absolute -left-0.5 top-1.5 flex flex-col gap-0.5 z-10">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="text-gray-500 hover:text-white disabled:opacity-20 text-[10px] leading-none px-1 py-0.5 bg-gray-800/80 hover:bg-gray-700 rounded shadow-sm"
                    title="上へ移動"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === sorted.length - 1}
                    className="text-gray-500 hover:text-white disabled:opacity-20 text-[10px] leading-none px-1 py-0.5 bg-gray-800/80 hover:bg-gray-700 rounded shadow-sm"
                    title="下へ移動"
                  >
                    ▼
                  </button>
                </div>
                <div className="relative ml-5">
                  {stripe && (
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg ${stripe} z-10 pointer-events-none`}
                      title="表示ON/OFFと対応"
                    />
                  )}
                  <div className={stripe ? 'pl-4' : ''}>
                    {section.component}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
