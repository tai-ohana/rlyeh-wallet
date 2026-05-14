import type { UserTier } from './types'

export interface WalletProduct {
  id: string
  tier: UserTier
  name: string
  description: string
  priceYen: number
  isOneTime: boolean
  isAvailable: boolean
  features: string[]
  highlighted?: boolean
}

// 現行プロダクト定義（買い切りモデル）
export const WALLET_PRODUCTS: WalletProduct[] = [
  {
    id: 'free',
    tier: 'free',
    name: '無料',
    description: '基本機能をすべて無料で',
    priceYen: 0,
    isOneTime: false,
    isAvailable: true,
    features: [
      'セッション記録（無制限）',
      '画像アップロード（5枚/1200px）',
      '関連リンク（5個）',
      '感想メモ（500文字）',
      'フォロー・フレンド機能',
      'シナリオ希望設定（各5件）',
    ],
  },
  {
    id: 'wallet-oneoff',          // Stripe の Price ID に合わせる
    tier: 'pro',
    name: 'ウォレット',
    description: '一度買えばずっと使える',
    priceYen: 980,
    isOneTime: true,
    isAvailable: true,
    highlighted: true,
    features: [
      '無料プランの全機能',
      '画像アップロード（無制限/2400px）',
      '関連リンク（無制限）',
      '感想メモ（無制限・Markdown対応）',
      'フォロー・フレンド（無制限）',
      'カスタムタグ（5個）・フォルダ整理',
      'プライベートノート',
      'データエクスポート',
      'シナリオ希望設定（各30件）',
      'ウォレットバッジ表示',
      '広告非表示',
    ],
  },
  {
    id: 'streamer',
    tier: 'streamer',
    name: '配信者プラン',
    description: 'TRPGストリーマー向け（準備中）',
    priceYen: 0,
    isOneTime: false,
    isAvailable: false,           // 未販売
    features: [
      'ウォレットの全機能',
      'YouTube動画埋め込み',
      'カスタムプロフィールURL',
      'ヘッダー画像・ミニキャラクター',
      'カスタムカラーテーマ',
      '視聴者コメント受付',
      '配信者バッジ表示',
    ],
  },
]

export function getProductByTier(tier: UserTier): WalletProduct | undefined {
  return WALLET_PRODUCTS.find(p => p.tier === tier)
}

export function getProductById(id: string): WalletProduct | undefined {
  return WALLET_PRODUCTS.find(p => p.id === id)
}

export function getAvailableProducts(): WalletProduct[] {
  return WALLET_PRODUCTS.filter(p => p.isAvailable)
}

// --- 後方互換エイリアス（旧コードが SubscriptionProduct を参照している場合）---
/** @deprecated WalletProduct を使ってください */
export type SubscriptionProduct = WalletProduct
/** @deprecated WALLET_PRODUCTS を使ってください */
export const SUBSCRIPTION_PRODUCTS = WALLET_PRODUCTS
