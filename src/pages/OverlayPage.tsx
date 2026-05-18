import { useEffect, useState } from 'react'
import { useBroadcastSync } from '../hooks/useBroadcastSync'
import { useGameStore, setPreventPersistWrites } from '../store/useGameStore'
import { requestState } from '../lib/sync'
import { loadOverlayCache } from '../lib/overlayCache'
import { DEFAULT_ELEMENT_POSITIONS } from '../types'
import OverlayPanel from '../components/overlay/shared/OverlayPanel'
import MiniScore from '../components/overlay/MiniScore'
import LineupPanel from '../components/overlay/LineupPanel'
import TournamentHeader from '../components/overlay/TournamentHeader'
import BigScore from '../components/overlay/BigScore'
import InningScoreboard from '../components/overlay/InningScoreboard'
import StatusPanel from '../components/overlay/StatusPanel'
import CurrentBatter from '../components/overlay/CurrentBatter'
import CurrentPitcher from '../components/overlay/CurrentPitcher'
import Ticker from '../components/overlay/Ticker'

const CANVAS_W = 1920
const CANVAS_H = 1080

/** ビューポートに合わせて 1920x1080 キャンバスを自動スケーリング */
function useViewportScale() {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    function update() {
      const sx = window.innerWidth / CANVAS_W
      const sy = window.innerHeight / CANVAS_H
      setScale(Math.min(sx, sy))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return scale
}

const HEARTBEAT_KEY = 'yakyuu-overlay-heartbeat'

/** オーバーレイが生きていることをコントロール側に伝えるハートビート */
function useOverlayHeartbeat() {
  useEffect(() => {
    function beat() {
      const ts = String(Date.now())
      try { localStorage.setItem(HEARTBEAT_KEY, ts) } catch { /* ignore */ }
      try { document.cookie = `yakyuu-hb=${ts};path=/;max-age=10;SameSite=Lax` } catch { /* ignore */ }
    }
    beat()
    const interval = setInterval(beat, 1000)
    return () => clearInterval(interval)
  }, [])
}

export default function OverlayPage() {
  useEffect(() => {
    setPreventPersistWrites(true)
    return () => setPreventPersistWrites(false)
  }, [])

  useBroadcastSync()
  useOverlayHeartbeat()

  useEffect(() => {
    const cached = loadOverlayCache()
    if (cached) {
      useGameStore.getState().replaceState(cached)
    }
    requestState()
  }, [])

  const scale = useViewportScale()
  const overlayScale = useGameStore((s) => s.overlayScale ?? 1)

  useEffect(() => {
    document.documentElement.classList.add('overlay-no-scroll')
    return () => document.documentElement.classList.remove('overlay-no-scroll')
  }, [])

  return (
    <div
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        transform: scale < 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
      className="relative select-none pointer-events-none"
    >
      {/* [1] ミニスコア — 左上 */}
      <OverlayPanel id="miniScore" defaultPos={DEFAULT_ELEMENT_POSITIONS.miniScore} scale={overlayScale}>
        <MiniScore />
      </OverlayPanel>

      {/* [3] スタメン一覧 — 左 */}
      <OverlayPanel id="lineup" defaultPos={DEFAULT_ELEMENT_POSITIONS.lineup} scale={overlayScale}>
        <LineupPanel />
      </OverlayPanel>

      {/* [4] 大会タイトル — 中央上 */}
      <OverlayPanel id="tournamentHeader" defaultPos={DEFAULT_ELEMENT_POSITIONS.tournamentHeader} scale={overlayScale}>
        <TournamentHeader />
      </OverlayPanel>

      {/* [5] 大型スコア — 中央 */}
      <OverlayPanel id="bigScore" defaultPos={DEFAULT_ELEMENT_POSITIONS.bigScore} scale={overlayScale}>
        <BigScore />
      </OverlayPanel>

      {/* [6] イニング別スコアボード — 左下 */}
      <OverlayPanel id="inningScoreboard" defaultPos={DEFAULT_ELEMENT_POSITIONS.inningScoreboard} scale={overlayScale}>
        <InningScoreboard />
      </OverlayPanel>

      {/* [7] BSOパネル — 右下 */}
      <OverlayPanel id="statusPanel" defaultPos={DEFAULT_ELEMENT_POSITIONS.statusPanel} scale={overlayScale}>
        <StatusPanel />
      </OverlayPanel>

      {/* [8] 現在の打者 — 中央下（ロワーサード） */}
      <OverlayPanel id="currentBatter" defaultPos={DEFAULT_ELEMENT_POSITIONS.currentBatter} scale={overlayScale}>
        <CurrentBatter />
      </OverlayPanel>

      {/* [9] 現在の投手 — 打者の少し上に配置 */}
      <OverlayPanel id="currentPitcher" defaultPos={DEFAULT_ELEMENT_POSITIONS.currentPitcher} scale={overlayScale}>
        <CurrentPitcher />
      </OverlayPanel>

      {/* [10] 速報テロップ — 画面下部 */}
      <OverlayPanel id="ticker" defaultPos={DEFAULT_ELEMENT_POSITIONS.ticker} scale={overlayScale}>
        <Ticker />
      </OverlayPanel>
    </div>
  )
}
