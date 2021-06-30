import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { CurrencyUnitConverterComponent } from '../../shared/components/currency-unit-converter/currency-unit-converter.component';
import { CommonService } from '../../shared/services/common.service';
import { LoggerService } from '../../shared/services/logger.service';
import { mockCommonService } from '../../shared/services/test-consts';
import { SharedModule } from '../../shared/shared.module';

import { RTLReducer } from '../../store/rtl.reducers';
import { CLConnectionsComponent } from './connections.component';

describe('CLConnectionsComponent', () => {
  let component: CLConnectionsComponent;
  let fixture: ComponentFixture<CLConnectionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLConnectionsComponent, CurrencyUnitConverterComponent ],
      imports: [ 
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        })
      ],
      providers: [
        LoggerService,
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLConnectionsComponent);
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
