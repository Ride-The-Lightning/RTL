import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../../../shared/shared.module';

import { CLChannelStatusInfoComponent } from './channel-status-info.component';

describe('CLChannelStatusInfoComponent', () => {
  let component: CLChannelStatusInfoComponent;
  let fixture: ComponentFixture<CLChannelStatusInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLChannelStatusInfoComponent],
      imports: [SharedModule]
    }).
    compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelStatusInfoComponent);
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
