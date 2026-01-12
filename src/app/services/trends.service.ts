import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TrendAnalysis, MarketIndicator } from './sentiment.model';
@Injectable({
  providedIn: 'root'
})
export class TrendsService {
  private apiUrl = `${environment.apiUrl}/api/v1/trends`;
  constructor(private http: HttpClient) {}

  getEmergingTrends(
    timePeriod: string = '24h',
    limit: number = 5
  ): Observable<TrendAnalysis[]> {
    const params = new HttpParams()
      .set('time_period', timePeriod)
      .set('limit', limit.toString());
    
    return this.http.get<TrendAnalysis[]>(`${this.apiUrl}/emerging`, { params });
  }

  getMarketIndicators(limit: number = 10): Observable<MarketIndicator[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<MarketIndicator[]>(`${this.apiUrl}/indicators`, { params });
  }

  getSentimentDistribution(
    query: string = 'stock market',
    limit: number = 30
  ): Observable<{ positive: number; neutral: number; negative: number; total: number }> {
    const params = new HttpParams()
      .set('query', query)
      .set('limit', limit.toString());
    
    return this.http.get<any>(`${this.apiUrl}/sentiment-distribution`, { params });
  }
}
