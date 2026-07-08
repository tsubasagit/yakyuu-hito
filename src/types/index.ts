export type HalfInning = 'top' | 'bottom'

export type Position = '投' | '捕' | '一' | '二' | '三' | '遊' | '左' | '中' | '右' | 'DH' | ''

/**
 * DH制モード（2026-04-23 追加）
 * - 'dh'     : DHあり。10名（1-9番打者＋10番目投手）
 * - 'none'   : DHなし。9名（投手が1-9番の打席に立つ。10番目行は非表示）
 * - 'twoWay' : 二刀流（大谷ルール）。10名だが、DH打者と投手が同一選手可（重複OK）
 */
export type DhMode = 'dh' | 'none' | 'twoWay'

export interface Count {
  balls: number
  strikes: number
  outs: number
}

export interface Runners {
  first: boolean
  second: boolean
  third: boolean
}

export interface PlayerInfo {
  name: string
  number: string
  stat: string
  statLabel: string
}

export interface LineupPlayer {
  order: number
  name: string
  number: string
  position: Position
  // 打者用（1-9番）
  battingAvg?: string   // 打率
  homeRuns?: string     // 本塁打数
  rbi?: string          // 打点
  ops?: string          // OPS
  // 投手用（10番目）
  appearances?: string  // 登板数
  record?: string       // 勝敗（例: "5勝3敗"）
  // 大学野球向け（yakyuu-hito 拡張）
  grade?: string        // 学年（"3年"など自由文字列）
  comment?: string      // 一行コメント（"少年クラブ優勝経験あり"など）
  /** 代打フラグ。true なら守備位置の代わりに「代打」を表示する */
  isPinchHit?: boolean
}

export interface InningScore {
  inning: number
  top: number | null
  bottom: number | null
}

export interface PitcherAppearance {
  id: string
  name: string
  number: string
  record: string        // 勝敗 ("10勝5敗")
  appearances: string   // 登板数
  pitchCount: number
  outsRecorded: number  // アウト取得数（投球回算出用）
  enteredInning: number
  enteredHalf: HalfInning
  exitedInning: number | null   // null = 現在登板中
  exitedHalf: HalfInning | null
  isActive: boolean
}

/** アウト取得数から投球回表記を生成（例: 20 → "6.2" = 6回2/3） */
export function formatInningsPitched(outsRecorded: number): string {
  const full = Math.floor(outsRecorded / 3)
  const remainder = outsRecorded % 3
  return remainder === 0 ? `${full}` : `${full}.${remainder}`
}

export interface PlayLogEntry {
  id: string
  timestamp: number
  inning: number
  half: HalfInning
  text: string
}

export type MascotMode = 'idle' | 'hidden' | 'celebration' | 'waiting'

export type EffectType = 'homerun' | 'strikeout' | 'double' | 'triple' | 'hit' | 'steal' | 'fineplay' | 'error' | 'walk' | 'change' | null

export interface Team {
  name: string
  shortName: string
  color: string
}

export interface OverlayPosition {
  x: number
  y: number
  scale?: number
}

/** yakyuu-hito の要素ID（2026-04-23 準拠 + currentBatter/currentPitcher/ticker 拡張） */
export type ElementId =
  | 'miniScore'
  | 'pinchHitter'
  | 'lineup'
  | 'tournamentHeader'
  | 'bigScore'
  | 'inningScoreboard'
  | 'statusPanel'
  | 'currentBatter'
  | 'currentPitcher'
  | 'ticker'

/** スタメンオーバーレイの表示モード */
export type LineupDisplayMode =
  | 'attacking'  // 攻撃中チームのみ（自動切替・デフォルト）
  | 'away'       // 先攻のみ
  | 'home'       // 後攻のみ
  | 'both'       // 両チーム並列表示（VS表示付き）

