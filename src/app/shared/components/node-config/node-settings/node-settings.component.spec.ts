import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../store/rtl.reducers';
import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';

import { NodeSettingsComponent } from './node-settings.component';
import { mockCommonService } from '../../../services/test-consts';
import { SharedModule } from '../../../shared.module';

describe('NodeSettingsComponent', () => {
  let component: NodeSettingsComponent;
  let fixture: ComponentFixture<NodeSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NodeSettingsComponent ],
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
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeSettingsComponent);
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
