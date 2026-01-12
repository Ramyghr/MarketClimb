// Interfaces pour les modèles de données

export enum SentimentLabel {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral'
}

export enum TradingSignal {
  STRONG_BUY = 'strong_buy',
  BUY = 'buy',
  HOLD = 'hold',
  SELL = 'sell',
  STRONG_SELL = 'strong_sell'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EXTREME = 'extreme'
}

export interface SentimentScore {
  label: SentimentLabel;
  score: number;
  keyword_sentiment?: number;
  ai_confidence?: number;
  volume_indicator?: number;
}

export interface NewsArticle {
  title: string;
  description?: string;
  content?: string;
  source: string;
  url: string;
  published_at: string;
  author?: string;
  image_url?: string;
}

export interface SentimentAnalysis {
  article: NewsArticle;
  sentiment: SentimentScore;
  keywords: string[];
  entities: string[];
}

export interface MarketSentimentSummary {
  overall_sentiment: SentimentLabel;
  confidence: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  total_articles: number;
  timestamp: string;
  trending_topics: string[];
  sentiment_momentum?: number;
  market_fear_greed?: number;
  volatility_index?: number;
  trading_signal?: TradingSignal;
  risk_level?: RiskLevel;
  recommendation?: string;
}

export interface TrendAnalysis {
  topic: string;
  sentiment_trend: SentimentScore[];
  article_count: number;
  time_period: string;
  momentum: number;
  social_volume?: number;
  price_correlation?: number;
  emerging_score?: number;
}

export interface MarketIndicator {
  name: string;
  value: number;
  sentiment_influence: number;
  timestamp: string;
  description?: string;
}

export interface SentimentRequest {
  text: string;
}

export interface SentimentResponse {
  text: string;
  sentiment: SentimentScore;
  keywords: string[];
  processed_at: string;
}