/** 大会情報（tournamentHeader 用） */
export interface Tournament {
  title: string      // 大会名（例: "全国クラブ野球選手権大会"）
  subtitle: string   // 副題（例: "決勝戦"）
  venue: string      // 会場（例: "ドリーム競技場"）
  date: string       // 日付（例: "2022年1月1日"、自由文字列）
}

/** 代打情報（pinchHitter 用） */
export interface PinchHitter {
  team: 'away' | 'home'
  name: string
  grade?: string    // 学年（"3年"など）
  comment?: string  // 1行コメント（"少年クラブ優勝経験あり"など）
}

/** 要素＋statusPanel サブトグルの表示フラグ */
export interface Visibility {
  miniScore: boolean
  pinchHitter: boolean
  lineup: boolean
  tournamentHeader: boolean
  bigScore: boolean
  inningScoreboard: boolean
  statusPanel: boolean
  currentBatter: boolean
  currentPitcher: boolean
  statusPanel_diamond: boolean
  statusPanel_bso: boolean
  statusPanel_quickScore: boolean
  ticker: boolean
}

/** 要素デフォルト座標・サイズ（1920x1080基準）。
 *  2026-06-17 株式会社ひと指定の「おすすめ配置」を初期値として採用。
 *  per-panel の scale は overlayPositions[id].scale からのみ反映される
 *  （OverlayPanel/PanelCard とも未設定時は 1.0 にフォールバック）ため、
 *  ここと initialGameState.overlayPositions の両方に scale を持たせる。
 *  これにより「初回起動」「位置リセット」のどちらでも推奨配置が再現される。 */
export const DEFAULT_ELEMENT_POSITIONS: Record<ElementId, OverlayPosition> = {
  miniScore:        { x: 40,   y: 40,  scale: 1.6 },
  pinchHitter:      { x: 1100, y: 40   },
  lineup:           { x: 40,   y: 200, scale: 1.6 },
  tournamentHeader: { x: 550,  y: 350, scale: 1.5 },
  bigScore:         { x: 550,  y: 800, scale: 0.9 },
  inningScoreboard: { x: 500,  y: 800, scale: 2.3 },
  statusPanel:      { x: 1500, y: 830, scale: 1.6 },
  currentBatter:    { x: 600,  y: 850, scale: 1.5 },
  currentPitcher:   { x: 600,  y: 850, scale: 1.5 },
  // テロップは baseScale=2 で高さ約2倍になったため、下端が画面外(>1080)に隠れないよう
  // デフォルトYを上げる（下端が約1060pxに収まる）。2026-06-09 顧客フィードバック
  ticker:           { x: 40,   y: 980  },
}

