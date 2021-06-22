import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../shared/services/logger.service';
import { DataService } from '../../../shared/services/data.service';

import { CLSignComponent } from './sign.component';

describe('CLSignComponent', () => {
  let component: CLSignComponent;
  let fixture: ComponentFixture<CLSignComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLSignComponent ],
      providers: [ LoggerService, DataService, MatSnackBar ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLSignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
