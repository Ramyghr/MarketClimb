import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms'
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TradeComponent } from './dashboard/trade/trade.component';
import { PortfolioComponent } from './dashboard/portfolio/portfolio.component';
import { AccountComponent } from './dashboard/account/account.component';
import { SigninComponent } from './auth/signin/signin.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TradingviewWidgetComponent } from './tradingview-widget/tradingview-widget.component';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { LandingComponent } from './landing/landing.component';
import { SignupComponent } from './auth/signup/signup.component';
import { PersonalDetailsComponent } from './auth/signup/steps/personal-details/personal-details.component';
import { FurtherInfoComponent } from './auth/signup/steps/further-info/further-info.component';
import { AccountConfigComponent } from './auth/signup/steps/account-config/account-config.component';
import { DeclarationComponent } from './auth/signup/steps/declaration/declaration.component';
import { StartTradingComponent } from './auth/signup/steps/start-trading/start-trading.component';
import { SidebarComponent } from './dashboard/sidebar/sidebar.component';
import { ChartComponent } from './dashboard/trade/chart/chart.component';
import { OrderPanelComponent } from './dashboard/trade/order-panel/order-panel.component';
import { OrderBookComponent } from './dashboard/trade/order-book/order-book.component';
import { RecentTradesComponent } from './dashboard/trade/recent-trades/recent-trades.component';


const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: SigninComponent },

  // Dashboard routes
  { 
    path: 'dashboard', component: DashboardComponent,
    children: [
      { path: 'trade', component: TradeComponent },
      { path: 'portfolio', component: PortfolioComponent },
      { path: 'account', component: AccountComponent },
      { path: '', redirectTo: 'trade', pathMatch: 'full' }
    ]
  },

  // Signup multi-step flow
  { 
    path: 'signup', component: SignupComponent,
    children: [
      { path: 'personal', component: PersonalDetailsComponent },
      { path: 'further', component: FurtherInfoComponent },
      { path: 'config', component: AccountConfigComponent },
      { path: 'declaration', component: DeclarationComponent },
      { path: 'start', component: StartTradingComponent },
      { path: '', redirectTo: 'personal', pathMatch: 'full' }
    ]
  },

  // fallback redirect
  { path: '**', redirectTo: '' }
];


@NgModule({
  declarations: [
    SidebarComponent,
    AppComponent,
    DashboardComponent,
    TradeComponent,
    PortfolioComponent,
    AccountComponent,
    SigninComponent,
    TradingviewWidgetComponent,
    HeaderComponent,
    FooterComponent,
    LandingComponent,
    SignupComponent,
    PersonalDetailsComponent,
    FurtherInfoComponent,
    AccountConfigComponent,
    DeclarationComponent,
    StartTradingComponent,
    ChartComponent,
    OrderPanelComponent,
    OrderBookComponent,
    RecentTradesComponent,
  ],
  imports: [
    NgbModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes) // <-- add routes here
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
