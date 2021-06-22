import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { LoggerService } from '../../shared/services/logger.service';

import { RTLReducer } from '../../store/rtl.reducers';
import { CLConnectionsComponent } from './connections.component';

describe('CLConnectionsComponent', () => {
  let component: CLConnectionsComponent;
  let fixture: ComponentFixture<CLConnectionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLConnectionsComponent ],
      imports: [ RouterTestingModule,
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
    fixture = TestBed.createComponent(CLConnectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
