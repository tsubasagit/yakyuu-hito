import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import SectionTitle from './shared/SectionTitle'
import { scrollToPanelCard } from './VisibilityControl'
import type { DhMode } from '../../types'
import { getSamplePreset } from '../../lib/samplePresets'
import { validateTeamLineup } from '../../lib/lineupValidation'
import { ConfirmModal } from './shared/Modal'
import InningScoreboard from '../overlay/InningScoreboard'

/** チームカラー プリセット（大学野球で使われやすい色を厳選） */
const COLOR_PRESETS: { label: string; hex: string }[] = [
  { label: 'レッド',     hex: '#e60033' },
  { label: 'ネイビー',   hex: '#1c4e88' },
  { label: 'ブルー',     hex: '#2563eb' },
  { label: 'スカイ',     hex: '#0ea5e9' },
  { label: 'グリーン',   hex: '#16a34a' },
  { label: 'イエロー',   hex: '#f59e0b' },
  { label: 'オレンジ',   hex: '#ea580c' },
  { label: 'パープル',   hex: '#7c3aed' },
  { label: 'マルーン',   hex: '#7f1d1d' },
  { label: 'ブラック',   hex: '#111827' },
  { label: 'グレー',     hex: '#6b7280' },
]

/** DH制の選択肢（試合前ナビで使用）。
 *  2026-07-08 顧客フィードバック: 二刀流（twoWay）モードは運用不要のため選択肢から削除。
 *  型・内部ロジックは旧データ互換のため残置するが、UI からは選べない。 */
const DH_OPTIONS: { key: DhMode; label: string; hint: string }[] = [
  { key: 'dh',     label: 'DHあり（10名）',     hint: '1〜9番=野手、10番=投手専用枠' },
  { key: 'none',   label: 'DHなし（9名）',      hint: '投手も打順に入って打席に立つ' },
]

/** ControlPage のセクションアンカーへスムーズスクロール */
function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el.classList.add('ring-2', 'ring-accent', 'ring-offset-2', 'ring-offset-gray-900')
  setTimeout(() => {
    el.classList.remove('ring-2', 'ring-accent', 'ring-offset-2', 'ring-offset-gray-900')
  }, 1200)
}

