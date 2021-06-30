import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoggerService } from '../../../shared/services/logger.service';
import { DataService } from '../../../shared/services/data.service';

import { CLVerifyComponent } from './verify.component';
import { mockDataService } from '../../../shared/services/test-consts';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('CLVerifyComponent', () => {
  let component: CLVerifyComponent;
  let fixture: ComponentFixture<CLVerifyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLVerifyComponent ],
      imports: [ 
        BrowserAnimationsModule,
        SharedModule
      ],
      providers: [ 
        LoggerService,
        { provide: DataService, useClass: mockDataService }
      ]
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

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
