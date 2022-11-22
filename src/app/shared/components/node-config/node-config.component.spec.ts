import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RTLEffects } from '../../../store/rtl.effects';
import { mockRTLEffects } from '../../../shared/test-helpers/mock-services';
import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { SharedModule } from '../../shared.module';
import { NodeConfigComponent } from './node-config.component';

describe('NodeConfigComponent', () => {
  let component: NodeConfigComponent;
  let fixture: ComponentFixture<NodeConfigComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NodeConfigComponent],
      imports: [
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        { provide: RTLEffects, useClass: mockRTLEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeConfigComponent);
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
