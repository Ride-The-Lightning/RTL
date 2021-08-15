import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../../shared/shared.module';

import { ChannelCapacityInfoComponent } from './channel-capacity-info.component';

describe('ChannelCapacityInfoComponent', () => {
  let component: ChannelCapacityInfoComponent;
  let fixture: ComponentFixture<ChannelCapacityInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ChannelCapacityInfoComponent],
      imports: [SharedModule, RouterTestingModule]
    }).
    compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelCapacityInfoComponent);
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
