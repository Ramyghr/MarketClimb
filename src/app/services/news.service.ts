import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

// ============= INTERFACES =============

export interface NewsArticleComment {
  id: number;
  content: string;
  author: string;
  posted_date_time: string;
  user_id: number;
}

export interface NewsArticle {
  id: number;
  title: string;
  content?: string;
  summary?: string;
  source?: string;
  source_type?: string;
  author?: string;
  url?: string;
  url_to_image?: string;
  published_at?: string;
  symbol?: string;
  sentiment?: string;
  sentiment_score?: number;
  topics?: string;
  like_count: number;
  comment_count: number;
  liked: boolean;
  comments: NewsArticleComment[];
  created_at: string;
  updated_at: string;
}

export interface NewsPaginatedResponse {
  items: NewsArticle[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface LikeResponse {
  article_id: number;
  liked: boolean;
  like_count: number;
}

export interface NewsCommentCreate {
  article_id: number;
  content: string;
}

// ============= SERVICE =============

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private apiUrl = `${environment.apiUrl}/news`;

  constructor(private http: HttpClient) {}

  // ============= PUBLIC ENDPOINTS (No Auth Required) =============

  /**
   * Get paginated news articles
   * PUBLIC - works without authentication
   */
  getNewsArticles(
    page: number = 0,
    size: number = 10,
    sortBy: 'published_at' | 'like_count' | 'sentiment_score' = 'published_at',
    symbol?: string
  ): Observable<NewsPaginatedResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort_by', sortBy);

    if (symbol) {
      params = params.set('symbol', symbol);
    }

    return this.http.get<NewsPaginatedResponse>(`${this.apiUrl}/`, { params });
  }

  /**
   * Get financial news (convenience method)
   */
  getFinancialNews(
    query: string = 'stock market finance trading',
    language: string = 'en',
    limit: number = 20
  ): Observable<NewsArticle[]> {
    return this.getNewsArticles(0, limit, 'published_at').pipe(
      map(response => response.items)
    );
  }

  /**
   * Get top headlines (convenience method)
   */
  getTopHeadlines(
    category: string = 'business',
    country: string = 'us',
    limit: number = 20
  ): Observable<NewsArticle[]> {
    return this.getNewsArticles(0, limit, 'published_at').pipe(
      map(response => response.items)
    );
  }

  /**
   * Get news by symbol
   */
  getNewsBySymbol(symbol: string, limit: number = 10): Observable<NewsArticle[]> {
    return this.getNewsArticles(0, limit, 'published_at', symbol).pipe(
      map(response => response.items)
    );
  }

  /**
   * Get specific news article by ID
   */
  getArticleById(articleId: number): Observable<NewsArticle> {
    return this.http.get<NewsArticle>(`${this.apiUrl}/${articleId}`);
  }

  /**
   * Get available news sources
   */
  getNewsSources(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sources`);
  }

  // ============= AUTHENTICATED ENDPOINTS =============

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Like or unlike an article
   * REQUIRES authentication
   */
  toggleLike(articleId: number): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(
      `${this.apiUrl}/${articleId}/like`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Add comment to article
   * REQUIRES authentication
   */
  addComment(articleId: number, content: string): Observable<NewsArticleComment> {
    const body: NewsCommentCreate = { article_id: articleId, content };
    return this.http.post<NewsArticleComment>(
      `${this.apiUrl}/comment`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Manually trigger news refresh
   * PUBLIC but might be restricted later
   */
  refreshNews(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/refresh`, {});
  }
}