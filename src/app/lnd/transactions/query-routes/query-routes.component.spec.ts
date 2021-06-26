import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CommonService } from '../../../shared/services/common.service';

import { QueryRoutesComponent } from './query-routes.component';
import { mockCommonService, mockLNDEffects } from '../../../shared/services/test-consts';
import { LNDEffects } from '../../store/lnd.effects';
import { LoggerService } from '../../../shared/services/logger.service';
import { SharedModule } from '../../../shared/shared.module';

describe('QueryRoutesComponent', () => {
  let component: QueryRoutesComponent;
  let fixture: ComponentFixture<QueryRoutesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ QueryRoutesComponent ],
      imports: [ 
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        })
      ],
      providers: [
        LoggerService,
        { provide: LNDEffects, useClass: mockLNDEffects },
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
