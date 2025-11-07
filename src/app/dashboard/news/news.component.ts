import { Component, OnInit, Output, EventEmitter } from '@angular/core';

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  sourceIcon: string;
  timestamp: Date;
  summary: string;
  imageUrl?: string;
  relatedSymbols: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  url: string;
  isBookmarked: boolean;
  views: number;
}

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit {
  @Output() closeOverlay = new EventEmitter<void>();
  @Output() symbolClicked = new EventEmitter<string>();

  isVisible = false;
  activeFilter = 'all';
  searchQuery = '';
  selectedCategory = 'all';

  categories = ['all', 'markets', 'stocks', 'crypto', 'forex', 'commodities', 'economics'];

  newsArticles: NewsArticle[] = [
    {
      id: '1',
      title: 'Federal Reserve Signals Potential Rate Cut in Q4 Amid Cooling Inflation',
      source: 'Reuters',
      sourceIcon: '📰',
      timestamp: new Date(Date.now() - 30 * 60000),
      summary: 'The Federal Reserve indicated a potential shift in monetary policy as inflation shows signs of cooling. Market analysts expect a 25 basis point cut...',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
      relatedSymbols: ['SPY', 'QQQ', 'DIA'],
      sentiment: 'positive',
      category: 'economics',
      url: '#',
      isBookmarked: false,
      views: 12543
    },
    {
      id: '2',
      title: 'Tech Giants Rally as AI Spending Shows No Signs of Slowing Down',
      source: 'Bloomberg',
      sourceIcon: '📊',
      timestamp: new Date(Date.now() - 90 * 60000),
      summary: 'Major technology companies continue to invest heavily in artificial intelligence infrastructure, driving stock prices higher across the sector...',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
      relatedSymbols: ['AAPL', 'MSFT', 'NVDA', 'GOOGL'],
      sentiment: 'positive',
      category: 'stocks',
      url: '#',
      isBookmarked: true,
      views: 8932
    },
    {
      id: '3',
      title: 'Oil Prices Surge 5% on Middle East Supply Concerns',
      source: 'CNBC',
      sourceIcon: '📈',
      timestamp: new Date(Date.now() - 120 * 60000),
      summary: 'Crude oil futures jumped sharply in early trading as geopolitical tensions in the Middle East raise concerns about potential supply disruptions...',
      relatedSymbols: ['USO', 'XLE'],
      sentiment: 'negative',
      category: 'commodities',
      url: '#',
      isBookmarked: false,
      views: 15221
    },
    {
      id: '4',
      title: 'Bitcoin Breaks $65,000 as Institutional Adoption Accelerates',
      source: 'CoinDesk',
      sourceIcon: '₿',
      timestamp: new Date(Date.now() - 180 * 60000),
      summary: 'Bitcoin surged past $65,000 for the first time in six months, driven by renewed institutional interest and the approval of several spot Bitcoin ETFs...',
      imageUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=250&fit=crop',
      relatedSymbols: ['BTC', 'ETH'],
      sentiment: 'positive',
      category: 'crypto',
      url: '#',
      isBookmarked: false,
      views: 22156
    },
    {
      id: '5',
      title: 'European Markets Close Lower on Recession Fears',
      source: 'Financial Times',
      sourceIcon: '🌍',
      timestamp: new Date(Date.now() - 240 * 60000),
      summary: 'European stock indices ended the session in negative territory as weak manufacturing data fueled concerns about an economic slowdown across the region...',
      relatedSymbols: ['EWG', 'EWU', 'EWI'],
      sentiment: 'negative',
      category: 'markets',
      url: '#',
      isBookmarked: false,
      views: 6843
    },
    {
      id: '6',
      title: 'Dollar Weakens Against Major Currencies on Fed Dovish Comments',
      source: 'Wall Street Journal',
      sourceIcon: '💱',
      timestamp: new Date(Date.now() - 300 * 60000),
      summary: 'The U.S. dollar fell to a three-month low against a basket of major currencies following dovish remarks from Federal Reserve officials...',
      relatedSymbols: ['DXY', 'EUR/USD', 'GBP/USD'],
      sentiment: 'negative',
      category: 'forex',
      url: '#',
      isBookmarked: true,
      views: 4521
    }
  ];

  filteredArticles: NewsArticle[] = [];

  ngOnInit() {
    this.filterArticles();
  }

  show() {
    this.isVisible = true;
  }

  hide() {
    this.isVisible = false;
    this.closeOverlay.emit();
  }

  filterArticles() {
    let articles = this.newsArticles;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      articles = articles.filter(a => a.category === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      articles = articles.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.summary.toLowerCase().includes(query) ||
        a.relatedSymbols.some(s => s.toLowerCase().includes(query))
      );
    }

    // Filter by active filter
    if (this.activeFilter === 'bookmarked') {
      articles = articles.filter(a => a.isBookmarked);
    } else if (this.activeFilter === 'trending') {
      articles = articles.sort((a, b) => b.views - a.views);
    }

    this.filteredArticles = articles;
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.filterArticles();
  }

  setCategory(category: string) {
    this.selectedCategory = category;
    this.filterArticles();
  }

  onSearchChange() {
    this.filterArticles();
  }

  toggleBookmark(article: NewsArticle) {
    article.isBookmarked = !article.isBookmarked;
    // Here you would typically call a service to persist this
  }

  getSentimentClass(sentiment: string): string {
    return `sentiment-${sentiment}`;
  }

  getSentimentIcon(sentiment: string): string {
    switch(sentiment) {
      case 'positive': return '📈';
      case 'negative': return '📉';
      default: return '➖';
    }
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  onSymbolClick(symbol: string) {
    this.symbolClicked.emit(symbol);
    this.hide();
  }

  openArticle(article: NewsArticle) {
    article.views++;
    window.open(article.url, '_blank');
  }
  
}