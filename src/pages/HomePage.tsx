import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CircleDot,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  ListOrdered,
  MailQuestion,
  Maximize2,
  Megaphone,
  MonitorCheck,
  Move,
  MousePointerClick,
  Settings2,
  Shield,
  Trophy,
  Tv,
  Undo2,
  User,
  WifiOff,
} from 'lucide-react'
import { LINEUP_CSV_SAMPLE } from '../lib/csvImport'

const HITO_LOGO = 'https://hito-inc.jp/wp-content/uploads/2023/10/header_title_20231020x.png'
const HITO_SITE = 'https://hito-inc.jp/'

/** ダウンロード用サンプルCSVの静的ファイルURL（コントロール画面と共通） */
const SAMPLE_CSV_URL = `${import.meta.env.BASE_URL}lineup_sample.csv`

/** LINEUP_CSV_SAMPLE（ヘッダー＋10行）を表テーブル描画用にパースする。末尾の空行は除外。 */
const SAMPLE_CSV_ROWS = LINEUP_CSV_SAMPLE.split('\n')
  .filter((line) => line.trim().length > 0)
  .map((line) => line.split(','))

/**
 * 株式会社ひと 大学野球配信向けトップページ。
 * 白基調 + ブランドカラー（青 #538bb0 / オレンジ #f97316）。
 */
