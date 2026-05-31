import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DhMode, EffectType, GameState, HalfInning, LineupDisplayMode, LineupPlayer, MascotMode, OverlayPosition, PinchHitter, PitcherAppearance, PlayerInfo, Runners, Tournament, Visibility } from '../types'
import { initialGameState, initialPlayerInfo, DEFAULT_OVERLAY_POSITIONS } from '../types'
import { broadcastState } from '../lib/sync'
import { backupToIDB, restoreFromIDB } from '../lib/idbBackup'

/**
 * オーバーレイページでは localStorage への書き込みを禁止する。
 * コントロールパネルだけが writer、オーバーレイは reader に徹することで
 * 書き込み競合（チーム名が反映されない・選手データが初期化される等）を防止する。
 *
 * モジュールレベルで URL ハッシュを判定し、useEffect より前に書き込みを禁止する。
 * これにより Zustand persist の初期化時の書き込み競合も防止できる。
 */
let _preventPersistWrites = false
if (typeof window !== 'undefined' && window.location.hash.includes('/overlay')) {
  _preventPersistWrites = true
}
export function setPreventPersistWrites(prevent: boolean) {
  _preventPersistWrites = prevent
}

/**
 * IDB 復元中フラグ。
 * localStorage が空 → IDB 復元の間に、Zustand persist が initialGameState を
 * IDB に書き戻して復元データを上書きするレースコンディションを防止する。
 */
let _idbRestoreInProgress = false

/**
 * BroadcastChannel 経由で受信した state を replaceState で適用している最中は
 * 再ブロードキャストしないためのフラグ。
 * これを立てないと Control タブが複数あるとき、Tab A → Tab B → Tab A の
 * 無限エコーループが発生する。
 * (2026-05-21 対応: 試合終了直後にスコアが交互に入れ替わるバグの根本対策)
 */
let _applyingFromBroadcast = false
export function withBroadcastApply<T>(fn: () => T): T {
  _applyingFromBroadcast = true
  try {
    return fn()
  } finally {
    _applyingFromBroadcast = false
  }
}

/** エフェクト自動クリア用タイマー。多重発火を防ぐため前回をクリアしてから再セットする。 */
let _effectTimer: ReturnType<typeof setTimeout> | null = null
const EFFECT_DURATION_MS = 6000

const DATA_KEYS: (keyof GameState)[] = [
  'awayTeam', 'homeTeam', 'currentInning', 'currentHalf', 'isGameOver',
  'innings', 'awayTotal', 'homeTotal', 'awayHits', 'homeHits',
  'awayErrors', 'homeErrors', 'count', 'runners',
  'batter', 'pitcher', 'awayLineup', 'homeLineup',
  'awayBatterIndex', 'homeBatterIndex', 'playLog',
  'awayPitchCount', 'homePitchCount', 'awayPitcherHistory', 'homePitcherHistory',
  'gameStartTime', 'ticker', 'activeEffect', 'effectTimestamp',
  'showMascot', 'mascotMode', 'mascotImages', 'autoChangeEffect', 'showWaitingScreen',
  'overlayPositions', 'overlayScale', 'lineupDisplayTeam', 'showBothLineups',
  'lineupDisplayMode', 'batterDisplayTeam', 'pitcherDisplayTeam',
  'dhMode', 'awayDhMode', 'homeDhMode',
  'gameStarted',
  // yakyuu-hito 拡張
  'tournament', 'pinchHitter', 'visibility',
]

export function extractGameState(store: GameState): GameState {
  return Object.fromEntries(
    DATA_KEYS.map((key) => [key, store[key]]),
  ) as unknown as GameState
}

function recalcTotals(state: GameState): GameState {
  let awayTotal = 0
  let homeTotal = 0
  for (const inn of state.innings) {
    awayTotal += inn.top ?? 0
    homeTotal += inn.bottom ?? 0
  }
  return { ...state, awayTotal, homeTotal }
}

/** 現在守備中チームの投手履歴キーを取得 */
function getDefendingHistKey(half: HalfInning): 'awayPitcherHistory' | 'homePitcherHistory' {
  return half === 'top' ? 'homePitcherHistory' : 'awayPitcherHistory'
}

/** active pitcher のフィールドをインクリメントした新しい履歴配列を返す */
function incrementActivePitcherField(
  history: PitcherAppearance[],
  field: 'pitchCount' | 'outsRecorded',
): PitcherAppearance[] {
  const updated = [...history]
  const idx = updated.findIndex(p => p.isActive)
  if (idx >= 0) {
    updated[idx] = { ...updated[idx]!, [field]: updated[idx]![field] + 1 }
  }
  return updated
}

/** 投手履歴から active pitcher の PlayerInfo を取得 */
function getActivePitcherInfo(history: PitcherAppearance[]): PlayerInfo | null {
  const active = history.find(p => p.isActive)
  if (!active) return null
  return {
    name: active.name,
    number: active.number,
    stat: active.record,
    statLabel: active.appearances ? `${active.appearances}登板` : '',
  }
}

/**
 * 指定スロットの代打フラグを解除した lineup を返す。
 * 元から代打でない場合は null を返す（呼び出し側で no-op 判定に使う）。
 *
 * 代打は1打席限りの起用なので、別打者へ進んだ瞬間に自動解除する設計。
 * （2026-05-21 顧客フィードバック対応）
 */
function clearPinchHitAt(
  lineup: LineupPlayer[],
  idx: number,
): LineupPlayer[] | null {
  const p = lineup[idx]
  if (!p?.isPinchHit) return null
  const updated = [...lineup]
  updated[idx] = { ...p, isPinchHit: false }
  return updated
}

