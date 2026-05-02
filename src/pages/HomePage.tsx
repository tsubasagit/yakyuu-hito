import { Link } from 'react-router-dom'

const HITO_LOGO = 'https://hito-inc.jp/wp-content/uploads/2023/10/header_title_20231020x.png'
const HITO_SITE = 'https://hito-inc.jp/'
const REPO_URL = 'https://github.com/tsubasagit/yakyuu-hito'

/**
 * 株式会社ひと 大学野球配信向けトップページ。
 * 大学生スタッフが「初めての配信でも迷わない」と感じられるストーリー導線。
 */
export default function HomePage() {
  const baseUrl = window.location.origin + window.location.pathname

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* ヘッダーバナー */}
        <div className="flex items-center justify-between gap-3 mb-10">
          <a
            href={HITO_SITE}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded px-3 py-1.5 hover:opacity-80 transition-opacity"
            title="株式会社ひと 公式サイト"
          >
            <img src={HITO_LOGO} alt="株式会社ひと" className="h-7 w-auto" />
          </a>
          <span className="text-slate-500 text-xs tracking-widest">
            v0.4.0-alpha
          </span>
        </div>

        {/* ヒーロー */}
        <div className="text-center mb-10">
          <p className="text-[#538bb0] text-xs tracking-[0.4em] mb-3 font-medium uppercase">
            For Hito Inc. — College Baseball Live Broadcast
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">
            初めての配信でも、<br className="md:hidden" />迷わない。
          </h1>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            株式会社ひと の大学野球オンライン配信を、
            <br />
            学生スタッフが <span className="text-amber-300 font-bold">1人で</span> 操作できるよう設計したスコアボードオーバーレイ。
          </p>
        </div>

        {/* ヒーロー画像 */}
        <div className="mb-12 rounded-xl overflow-hidden border border-slate-700 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <img
            src="images/hero-overlay-game.png"
            alt="試合中のオーバーレイ表示例"
            className="w-full block"
            loading="lazy"
          />
        </div>

        {/* 入口リンク */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
          <Link
            to="/control"
            className="block bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-[#538bb0] rounded-xl p-5 transition-colors"
          >
            <div className="text-[10px] tracking-[0.3em] text-[#538bb0] font-medium uppercase mb-1">
              For Operator
            </div>
            <h2 className="text-xl font-bold mb-1">コントロールパネル</h2>
            <p className="text-slate-400 text-sm">
              スコア・カウント・選手の操作画面（OBSカスタムドック用）
            </p>
          </Link>
          <Link
            to="/overlay"
            className="block bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-300 rounded-xl p-5 transition-colors"
          >
            <div className="text-[10px] tracking-[0.3em] text-amber-300 font-medium uppercase mb-1">
              For OBS Browser Source
            </div>
            <h2 className="text-xl font-bold mb-1">オーバーレイ</h2>
            <p className="text-slate-400 text-sm">
              透明背景のスコアボード（OBSブラウザソース用 / 1920×1080）
            </p>
          </Link>
        </div>

        {/* 学生スタッフ向け安心ポイント */}
        <div className="mb-14">
          <h2 className="text-xl font-bold mb-1 tracking-tight">学生スタッフが安心して使える理由</h2>
          <p className="text-slate-500 text-xs mb-5">
            初心者を取り残さない設計を最優先しました。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Reason
              title="1クリックON/OFF"
              desc="表示要素ごとに大きなトグルボタン。色帯で「下のどのセクションが操作元か」が視覚で分かります。"
            />
            <Reason
              title="間違えてもすぐ戻せる"
              desc="カウント・走者・打順は ±1 / 戻すボタン完備。「次の打者」「前の打者」も1タップ。"
            />
            <Reason
              title="OBS再起動でも消えない"
              desc="状態は localStorage + IndexedDB に二重保存。試合途中で OBS が落ちても復元します。"
            />
            <Reason
              title="ネット切断にも強い"
              desc="初回読み込み後はオフライン動作。回線が不安定な球場でも止まりません。"
            />
            <Reason
              title="CSVで一括登録"
              desc="背番号・打順・守備のサンプルCSVをDLボタンから取得。Excelで編集して読込ですぐスタメン完成。"
            />
            <Reason
              title="本番中の修正も自由"
              desc="表示位置はドラッグで微調整、チームカラーはHEXコード入力＋コピペ対応。"
            />
          </div>
        </div>

        {/* 表示できる要素 */}
        <div className="mb-14">
          <h2 className="text-xl font-bold mb-1 tracking-tight">表示できるオーバーレイ要素</h2>
          <p className="text-slate-500 text-xs mb-5">
            必要なものだけON、不要なものはOFFでスッキリ画面に。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <FeatureCard title="ミニスコア" desc="左上の小型2行スコア。試合中の常設表示向け。" />
            <FeatureCard title="現在の打者" desc="打順・守備・背番号・名前を中継風ロワーサードで表示。" />
            <FeatureCard title="スタメン一覧" desc="DH制（あり/なし/二刀流）対応。両チーム並列表示も可能。" />
            <FeatureCard title="大会名" desc="大会名・副題・対戦カード・会場・日付。試合前のオープニング向け。" />
            <FeatureCard title="大型スコア" desc="中継切替時の大判スコア。チーム色フルバンド + 大きな数字。" />
            <FeatureCard title="イニング別スコア" desc="9回基本＋延長12回まで自動拡張。R列強調。" />
            <FeatureCard title="状況パネル" desc="イニング表記＋スコア＋走者ダイヤ＋BSO（緑のグラウンド地）を1セットで。" />
            <FeatureCard title="代打 / 速報テロップ" desc="代打選手の発表表示と、自由テロップ。" />
          </div>
        </div>

        {/* OBS セットアップガイド */}
        <div className="mb-14">
          <h2 className="text-xl font-bold mb-1 tracking-tight">OBS セットアップ</h2>
          <p className="text-slate-500 text-xs mb-5">2ステップで完了します。</p>
          <div className="space-y-4 text-sm">
            <a
              href="guide.html"
              className="block bg-[#538bb0]/10 hover:bg-[#538bb0]/20 border-2 border-[#538bb0] rounded-xl p-5 transition-colors text-center"
            >
              <span className="text-[#538bb0] font-bold text-lg block mb-1">
                スクリーンショット付き 詳細ガイド
              </span>
              <span className="text-slate-400 text-sm">
                操作デモ動画つき・初めての方はこちらから →
              </span>
            </a>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <h3 className="font-bold text-[#538bb0] mb-2">
                Step 1: カスタムドックを追加（コントロール画面）
              </h3>
              <p className="text-slate-300 mb-2">
                OBS の「<strong className="text-white">ドック</strong>」→「<strong className="text-white">カスタムブラウザドック</strong>」で以下を設定：
              </p>
              <ul className="text-slate-400 space-y-1 ml-4">
                <li>
                  ・ ドック名:{' '}
                  <code className="bg-slate-700 px-1.5 py-0.5 rounded text-xs text-slate-200">yakyuu-hito</code>
                </li>
                <li>
                  ・ URL:{' '}
                  <code className="bg-slate-700 px-1.5 py-0.5 rounded text-xs text-slate-200">{baseUrl}#/control</code>
                </li>
              </ul>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <h3 className="font-bold text-amber-300 mb-2">
                Step 2: ブラウザソースを追加（オーバーレイ）
              </h3>
              <p className="text-slate-300 mb-2">OBS の「ソース」→「ブラウザ」で以下を設定：</p>
              <ul className="text-slate-400 space-y-1 ml-4">
                <li>
                  ・ URL:{' '}
                  <code className="bg-slate-700 px-1.5 py-0.5 rounded text-xs text-slate-200">{baseUrl}#/overlay</code>
                </li>
                <li>
                  ・ 幅: <strong className="text-white">1920</strong>　高さ:{' '}
                  <strong className="text-white">1080</strong>
                </li>
                <li>
                  ・ カスタムCSS: <strong className="text-red-400">空欄にする</strong>（OBS デフォルトを削除）
                </li>
              </ul>
            </div>
            <p className="text-amber-300/80 text-xs">
              ※ カスタムドックとブラウザソースは OBS 内で同じブラウザエンジン（CEF）を共有するため、リアルタイム同期が可能です。Chrome 等の外部ブラウザでは同期できません。
            </p>
          </div>
        </div>

        {/* 更新履歴 */}
        <div className="mb-14">
          <h2 className="text-xl font-bold mb-5 tracking-tight">更新履歴</h2>
          <div className="space-y-4 text-sm">
            <ChangelogEntry version="v0.4.0-alpha" date="2026-04-23 〜 開発中">
              <p className="text-slate-300 mb-2">
                株式会社ひと 大学野球配信向けに{' '}
                <a
                  href="https://github.com/tsubasagit/yakyuu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#538bb0] hover:underline"
                >
                  tsubasagit/yakyuu
                </a>{' '}
                v0.3.0 から分岐し、学生運用向けに最適化。
              </p>
              <p className="text-emerald-400 text-xs font-bold mb-1">主な変更</p>
              <ul className="text-slate-400 space-y-0.5 ml-3 text-xs">
                <li>・ オーバーレイ全体をプロ野球中継風にリファイン</li>
                <li>・ 必須4要素（BSO・スコアボード・打者名・スタメン）を個別ON/OFF・ドラッグ配置</li>
                <li>・ DH制モード切替（DHあり/なし/二刀流）と両チーム並列スタメン表示</li>
                <li>・ 状況パネルを青地ベース＋緑のグラウンド地（BSO/ダイヤ）で視認性UP</li>
                <li>・ チームカラーHEX入力 + コピー対応、デフォルト黒</li>
                <li>・ サンプルCSVダウンロード + 列ヘッダ表示で取込みをシンプル化</li>
                <li>・ 代打入力を選手名のみに簡素化（攻撃中チーム自動採用）</li>
                <li>・ 日本語フォントを Inter + Noto Sans JP に統一</li>
                <li>・ 不要機能（マスコット・経過ログ・経過時間タイマー・詳細スタッツ）を削除</li>
              </ul>
            </ChangelogEntry>
            <ChangelogEntry version="v0.3.0" date="2026-04-17 (派生元 yakyuu)">
              <p className="text-slate-300">
                両チーム打順の同時オーバーレイ表示トグル。yakyuu-hitoの基盤。
              </p>
            </ChangelogEntry>
            <ChangelogEntry version="v0.1.0" date="2026-03-17 (派生元 yakyuu)">
              <p className="text-slate-300">
                初回リリース。スコアボード・BSO・走者・打順カード・BroadcastChannel同期。
              </p>
            </ChangelogEntry>
          </div>
        </div>

        {/* 問い合わせ CTA */}
        <div className="mb-14">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-[#538bb0]/30 rounded-xl p-6 text-center">
            <h2 className="text-lg font-bold text-[#538bb0] mb-2">大学野球配信のご相談</h2>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              本ツールは株式会社ひとが大学野球オンライン配信のために運用しています。<br />
              配信導入・カスタマイズ等のご相談は株式会社ひとまでお気軽にお問い合わせください。
            </p>
            <a
              href={HITO_SITE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#538bb0] hover:bg-[#3d6f94] text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              株式会社ひと 公式サイト →
            </a>
          </div>
        </div>

        {/* 技術スタック（控えめに最後） */}
        <details className="mb-10 group">
          <summary className="cursor-pointer text-slate-400 text-xs hover:text-white transition-colors list-none flex items-center justify-center gap-2">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            技術スタックを見る
          </summary>
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Zustand', 'BroadcastChannel API', 'GitHub Pages'].map((tech) => (
              <span
                key={tech}
                className="bg-slate-800 border border-slate-600 text-slate-300 text-xs px-3 py-1 rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
        </details>

        {/* フッター */}
        <div className="text-center text-slate-500 text-sm border-t border-slate-700 pt-6 space-y-1">
          <p>
            <a href={HITO_SITE} target="_blank" rel="noopener noreferrer" className="text-[#538bb0] hover:underline">
              株式会社ひと
            </a>
          </p>
          <p className="text-xs">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-[#538bb0] hover:underline"
            >
              GitHub
            </a>
            {' / '}
            <a
              href={`${REPO_URL}/issues/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-[#538bb0] hover:underline"
            >
              ご質問・不具合報告
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

function Reason({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="text-amber-300 text-base font-bold mb-1">{title}</div>
      <div className="text-slate-300 text-xs leading-relaxed">{desc}</div>
    </div>
  )
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
      <div className="text-white font-bold text-sm mb-1">{title}</div>
      <div className="text-slate-400 text-xs leading-relaxed">{desc}</div>
    </div>
  )
}

function ChangelogEntry({
  version,
  date,
  children,
}: {
  version: string
  date: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#538bb0] font-bold">{version}</span>
        <span className="text-slate-500 text-xs">{date}</span>
      </div>
      {children}
    </div>
  )
}
