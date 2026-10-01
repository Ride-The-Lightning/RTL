import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';
import { SessionService } from '../../../../shared/services/session.service';

import { SideNavigationComponent } from './side-navigation.component';
import { MENU_DATA } from '../../../models/navMenu';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../test-helpers/mock-services';
import { EffectsModule } from '@ngrx/effects';
import { RTLEffects } from '../../../../store/rtl.effects';
import { SharedModule } from '../../../shared.module';
import { DataService } from '../../../services/data.service';

describe('SideNavigationComponent', () => {
  let component: SideNavigationComponent;
  let fixture: ComponentFixture<SideNavigationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SideNavigationComponent],
      imports: [
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService }, SessionService,
        { provide: DataService, useClass: mockDataService },
        { provide: RTLEffects, useClass: mockRTLEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should leave the Services group out of the Core Lightning menu while it has no entries', () => {
    component.selNode = <any>{ lnImplementation: 'CLN', settings: { userPersona: 'OPERATOR', enablePeerswap: false } };
    component.loadCLNMenu();
    const names = component.navMenus.data.map((menu) => menu.name);
    expect(names).toContain('Dashboard');
    expect(names).toContain('Node Config');
    expect(names).not.toContain('Services');
  });

  it('should keep the Services group in the Core Lightning menu data for services added later', () => {
    expect(MENU_DATA.CLNChildren?.some((menu) => menu.name === 'Services')).toBeTrue();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
