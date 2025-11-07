import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketAiAgentComponent } from './market-ai-agent.component';

describe('MarketAiAgentComponent', () => {
  let component: MarketAiAgentComponent;
  let fixture: ComponentFixture<MarketAiAgentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MarketAiAgentComponent]
    });
    fixture = TestBed.createComponent(MarketAiAgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
