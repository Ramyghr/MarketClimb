import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NewsService {

  // RSS feed URL for Yahoo Finance
  private feedUrl = 'https://finance.yahoo.com/rss/topstories';

  constructor(private http: HttpClient) {}

  getMarketNews(): Observable<any[]> {
    return this.http.get(this.feedUrl, { responseType: 'text' }).pipe(
      map((rss: string) => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(rss, 'application/xml');
        const items = Array.from(xml.querySelectorAll('item'));
        return items.map((item: any) => ({
          title: item.querySelector('title')?.textContent ?? '',
          link: item.querySelector('link')?.textContent ?? '',
          pubDate: item.querySelector('pubDate')?.textContent ?? '',
          description: item.querySelector('description')?.textContent ?? '',
          source: 'Yahoo Finance',
          imageUrl: this.extractImage(item.querySelector('description')?.textContent),
          sentiment: this.randomSentiment(),
          views: Math.floor(Math.random() * 5000),
        }));
      })
    );
  }

  private extractImage(desc: string | null): string | null {
    if (!desc) return null;
    const match = desc.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : null;
  }

  private randomSentiment(): string {
    const sentiments = ['positive', 'neutral', 'negative'];
    return sentiments[Math.floor(Math.random() * sentiments.length)];
  }
}
