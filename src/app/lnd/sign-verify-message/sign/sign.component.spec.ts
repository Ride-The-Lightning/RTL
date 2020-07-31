import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DataService } from '../../../shared/services/data.service';

import { SignComponent } from './sign.component';

describe('SignComponent', () => {
  let component: SignComponent;
  let fixture: ComponentFixture<SignComponent>;
  const mockDataService = jasmine.createSpyObj("DataService", ["getChildAPIUrl","setChildAPIUrl","getFiatRates",
  "getAliasesFromPubkeys","signMessage","verifyMessage","handleErrorWithoutAlert","handleErrorWithAlert"]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SignComponent ],
      providers: [
        { provide: DataService, useValue: mockDataService }
      ]
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
