import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLChannelOpenTableComponent } from './channel-open-table.component';

describe('CLChannelOpenTableComponent', () => {
  let component: CLChannelOpenTableComponent;
  let fixture: ComponentFixture<CLChannelOpenTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelOpenTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelOpenTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