/**
 * 二刀流（大谷ルール）モード時に、1-9番のうち position='DH' の選手を
 * 10番投手スロットへコピーして返す。
 *
 * - 6番DH ↔ 10番投手 を「同一選手」として保つための内部同期処理
 * - DH選手が見つからない／既に同期済みの場合は null（呼び出し側で no-op 判定）
 * - 学年・コメントもコピーする（テロップ表示時に整合させるため）
 *
 * setLineupPlayer / setLineup / setDhMode から呼び出される。
 * （2026-05-28 顧客フィードバック対応: 手動コピーボタン廃止に伴う自動同期）
 */
function syncTwoWayPitcher(lineup: LineupPlayer[]): LineupPlayer[] | null {
  const dhIdx = lineup.slice(0, 9).findIndex((p) => p.position === 'DH')
  if (dhIdx === -1) return null
  const dh = lineup[dhIdx]!
  const current = lineup[9]
  // 既に同期済みなら何もしない（無限ループ防止＋不要な再レンダ抑制）
  if (
    current &&
    current.name === dh.name &&
    current.number === dh.number &&
    current.grade === dh.grade &&
    current.comment === dh.comment &&
    current.position === '投'
  ) {
    return null
  }
  const updated = [...lineup]
  updated[9] = {
    ...(current ?? { order: 10, name: '', number: '', position: '投' as const }),
    name: dh.name,
    number: dh.number,
    grade: dh.grade,
    comment: dh.comment,
    position: '投',
  }
  return updated
}

/** 両チームの全打者の代打フラグを解除した patch を返す（回送り時に使用） */
function clearAllPinchHitsPatch(s: GameState): Partial<GameState> {
  const patch: Partial<GameState> = {}
  if (s.awayLineup.some((p) => p.isPinchHit)) {
    patch.awayLineup = s.awayLineup.map((p) => p.isPinchHit ? { ...p, isPinchHit: false } : p)
  }
  if (s.homeLineup.some((p) => p.isPinchHit)) {
    patch.homeLineup = s.homeLineup.map((p) => p.isPinchHit ? { ...p, isPinchHit: false } : p)
  }
  return patch
}

interface GameActions {
  addBall: () => void
  addStrike: () => void
  addOut: () => void
  resetCount: () => void
  applyStrikeout: () => void
  applyWalkPreset: () => void
  advanceInning: () => void
  setRunner: (base: keyof Runners, on: boolean) => void
  addRun: (team: 'away' | 'home') => void
  setInningScore: (inning: number, half: HalfInning, score: number) => void
  setBatter: (info: PlayerInfo) => void
  setPitcher: (info: PlayerInfo) => void
  addHit: (team: 'away' | 'home') => void
  addError: (team: 'away' | 'home') => void
  setHits: (team: 'away' | 'home', count: number) => void
  setErrors: (team: 'away' | 'home', count: number) => void
  setLineup: (team: 'away' | 'home', lineup: LineupPlayer[]) => void
  setLineupPlayer: (team: 'away' | 'home', index: number, player: LineupPlayer) => void
  selectBatter: (team: 'away' | 'home', index: number) => void
  nextBatter: () => void
  prevBatter: () => void
  addPlayLog: (text: string) => void
  clearPlayLog: () => void
  setTeamName: (team: 'away' | 'home', name: string, shortName: string) => void
  setGameOver: (over: boolean) => void
  /** 試合開始（オーダー確定・ロック）。DH制・打順並び替え・選手追加削除をロックする。 */
  setGameStarted: (started: boolean) => void
  newGame: () => void
  /** チーム情報（名前・色・打順・大会名・パネル位置等）を引き継いで試合データのみリセット */
  newGameKeepTeams: () => void
  replaceState: (state: GameState) => void
  subtractBall: () => void
  subtractStrike: () => void
  subtractOut: () => void
  subtractRun: (team: 'away' | 'home') => void
  addPitch: () => void
  setPitchCount: (n: number) => void
  setTeamPitchCount: (team: 'away' | 'home', n: number) => void
  startGameTimer: () => void
  stopGameTimer: () => void
  setTicker: (text: string) => void
  triggerEffect: (type: EffectType) => void
  setTeamColor: (team: 'away' | 'home', color: string) => void
  rewindInning: () => void
  setShowMascot: (show: boolean) => void
  setMascotMode: (mode: MascotMode) => void
  setMascotImage: (mode: string, dataUrl: string | null) => void
  setAutoChangeEffect: (on: boolean) => void
  setShowWaitingScreen: (show: boolean) => void
  setOverlayPosition: (id: string, pos: Partial<OverlayPosition>) => void
  resetOverlayPositions: () => void
  setOverlayScale: (scale: number) => void
  setLineupDisplayTeam: (team: 'away' | 'home') => void
  setBatterDisplayTeam: (team: 'away' | 'home') => void
  setPitcherDisplayTeam: (team: 'away' | 'home') => void
  setShowBothLineups: (show: boolean) => void
  setLineupDisplayMode: (mode: LineupDisplayMode) => void
  setDhMode: (team: 'away' | 'home', mode: DhMode) => void
  copyDhToPitcher: (team: 'away' | 'home') => void
  // --- yakyuu-hito 拡張 ---
  toggleVisibility: (id: keyof Visibility) => void
  setVisibility: (id: keyof Visibility, value: boolean) => void
  setTournament: (partial: Partial<Tournament>) => void
  setPinchHitter: (value: PinchHitter | null) => void
}

