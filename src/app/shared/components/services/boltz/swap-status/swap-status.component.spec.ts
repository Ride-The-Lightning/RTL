import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../../../../shared.module';

import { SwapStatusComponent } from './swap-status.component';

describe('SwapStatusComponent', () => {
  let component: SwapStatusComponent;
  let fixture: ComponentFixture<SwapStatusComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapStatusComponent ],
      imports: [ SharedModule ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(SwapStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
