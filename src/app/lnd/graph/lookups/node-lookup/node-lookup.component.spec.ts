import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { LoggerService } from '../../../../shared/services/logger.service';
import { SharedModule } from '../../../../shared/shared.module';

import { NodeLookupComponent } from './node-lookup.component';

describe('NodeLookupComponent', () => {
  let component: NodeLookupComponent;
  let fixture: ComponentFixture<NodeLookupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NodeLookupComponent],
      imports: [
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [LoggerService]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeLookupComponent);
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
