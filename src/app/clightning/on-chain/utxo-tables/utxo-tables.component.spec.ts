import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { LoggerService } from '../../../shared/services/logger.service';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CLUTXOTablesComponent } from './utxo-tables.component';

describe('CLUTXOTablesComponent', () => {
  let component: CLUTXOTablesComponent;
  let fixture: ComponentFixture<CLUTXOTablesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLUTXOTablesComponent ],
      imports: [
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
 ],
      providers: [ LoggerService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLUTXOTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
