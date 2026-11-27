import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { of, config as rxjsConfig } from 'rxjs';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { SharedModule } from '../../../shared.module';
import { ExperimentalSettingsComponent } from './experimental-settings.component';
import { mockDataService, mockLoggerService } from '../../../test-helpers/mock-services';
import { LoggerService } from '../../../services/logger.service';
import { DataService } from '../../../services/data.service';
import { CommonService } from '../../../services/common.service';

describe('ExperimentalSettingsComponent', () => {
  let component: ExperimentalSettingsComponent;
  let fixture: ComponentFixture<ExperimentalSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ExperimentalSettingsComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentalSettingsComponent);
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

describe('ExperimentalSettingsComponent channel funding policy status', () => {
  let unhandled: any[];
  let savedHandler: ((err: any) => void) | null;

  const createWith = (listConfigsReply: any) => {
    TestBed.configureTestingModule({
      declarations: [ExperimentalSettingsComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useValue: { listConfigs: () => of(listConfigsReply) } }
      ]
    });
    const fixture = TestBed.createComponent(ExperimentalSettingsComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(() => {
    unhandled = [];
    savedHandler = rxjsConfig.onUnhandledError;
    rxjsConfig.onUnhandledError = (err) => unhandled.push(err);
  });

  afterEach(() => {
    rxjsConfig.onUnhandledError = savedHandler;
    TestBed.resetTestingModule();
  });

  // rxjs reports an error thrown in a subscriber on a later timer tick, so wait for it.
  const nextTick = () => new Promise<void>((resolve) => { setTimeout(resolve); });

  it('shows the policy as enabled when Core Lightning reports experimental-dual-fund set', async () => {
    const component = createWith({ configs: { 'experimental-dual-fund': { set: true, source: 'cmdline' } } });
    await nextTick();
    expect(component.features[1].enabled).toBeTrue();
    expect(unhandled).toEqual([]);
  });

  it('shows the policy as disabled, without an error, when the reply has no experimental-dual-fund', async () => {
    const component = createWith({ configs: {} });
    await nextTick();
    expect(component.features[1].enabled).toBeFalse();
    expect(unhandled).toEqual([]);
  });
});
