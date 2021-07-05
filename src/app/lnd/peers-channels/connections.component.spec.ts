import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../store/rtl.reducers';
import { LoggerService } from '../../shared/services/logger.service';

import { ConnectionsComponent } from './connections.component';
import { SharedModule } from '../../shared/shared.module';
import { mockDataService } from '../../shared/test-helpers/test-consts';
import { CommonService } from '../../shared/services/common.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../shared/services/data.service';

describe('ConnectionsComponent', () => {
  let component: ConnectionsComponent;
  let fixture: ComponentFixture<ConnectionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectionsComponent ],
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
        LoggerService, CommonService,
        { provide: DataService, useClass: mockDataService }
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(ConnectionsComponent);
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
