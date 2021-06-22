import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../shared/services/logger.service';
import { DataService } from '../../../shared/services/data.service';

import { SignComponent } from './sign.component';

describe('SignComponent', () => {
  let component: SignComponent;
  let fixture: ComponentFixture<SignComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SignComponent ],
      providers: [ LoggerService, DataService, MatSnackBar ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
