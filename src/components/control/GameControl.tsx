import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import SectionTitle from './shared/SectionTitle'
import { scrollToPanelCard } from './VisibilityControl'
import type { DhMode } from '../../types'
import { getSamplePreset } from '../../lib/samplePresets'
import { validateTeamLineup } from '../../lib/lineupValidation'

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

/** DH制の選択肢（試合前ナビで使用） */
const DH_OPTIONS: { key: DhMode; label: string; hint: string }[] = [
  { key: 'dh',     label: 'DHあり（10名）',     hint: '1〜9番=野手、10番=投手専用枠' },
  { key: 'none',   label: 'DHなし（9名）',      hint: '投手も打順に入って打席に立つ' },
  { key: 'twoWay', label: '二刀流（10名）',     hint: 'DH打者と10番投手が同一選手' },
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

  // 試合前の打順・選手 完成度チェック（選択中の DH 制で判定）
  const awayCheck = validateTeamLineup(awayLineup, currentDhMode)
  const homeCheck = validateTeamLineup(homeLineup, currentDhMode)
  const canStart = awayCheck.complete && homeCheck.complete

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

  // ローカル state（スムーズな入力用）
  const [awayName, setAwayName] = useState(awayTeam.name)
  const [homeName, setHomeName] = useState(homeTeam.name)
  const [awayColor, setAwayColor] = useState(awayTeam.color)
  const [homeColor, setHomeColor] = useState(homeTeam.color)

  // ストア側が変わったらローカル state を追従（IDB復元・newGame 等）
  useEffect(() => { setAwayName(awayTeam.name) }, [awayTeam.name])
  useEffect(() => { setHomeName(homeTeam.name) }, [homeTeam.name])
  useEffect(() => { setAwayColor(awayTeam.color) }, [awayTeam.color])
  useEffect(() => { setHomeColor(homeTeam.color) }, [homeTeam.color])

  /** ローカル state → ストアに反映（name を shortName にも使用） */
  const applyTeams = () => {
    setTeamName('away', awayName, awayName)
    setTeamName('home', homeName, homeName)
    setTeamColor('away', awayColor)
    setTeamColor('home', homeColor)
  }

  /** 入力欄からフォーカスが外れたら自動でストアに反映 */
  const handleBlur = () => { applyTeams() }

  // デバウンス付き自動反映: OBS Dock では blur が発火しないケースがあるため、
  // 入力変更 500ms 後にストアへ自動反映する
  useEffect(() => {
    const timer = setTimeout(() => {
      setTeamName('away', awayName, awayName)
      setTeamName('home', homeName, homeName)
    }, 500)
    return () => clearTimeout(timer)
  }, [awayName, homeName, setTeamName])

  const handleNewGameKeepTeams = () => {
    if (confirm('新しい試合を開始しますか？\n\n● 同じチーム情報・打順・カラー・大会情報は引き継ぎます\n● スコア・カウント・走者・打席・投手履歴・プレーログはリセットされます')) {
      newGameKeepTeams()
    }
  }

  const handleNewGameFullReset = () => {
    if (confirm('完全リセットして新しい試合を開始しますか？\n\nチーム情報・打順・カラー設定もすべて初期状態に戻ります。\n（テロップの位置・サイズ設定は保持されます）\nこの操作は取り消せません。')) {
      newGame()
    }
  }

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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-gray-400 text-xs">アウェイ（先攻）</label>
          <input
            className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
            placeholder="チーム名"
            value={awayName}
            onChange={(e) => setAwayName(e.target.value)}
            onBlur={handleBlur}
          />
        </div>
        <div className="space-y-2">
          <label className="text-gray-400 text-xs">ホーム（後攻）</label>
          <input
            className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
            placeholder="チーム名"
            value={homeName}
            onChange={(e) => setHomeName(e.target.value)}
            onBlur={handleBlur}
          />
        </div>
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
            onClick={() => setGameOver(true)}
            className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold"
            title="試合終了。スコアボードに×が表示され、オーダー編集が再度可能になります"
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

          {/* ① DH制 */}
          <div className="space-y-1.5">
            <div className="text-gray-300 text-xs font-bold">① DH制を選択</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
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
                onClick={() => {
                  setLineup('away', getSamplePreset('away', currentDhMode))
                  setLineup('home', getSamplePreset('home', currentDhMode))
                }}
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
              title={canStart ? 'オーダーを確定して試合開始' : '打順・選手の必須項目をすべて埋めてください'}
            >
              {canStart ? '▶ 試合開始（オーダー確定・ロック）' : '▶ 打順・選手を埋めると開始できます'}
            </button>
            {!canStart && (
              <div className="text-[11px] text-amber-300/90 text-center">
                未入力の項目があります（上の②を確認してください）
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
    </div>
  )
}
