import { Component, Input, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-tradingview-widget',
  templateUrl: './tradingview-widget.component.html',
  styleUrls: ['./tradingview-widget.component.css']
})
export class TradingviewWidgetComponent implements AfterViewInit {
  @Input() symbol!: string;
  @Input() width: number = 2080;
  @Input() height: number = 1510;
  @Input() theme: string = 'light';

  ngAfterViewInit(): void {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      new (window as any).TradingView.widget({
        container_id: 'tradingview-widget',
        width: this.width,
        height: this.height,
        symbol: this.symbol,
        theme: this.theme,
        interval: 'D',
        timezone: 'Etc/UTC',
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
      });
    };
    document.getElementById('tradingview-widget')?.appendChild(script);
  }
}
