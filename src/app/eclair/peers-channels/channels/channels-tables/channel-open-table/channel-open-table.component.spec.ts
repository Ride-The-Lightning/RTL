import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLChannelOpenTableComponent } from './channel-open-table.component';

describe('ECLChannelOpenTableComponent', () => {
  let component: ECLChannelOpenTableComponent;
  let fixture: ComponentFixture<ECLChannelOpenTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLChannelOpenTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLChannelOpenTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
