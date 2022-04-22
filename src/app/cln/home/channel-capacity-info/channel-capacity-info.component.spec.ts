import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../../shared/shared.module';

import { CLNChannelCapacityInfoComponent } from './channel-capacity-info.component';

describe('CLNChannelCapacityInfoComponent', () => {
  let component: CLNChannelCapacityInfoComponent;
  let fixture: ComponentFixture<CLNChannelCapacityInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNChannelCapacityInfoComponent],
      imports: [SharedModule, RouterTestingModule]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNChannelCapacityInfoComponent);
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
