import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import SectionTitle from './shared/SectionTitle'

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
  const [colorEditorOpen, setColorEditorOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<'away' | 'home' | null>(null)

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
    if (confirm('完全リセットして新しい試合を開始しますか？\n\nチーム情報・打順・カラー設定もすべて初期状態に戻ります。\nこの操作は取り消せません。')) {
      newGame()
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <SectionTitle title="試合管理" controls={['ミニスコア', '大型スコア']} />

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
            onClick={() => {
              if (confirm('試合を開始しますか？\n\n● DH制（あり/なし/二刀流）の切替がロックされます\n● 打順並び替え・選手追加削除もロックされます\n● 名前・学年・コメント・守備位置・代打・投手交代は試合中も編集できます')) {
                setGameStarted(true)
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-bold"
            title="オーダー（DH制・打順）を確定して試合を開始"
          >
            ▶ 試合開始（オーダー確定）
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
    </div>
  )
}
