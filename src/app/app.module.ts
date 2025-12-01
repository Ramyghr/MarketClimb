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
  import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
  import { WatchlistComponent } from './dashboard/trade/watchlist/watchlist.component';
  import { CommunityComponent } from './dashboard/community/community.component';
  import { LearningComponent } from './dashboard/learning/learning.component';
  import { GamificationComponent } from './dashboard/gamification/gamification.component';
  import { AchievementsComponent } from './dashboard/gamification/achievements/achievements.component';
  import { StreaksComponent } from './dashboard/gamification/streaks/streaks.component';
  import { ChallengesComponent } from './dashboard/gamification/challenges/challenges.component';
  import { LeaderboardComponent } from './dashboard/gamification/leaderboard/leaderboard.component';
  import { RewardsComponent } from './dashboard/gamification/rewards/rewards.component';
  import { MarketAiAgentComponent } from './shared/market-ai-agent/market-ai-agent.component';
  import { NewsComponent } from './dashboard/news/news.component';
  import { OverviewComponent } from './dashboard/overview/overview.component';
  import { HttpClientModule } from '@angular/common/http';
  import { HTTP_INTERCEPTORS } from '@angular/common/http';
  import { AuthInterceptor } from 'src/app/core/interceptors/auth.service';



  const routes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'login', component: SigninComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },

    // Dashboard routes
    { 
      path: 'dashboard', component: DashboardComponent,
      children: [
        { path: 'overview', component: OverviewComponent },
        { path: 'trade', component: TradeComponent },
        { path: 'portfolio', component: PortfolioComponent },
        { path: 'community', component: CommunityComponent },
        { path: 'account', component: AccountComponent },
        { path: 'learning', component: LearningComponent },
        { path: 'game', component: GamificationComponent },
        { path: 'news', component: NewsComponent },
        { path: '', redirectTo: 'overview', pathMatch: 'full' }
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
      ForgotPasswordComponent,
      WatchlistComponent,
      CommunityComponent,
      LearningComponent,
      GamificationComponent,
      AchievementsComponent,
      StreaksComponent,
      ChallengesComponent,
      LeaderboardComponent,
      RewardsComponent,
      MarketAiAgentComponent,
      NewsComponent,
      OverviewComponent,
    ],
    imports: [
      NgbModule,
      BrowserModule,
      FormsModule,
      ReactiveFormsModule,
      HttpClientModule,
      RouterModule.forRoot(routes) // <-- add routes here
    ],
    providers: [ 
      {
        provide: HTTP_INTERCEPTORS,
        useClass: AuthInterceptor,
        multi: true
      }],
    bootstrap: [AppComponent]
  })
  export class AppModule { }
