import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../shared/services/logger.service';
import { DataService } from '../../../shared/services/data.service';

import { CLVerifyComponent } from './verify.component';

describe('CLVerifyComponent', () => {
  let component: CLVerifyComponent;
  let fixture: ComponentFixture<CLVerifyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLVerifyComponent ],
      providers: [ LoggerService, DataService, MatSnackBar, HttpClient ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLVerifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
