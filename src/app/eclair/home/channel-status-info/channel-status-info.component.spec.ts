import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLChannelStatusInfoComponent } from './channel-status-info.component';

describe('ECLChannelStatusInfoComponent', () => {
  let component: ECLChannelStatusInfoComponent;
  let fixture: ComponentFixture<ECLChannelStatusInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLChannelStatusInfoComponent]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLChannelStatusInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
