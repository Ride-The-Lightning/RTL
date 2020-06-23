import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRChannelsTableComponent } from './channels-table.component';

describe('ECLRChannelsTableComponent', () => {
  let component: ECLRChannelsTableComponent;
  let fixture: ComponentFixture<ECLRChannelsTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRChannelsTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRChannelsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
