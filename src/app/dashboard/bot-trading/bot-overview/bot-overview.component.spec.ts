import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BotOverviewComponent } from './bot-overview.component';

describe('BotOverviewComponentComponent', () => {
  let component: BotOverviewComponent;
  let fixture: ComponentFixture<BotOverviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BotOverviewComponent]
    });
    fixture = TestBed.createComponent(BotOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