type GameStore = GameState & GameActions

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialGameState,

      addBall: () =>
        set((s) => {
          const pitchKey = s.currentHalf === 'top' ? 'homePitchCount' : 'awayPitchCount'
          const histKey = getDefendingHistKey(s.currentHalf)
          const updatedHist = incrementActivePitcherField(s[histKey], 'pitchCount')
          const balls = s.count.balls + 1
          if (balls >= 4) {
            return { ...applyWalk(s), [pitchKey]: s[pitchKey] + 1, [histKey]: updatedHist }
          }
          return { count: { ...s.count, balls }, [pitchKey]: s[pitchKey] + 1, [histKey]: updatedHist }
        }),

      addStrike: () =>
        set((s) => {
          const pitchKey = s.currentHalf === 'top' ? 'homePitchCount' : 'awayPitchCount'
          const histKey = getDefendingHistKey(s.currentHalf)
          let updatedHist = incrementActivePitcherField(s[histKey], 'pitchCount')
          const strikes = s.count.strikes + 1
          if (strikes >= 3) {
            // 三振 → アウト: outsRecorded もインクリメント
            updatedHist = incrementActivePitcherField(updatedHist, 'outsRecorded')
            const outs = s.count.outs + 1
            if (outs >= 3) {
              return { ...advanceInningPatch(s), [pitchKey]: s[pitchKey] + 1, [histKey]: updatedHist }
            }
            return { count: { balls: 0, strikes: 0, outs }, [pitchKey]: s[pitchKey] + 1, [histKey]: updatedHist }
          }
          return { count: { ...s.count, strikes }, [pitchKey]: s[pitchKey] + 1, [histKey]: updatedHist }
        }),

      addOut: () =>
        set((s) => {
          const histKey = getDefendingHistKey(s.currentHalf)
          const updatedHist = incrementActivePitcherField(s[histKey], 'outsRecorded')
          const outs = s.count.outs + 1
          if (outs >= 3) {
            return { ...advanceInningPatch(s), [histKey]: updatedHist }
          }
          return { count: { balls: 0, strikes: 0, outs }, [histKey]: updatedHist }
        }),

      resetCount: () =>
        set(() => ({
          // B/S・アウト・走者をすべてゼロに戻す
          // （2026-05-31 顧客フィードバック⑥: アウトもリセット対象に含める）
          count: { balls: 0, strikes: 0, outs: 0 },
          runners: { first: false, second: false, third: false },
        })),

      /** 三振プリセット: 1回の set() でアウト加算+投球数+チェンジ判定まで完結 */
      applyStrikeout: () =>
        set((s) => {
          const pitchKey = s.currentHalf === 'top' ? 'homePitchCount' : 'awayPitchCount'
          const histKey = getDefendingHistKey(s.currentHalf)
          let updatedHist = incrementActivePitcherField(s[histKey], 'pitchCount')
          updatedHist = incrementActivePitcherField(updatedHist, 'outsRecorded')
          const outs = s.count.outs + 1
          if (outs >= 3) {
            return { ...advanceInningPatch(s), [pitchKey]: s[pitchKey] + 1, [histKey]: updatedHist }
          }
          return { count: { balls: 0, strikes: 0, outs }, [pitchKey]: s[pitchKey] + 1, [histKey]: updatedHist }
        }),

      /** 四球プリセット: 1回の set() で走者押し出し+投球数まで完結 */
      applyWalkPreset: () =>
        set((s) => {
          const pitchKey = s.currentHalf === 'top' ? 'homePitchCount' : 'awayPitchCount'
          const histKey = getDefendingHistKey(s.currentHalf)
          const updatedHist = incrementActivePitcherField(s[histKey], 'pitchCount')
          return { ...applyWalk(s), [pitchKey]: s[pitchKey] + 1, [histKey]: updatedHist }
        }),

      advanceInning: () => set((s) => advanceInningPatch(s)),

      setRunner: (base, on) =>
        set((s) => ({ runners: { ...s.runners, [base]: on } })),

      addRun: (team) =>
        set((s) => {
          const innings = [...s.innings]
          const currentIdx = innings.findIndex(
            (inn) => inn.inning === s.currentInning,
          )
          if (currentIdx === -1) return s

          const inn = { ...innings[currentIdx]! }
          const half = team === 'away' ? 'top' as const : 'bottom' as const
          inn[half] = (inn[half] ?? 0) + 1
          innings[currentIdx] = inn

          return recalcTotals({ ...extractGameState(s), innings })
        }),

      setInningScore: (inning, half, score) =>
        set((s) => {
          const innings = [...s.innings]
          const idx = innings.findIndex((inn) => inn.inning === inning)
          if (idx === -1) return s

          const inn = { ...innings[idx]! }
          inn[half] = score
          innings[idx] = inn

          return recalcTotals({ ...extractGameState(s), innings })
        }),

      setBatter: (info) => set({ batter: info }),

      setPitcher: (info) => set({ pitcher: info }),

      addHit: (team) =>
        set((s) => team === 'away'
          ? { awayHits: s.awayHits + 1 }
          : { homeHits: s.homeHits + 1 }),

      addError: (team) =>
        set((s) => team === 'away'
          ? { awayErrors: s.awayErrors + 1 }
          : { homeErrors: s.homeErrors + 1 }),

      setHits: (team, count) =>
        set(team === 'away' ? { awayHits: count } : { homeHits: count }),

      setErrors: (team, count) =>
        set(team === 'away' ? { awayErrors: count } : { homeErrors: count }),

      setLineup: (team, lineup) => {
        // CSV/プリセット読み込みでは isPinchHit を必ず false に正規化する。
        // 前試合や読込元データに残った代打フラグが新ラインナップへ混入するのを防ぐ。
        // (2026-05-21 顧客フィードバック対応: 学生運用の混乱防止)
        const sanitized = lineup.map((p) => p.isPinchHit ? { ...p, isPinchHit: false } : p)
        set((s) => {
          const key = team === 'away' ? 'awayLineup' : 'homeLineup'
          // 二刀流モード時は DH→投手 を自動同期（手動コピー廃止のため）
          const synced = s.dhMode === 'twoWay'
            ? (syncTwoWayPitcher(sanitized) ?? sanitized)
            : sanitized
          return { [key]: synced }
        })
      },

      setLineupPlayer: (team, index, player) =>
        set((s) => {
          const key = team === 'away' ? 'awayLineup' : 'homeLineup'
          const lineup = [...s[key]]
          lineup[index] = player
          // 二刀流モード時: DH 行が更新されたら投手行を追従させる（自動同期）。
          // 10番投手行への直接編集は LineupControl 側で read-only にして来ない想定。
          // （2026-05-28 顧客フィードバック対応: 手動コピーボタン廃止）
          if (s.dhMode === 'twoWay') {
            const synced = syncTwoWayPitcher(lineup)
            if (synced) return { [key]: synced }
          }
          return { [key]: lineup }
        }),

      selectBatter: (team, index) =>
        set((s) => {
          const key = team === 'away' ? 'awayLineup' : 'homeLineup'
          const player = s[key][index]
          if (!player) return s

          // 別打者・別チームに切り替わった時、前打者の代打フラグを自動解除。
          // 投手選択(index=9)は打者交代に当たらないので対象外。
          const prevTeam: 'away' | 'home' = s.lineupDisplayTeam ?? 'away'
          const prevIdx = prevTeam === 'away' ? s.awayBatterIndex : s.homeBatterIndex
          const prevKey: 'awayLineup' | 'homeLineup' = prevTeam === 'away' ? 'awayLineup' : 'homeLineup'
          const isSameSlot = prevTeam === team && prevIdx === index
          const clearPrevPatch: Partial<GameState> = {}
          if (!isSameSlot && index !== 9) {
            const cleared = clearPinchHitAt(s[prevKey], prevIdx)
            if (cleared) clearPrevPatch[prevKey] = cleared
          }

          // 10番目（index 9）は投手 → 投手交代（履歴付き）
          if (index === 9) {
            const histKey = team === 'away' ? 'awayPitcherHistory' as const : 'homePitcherHistory' as const
            const pitchCountKey = team === 'away' ? 'awayPitchCount' as const : 'homePitchCount' as const
            const history = [...s[histKey]]

            // 同じ投手の場合は表示更新のみ（アピアランス重複防止）
            const activeIdx = history.findIndex(p => p.isActive)
            // 学生運用簡素化のため、勝敗・登板数は overlay に伝播しない
            const pitcherInfo: PlayerInfo = {
              name: player.name,
              number: player.number,
              stat: '',
              statLabel: '',
            }

            // このチームが現在守備中かどうか判定
            const isDefending = (team === 'home' && s.currentHalf === 'top') ||
              (team === 'away' && s.currentHalf === 'bottom')

            if (activeIdx >= 0 && history[activeIdx]!.name === player.name && history[activeIdx]!.number === player.number) {
              // 同じ投手 → 投手テロップの表示元チームは手動選択を尊重して更新
              return isDefending
                ? { pitcher: pitcherInfo, pitcherDisplayTeam: team }
                : { pitcherDisplayTeam: team }
            }

            // 現在のアクティブ投手をアーカイブ
            if (activeIdx >= 0) {
              history[activeIdx] = {
                ...history[activeIdx]!,
                isActive: false,
                exitedInning: s.currentInning,
                exitedHalf: s.currentHalf,
              }
            }

            // 新投手のアピアランスを作成
            history.push({
              id: crypto.randomUUID(),
              name: player.name,
              number: player.number,
              record: player.record || '',
              appearances: player.appearances || '',
              pitchCount: 0,
              outsRecorded: 0,
              enteredInning: s.currentInning,
              enteredHalf: s.currentHalf,
              exitedInning: null,
              exitedHalf: null,
              isActive: true,
            })

            // 履歴と投球数は常に更新。表示投手は守備中チームのみ更新
            // 投手を選択したチームを lineupDisplayTeam にも反映（オーバーレイの投手表示に連動）
            const result: Partial<GameState> = {
              [histKey]: history,
              [pitchCountKey]: 0,
              pitcher: pitcherInfo,
              lineupDisplayTeam: team,
              // 投手テロップは完全手動: 「登板」で選んだチームを表示元に固定（攻守独立）
              pitcherDisplayTeam: team,
            }
            if (isDefending) {
              result.pitcher = pitcherInfo
            }
            return result
          }

          const idxKey = team === 'away' ? 'awayBatterIndex' : 'homeBatterIndex'
          return {
            ...clearPrevPatch,
            [idxKey]: index,
            batter: {
              name: player.name,
              number: player.number,
              stat: '',
              statLabel: '',
            },
            // 選択したチームを lineupDisplayTeam にも反映（攻守問わず CurrentBatter のチーム色決定に使用）
            lineupDisplayTeam: team,
            // 打者テロップは完全手動: 「打席」で選んだチームを表示元に固定（攻守独立）
            batterDisplayTeam: team,
          }
        }),

      nextBatter: () =>
        set((s) => {
          const isAway = s.currentHalf === 'top'
          const key = isAway ? 'awayLineup' : 'homeLineup'
          const idxKey = isAway ? 'awayBatterIndex' : 'homeBatterIndex'
          const currentIdx = s[idxKey]
          const nextIdx = (currentIdx + 1) % 9  // 1-9番のみ巡回（10番目=投手は除外）
          const player = s[key][nextIdx]
          if (!player) return s
          // 進む直前の打者の代打フラグを自動解除
          const cleared = clearPinchHitAt(s[key], currentIdx)
          return {
            ...(cleared ? { [key]: cleared } : {}),
            [idxKey]: nextIdx,
            batter: {
              name: player.name,
              number: player.number,
              stat: '',
              statLabel: '',
            },
            // 次の打者へ進めたら、打者テロップの表示元も攻撃側へ追従
            batterDisplayTeam: isAway ? 'away' as const : 'home' as const,
            count: { ...s.count, balls: 0, strikes: 0 },
          }
        }),

      prevBatter: () =>
        set((s) => {
          const isAway = s.currentHalf === 'top'
          const key = isAway ? 'awayLineup' : 'homeLineup'
          const idxKey = isAway ? 'awayBatterIndex' : 'homeBatterIndex'
          const currentIdx = s[idxKey]
          const prevIdx = (currentIdx - 1 + 9) % 9
          const player = s[key][prevIdx]
          if (!player) return s
          // 戻る直前の打者の代打フラグを自動解除
          const cleared = clearPinchHitAt(s[key], currentIdx)
          return {
            ...(cleared ? { [key]: cleared } : {}),
            [idxKey]: prevIdx,
            batter: {
              name: player.name,
              number: player.number,
              stat: '',
              statLabel: '',
            },
            // 前の打者へ戻したら、打者テロップの表示元も攻撃側へ追従
            batterDisplayTeam: isAway ? 'away' as const : 'home' as const,
            count: { ...s.count, balls: 0, strikes: 0 },
          }
        }),

      addPlayLog: (text) =>
        set((s) => {
          const entry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            inning: s.currentInning,
            half: s.currentHalf,
            text,
          }
          return { playLog: [entry, ...s.playLog] }
        }),

      clearPlayLog: () => set({ playLog: [] }),

      setTeamName: (team, name, shortName) =>
        set((s) => {
          if (team === 'away') {
            return { awayTeam: { ...s.awayTeam, name, shortName } }
          }
          return { homeTeam: { ...s.homeTeam, name, shortName } }
        }),

      setGameOver: (over) => set(() => ({
        isGameOver: over,
        // 終了時: オーダー編集を再度許可（次試合準備のため gameStarted=false）。
        // 再開時: 試合中扱いに戻し gameStarted=true。これにより「試合終了」ボタンが
        //   再表示され、再度「試合開始」を押さなくても戻せる。
        // （2026-05-31 顧客フィードバック⑤: 誤って試合終了→再開で元に戻せない問題）
        gameStarted: over ? false : true,
      })),

      setGameStarted: (started) => set({ gameStarted: started }),

      // 完全リセット。チーム・打順・カラー・大会情報まで初期化するが、
      // テロップ等の配置（位置・サイズ）と全体スケールは保持する。
      // （2026-05-31 顧客フィードバック⑦: 試合リセットでもテロップのXY/サイズは保持）
      newGame: () =>
        set((s) => ({
          ...initialGameState,
          overlayPositions: s.overlayPositions,
          overlayScale: s.overlayScale,
        })),

      newGameKeepTeams: () =>
        set((s) => ({
          ...initialGameState,
          // チーム情報を引き継ぐ。代打フラグは前試合の名残なので必ずクリア。
          // (2026-05-21 顧客フィードバック: 新試合の冒頭で前試合の代打表記が残るのを防止)
          awayTeam: s.awayTeam,
          homeTeam: s.homeTeam,
          awayLineup: s.awayLineup.map((p) => p.isPinchHit ? { ...p, isPinchHit: false } : p),
          homeLineup: s.homeLineup.map((p) => p.isPinchHit ? { ...p, isPinchHit: false } : p),
          dhMode: s.dhMode ?? s.awayDhMode ?? s.homeDhMode ?? 'dh',
          // 大会・表示設定も引き継ぐ
          tournament: s.tournament,
          overlayPositions: s.overlayPositions,
          overlayScale: s.overlayScale,
          visibility: s.visibility,
          mascotImages: s.mascotImages,
        })),

      replaceState: (state) =>
        set((s) => ({
          ...state,
          // 受信した state に新キーが欠けている場合に備えて
          // 現行の visibility を下敷きに上書きする（点滅・初動不整合の防止）
          visibility: { ...s.visibility, ...(state.visibility ?? {}) },
        })),

      subtractBall: () =>
        set((s) => ({
          count: { ...s.count, balls: Math.max(0, s.count.balls - 1) },
        })),

      subtractStrike: () =>
        set((s) => ({
          count: { ...s.count, strikes: Math.max(0, s.count.strikes - 1) },
        })),

      subtractOut: () =>
        set((s) => ({
          count: { ...s.count, outs: Math.max(0, s.count.outs - 1) },
        })),

      subtractRun: (team) =>
        set((s) => {
          const innings = [...s.innings]
          const currentIdx = innings.findIndex(
            (inn) => inn.inning === s.currentInning,
          )
          if (currentIdx === -1) return s

          const inn = { ...innings[currentIdx]! }
          const half = team === 'away' ? 'top' as const : 'bottom' as const
          const current = inn[half] ?? 0
          if (current <= 0) return s
          inn[half] = current - 1
          innings[currentIdx] = inn

          return recalcTotals({ ...extractGameState(s), innings })
        }),

      addPitch: () => set((s) => {
        const pitchKey = s.currentHalf === 'top' ? 'homePitchCount' : 'awayPitchCount'
        const histKey = getDefendingHistKey(s.currentHalf)
        const updatedHist = incrementActivePitcherField(s[histKey], 'pitchCount')
        return { [pitchKey]: s[pitchKey] + 1, [histKey]: updatedHist }
      }),

      setPitchCount: (n) => set((s) => {
        const pitchKey = s.currentHalf === 'top' ? 'homePitchCount' : 'awayPitchCount'
        const histKey = getDefendingHistKey(s.currentHalf)
        const history = [...s[histKey]]
        const idx = history.findIndex(p => p.isActive)
        if (idx >= 0) {
          history[idx] = { ...history[idx]!, pitchCount: n }
        }
        return { [pitchKey]: n, [histKey]: history }
      }),

      setTeamPitchCount: (team, n) => set((s) => {
        const pitchKey = team === 'away' ? 'awayPitchCount' : 'homePitchCount'
        const histKey = team === 'away' ? 'awayPitcherHistory' : 'homePitcherHistory'
        const history = [...s[histKey]]
        const idx = history.findIndex(p => p.isActive)
        if (idx >= 0) {
          history[idx] = { ...history[idx]!, pitchCount: n }
        }
        return { [pitchKey]: n, [histKey]: history }
      }),

      startGameTimer: () => set({ gameStartTime: Date.now(), showWaitingScreen: false }),

      stopGameTimer: () => set({ gameStartTime: null }),

      setTicker: (text) => set({ ticker: text }),

      triggerEffect: (type) => {
        // 前回のタイマーをクリアして多重発火を防止
        if (_effectTimer) { clearTimeout(_effectTimer); _effectTimer = null }
        if (type) {
          set({ activeEffect: type, effectTimestamp: Date.now() })
          _effectTimer = setTimeout(() => {
            _effectTimer = null
            set({ activeEffect: null, effectTimestamp: 0 })
          }, EFFECT_DURATION_MS)
        } else {
          set({ activeEffect: null, effectTimestamp: 0 })
        }
      },

      setTeamColor: (team, color) =>
        set((s) => {
          if (team === 'away') {
            return { awayTeam: { ...s.awayTeam, color } }
          }
          return { homeTeam: { ...s.homeTeam, color } }
        }),

      rewindInning: () =>
        set((s) => {
          const base: Partial<GameState> = {
            count: { balls: 0, strikes: 0, outs: 0 },
            runners: { first: false, second: false, third: false },
          }
          if (s.currentHalf === 'bottom') {
            // 裏→表: 後攻が守備に入る → 後攻の active pitcher を表示
            const homeActive = getActivePitcherInfo(s.homePitcherHistory)
            if (homeActive) {
              base.pitcher = homeActive
            } else {
              const p = s.homeLineup[9]
              if (p?.name) base.pitcher = { name: p.name, number: p.number, stat: '', statLabel: '' }
            }
            const hp = s.homePitcherHistory.find(p => p.isActive)
            if (hp) base.homePitchCount = hp.pitchCount
            // 裏→表に戻す → 先攻が攻撃・後攻が守備
            base.batterDisplayTeam = 'away'
            base.pitcherDisplayTeam = 'home'
            return { ...base, currentHalf: 'top' as const }
          }
          if (s.currentInning <= 1) return s
          // 表→前回裏: 先攻が守備に入る → 先攻の active pitcher を表示
          const awayActive = getActivePitcherInfo(s.awayPitcherHistory)
          if (awayActive) {
            base.pitcher = awayActive
          } else {
            const p = s.awayLineup[9]
            if (p?.name) base.pitcher = { name: p.name, number: p.number, stat: '', statLabel: '' }
          }
          const ap = s.awayPitcherHistory.find(p => p.isActive)
          if (ap) base.awayPitchCount = ap.pitchCount
          // 表→前回裏に戻す → 後攻が攻撃・先攻が守備
          base.batterDisplayTeam = 'home'
          base.pitcherDisplayTeam = 'away'
          return { ...base, currentInning: s.currentInning - 1, currentHalf: 'bottom' as const }
        }),

      setShowMascot: (show) => set({ showMascot: show }),

      setMascotMode: (mode) => set({ mascotMode: mode }),

      setMascotImage: (mode, dataUrl) =>
        set((s) => {
          const mascotImages = { ...s.mascotImages }
          if (dataUrl) {
            mascotImages[mode] = dataUrl
          } else {
            delete mascotImages[mode]
          }
          return { mascotImages }
        }),

      setAutoChangeEffect: (on) => set({ autoChangeEffect: on }),

      setShowWaitingScreen: (show) => set({ showWaitingScreen: show }),

      setOverlayPosition: (id, pos) =>
        set((s) => ({
          overlayPositions: {
            ...s.overlayPositions,
            [id]: { ...(s.overlayPositions?.[id] ?? { x: 0, y: 0 }), ...pos },
          },
        })),

      resetOverlayPositions: () =>
        set({ overlayPositions: { ...DEFAULT_OVERLAY_POSITIONS } }),

      setOverlayScale: (scale) =>
        set({ overlayScale: Math.max(0.5, Math.min(3, scale)) }),

      setLineupDisplayTeam: (team) => set({ lineupDisplayTeam: team }),

      setBatterDisplayTeam: (team) => set({ batterDisplayTeam: team }),

      setPitcherDisplayTeam: (team) => set({ pitcherDisplayTeam: team }),

      setShowBothLineups: (show) => set({ showBothLineups: show }),

      setLineupDisplayMode: (mode) => set({ lineupDisplayMode: mode }),

      setDhMode: (team, mode) => {
        // DH制は試合単位で両チーム共通。team 引数は互換のため受け取るが無視し、
        // 共通の dhMode と旧 away/home を全て同じ値で同期。
        // （2026-05-25 一元化: 野球ルール上、片チームのみDHあり/なしはありえない）
        void team
        set((s) => {
          const patch: Partial<GameState> = {
            dhMode: mode,
            awayDhMode: mode,
            homeDhMode: mode,
          }
          // 二刀流へ切り替えた瞬間に DH→投手 を両チーム同期。
          // （2026-05-28 顧客フィードバック対応: 手動コピーボタン廃止）
          if (mode === 'twoWay') {
            const awaySync = syncTwoWayPitcher(s.awayLineup)
            const homeSync = syncTwoWayPitcher(s.homeLineup)
            if (awaySync) patch.awayLineup = awaySync
            if (homeSync) patch.homeLineup = homeSync
          }
          return patch
        })
      },

      copyDhToPitcher: (team) =>
        set((s) => {
          const key = team === 'away' ? 'awayLineup' : 'homeLineup'
          const lineup = [...s[key]]
          // 1-9番から position === 'DH' の選手を探す
          const dhIdx = lineup.slice(0, 9).findIndex((p) => p.position === 'DH')
          if (dhIdx === -1) return s
          const dh = lineup[dhIdx]!
          lineup[9] = {
            ...lineup[9]!,
            name: dh.name,
            number: dh.number,
            position: '投',
          }
          return { [key]: lineup }
        }),

      // --- yakyuu-hito 拡張 ---
      toggleVisibility: (id) =>
        set((s) => ({
          visibility: {
            ...s.visibility,
            // 新キー追加直後は s.visibility[id] が undefined のケースがある。
            // !undefined=true となり初回トグルで意図と逆方向になるのを防ぐため
            // デフォルトを true 扱いで反転する。
            [id]: !(s.visibility[id] ?? true),
          },
        })),

      setVisibility: (id, value) =>
        set((s) => ({
          visibility: {
            ...s.visibility,
            [id]: value,
          },
        })),

      setTournament: (partial) =>
        set((s) => ({
          tournament: { ...s.tournament, ...partial },
        })),

      setPinchHitter: (value) => set({ pinchHitter: value }),
    }),
    {
      name: 'yakyuu-game-state-v2',
      storage: {
        getItem: (name) => {
          try {
            const raw = localStorage.getItem(name)
            if (raw) return JSON.parse(raw)
            // localStorage が空の場合 IndexedDB バックアップからの非同期復元をスケジュール
            // (getItem は同期 API なので初回は null を返し、復元完了後に replaceState する)
            // オーバーレイでも IDB 復元を行う（OBS 再起動対応）
            _idbRestoreInProgress = true
            restoreFromIDB().then((backup) => {
              _idbRestoreInProgress = false
              if (backup) {
                try {
                  const parsed = JSON.parse(backup)
                  const state = parsed.state
                  if (state) {
                    // コントロールパネルの場合のみ localStorage に書き戻す
                    if (!_preventPersistWrites) {
                      localStorage.setItem(name, backup)
                    }
                    useGameStore.getState().replaceState(state)
                    console.info('Restored state from IndexedDB backup')
                  }
                } catch { /* ignore */ }
              }
            }).catch(() => { _idbRestoreInProgress = false })
            return null
          } catch {
            // JSON 破損時はデータを削除して初期状態で起動（白画面防止）
            console.warn('Failed to parse localStorage — starting fresh')
            try { localStorage.removeItem(name) } catch { /* ignore */ }
            return null
          }
        },
        setItem: (name, value) => {
          if (_preventPersistWrites) return  // オーバーレイは書き込み禁止
          try {
            const raw = JSON.stringify(value)
            localStorage.setItem(name, raw)
            // IDB 復元中はバックアップ上書きを防止（initialGameState で上書きされるのを防ぐ）
            if (!_idbRestoreInProgress) {
              backupToIDB(raw)
            }
          } catch {
            // QuotaExceededError: 容量超過時は書き込みをスキップ
            console.warn('localStorage quota exceeded — state not persisted')
          }
        },
        removeItem: (name) => {
          if (_preventPersistWrites) return
          localStorage.removeItem(name)
        },
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameStore>
        return {
          ...current,
          ...p,
          // visibility は新キー追加時に persisted 側で欠落しがちなので
          // 必ず default(initialGameState.visibility) を下敷きにマージする。
          // これを怠ると新トグル(currentBatter等)が undefined となり、
          // !undefined=true でON/OFF初動が逆転して点滅に見える原因になる。
          visibility: { ...current.visibility, ...(p.visibility ?? {}) },
          // エフェクトは一時的な表示状態なので、リロード時にリセット
          activeEffect: null,
          effectTimestamp: 0,
        }
      },
    },
  ),
)

