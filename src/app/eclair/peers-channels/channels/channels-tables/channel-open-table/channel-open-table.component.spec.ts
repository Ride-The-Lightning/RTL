import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRChannelOpenTableComponent } from './channel-open-table.component';

describe('ECLRChannelOpenTableComponent', () => {
  let component: ECLRChannelOpenTableComponent;
  let fixture: ComponentFixture<ECLRChannelOpenTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRChannelOpenTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRChannelOpenTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
