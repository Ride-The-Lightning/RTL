import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLChannelsComponent } from './channels.component';

describe('CLChannelsComponent', () => {
  let component: CLChannelsComponent;
  let fixture: ComponentFixture<CLChannelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
