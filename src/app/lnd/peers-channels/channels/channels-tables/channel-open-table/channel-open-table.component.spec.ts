import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelOpenTableComponent } from './channel-open-table.component';

describe('ChannelOpenTableComponent', () => {
  let component: ChannelOpenTableComponent;
  let fixture: ComponentFixture<ChannelOpenTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelOpenTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelOpenTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
