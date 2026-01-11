import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BotLogsComponent } from './bot-logs.component';

describe('BotLogsComponent', () => {
  let component: BotLogsComponent;
  let fixture: ComponentFixture<BotLogsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BotLogsComponent]
    });
    fixture = TestBed.createComponent(BotLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