export default function GameControl() {
  const awayTeam = useGameStore((s) => s.awayTeam)
  const homeTeam = useGameStore((s) => s.homeTeam)
  const awayTotal = useGameStore((s) => s.awayTotal)
  const homeTotal = useGameStore((s) => s.homeTotal)
  const scoreboardCross = useGameStore((s) => s.scoreboardCross ?? true)
  const setScoreboardCross = useGameStore((s) => s.setScoreboardCross)
  const currentInning = useGameStore((s) => s.currentInning)
  const currentHalf = useGameStore((s) => s.currentHalf)
  const isGameOver = useGameStore((s) => s.isGameOver)
  const gameStarted = useGameStore((s) => s.gameStarted ?? false)
  const setGameStarted = useGameStore((s) => s.setGameStarted)
  const setTeamName = useGameStore((s) => s.setTeamName)
  const setGameOver = useGameStore((s) => s.setGameOver)
  const newGame = useGameStore((s) => s.newGame)
  const newGameKeepTeams = useGameStore((s) => s.newGameKeepTeams)
  const setTeamColor = useGameStore((s) => s.setTeamColor)
  // DH制・打順（試合前ナビで使用）
  const currentDhMode = useGameStore((s) => s.dhMode ?? s.awayDhMode ?? s.homeDhMode ?? 'dh')
  const setDhMode = useGameStore((s) => s.setDhMode)
  const setLineup = useGameStore((s) => s.setLineup)
  const awayLineup = useGameStore((s) => s.awayLineup)
  const homeLineup = useGameStore((s) => s.homeLineup)
  const [colorEditorOpen, setColorEditorOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<'away' | 'home' | null>(null)
  // 新試合・完全リセットの確認モーダル（confirm の置換。OBSドックでも確実に動く）
  const [pendingReset, setPendingReset] = useState<null | 'keep' | 'full'>(null)
  // サンプル選手投入の確認モーダル（誤クリックで既存打順を上書きしないよう1クッション）
  // 2026-06-09 顧客フィードバック⑦
  const [pendingSample, setPendingSample] = useState(false)
  // 試合終了ウィザード（プレビュー → ×トグル → 確定）。2026-06-09 顧客フィードバック⑥
  // 「試合終了」を押すといきなり確定せず、完成形をプレビューさせて確認してから確定する。
  const [endWizardOpen, setEndWizardOpen] = useState(false)
  const [tentativeCross, setTentativeCross] = useState(false)
  // この試合で「試合終了」を確定したときの×設定を覚えておく（再終了時の初期値に使う）。
  // null=まだ一度も確定していない（初回は自動判定をデフォルトにする）。新試合でnullに戻す。
  const lastConfirmedCross = useRef<boolean | null>(null)

  // 勝敗の自動判定（ウィザードの「下書き」用。放送表示の真偽は人の確定が握る）
  const homeWon = homeTotal > awayTotal
  const awayWon = awayTotal > homeTotal
  // 最終回（後攻が裏を攻撃せず勝つと表終了で同回裏へ自動遷移するため通常 bottom 着地。
  //  進め過ぎた場合は -1 で前の回に補正）
  const finalInning = currentHalf === 'bottom' ? currentInning : Math.max(1, currentInning - 1)
  const endHomeName = homeTeam.name || '後攻'
  const endAwayName = awayTeam.name || '先攻'

  /** 「試合終了」押下 → ×の初期値を下書きし、ウィザードを開く（まだ確定しない）。
   *  初回はこの試合の自動判定（後攻勝ち）、2回目以降は前回確定した値を初期値にする
   *  （連盟方針で×OFFにした等の手動判断を再終了時に取りこぼさない。2026-06-09 QA #3） */
  const openEndWizard = () => {
    setTentativeCross(lastConfirmedCross.current ?? homeWon)
    setEndWizardOpen(true)
  }

  /** ウィザードで「この内容で終了」 → 確認した×設定を反映し、試合終了を確定 */
  const confirmEnd = () => {
    setScoreboardCross(tentativeCross)
    lastConfirmedCross.current = tentativeCross
    setGameOver(true)
    setEndWizardOpen(false)
  }

  /** 両チームに架空のサンプル選手を投入（既存打順は上書き） */
  const injectSample = () => {
    setLineup('away', getSamplePreset('away', currentDhMode))
    setLineup('home', getSamplePreset('home', currentDhMode))
  }

  // 試合前の打順・選手 完成度チェック（選択中の DH 制で判定）
  const awayCheck = validateTeamLineup(awayLineup, currentDhMode)
  const homeCheck = validateTeamLineup(homeLineup, currentDhMode)
  // フルネームのチーム名は両チーム必須。空欄では試合開始できない。
  // 省略名は任意（未入力ならフルネーム頭5文字を自動採用＝pickTeamLabel）。
  // 2026-07-01 顧客FB: チーム名空欄でも開始できてしまう問題
  const awayNameOk = awayTeam.name.trim().length > 0
  const homeNameOk = homeTeam.name.trim().length > 0
  const teamNamesOk = awayNameOk && homeNameOk
  const canStart = teamNamesOk && awayCheck.complete && homeCheck.complete
  // 両チームの打順が空（完全リセット直後など）。誘導文の出し分けに使う。2026-06-09 QA #2
  const bothLineupsEmpty = awayCheck.filledBatters === 0 && homeCheck.filledBatters === 0

  /** 打順が揃っていれば試合開始（オーダー確定・ロック） */
  const startGame = () => {
    if (!canStart) return
    setGameStarted(true)
  }

  const copyColor = async (team: 'away' | 'home', value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(team)
      setTimeout(() => setCopiedKey((k) => (k === team ? null : k)), 1200)
    } catch {
      /* clipboard unavailable */
    }
  }

  // ローカル state（スムーズな入力用）。
  // 2026-07-01 顧客フィードバック⑤: チーム名は「フルネーム」と「省略名（表示は5文字まで）」を分離。
  //   - フルネーム（name）: 大会名ヘッダー・打順パネルに表示
  //   - 省略名（shortName）: ミニスコア/BSOパネル/イニングスコアボード/大型スコア等の狭い枠に表示
  const [awayName, setAwayName] = useState(awayTeam.name)
  const [homeName, setHomeName] = useState(homeTeam.name)
  const [awayShort, setAwayShort] = useState(awayTeam.shortName)
  const [homeShort, setHomeShort] = useState(homeTeam.shortName)
  const [awayColor, setAwayColor] = useState(awayTeam.color)
  const [homeColor, setHomeColor] = useState(homeTeam.color)

  // ストア側が変わったらローカル state を追従（IDB復元・newGame 等）
  useEffect(() => { setAwayName(awayTeam.name) }, [awayTeam.name])
  useEffect(() => { setHomeName(homeTeam.name) }, [homeTeam.name])
  useEffect(() => { setAwayShort(awayTeam.shortName) }, [awayTeam.shortName])
  useEffect(() => { setHomeShort(homeTeam.shortName) }, [homeTeam.shortName])
  useEffect(() => { setAwayColor(awayTeam.color) }, [awayTeam.color])
  useEffect(() => { setHomeColor(homeTeam.color) }, [homeTeam.color])

  // 省略名の入力上限（15文字）と、オーバーレイに表示される文字数（5文字）。
  // 入力は最大15文字まで許容するが、実際に表示されるのは先頭5文字のみ（pickTeamLabel が丸める）。
  // 2026-07-08 顧客フィードバック: 入力は長めに許容、表示は5文字までと注意喚起する
  const SHORT_INPUT_MAX = 15
  const SHORT_DISPLAY_MAX = 5
  /** 省略名は最大15文字に丸める（全角/絵文字はサロゲート単位で1文字扱い） */
  const clampShort = (v: string) => Array.from(v).slice(0, SHORT_INPUT_MAX).join('')

  /** ローカル state → ストアに反映（フルネーム + 省略名を別々に保存） */
  const applyTeams = () => {
    setTeamName('away', awayName, clampShort(awayShort))
    setTeamName('home', homeName, clampShort(homeShort))
    setTeamColor('away', awayColor)
    setTeamColor('home', homeColor)
  }

  /** 入力欄からフォーカスが外れたら自動でストアに反映 */
  const handleBlur = () => { applyTeams() }

  // デバウンス付き自動反映: OBS Dock では blur が発火しないケースがあるため、
  // 入力変更 500ms 後にストアへ自動反映する
  useEffect(() => {
    const timer = setTimeout(() => {
      setTeamName('away', awayName, clampShort(awayShort))
      setTeamName('home', homeName, clampShort(homeShort))
    }, 500)
    return () => clearTimeout(timer)
  }, [awayName, homeName, awayShort, homeShort, setTeamName])

  const handleNewGameKeepTeams = () => setPendingReset('keep')
  const handleNewGameFullReset = () => setPendingReset('full')

  // 試合概要バナー用ラベル。DH 制 + 試合状態 を1行で把握。
  const dhLabel =
    currentDhMode === 'dh'
      ? 'DHあり（10名・10番=投手）'
      : currentDhMode === 'none'
        ? 'DHなし（9名・投手も打席）'
        : '二刀流（10名・大谷ルール）'
  const phaseLabel = isGameOver
    ? '試合終了'
    : gameStarted
      ? '試合中（オーダーロック）'
      : '試合前（準備中）'
  const phaseColor = isGameOver
    ? 'bg-red-900/40 border-red-500/50 text-red-200'
    : gameStarted
      ? 'bg-orange-900/40 border-orange-500/50 text-orange-200'
      : 'bg-emerald-900/30 border-emerald-500/40 text-emerald-200'

  const isPreGame = !gameStarted && !isGameOver

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <SectionTitle title="試合管理" controls={['ミニスコア', '大型スコア', 'スコアボード', 'BSOパネル']} />

      {/* 試合概要バナー: DH制 + 試合状態を一目で把握 */}
      <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded border px-3 py-2 text-xs ${phaseColor}`}>
        <span className="font-bold tracking-wide">{phaseLabel}</span>
        <span className="opacity-60">|</span>
        <span>
          <span className="opacity-70">DH制：</span>
          <span className="font-bold">{dhLabel}</span>
        </span>
        {isPreGame && (
          <span className="ml-auto opacity-70 text-[11px]">
            下の「試合前の準備」で開始できます
          </span>
        )}
      </div>

      {/* チーム名: フルネーム + 省略名（入力は15文字まで・表示は5文字）を分けて入力。
          フルネーム=大会名/打順表示、省略名=ミニスコア等の狭い枠表示。
          省略名が空のときはフルネームを5文字に丸めた表示に自動フォールバックする。
          2026-07-01 顧客フィードバック⑤⑥ */}
      <div className="grid grid-cols-2 gap-4">
        {(['away', 'home'] as const).map((team) => {
          const isAway = team === 'away'
          const label = isAway ? 'アウェイ（先攻）' : 'ホーム（後攻）'
          const nameValue = isAway ? awayName : homeName
          const shortValue = isAway ? awayShort : homeShort
          const setName = isAway ? setAwayName : setHomeName
          const setShort = isAway ? setAwayShort : setHomeShort
          // フルネーム未入力なら赤枠で必須を明示（試合開始の必須項目）
          const nameEmpty = nameValue.trim().length === 0
          // 省略名が表示上限（5文字）を超えているか。超過時は注意喚起を出す（入力自体は許容）。
          const shortOverLimit = Array.from(shortValue).length > SHORT_DISPLAY_MAX
          return (
            <div key={team} className="space-y-1.5">
              <label className="text-gray-400 text-xs flex items-center gap-1.5">
                {label}
                <span className="text-red-400 font-bold">必須</span>
              </label>
              <input
                className={`w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border ${
                  nameEmpty ? 'border-red-500/70' : 'border-transparent'
                }`}
                placeholder="チーム名（フルネーム）"
                value={nameValue}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleBlur}
              />
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-[10px] whitespace-nowrap shrink-0">省略名（任意・表示は5文字まで）</span>
                <input
                  className={`flex-1 min-w-0 bg-gray-700 text-white rounded px-3 py-1.5 text-sm border ${
                    shortOverLimit ? 'border-amber-500/70' : 'border-transparent'
                  }`}
                  placeholder={Array.from(nameValue).slice(0, SHORT_DISPLAY_MAX).join('') || '例: 帝都'}
                  maxLength={SHORT_INPUT_MAX}
                  value={shortValue}
                  onChange={(e) => setShort(clampShort(e.target.value))}
                  onBlur={handleBlur}
                />
              </div>
              {shortOverLimit && (
                <p className="text-[10px] text-amber-400/90">
                  ⚠️ 表示できるのは5文字までです（オーバーレイには先頭「{Array.from(shortValue).slice(0, SHORT_DISPLAY_MAX).join('')}」のみ表示されます）
                </p>
              )}
              {nameEmpty && (
                <p className="text-[10px] text-red-400/90">フルネームを入力してください（未入力だと試合開始できません）</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={applyTeams}
          className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded text-sm font-bold"
        >
          チーム名を反映
        </button>
        <button
          onClick={() => setColorEditorOpen((v) => !v)}
          className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm font-bold border border-gray-600 flex items-center gap-1"
        >
          <span>{colorEditorOpen ? '▼' : '▶'}</span>
          チームカラーを変更
        </button>
        {/* 試合終了 / 再開 は「試合を終える/戻す」操作で意図が異なるため、
            準備系ボタンの右側に少し余白を空けて配置する（2026-05-31 顧客FB）。 */}
        {gameStarted && !isGameOver && (
          <button
            onClick={openEndWizard}
            className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold"
            title="試合終了。最終スコアをプレビュー確認してから確定します"
          >
            試合終了
          </button>
        )}
        {isGameOver && (
          <button
            onClick={() => setGameOver(false)}
            className="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold"
          >
            試合再開
          </button>
        )}
      </div>

      {colorEditorOpen && (
        <div className="grid grid-cols-2 gap-4 bg-gray-900/50 rounded p-3 border border-gray-700">
          {(['away', 'home'] as const).map((team) => {
            const label = team === 'away' ? 'アウェイ（先攻）' : 'ホーム（後攻）'
            const value = team === 'away' ? awayColor : homeColor
            const setLocal = team === 'away' ? setAwayColor : setHomeColor
            const apply = (v: string) => { setLocal(v); setTeamColor(team, v) }
            return (
              <div key={team} className="space-y-2">
                <span className="text-gray-400 text-xs">{label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                    value={value}
                    onChange={(e) => apply(e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 bg-gray-700 text-white rounded px-2 py-1 text-xs font-mono"
                    value={value}
                    onChange={(e) => {
                      const v = e.target.value
                      setLocal(v)
                      if (/^#[0-9a-fA-F]{6}$/.test(v)) setTeamColor(team, v)
                    }}
                  />
                  <button
                    onClick={() => copyColor(team, value)}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded text-xs border border-gray-600"
                    title="カラーコードをコピー"
                  >
                    {copiedKey === team ? '✓' : 'コピー'}
                  </button>
                </div>
                {/* プリセット色パッチ（クリックで一発適用） */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COLOR_PRESETS.map((preset) => {
                    const selected = value.toLowerCase() === preset.hex.toLowerCase()
                    return (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => apply(preset.hex)}
                        title={`${preset.label} ${preset.hex}`}
                        className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
                          selected ? 'border-white ring-2 ring-accent' : 'border-gray-600'
                        }`}
                        style={{ backgroundColor: preset.hex }}
                        aria-label={preset.label}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ===== 試合前の準備ナビ（準備中のみ表示） ===== */}
      {isPreGame && (
        <div className="bg-emerald-950/30 border-2 border-emerald-500/40 rounded-lg p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-emerald-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">試合前の準備</span>
            <span className="text-emerald-200/80 text-[11px] leading-snug">
              ① DH制を選ぶ → ② 打順・選手を埋める → ③（任意）サイズ調整 → ▶ 試合開始
            </span>
          </div>

          {/* 打順が空のときの誘導（完全リセット直後など）。DHを選んでも②が未完成な理由を明示。
              2026-06-09 QA #2 */}
          {bothLineupsEmpty && (
            <div className="bg-amber-900/25 border border-amber-500/40 rounded-lg p-2.5 text-[11px] text-amber-100 leading-relaxed">
              <span className="font-bold">打順がまだ空です。</span>
              ① でDH制を選んでから、② で選手を入力してください。
              すぐ埋めたいときは ② の <span className="font-bold">「サンプル選手を両チーム投入」</span> が便利です
              （DH制を選んでから投入してください）。
            </div>
          )}

          {/* ① DH制 */}
          <div className="space-y-1.5">
            <div className="text-gray-300 text-xs font-bold">① DH制を選択</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {DH_OPTIONS.map((opt) => {
                const active = currentDhMode === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDhMode('away', opt.key)}
                    className={`text-left px-2.5 py-1.5 rounded border-2 transition-colors ${
                      active
                        ? 'bg-emerald-600/30 border-emerald-400 text-white'
                        : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                      {opt.label}
                    </div>
                    <div className="text-[10px] text-gray-400 leading-snug ml-4">{opt.hint}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ② 打順・選手の完成度 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-gray-300 text-xs font-bold">② 打順・選手を登録（全項目）</div>
              <button
                type="button"
                onClick={() => scrollToId('section-lineup')}
                className="text-[11px] text-accent hover:underline font-bold shrink-0"
              >
                打順・選手を編集 ↗
              </button>
            </div>
            {(['away', 'home'] as const).map((side) => {
              const team = side === 'away' ? awayTeam : homeTeam
              const check = side === 'away' ? awayCheck : homeCheck
              const roleLabel = side === 'away' ? '先攻' : '後攻'
              return (
                <div
                  key={side}
                  className={`rounded px-2.5 py-1.5 border text-[11px] ${
                    check.complete
                      ? 'bg-emerald-900/30 border-emerald-600/40'
                      : 'bg-amber-900/20 border-amber-600/40'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">
                      {check.complete ? '✅' : '⚠️'} {team.name || roleLabel}
                    </span>
                    <span className="text-gray-400">（{roleLabel} ／ 入力 {check.filledBatters}/{check.requiredBatters}名）</span>
                  </div>
                  {!check.complete && (
                    <div className="text-amber-200/90 mt-0.5 leading-snug">
                      未完成: {check.issues.slice(0, 3).join(' / ')}
                      {check.issues.length > 3 ? ` 他${check.issues.length - 3}件` : ''}
                    </div>
                  )}
                </div>
              )
            })}
            {/* サンプル投入（任意・素早く埋めたいとき） */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-gray-500">素早く埋める（任意）:</span>
              <button
                type="button"
                onClick={() => setPendingSample(true)}
                className="text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded border border-gray-600"
                title="架空のサンプル選手を両チームに投入（既存の打順は上書き）"
              >
                サンプル選手を両チーム投入
              </button>
            </div>
          </div>

          {/* ③ サイズ・配置（任意） */}
          <div className="flex items-center justify-between gap-2">
            <div className="text-gray-300 text-xs font-bold">③ スコアボード等のサイズ・配置（任意）</div>
            <button
              type="button"
              onClick={() => scrollToPanelCard('スコアボード')}
              className="text-[11px] text-accent hover:underline font-bold shrink-0"
            >
              表示パネルへ ↗
            </button>
          </div>

          {/* ▶ 試合開始（完成時のみ有効） */}
          <div className="pt-2 border-t border-emerald-500/20 space-y-2">
            <button
              type="button"
              onClick={startGame}
              disabled={!canStart}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded font-bold text-sm"
              title={
                canStart
                  ? 'オーダーを確定して試合開始'
                  : !teamNamesOk
                    ? 'チーム名（フルネーム）を両チーム入力してください'
                    : '打順・選手の必須項目をすべて埋めてください'
              }
            >
              {canStart
                ? '▶ 試合開始（オーダー確定・ロック）'
                : !teamNamesOk
                  ? '▶ チーム名を入力すると開始できます'
                  : '▶ 打順・選手を埋めると開始できます'}
            </button>
            {!canStart && (
              <div className="text-[11px] text-amber-300/90 text-center">
                {!teamNamesOk ? (
                  <>
                    チーム名（フルネーム）が未入力です：
                    {!awayNameOk && '先攻'}
                    {!awayNameOk && !homeNameOk && '・'}
                    {!homeNameOk && '後攻'}
                    （上の「チーム名」欄）
                  </>
                ) : (
                  '未入力の項目があります（上の②を確認してください）'
                )}
              </div>
            )}
            <div className="bg-orange-900/20 border border-orange-500/30 rounded p-2 text-[10px] text-orange-200/90 leading-snug">
              🔒 開始後は <strong>DH制・打順並び替え・選手追加削除・CSV読込</strong> がロックされます。
              名前・学年・コメント・守備位置・代打・投手交代は試合中も編集できます。
            </div>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="bg-gradient-to-br from-red-950/80 to-red-900/40 border-2 border-red-500/70 rounded-lg p-4 space-y-3">
          <div className="text-center">
            <div className="inline-block bg-red-600 text-white text-xs font-bold tracking-[0.3em] px-3 py-1 rounded mb-2">
              GAME OVER
            </div>
            <div className="text-white text-base font-bold">試合終了</div>
            <div className="text-gray-300 text-xs mt-1">
              続行するか、新しい試合を作成してください
            </div>
          </div>

          {/* スコアボード「×」表記の後付け調整（試合終了ウィザードで確定した値をここでも付け外し可）。
              2026-06-09 顧客フィードバック⑥ */}
          <div className="bg-black/30 border border-red-500/30 rounded-lg p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={scoreboardCross}
                onChange={(e) => setScoreboardCross(e.target.checked)}
                className="w-4 h-4 accent-red-500"
              />
              <span className="text-white text-sm font-bold">スコアボードに「×」を表示する</span>
            </label>
            <p className="text-gray-300 text-[11px] leading-snug">
              最終回（{finalInning}回裏）に「×」（得点1以上は「2×」）を表示します。
              試合終了時に確認した内容です。違っていればここで付け外しできます。
            </p>
            <div className="text-[11px] text-gray-400">
              参考（自動判定）：{homeWon
                ? `後攻（${endHomeName}）の勝ち → ×を付けるのが一般的`
                : awayWon
                  ? `先攻（${endAwayName}）の勝ち → ×なしが一般的`
                  : '引き分け → ×なしが一般的'}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setGameOver(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded font-bold text-sm"
              title="誤って試合終了を押した場合や延長戦の場合"
            >
              ↩ この試合を再開する
            </button>
            <button
              onClick={handleNewGameKeepTeams}
              className="w-full bg-accent hover:bg-accent/80 text-white px-4 py-2.5 rounded font-bold text-sm"
              title="チーム・打順・カラー・大会情報を引き継いで新試合"
            >
              ▶ 新しい試合を作成（同じチームで）
            </button>
            <button
              onClick={handleNewGameFullReset}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2.5 rounded font-bold text-xs border border-gray-600"
              title="全データ初期化（チーム情報も含む）"
            >
              ⟲ 完全リセットして新試合
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={pendingReset !== null}
        title={pendingReset === 'full' ? '完全リセットして新しい試合を作成' : '新しい試合を作成（同じチームで）'}
        message={
          pendingReset === 'full'
            ? 'チーム名・打順・選手情報がすべて空欄になります。\n（大会情報＝大会名・副題・会場・日付、テロップの位置・サイズ設定は保持されます）\nこの操作は取り消せません。'
            : '● 同じチーム情報・打順・カラー・大会情報は引き継ぎます\n● スコア・カウント・走者・打席・投手履歴・プレーログはリセットされます'
        }
        confirmLabel={pendingReset === 'full' ? '完全リセットする' : '新試合を開始'}
        cancelLabel="やめる"
        tone="danger"
        onConfirm={() => {
          if (pendingReset === 'keep') newGameKeepTeams()
          else if (pendingReset === 'full') newGame()
          lastConfirmedCross.current = null // 新試合は×判断をリセット（次の終了は自動判定が初期値）
          setPendingReset(null)
        }}
        onCancel={() => setPendingReset(null)}
      />

      <ConfirmModal
        open={pendingSample}
        title="サンプル選手を投入しますか？"
        message={'両チームの打順に架空のサンプル選手を入れます。\n現在入力されている打順は上書きされます。'}
        confirmLabel="はい、投入する"
        cancelLabel="いいえ"
        tone="danger"
        onConfirm={() => {
          injectSample()
          setPendingSample(false)
        }}
        onCancel={() => setPendingSample(false)}
      />

      {/* 試合終了ウィザード: 完成形プレビュー → ×トグル → 確定。
          人がプレビューで確認するまで放送（isGameOver）に確定しない。
          2026-06-09 顧客フィードバック⑥ */}
      {endWizardOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setEndWizardOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div>
              <h3 className="text-white text-base font-bold leading-snug">試合を終了します</h3>
              <p className="text-gray-300 text-xs mt-1 leading-relaxed">
                下のスコアボードが配信に出ます。<strong className="text-white">球場の最終結果と見比べて</strong>、
                問題なければ「この内容で終了」を押してください。
              </p>
            </div>

            {/* 完成形プレビュー（実際の見た目そのまま。芝を模した背景に重ねる） */}
            <div className="rounded-lg bg-gradient-to-b from-emerald-900/50 to-gray-900 border border-gray-700 p-4 flex justify-center overflow-x-auto">
              <InningScoreboard preview={{ cross: tentativeCross }} />
            </div>

            {/* 平易な一言（現在のトグル状態を反映） */}
            <div className="text-sm leading-relaxed">
              {tentativeCross ? (
                <span className="text-amber-200">
                  最終回（<strong>{finalInning}回裏</strong>）に「<strong>×</strong>」を付けています。
                  {homeWon ? `（後攻 ${endHomeName} の勝ち）` : ''}
                </span>
              ) : (
                <span className="text-gray-200">「×」は付けていません（通常終了）。</span>
              )}
            </div>

            {/* 参考: 自動判定（拘束力なし・人の確認が優先） */}
            <div className="text-[11px] text-gray-400">
              参考（自動判定）：{homeWon
                ? `後攻（${endHomeName}）の勝ち → ×を付けるのが一般的`
                : awayWon
                  ? `先攻（${endAwayName}）の勝ち → ×なしが一般的`
                  : '引き分け → ×なしが一般的'}
            </div>

            {/* ×トグル（1ボタン。現在状態＋タップで反転） */}
            <button
              type="button"
              onClick={() => setTentativeCross((v) => !v)}
              className={`w-full px-4 py-3 rounded font-bold text-sm border-2 transition-colors ${
                tentativeCross
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 hover:bg-amber-500/30'
                  : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
              }`}
            >
              {tentativeCross ? '「×」を表示中 — タップで外す' : '「×」なし — タップで付ける'}
            </button>

            {/* 確定 / キャンセル */}
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setEndWizardOpen(false)}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm font-bold"
              >
                やめる（試合に戻る）
              </button>
              <button
                type="button"
                onClick={confirmEnd}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold"
              >
                この内容で終了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