// subscribe でstate変更時に自動ブロードキャスト（関数を含まないデータのみ送信）
// オーバーレイ側では受信専用とし、ブロードキャストしない（状態ピンポン防止）
// BroadcastChannel 受信由来の replaceState は再ブロードキャストしない（エコーループ防止）
useGameStore.subscribe((state) => {
  if (_preventPersistWrites) return
  if (_applyingFromBroadcast) return
  broadcastState(extractGameState(state))
})

/** 四球・死球: 打者→一塁、フォースで走者押し出し、満塁なら得点 */
function applyWalk(s: GameState): Partial<GameState> {
  const { first, second, third } = s.runners
  const newRunners = { first: true, second, third }
  let runsScored = 0

  if (first) {
    newRunners.second = true
    if (second) {
      newRunners.third = true
      if (third) {
        // 満塁押し出し — 三塁走者が生還
        runsScored = 1
      }
    }
  }

  const patch: Partial<GameState> = {
    count: { ...s.count, balls: 0, strikes: 0 },
    runners: newRunners,
  }

  if (runsScored > 0) {
    const innings = [...s.innings]
    const idx = innings.findIndex((inn) => inn.inning === s.currentInning)
    if (idx !== -1) {
      const inn = { ...innings[idx]! }
      const half = s.currentHalf
      inn[half] = (inn[half] ?? 0) + runsScored
      innings[idx] = inn
      const totals = recalcTotals({ ...extractGameState(s), innings })
      patch.innings = totals.innings
      patch.awayTotal = totals.awayTotal
      patch.homeTotal = totals.homeTotal
    }
  }

  return patch
}

