import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';

import { SharedModule } from '../../../../shared.module';
import { RTLReducer } from '../../../../../store/rtl.reducers';
import { CommonService } from '../../../../services/common.service';
import { DataService } from '../../../../services/data.service';

import { SwapInInfoGraphicsComponent } from './info-graphics.component';

describe('SwapInInfoGraphicsComponent', () => {
  let component: SwapInInfoGraphicsComponent;
  let fixture: ComponentFixture<SwapInInfoGraphicsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapInInfoGraphicsComponent ],
      imports: [
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
        BrowserAnimationsModule
      ],
      providers: [ CommonService, DataService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapInInfoGraphicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
