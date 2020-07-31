import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLNodeInfoComponent } from './node-info.component';
import { CommonService } from '../../../shared/services/common.service';

describe('CLNodeInfoComponent', () => {
  let component: CLNodeInfoComponent;
  let fixture: ComponentFixture<CLNodeInfoComponent>;
  const mockCommonService = jasmine.createSpyObj("CommonService",["getScreenSize","setScreenSize",
"sortDescByKey","camelCase","titleCase","convertCurrency","convertWithoutFiat","convertWithFiat",
"convertTime","convertTimestampToDate","downloadFile","convertToCSV"]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLNodeInfoComponent ],
      providers: [
        { provide: CommonService, useValue: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNodeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
