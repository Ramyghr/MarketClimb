import { Component, Input, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-tradingview-widget',
  templateUrl: './tradingview-widget.component.html',
  styleUrls: ['./tradingview-widget.component.css']
})
export class TradingviewWidgetComponent implements AfterViewInit, OnDestroy {
  @Input() symbol: string = 'NASDAQ:AAPL'; // default symbol
  @Input() width: number = 800; 
  @Input() height: number = 600; 
  @Input() theme: 'light' | 'dark' = 'light';

  private script: HTMLScriptElement | null = null;

  ngAfterViewInit(): void {
    // Load TradingView script dynamically
    this.script = document.createElement('script');
    this.script.src = 'https://s3.tradingview.com/tv.js';
    this.script.onload = () => {
      new (window as any).TradingView.widget({
        container_id: 'tradingview_container',
        width: this.width,
        height: this.height,
        symbol: this.symbol,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: this.theme,
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        details: true,
        hotlist: true,
        calendar: true
      });
    };
    document.body.appendChild(this.script);
  }

  ngOnDestroy(): void {
    // Clean up script if component destroyed
    if (this.script) {
      document.body.removeChild(this.script);
      this.script = null;
    }
  }
}