export interface GameState {
  awayTeam: Team
  homeTeam: Team
  currentInning: number
  currentHalf: HalfInning
  isGameOver: boolean
  innings: InningScore[]
  awayTotal: number
  homeTotal: number
  awayHits: number
  homeHits: number
  awayErrors: number
  homeErrors: number
  count: Count
  runners: Runners
  batter: PlayerInfo
  pitcher: PlayerInfo
  awayLineup: LineupPlayer[]
  homeLineup: LineupPlayer[]
  awayBatterIndex: number
  homeBatterIndex: number
  playLog: PlayLogEntry[]
  awayPitchCount: number
  homePitchCount: number
  awayPitcherHistory: PitcherAppearance[]
  homePitcherHistory: PitcherAppearance[]
  gameStartTime: number | null
  ticker: string
  activeEffect: EffectType
  effectTimestamp: number
  showMascot: boolean
  mascotMode: MascotMode
  mascotImages: Record<string, string>
  autoChangeEffect: boolean
  showWaitingScreen: boolean
  overlayPositions: Record<string, OverlayPosition>
  overlayScale: number
  /** コントロールパネルで選択中のチーム。オーバーレイの打順表示に連動する */
  lineupDisplayTeam: 'away' | 'home'
  /** 打者テロップに出すチーム（完全手動）。「打席」ボタンで切替。攻守と独立。
   *  （2026-05-31 顧客フィードバック①: 攻守問わず打者テロップを出せるように） */
  batterDisplayTeam: 'away' | 'home'
  /** 投手テロップに出すチーム（完全手動）。「登板」ボタンで切替。攻守と独立。
   *  （2026-05-31 顧客フィードバック①: 攻守問わず投手テロップを出せるように） */
  pitcherDisplayTeam: 'away' | 'home'
  /** 両チームの打順を同時にオーバーレイに表示するか（旧フィールド・lineupDisplayMode が優先） */
  showBothLineups: boolean
  /** スタメンオーバーレイの表示モード（先攻/後攻/両方/自動） */
  lineupDisplayMode: LineupDisplayMode
  /** DH制モード（試合単位で両チーム共通）。
   *  野球のルール上 DH 制はリーグ／試合単位で決まり、片チームのみDHあり/なしは存在しない。
   *  旧 awayDhMode / homeDhMode は互換のため残しているが、新コードは dhMode を参照する。
   *  （2026-05-25 一元化） */
  dhMode: DhMode
  /** @deprecated dhMode を使うこと。旧データ互換のため残置 */
  awayDhMode?: DhMode
  /** @deprecated dhMode を使うこと。旧データ互換のため残置 */
  homeDhMode?: DhMode
  /** 試合開始フラグ。true の間は DH制・打順並び替え・選手追加/削除/CSVインポートをロック。
   *  名前・学年・コメント・守備位置・代打フラグ・投手交代 は試合中も編集可能。
   *  「試合終了」ボタンで false に戻る（新試合準備のためオーダー編集可へ）。
   *  （2026-05-25 顧客フィードバック: 試合中のDH切替で表示崩れが起きるため） */
  gameStarted: boolean
  // --- yakyuu-hito 拡張（2026-04-23 キックオフ） ---
  /** 大会情報（tournamentHeader 用） */
  tournament: Tournament
  /** 代打情報（pinchHitter 用、nullなら代打なし） */
  pinchHitter: PinchHitter | null
  /** 7要素の表示フラグ */
  visibility: Visibility
  /** スコアボードの試合終了「×」表記を使うか（ON/OFF）。デフォルト ON。
   *  ON でも「×」を実際に出すのは後攻勝ち（後攻合計＞先攻合計）のときのみ＝自動判定。
   *  連盟により×表記を使わない場合は OFF にできる。
   *  （2026-06-09 顧客フィードバック⑥） */
  scoreboardCross: boolean
}

export const initialPlayerInfo: PlayerInfo = {
  name: '',
  number: '',
  stat: '',
  statLabel: '',
}

function emptyLineup(): LineupPlayer[] {
  return Array.from({ length: 10 }, (_, i) => ({
    order: i + 1,
    name: '',
    number: '',
    position: (i === 9 ? '投' : '') as Position,
  }))
}

// デモ用: 帝都大学 ホワイトイーグルス（架空 / 東都リーグ風）
// 学生運用ではスタッツ表示なし。打順・名前・守備のみ
export const TEITO_LINEUP: LineupPlayer[] = [
  { order: 1, name: '三輪 蓮', number: '8', position: '中' },
  { order: 2, name: '古谷 颯太', number: '6', position: '遊' },
  { order: 3, name: '上條 蒼真', number: '7', position: '左' },
  { order: 4, name: '神宮 大和', number: '3', position: '一' },
  { order: 5, name: '久保田 凌', number: '9', position: '右' },
  { order: 6, name: '武藤 光輝', number: '24', position: 'DH' },
  { order: 7, name: '桐山 直人', number: '4', position: '二' },
  { order: 8, name: '河合 篤', number: '2', position: '捕' },
  { order: 9, name: '梶 拓海', number: '5', position: '三' },
  { order: 10, name: '倉本 龍之介', number: '1', position: '投' },
]

