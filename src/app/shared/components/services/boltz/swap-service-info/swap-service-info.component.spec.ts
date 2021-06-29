import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../../../../shared.module';

import { SwapServiceInfoComponent } from './swap-service-info.component';

describe('SwapServiceInfoComponent', () => {
  let component: SwapServiceInfoComponent;
  let fixture: ComponentFixture<SwapServiceInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapServiceInfoComponent ],
      imports: [ SharedModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapServiceInfoComponent);
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
