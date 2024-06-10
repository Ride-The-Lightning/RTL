import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../../../../shared.module';

import { DataService } from '../../../../services/data.service';
import { CommonService } from '../../../../services/common.service';
import { mockDataService } from '../../../../test-helpers/mock-services';
import { SwapStatusComponent } from './swap-status.component';

describe('SwapStatusComponent', () => {
  let component: SwapStatusComponent;
  let fixture: ComponentFixture<SwapStatusComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SwapStatusComponent],
      imports: [SharedModule],
      providers: [
        CommonService,
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapStatusComponent);
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
