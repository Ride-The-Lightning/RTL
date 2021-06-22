import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CLChannelCapacityInfoComponent } from './channel-capacity-info.component';

describe('CLChannelCapacityInfoComponent', () => {
  let component: CLChannelCapacityInfoComponent;
  let fixture: ComponentFixture<CLChannelCapacityInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelCapacityInfoComponent ],
      imports: [ RouterTestingModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelCapacityInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
