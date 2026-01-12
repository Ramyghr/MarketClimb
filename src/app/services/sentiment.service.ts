import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  SentimentAnalysis,
  MarketSentimentSummary,
  SentimentRequest,
  SentimentResponse
}from './sentiment.model';
@Injectable({
  providedIn: 'root'
})
export class SentimentService {
  private apiUrl = `${environment.apiUrl}/api/v1/sentiment`;
  
  constructor(private http: HttpClient) {}

  analyzText(request: SentimentRequest): Observable<SentimentResponse> {
    return this.http.post<SentimentResponse>(`${this.apiUrl}/analyze`, request);
  }

  getMarketSummary(query: string = 'stock market finance trading', limit: number = 20): Observable<MarketSentimentSummary> {
    const params = new HttpParams()
      .set('query', query)
      .set('limit', limit.toString());
    
    return this.http.get<MarketSentimentSummary>(`${this.apiUrl}/market-summary`, { params });
  }

  analyzeNews(query: string = 'stock market finance', limit: number = 10): Observable<SentimentAnalysis[]> {
    const params = new HttpParams()
      .set('query', query)
      .set('limit', limit.toString());
    
    return this.http.get<SentimentAnalysis[]>(`${this.apiUrl}/analyze-news`, { params });
  }

  analyzeSymbol(symbol: string, limit: number = 10): Observable<SentimentAnalysis[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<SentimentAnalysis[]>(`${this.apiUrl}/symbol/${symbol}`, { params });
  }
}
