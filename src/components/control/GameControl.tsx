import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import SectionTitle from './shared/SectionTitle'
import type { DhMode } from '../../types'
import { getSamplePreset } from '../../lib/samplePresets'

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
  // 試合開始ウィザードで使用する store 操作
  const currentDhMode = useGameStore((s) => s.dhMode ?? s.awayDhMode ?? s.homeDhMode ?? 'dh')
  const setDhMode = useGameStore((s) => s.setDhMode)
  const setLineup = useGameStore((s) => s.setLineup)
  const awayLineup = useGameStore((s) => s.awayLineup)
  const homeLineup = useGameStore((s) => s.homeLineup)
  const [colorEditorOpen, setColorEditorOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<'away' | 'home' | null>(null)

  // 試合開始ウィザード（モーダル）の状態。
  // 学生オペレーターが DH 制を選び忘れた／投手を未登録のまま試合開始すると、
  // ピッチャーテロップに何も表示できなくなる事故を防ぐためのフロー。
  //（2026-05-28 顧客フィードバック対応）
  const [startWizardOpen, setStartWizardOpen] = useState(false)
  const [wizardDh, setWizardDh] = useState<DhMode>(currentDhMode)
  // サンプル投入は既定オフ（本番運用で誤投入を防ぐ）。
  // （2026-05-31 顧客フィードバック②: default でチェックを外す）
  const [wizardApplySample, setWizardApplySample] = useState(false)
  const [wizardApplyAway, setWizardApplyAway] = useState(true)
  const [wizardApplyHome, setWizardApplyHome] = useState(true)

  /** 試合開始ウィザードを開く。現在の DH モードを初期値として読み込む */
  const openStartWizard = () => {
    setWizardDh(currentDhMode)
    setWizardApplySample(false)
    setWizardApplyAway(true)
    setWizardApplyHome(true)
    setStartWizardOpen(true)
  }

  /** 試合開始ウィザードの確定処理。DH モード設定 → サンプル投入 → 試合開始ロック */
  const confirmStartWizard = () => {
    // DH モードを両チーム共通で適用（setDhMode 内部で両チーム同期）
    setDhMode('away', wizardDh)
    // サンプル選手データを投入（チェックされたチームのみ）
    if (wizardApplySample) {
      if (wizardApplyAway) setLineup('away', getSamplePreset('away', wizardDh))
      if (wizardApplyHome) setLineup('home', getSamplePreset('home', wizardDh))
    }
    setGameStarted(true)
    setStartWizardOpen(false)
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

  // 試合概要バナー用ラベル。
  // DH 制 + 試合状態 を1行で把握できる位置に置き、各チームカードからは重複表示を撤去。
  // （2026-05-28 顧客フィードバック対応: 試合概要に開始ルールを集約）
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

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      {/* チーム名・色は全スコア系パネル（ミニスコア・大型スコア・スコアボード・BSOパネル）に
          反映されるため controls には全部を列挙する。学生が「チーム名を変えたいけど、
          どの表示パネルに影響する？」と迷ったときの導線になる。 */}
      <SectionTitle title="試合管理" controls={['ミニスコア', '大型スコア', 'スコアボード', 'BSOパネル']} />

      {/* 試合概要バナー: DH制 + 試合状態を一目で把握。
          DH制の変更は「▶ 試合開始」ウィザードに一本化（チームカード内は表示しない）。 */}
      <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded border px-3 py-2 text-xs ${phaseColor}`}>
        <span className="font-bold tracking-wide">{phaseLabel}</span>
        <span className="opacity-60">|</span>
        <span>
          <span className="opacity-70">DH制：</span>
          <span className="font-bold">{dhLabel}</span>
        </span>
        {!gameStarted && !isGameOver && (
          <span className="ml-auto opacity-70 text-[11px]">
            DH制の変更は「▶ 試合開始」ウィザードから
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

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={applyTeams}
          className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded text-sm font-bold"
        >
          チーム名を反映
        </button>
        {/* 試合開始 / 終了 ボタン
            開始: gameStarted=true にしてDH制・打順並び替え・選手追加削除をロック
            終了: setGameOver(true) を呼ぶと isGameOver=true & gameStarted=false（次試合準備のため編集可へ） */}
        {!gameStarted && !isGameOver && (
          <button
            onClick={openStartWizard}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-bold"
            title="DH制を選択し、必要ならサンプル選手を投入してから試合を開始"
          >
            ▶ 試合開始（DH選択 / オーダー確定）
          </button>
        )}
        {gameStarted && !isGameOver && (
          <button
            onClick={() => setGameOver(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold"
            title="試合終了。スコアボードに×が表示され、オーダー編集が再度可能になります"
          >
            試合終了
          </button>
        )}
        {isGameOver && (
          <button
            onClick={() => setGameOver(false)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold"
          >
            試合再開
          </button>
        )}
        <button
          onClick={() => setColorEditorOpen((v) => !v)}
          className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm font-bold border border-gray-600 flex items-center gap-1"
        >
          <span>{colorEditorOpen ? '▼' : '▶'}</span>
          チームカラーを変更
        </button>
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

      {/* 試合開始ウィザード（モーダル）。
          ① DH制（あり / なし / 二刀流）を必ず選択させる
          ② 各DHモードに対応したサンプル選手を投入できる（投手込み）
          ③ 確定で setDhMode + setLineup + setGameStarted を一括実行
          学生オペレーターが投手未登録のまま試合開始する事故を防ぐ。 */}
      {startWizardOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setStartWizardOpen(false)}
        >
          <div
            className="bg-gray-900 border-2 border-emerald-500/60 rounded-lg p-5 max-w-md w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <div className="text-emerald-400 text-xs font-bold tracking-[0.3em]">
                STEP 1 OF 1
              </div>
              <div className="text-white text-lg font-bold">試合開始の準備</div>
              <div className="text-gray-400 text-xs">
                DH制を選択し、必要ならサンプル選手を投入してから試合を開始します
              </div>
            </div>

            {/* DH制選択 */}
            <div className="space-y-2">
              <div className="text-gray-300 text-xs font-bold">
                ① DH制を選択
              </div>
              <div className="grid grid-cols-1 gap-2">
                {([
                  {
                    key: 'dh',
                    label: 'DHあり（10名）',
                    hint: '1〜9番=野手、10番目=投手専用枠',
                  },
                  {
                    key: 'none',
                    label: 'DHなし（9名）',
                    hint: '投手も打順に入って打席に立つ',
                  },
                  {
                    key: 'twoWay',
                    label: '二刀流（10名・大谷ルール）',
                    hint: 'DH打者と10番目投手が同一選手',
                  },
                ] as { key: DhMode; label: string; hint: string }[]).map((opt) => {
                  const active = wizardDh === opt.key
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setWizardDh(opt.key)}
                      className={`text-left px-3 py-2 rounded border-2 transition-colors ${
                        active
                          ? 'bg-emerald-600/30 border-emerald-400 text-white'
                          : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <div className="text-sm font-bold flex items-center gap-2">
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${
                            active ? 'bg-emerald-400' : 'bg-gray-600'
                          }`}
                        />
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-gray-400 ml-5 leading-snug">
                        {opt.hint}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* サンプル投入 */}
            <div className="space-y-2 border-t border-gray-700 pt-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wizardApplySample}
                  onChange={(e) => setWizardApplySample(e.target.checked)}
                  className="mt-1 accent-emerald-500"
                />
                <div className="flex-1">
                  <div className="text-white text-sm font-bold">
                    ② サンプル選手データを投入する
                  </div>
                  <div className="text-gray-400 text-[11px] leading-snug">
                    架空選手 9〜10名（投手を含む）を投入します。投手テロップ ON/OFF
                    などの動作確認がすぐにできます。
                    <span className="text-amber-400">既存の打順は上書きされます。</span>
                  </div>
                </div>
              </label>
              {wizardApplySample && (
                <div className="ml-6 flex flex-col gap-1.5 bg-gray-800/60 rounded p-2 border border-gray-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wizardApplyAway}
                      onChange={(e) => setWizardApplyAway(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span className="text-gray-200 text-xs">
                      先攻（{awayLineup.find((p) => p.name)?.name ? '上書き' : '空のため投入'}）
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wizardApplyHome}
                      onChange={(e) => setWizardApplyHome(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span className="text-gray-200 text-xs">
                      後攻（{homeLineup.find((p) => p.name)?.name ? '上書き' : '空のため投入'}）
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* ロック説明 */}
            <div className="bg-orange-900/30 border border-orange-500/40 rounded p-2 text-[11px] text-orange-200 leading-snug">
              🔒 開始後は <strong>DH制・打順並び替え・選手追加削除・CSV読込</strong>{' '}
              がロックされます。名前・学年・コメント・守備位置・代打フラグ・投手交代は試合中も編集できます。
            </div>

            {/* アクション */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStartWizardOpen(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded font-bold text-sm"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={confirmStartWizard}
                disabled={wizardApplySample && !wizardApplyAway && !wizardApplyHome}
                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-bold text-sm"
              >
                ▶ この設定で試合開始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
