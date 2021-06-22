import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../shared/services/logger.service';

import { ECLNodeLookupComponent } from './node-lookup.component';

describe('ECLNodeLookupComponent', () => {
  let component: ECLNodeLookupComponent;
  let fixture: ComponentFixture<ECLNodeLookupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLNodeLookupComponent ],
      providers: [ LoggerService, MatSnackBar ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLNodeLookupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