// デモ用: 早凌大学 ブルーアロウズ（架空 / 東都リーグ風）
export const SORYO_LINEUP: LineupPlayer[] = [
  { order: 1, name: '高梨 啓人', number: '4', position: '二' },
  { order: 2, name: '安永 慎之介', number: '6', position: '遊' },
  { order: 3, name: '富田 凌空', number: '8', position: '中' },
  { order: 4, name: '黒田 颯', number: '3', position: '一' },
  { order: 5, name: '篠原 蓮', number: '9', position: '右' },
  { order: 6, name: '中野 海斗', number: '22', position: 'DH' },
  { order: 7, name: '平井 玲音', number: '7', position: '左' },
  { order: 8, name: '田所 智樹', number: '2', position: '捕' },
  { order: 9, name: '結城 隼', number: '5', position: '三' },
  { order: 10, name: '速水 翔太郎', number: '11', position: '投' },
]

export const DEFAULT_OVERLAY_POSITIONS: Record<string, OverlayPosition> = {
  scoreboard: { x: 24, y: 24 },
  timer: { x: 24, y: 160 },
  lineup: { x: 1420, y: 24 },
  lineup_away: { x: 1420, y: 24 },
  lineup_home: { x: 1420, y: 420 },
  playerInfo: { x: 24, y: 1020 },
  playLog: { x: 1560, y: 800 },
  mascot: { x: 1740, y: 900 },
}

export const initialGameState: GameState = {
  awayTeam: { name: '帝都大学', shortName: '帝都', color: '#1d3557' },
  homeTeam: { name: '早凌大学', shortName: '早凌', color: '#1e40af' },
  currentInning: 1,
  currentHalf: 'top',
  isGameOver: false,
  innings: Array.from({ length: 9 }, (_, i) => ({ inning: i + 1, top: null, bottom: null })),
  awayTotal: 0,
  homeTotal: 0,
  awayHits: 0,
  homeHits: 0,
  awayErrors: 0,
  homeErrors: 0,
  count: { balls: 0, strikes: 0, outs: 0 },
  runners: { first: false, second: false, third: false },
  batter: { name: '三輪 蓮', number: '8', stat: '', statLabel: '' },
  pitcher: { name: '倉本 龍之介', number: '1', stat: '', statLabel: '' },
  awayLineup: [...TEITO_LINEUP],
  homeLineup: [...SORYO_LINEUP],
  awayBatterIndex: 0,
  homeBatterIndex: 0,
  playLog: [],
  awayPitchCount: 0,
  homePitchCount: 0,
  awayPitcherHistory: [],
  homePitcherHistory: [],
  gameStartTime: null,
  ticker: '',
  activeEffect: null,
  effectTimestamp: 0,
  showMascot: false,
  mascotMode: 'idle',
  mascotImages: {},
  autoChangeEffect: true,
  showWaitingScreen: false,
  // 初期配置は「おすすめ配置」（DEFAULT_ELEMENT_POSITIONS）を ElementId キーで採用。
  // 旧 DEFAULT_OVERLAY_POSITIONS は別キー体系（scoreboard/playLog 等・現行未使用）のため使わない。
  overlayPositions: { ...DEFAULT_ELEMENT_POSITIONS },
  overlayScale: 1,
  lineupDisplayTeam: 'away',
  batterDisplayTeam: 'away',
  pitcherDisplayTeam: 'home',
  showBothLineups: false,
  lineupDisplayMode: 'attacking',
  dhMode: 'dh',
  gameStarted: false,
  tournament: {
    title: '',
    subtitle: '',
    venue: '',
    date: '',
  },
  pinchHitter: null,
  visibility: {
    miniScore: true,
    pinchHitter: false,
    lineup: true,
    tournamentHeader: false,
    bigScore: false,
    inningScoreboard: true,
    statusPanel: true,
    currentBatter: false,
    currentPitcher: false,
    statusPanel_diamond: true,
    statusPanel_bso: true,
    statusPanel_quickScore: true,
    ticker: false,
  },
  scoreboardCross: true,
}

export { emptyLineup }
