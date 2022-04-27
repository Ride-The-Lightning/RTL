import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';

import { InvoiceLookupComponent } from './invoice-lookup.component';
import { mockDataService, mockLoggerService } from '../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../shared/shared.module';
import { DataService } from '../../../../shared/services/data.service';

describe('InvoiceLookupComponent', () => {
  let component: InvoiceLookupComponent;
  let fixture: ComponentFixture<InvoiceLookupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InvoiceLookupComponent],
      imports: [
        SharedModule
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceLookupComponent);
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
