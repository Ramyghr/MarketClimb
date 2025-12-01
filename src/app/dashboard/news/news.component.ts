import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

interface NewsArticle {
  id: string | number;
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
  likeCount?: number;
}

interface ApiResponse {
  items: any[];
  total: number;
  page: number;
  size: number;
  pages: number;
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
  loading = false;
  loadingMore = false;
  hasMore = true;
  isRefreshing = false;

  activeFilter: 'all' | 'trending' | 'bookmarked' = 'all';
  selectedCategory = 'all';
  searchQuery = '';
  private searchSubject = new Subject<string>();

  categories = ['all', 'markets', 'stocks', 'crypto', 'forex', 'commodities', 'economics'];

  articles: NewsArticle[] = [];
  page = 0;
  size = 15;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.setupSearchDebounce();
  }

  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery = query.trim();
      this.resetAndLoad();
    });
  }

  show() {
    this.isVisible = true;
    if (this.articles.length === 0) this.resetAndLoad();
  }

  hide() {
    this.isVisible = false;
    this.closeOverlay.emit();
  }

  // Bouton Refresh
  refreshNews() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    this.http.post(`${environment.apiUrl}/news/refresh`, {}).subscribe({
      next: () => {
        this.resetAndLoad(); // Recharge tout de suite
      },
      error: (err) => {
        console.error('Refresh failed:', err);
      },
      complete: () => {
        setTimeout(() => this.isRefreshing = false, 1000);
      }
    });
  }

  private resetAndLoad() {
    this.page = 0;
    this.articles = [];
    this.hasMore = true;
    this.loadArticles();
  }

  loadArticles(append = false) {
    if ((this.loading || this.loadingMore) && !append) return;
    if (!this.hasMore && append) return;

    this.loading = !append;
    this.loadingMore = append;

    let params = new HttpParams()
      .set('page', this.page.toString())
      .set('size', this.size.toString())
      .set('sort_by', this.activeFilter === 'trending' ? 'like_count' : 'published_at');

    if (this.selectedCategory !== 'all') {
      params = params.set('category', this.selectedCategory);
    }
    if (this.searchQuery) {
      params = params.set('q', this.searchQuery);
    }

    this.http.get<ApiResponse>(`${environment.apiUrl}/news/`, { params }).subscribe({
      next: (res) => {
        const newArticles: NewsArticle[] = (res.items || []).map((a: any) => ({
          id: a.id,
          title: a.title || 'Untitled',
          source: a.source || 'Unknown Source',
          sourceIcon: this.getSourceIcon(a.source || ''),
          timestamp: new Date(a.published_at),
          summary: a.summary || a.content?.slice(0, 180) + '...' || 'No summary available.',
          imageUrl: a.url_to_image || '',
          relatedSymbols: a.symbol ? [a.symbol] : [],
          sentiment: (a.sentiment || 'neutral').toLowerCase() as 'positive' | 'negative' | 'neutral',
          category: this.mapTopicToCategory(a.topics || 'general'),
          url: a.url || '#',
          isBookmarked: !!a.liked,
          views: a.view_count || Math.floor(Math.random() * 40000) + 5000,
          likeCount: a.like_count || 0
        }));

        this.articles = append ? [...this.articles, ...newArticles] : newArticles;
        this.hasMore = this.articles.length < res.total;
        this.page++;
      },
      error: (err) => {
        console.error('Failed to load news:', err);
        this.hasMore = false;
      },
      complete: () => {
        this.loading = false;
        this.loadingMore = false;
      }
    });
  }

  // Infinite scroll
  onScroll() {
    const feed = document.querySelector('.news-feed') as HTMLElement;
    if (!feed) return;

    const trigger = feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 800;
    if (trigger && !this.loadingMore && this.hasMore) {
      this.loadArticles(true);
    }
  }

  setFilter(filter: 'all' | 'trending' | 'bookmarked') {
    this.activeFilter = filter;
    this.resetAndLoad();
  }

  setCategory(category: string) {
    this.selectedCategory = category;
    this.resetAndLoad();
  }

  onSearchInput(value: string) {
    this.searchSubject.next(value);
  }

  toggleBookmark(article: NewsArticle) {
    const previous = article.isBookmarked;
    article.isBookmarked = !previous;

    this.http.post(`${environment.apiUrl}/news/${article.id}/like`, {}).subscribe({
      error: () => {
        article.isBookmarked = previous; // revert
      }
    });
  }

  // Helpers
  private getSourceIcon(source: string): string {
    const map: Record<string, string> = {
      'CoinDesk': 'B', 'Bloomberg': 'B', 'Reuters': 'R', 'CNBC': 'C',
      'Financial Times': 'FT', 'Wall Street Journal': 'WSJ'
    };
    return map[source] || source.charAt(0).toUpperCase() || 'N';
  }

  getSentimentClass(sentiment: string): string {
    return `sentiment-${sentiment}`;
  }

  getSentimentIcon(sentiment: string): string {
    switch (sentiment) {
      case 'positive': return 'Up';
      case 'negative': return 'Down';
      default: return 'Neutral';
    }
  }

  private mapTopicToCategory(topics: string): string {
    const lower = (topics || '').toLowerCase();
    if (lower.includes('crypto') || lower.includes('bitcoin')) return 'crypto';
    if (lower.includes('stock') || lower.includes('earnings')) return 'stocks';
    if (lower.includes('fed') || lower.includes('inflation')) return 'economics';
    if (lower.includes('oil') || lower.includes('gold')) return 'commodities';
    if (lower.includes('eur') || lower.includes('usd')) return 'forex';
    return 'markets';
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
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
    if (article.url && article.url !== '#') {
      window.open(article.url, '_blank');
    }
  }

  trackById = (index: number, article: NewsArticle): any => article.id;
}