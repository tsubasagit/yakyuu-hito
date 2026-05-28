import { useEffect, useRef } from 'react'
import { useGameStore, withBroadcastApply } from '../store/useGameStore'
import { onStateUpdate, TAB_ID } from '../lib/sync'
import { cacheOverlayState } from '../lib/overlayCache'
import { isGlobalDragActive } from '../lib/dragState'

export function useBroadcastSync(): void {
  const replaceState = useGameStore((s) => s.replaceState)
  // コントロール側の overlayPositions が変わったかを追跡
  const prevPositionsRef = useRef<string>('')
  // 直近で適用したメッセージのタイムスタンプ。
  // 複数の Control タブが古い state を 2秒ごとに broadcast し続けると
  // オーバーレイで新旧スコアが「交互に入れ替わる」現象が起きる。
  // タイムスタンプベースで古い state を破棄して防ぐ。
  // (2026-05-21 顧客フィードバック対応)
  const lastAppliedTsRef = useRef<number>(0)
  // タブIDごとの直近 ts。複数 writer タブを検知するため。
  const lastTsByTabRef = useRef<Record<string, number>>({})

  useEffect(() => {
    const unsubscribe = onStateUpdate((state, meta) => {
      // 自タブが発したメッセージは無視（ループ防止）
      if (meta.tabId === TAB_ID) return

      // ドラッグ中は replaceState をスキップ（点滅防止）
      if (isGlobalDragActive()) return

      // 古いメッセージは破棄（last-write-wins）
      if (meta.ts < lastAppliedTsRef.current) return
      lastAppliedTsRef.current = meta.ts
      lastTsByTabRef.current[meta.tabId] = meta.ts

      // overlayPositions: コントロール側で変更があった場合のみ反映する。
      // オーバーレイは localStorage に書けないため、
      // ドラッグ後のブロードキャストで古い位置に戻るのを防ぐ。
      const newPosStr = JSON.stringify(state.overlayPositions ?? {})
      if (prevPositionsRef.current && newPosStr === prevPositionsRef.current) {
        // コントロール側からの位置変更なし → オーバーレイの現在位置を維持
        state.overlayPositions = useGameStore.getState().overlayPositions
      }
      prevPositionsRef.current = newPosStr

      // 受信由来の適用中は再ブロードキャストしない（エコーループ防止）
      withBroadcastApply(() => replaceState(state))

      // BroadcastChannel 経由で受信したデータをキャッシュ。
      // OBS 再起動時にメインの localStorage が空でもキャッシュから復元可能にする。
      cacheOverlayState(state)
    })
    return unsubscribe
  }, [replaceState])
}