export default function HomePage() {
  const baseUrl = window.location.origin + window.location.pathname

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* ヘッダーバナー */}
        <div className="flex items-center justify-between gap-3 mb-10">
          <a
            href={HITO_SITE}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-70 transition-opacity"
            title="株式会社ひと 公式サイト"
          >
            <img src={HITO_LOGO} alt="株式会社ひと" className="h-7 w-auto" />
          </a>
          <span className="text-slate-500 text-xs tracking-widest">
            v1.0
          </span>
        </div>

        {/* ヒーロー */}
        <div className="text-center mb-10">
          <p className="text-[#538bb0] text-base tracking-[0.3em] mb-4 font-bold">
            株式会社ひと 大学野球配信オーバーレイ
          </p>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight leading-[1.1] text-slate-900">
            初めての配信でも、<br />迷わない。
          </h1>
          <p className="text-slate-700 text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto font-medium">
            学生スタッフ <span className="text-[#f97316] font-bold text-3xl">1人</span> で
            操作できる、<br className="hidden md:inline" />
            大学野球専用のスコアボード。
          </p>
        </div>

        {/* ヒーロー画像 */}
        <div className="mb-12">
          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-white">
            <img
              src="images/hero-stadium.jpg"
              alt="試合中のオーバーレイ表示イメージ：帝都大学 vs 早凌大学"
              className="w-full block"
              loading="lazy"
            />
          </div>
          <p className="text-slate-500 text-sm text-center mt-3">
            ▲ 試合中のオーバーレイ表示イメージ（球場映像にスコア・スタメン・BSOを重ねて配信）
          </p>
        </div>

        {/* 入口リンク（外部URL風の巨大アクションボタン） */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
          <a
            href="#/control"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block bg-white hover:bg-[#538bb0]/[0.04] border-2 border-[#538bb0] rounded-2xl p-7 transition-all shadow-md hover:shadow-[0_12px_32px_rgba(83,139,176,0.30)] hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="bg-[#538bb0] rounded-xl p-3.5 shadow-md">
                <Settings2 className="w-7 h-7 text-white" strokeWidth={2.25} />
              </div>
              <span className="inline-flex items-center gap-1 bg-[#538bb0]/10 text-[#538bb0] text-[11px] font-bold px-2.5 py-1 rounded-full">
                <ExternalLink className="w-3 h-3" />
                新しいタブで開く
              </span>
            </div>
            <div className="text-sm text-[#538bb0] font-bold mb-1.5 tracking-wider">
              操作する人へ
            </div>
            <h2 className="text-3xl font-bold mb-2 text-slate-900">コントロールパネル</h2>
            <p className="text-slate-600 text-base leading-relaxed mb-4">
              スコア・カウント・選手の操作画面
              <span className="block text-slate-500 text-sm mt-0.5">OBSカスタムドック用URL</span>
            </p>
            <div className="flex items-center justify-between bg-slate-900 text-slate-100 rounded-lg px-3 py-2.5 font-mono text-xs">
              <span className="truncate">{baseUrl}#/control</span>
              <ArrowUpRight className="w-4 h-4 text-[#538bb0] shrink-0 ml-2 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-[#538bb0] rounded-b-2xl" />
          </a>

          <a
            href="#/overlay"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block bg-white hover:bg-[#f97316]/[0.04] border-2 border-[#f97316] rounded-2xl p-7 transition-all shadow-md hover:shadow-[0_12px_32px_rgba(249,115,22,0.30)] hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="bg-[#f97316] rounded-xl p-3.5 shadow-md">
                <Tv className="w-7 h-7 text-white" strokeWidth={2.25} />
              </div>
              <span className="inline-flex items-center gap-1 bg-[#f97316]/10 text-[#f97316] text-[11px] font-bold px-2.5 py-1 rounded-full">
                <ExternalLink className="w-3 h-3" />
                新しいタブで開く
              </span>
            </div>
            <div className="text-sm text-[#f97316] font-bold mb-1.5 tracking-wider">
              OBSに取り込む画面
            </div>
            <h2 className="text-3xl font-bold mb-2 text-slate-900">オーバーレイ</h2>
            <p className="text-slate-600 text-base leading-relaxed mb-4">
              透明背景のスコアボード
              <span className="block text-slate-500 text-sm mt-0.5">OBSブラウザソース用URL / 1920×1080</span>
            </p>
            <div className="flex items-center justify-between bg-slate-900 text-slate-100 rounded-lg px-3 py-2.5 font-mono text-xs">
              <span className="truncate">{baseUrl}#/overlay</span>
              <ArrowUpRight className="w-4 h-4 text-[#f97316] shrink-0 ml-2 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-[#f97316] rounded-b-2xl" />
          </a>
        </div>

        {/* 学生スタッフ向け安心ポイント */}
        <div className="mb-16">
          <SectionHeader
            label="WHY"
            title="安心して使える理由"
            subtitle="初心者を取り残さない設計を最優先しました。"
            accent="orange"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Reason
              icon={<MousePointerClick />}
              title="1クリックON/OFF"
              desc="表示要素ごとに大きなトグルボタン。色帯で「下のどのセクションが操作元か」が視覚で分かります。"
            />
            <Reason
              icon={<Undo2 />}
              title="間違えてもすぐ戻せる"
              desc="カウント・走者・打順は ±1 / 戻すボタン完備。「次の打者」「前の打者」も1タップ。"
            />
            <Reason
              icon={<Database />}
              title="OBS再起動でも消えない"
              desc="状態は localStorage + IndexedDB に二重保存。試合途中で OBS が落ちても復元します。"
            />
            <Reason
              icon={<WifiOff />}
              title="ネット切断にも強い"
              desc="初回読み込み後はオフライン動作。回線が不安定な球場でも止まりません。"
            />
            <Reason
              icon={<FileSpreadsheet />}
              title="CSVで一括登録"
              desc="順番・名前・守備＋学年・コメントのシンプルCSV。Excelで編集して読込ですぐスタメン完成。"
            />
            <Reason
              icon={<Move />}
              title="本番中の修正も自由"
              desc="表示位置はドラッグで微調整、チームカラーはHEXコード入力＋コピペ対応。"
            />
          </div>
        </div>

        {/* サンプルCSV（そのまま掲載） */}
        <div className="mb-16">
          <SectionHeader
            label="CSV SAMPLE"
            title="スタメン登録用サンプルCSV"
            subtitle="この内容をそのまま Excel に貼り付け・編集して読み込めばスタメン完成です。"
            accent="primary"
          />

          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
            {/* 見出しバー＋ダウンロード */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-700">
                <FileSpreadsheet className="w-5 h-5 text-[#538bb0]" />
                <code className="text-sm font-mono text-slate-800">lineup_sample.csv</code>
              </div>
              <a
                href={SAMPLE_CSV_URL}
                download="lineup_sample.csv"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#538bb0] hover:bg-[#3d6f94] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                ダウンロード
              </a>
            </div>

            {/* CSVをそのままテーブル表示 */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#538bb0]/10 text-[#538bb0]">
                    {SAMPLE_CSV_ROWS[0]!.map((cell, i) => (
                      <th
                        key={i}
                        className="text-left font-bold px-3 py-2 border-b border-slate-200 whitespace-nowrap"
                      >
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_CSV_ROWS.slice(1).map((row, r) => (
                    <tr key={r} className="odd:bg-white even:bg-slate-50">
                      {SAMPLE_CSV_ROWS[0]!.map((_, c) => (
                        <td
                          key={c}
                          className="px-3 py-1.5 border-b border-slate-100 text-slate-700 whitespace-nowrap"
                        >
                          {row[c] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 原文（テキストそのまま） */}
            <pre className="bg-slate-900 text-slate-100 text-xs md:text-sm font-mono leading-relaxed px-4 py-3 overflow-x-auto border-t border-slate-200">
{LINEUP_CSV_SAMPLE.trimEnd()}
            </pre>
          </div>

          <ul className="mt-4 space-y-1.5 text-slate-600 text-sm">
            <li>・1〜9行目が野手、10行目が投手です（DH制あり／なしに対応）。</li>
            <li>・<strong className="text-slate-800">守備</strong>は <code className="bg-slate-100 px-1 rounded">投・捕・一・二・三・遊・左・中・右・DH</code> から指定。</li>
            <li>・<strong className="text-slate-800">学年・コメント</strong>は任意（空欄可）。コメントは打者テロップに表示されます。</li>
          </ul>
        </div>

        {/* 表示できる要素 */}
        <div className="mb-16">
          <SectionHeader
            label="FEATURES"
            title="表示できるオーバーレイ要素"
            subtitle="必要なものだけON、不要なものはOFFでスッキリ画面に。"
            accent="primary"
          />

          {/* 要素サンプル一覧（ビジュアル） */}
          <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <img
              src="images/manual-elements.png"
              alt="オーバーレイ要素サンプル：ミニスコア・対戦カード・大型スコア・スタメン一覧・イニング別スコア・投手/打者カード・BSOパネル"
              className="w-full block"
              loading="lazy"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FeatureCard icon={<BarChart3 />} title="ミニスコア" desc="左上の小型2行スコア。試合中の常設表示向け。" />
            <FeatureCard icon={<User />} title="現在の打者" desc="打順・守備・名前を中継風ロワーサードで表示。" />
            <FeatureCard icon={<ListOrdered />} title="スタメン一覧" desc="DH制（あり/なし）対応。両チーム並列表示も可能。" />
            <FeatureCard icon={<Trophy />} title="大会名" desc="大会名・副題・対戦カード・会場・日付。試合前のオープニング向け。" />
            <FeatureCard icon={<Maximize2 />} title="大型スコア" desc="中継切替時の大判スコア。チーム色フルバンド + 大きな数字。" />
            <FeatureCard icon={<BarChart3 />} title="イニング別スコア" desc="9回基本＋延長15回まで自動拡張。R列強調。" />
            <FeatureCard icon={<CircleDot />} title="BSOパネル" desc="イニング表記＋スコア＋走者ダイヤ＋BSO（緑のグラウンド地）を1セットで。" />
            <FeatureCard icon={<Megaphone />} title="代打 / 速報テロップ" desc="代打選手の発表表示と、自由テロップ。" />
          </div>
        </div>

        {/* OBS セットアップガイド */}
        <div className="mb-16">
          <SectionHeader
            label="SETUP"
            title="OBS セットアップ"
            subtitle="2ステップで完了します。"
            accent="primary"
          />

          {/* 推奨環境（2026-06-09 顧客フィードバック①: Win・Mac 検証結果を表記） */}
          <div className="mb-6 flex items-start gap-3 bg-[#538bb0]/5 border border-[#538bb0]/30 rounded-lg p-4">
            <MonitorCheck className="w-5 h-5 text-[#538bb0] shrink-0 mt-0.5" />
            <div className="text-slate-700 text-sm leading-relaxed">
              <span className="font-bold text-slate-900">推奨環境：OBS Studio ver31 以上</span>
              <span className="block text-slate-600 mt-0.5">
                Windows・Mac の両方で動作確認済みです。ver31 未満では正しく表示されない場合があります。
              </span>
            </div>
          </div>

          {/* 全体ワークフロー図 */}
          <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
            <img
              src="images/manual-workflow.jpg"
              alt="操作方法：コントロールパネル→OBS Studio→YouTube Live の3ステップ"
              className="w-full block"
              loading="lazy"
            />
          </div>

          <a
            href="guide.html"
            className="group flex items-center justify-between gap-4 bg-[#538bb0]/5 hover:bg-[#538bb0]/10 border-2 border-[#538bb0] rounded-xl p-5 mb-5 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#538bb0] rounded-lg p-3 shrink-0">
                <Tv className="w-6 h-6 text-white" strokeWidth={2.25} />
              </div>
              <div>
                <div className="text-[#538bb0] font-bold text-lg md:text-xl">
                  スクリーンショット付き 詳細ガイド
                </div>
                <div className="text-slate-600 text-sm md:text-base mt-0.5">
                  操作デモ動画つき・初めての方はこちらから
                </div>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-[#538bb0] shrink-0 group-hover:translate-x-1 transition-transform" />
          </a>

          <div className="space-y-4">
            <StepCard
              stepNum={1}
              accent="primary"
              title="カスタムドックを追加（コントロール画面）"
              description={
                <>
                  OBS の「<strong className="text-slate-900">ドック</strong>」→
                  「<strong className="text-slate-900">カスタムブラウザドック</strong>」で以下を設定：
                </>
              }
              items={[
                { label: 'ドック名', value: '大学野球テロップ' },
                { label: 'URL', value: `${baseUrl}#/control` },
              ]}
            />
            <StepCard
              stepNum={2}
              accent="orange"
              title="ブラウザソースを追加（オーバーレイ）"
              description={<>OBS の「ソース」→「ブラウザ」で以下を設定：</>}
              items={[
                { label: 'URL', value: `${baseUrl}#/overlay` },
                { label: '幅 × 高さ', value: '1920 × 1080' },
                { label: 'カスタムCSS', value: '空欄にする（OBSデフォルトを削除）', warn: true },
              ]}
            />
          </div>

          <div className="mt-5 flex items-start gap-3 bg-[#f97316]/5 border border-[#f97316]/30 rounded-lg p-4">
            <Shield className="w-5 h-5 text-[#f97316] shrink-0 mt-0.5" />
            <p className="text-slate-700 text-sm leading-relaxed">
              カスタムドックとブラウザソースは OBS 内で同じブラウザエンジン（CEF）を共有するため、
              リアルタイム同期が可能です。Chrome 等の外部ブラウザでは同期できません。
            </p>
          </div>
        </div>

        {/* 問い合わせ CTA（強調アクセントとして濃紺グラデを残す） */}
        <div className="mb-16">
          <div className="relative bg-gradient-to-br from-[#1d3557] via-slate-800 to-slate-900 border-2 border-[#538bb0]/40 rounded-2xl p-8 text-center overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#538bb0]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-[#538bb0]/20 border border-[#538bb0]/40 rounded-full px-4 py-1.5 mb-4">
                <MailQuestion className="w-4 h-4 text-[#538bb0]" />
                <span className="text-[#538bb0] text-xs font-bold tracking-wider">CONTACT</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                大学野球配信のご相談
              </h2>
              <p className="text-slate-300 text-base md:text-lg mb-6 leading-relaxed max-w-xl mx-auto">
                本ツールは株式会社ひとが大学野球オンライン配信のために運用しています。<br className="hidden md:inline" />
                配信導入・カスタマイズ等のご相談は<br className="md:hidden" />
                株式会社ひとまでお気軽にお問い合わせください。
              </p>
              <a
                href={HITO_SITE}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 bg-[#538bb0] hover:bg-[#3d6f94] text-white font-bold px-8 py-3.5 rounded-lg transition-colors shadow-lg shadow-[#538bb0]/30"
              >
                株式会社ひと 公式サイト
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* 技術スタック（控えめに最後） */}
        <details className="mb-10 group">
          <summary className="cursor-pointer text-slate-500 text-xs hover:text-slate-900 transition-colors list-none flex items-center justify-center gap-2">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            技術スタックを見る
          </summary>
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Zustand', 'BroadcastChannel API', 'GitHub Pages'].map((tech) => (
              <span
                key={tech}
                className="bg-white border border-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
        </details>

        {/* フッター */}
        <div className="text-center border-t border-slate-200 pt-6 space-y-3">
          <p className="text-sm">
            <a href={HITO_SITE} target="_blank" rel="noopener noreferrer" className="text-[#538bb0] hover:underline font-medium">
              株式会社ひと
            </a>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <a
              href="https://hito-inc.jp/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#538bb0] transition-colors"
            >
              ご質問・不具合報告
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({
  label,
  title,
  subtitle,
  accent = 'primary',
}: {
  label: string
  title: string
  subtitle: string
  accent?: 'primary' | 'orange'
}) {
  const accentColors =
    accent === 'orange'
      ? { bar: 'bg-[#f97316]', text: 'text-[#f97316]' }
      : { bar: 'bg-[#538bb0]', text: 'text-[#538bb0]' }
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <span className={`block w-8 h-0.5 ${accentColors.bar}`} />
        <span className={`text-[10px] font-bold tracking-[0.3em] ${accentColors.text}`}>
          {label}
        </span>
      </div>
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-slate-900">{title}</h2>
      <p className="text-slate-600 text-base">{subtitle}</p>
    </div>
  )
}

function Reason({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#f97316]/60 rounded-xl p-5 transition-all shadow-sm">
      <div className="flex items-start gap-3.5">
        <div className="bg-[#f97316]/10 group-hover:bg-[#f97316]/20 border border-[#f97316]/30 rounded-lg p-2.5 shrink-0 transition-colors">
          <div className="w-6 h-6 text-[#f97316] [&>svg]:w-6 [&>svg]:h-6">{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[#f97316] text-lg font-bold mb-1.5 leading-tight">{title}</div>
          <div className="text-slate-700 text-sm leading-relaxed">{desc}</div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#538bb0]/60 rounded-xl p-5 transition-all shadow-sm">
      <div className="flex items-start gap-3.5">
        <div className="bg-[#538bb0]/10 group-hover:bg-[#538bb0]/20 border border-[#538bb0]/30 rounded-lg p-2.5 shrink-0 transition-colors">
          <div className="w-6 h-6 text-[#538bb0] [&>svg]:w-6 [&>svg]:h-6">{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-slate-900 font-bold text-base mb-1.5 leading-tight">{title}</div>
          <div className="text-slate-600 text-sm leading-relaxed">{desc}</div>
        </div>
      </div>
    </div>
  )
}

function StepCard({
  stepNum,
  accent,
  title,
  description,
  items,
}: {
  stepNum: number
  accent: 'primary' | 'orange'
  title: string
  description: React.ReactNode
  items: { label: string; value: string; warn?: boolean }[]
}) {
  const colors =
    accent === 'orange'
      ? {
          badge: 'bg-[#f97316] text-white',
          border: 'border-[#f97316]/40',
          title: 'text-[#f97316]',
          ring: 'ring-[#f97316]/20',
        }
      : {
          badge: 'bg-[#538bb0] text-white',
          border: 'border-[#538bb0]/40',
          title: 'text-[#538bb0]',
          ring: 'ring-[#538bb0]/20',
        }
  return (
    <div className={`bg-white border ${colors.border} rounded-xl p-6 ring-1 ${colors.ring} shadow-sm`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`${colors.badge} font-bold text-xl w-12 h-12 rounded-lg flex items-center justify-center shrink-0 shadow-md`}>
          {stepNum}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h3 className={`font-bold ${colors.title} text-lg md:text-xl leading-tight mb-2`}>
            {title}
          </h3>
          <p className="text-slate-700 text-base leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="space-y-2.5 ml-0 md:ml-16">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5"
          >
            <span className="text-slate-600 text-sm font-medium sm:w-32 shrink-0">
              {item.label}
            </span>
            <code
              className={`flex-1 px-3 py-1.5 rounded text-sm font-mono break-all ${
                item.warn
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-slate-900 text-slate-100 border border-slate-700'
              }`}
            >
              {item.value}
            </code>
          </div>
        ))}
      </div>
    </div>
  )
}