function advanceInningPatch(s: GameState): Partial<GameState> {
  // 回送り時に両チームの代打フラグを全クリア（代打は1打席限りなので回をまたいで残さない）
  const resetState: Partial<GameState> = {
    count: { balls: 0, strikes: 0, outs: 0 },
    runners: { first: false, second: false, third: false },
    batter: { ...initialPlayerInfo },
    ...clearAllPinchHitsPatch(s),
  }

  if (s.autoChangeEffect) {
    resetState.activeEffect = 'change'
    resetState.effectTimestamp = Date.now()
    // 前回のタイマーをクリアして多重発火を防止
    if (_effectTimer) { clearTimeout(_effectTimer); _effectTimer = null }
    _effectTimer = setTimeout(() => {
      _effectTimer = null
      useGameStore.setState({ activeEffect: null, effectTimestamp: 0 })
    }, EFFECT_DURATION_MS)
  }

  // 終了した半回のスコアが null のままなら 0 を確定書き込み。
  // 表示側で `?? 0` するだけでなく state にも 0 を残すことで、
  // 編集ダイアログ・再開・バックアップ復元時にも「0が入っている」状態を保てる。
  // (2026-05-21 顧客フィードバック: 回を送ったら自動で 0 が入ってほしい)
  const finalizeHalfToZero = (
    list: { inning: number; top: number | null; bottom: number | null }[],
    inningNum: number,
    half: HalfInning,
  ) => {
    const idx = list.findIndex((inn) => inn.inning === inningNum)
    if (idx === -1) return list
    const inn = list[idx]!
    if (inn[half] !== null && inn[half] !== undefined) return list
    const updated = [...list]
    updated[idx] = { ...inn, [half]: 0 }
    return updated
  }

  if (s.currentHalf === 'top') {
    // 表→裏: 先攻が守備に入る → 先攻の active pitcher を表示
    const awayActive = getActivePitcherInfo(s.awayPitcherHistory)
    if (awayActive) {
      resetState.pitcher = awayActive
    } else {
      // 履歴未登録時は lineup[9] からフォールバック
      const p = s.awayLineup[9]
      if (p?.name) {
        resetState.pitcher = {
          name: p.name, number: p.number,
          stat: '', statLabel: '',
        }
      }
    }
    const ap = s.awayPitcherHistory.find(p => p.isActive)
    if (ap) resetState.awayPitchCount = ap.pitchCount
    // 表が終わった → 当該回 top を 0 確定（null時のみ）
    const inningsAfter = finalizeHalfToZero(s.innings, s.currentInning, 'top')
    if (inningsAfter !== s.innings) {
      resetState.innings = inningsAfter
      const totals = recalcTotals({ ...extractGameState(s), innings: inningsAfter })
      resetState.awayTotal = totals.awayTotal
      resetState.homeTotal = totals.homeTotal
    }
    // 攻守交代に合わせてテロップの表示元チームも自動追従（裏=後攻が攻撃／先攻が守備）。
    // 同じ回の中では「打席」「登板」ボタンで手動上書き可能（2026-05-31 顧客FB: 攻守で切替わらない）。
    return {
      ...resetState,
      currentHalf: 'bottom' as const,
      batterDisplayTeam: 'home' as const,
      pitcherDisplayTeam: 'away' as const,
    }
  }

  // 裏→次回表: 後攻が守備に入る → 後攻の active pitcher を表示
  const nextInning = s.currentInning + 1
  // 裏が終わった → 当該回 bottom を 0 確定（null時のみ）
  let innings = finalizeHalfToZero(s.innings, s.currentInning, 'bottom')
  if (!innings.find((inn) => inn.inning === nextInning)) {
    innings = [...innings, { inning: nextInning, top: null, bottom: null }]
  }
  if (innings !== s.innings) {
    const totals = recalcTotals({ ...extractGameState(s), innings })
    resetState.awayTotal = totals.awayTotal
    resetState.homeTotal = totals.homeTotal
  }

  const homeActive = getActivePitcherInfo(s.homePitcherHistory)
  if (homeActive) {
    resetState.pitcher = homeActive
  } else {
    const p = s.homeLineup[9]
    if (p?.name) {
      resetState.pitcher = {
        name: p.name, number: p.number,
        stat: '', statLabel: '',
      }
    }
  }
  const hp = s.homePitcherHistory.find(p => p.isActive)
  if (hp) resetState.homePitchCount = hp.pitchCount

  // 次回表に進む → 先攻が攻撃・後攻が守備。テロップ表示元を自動追従。
  return {
    ...resetState,
    currentInning: nextInning,
    currentHalf: 'top' as const,
    innings,
    batterDisplayTeam: 'away' as const,
    pitcherDisplayTeam: 'home' as const,
  }
}
