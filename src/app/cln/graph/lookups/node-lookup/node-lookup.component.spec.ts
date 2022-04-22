import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { LoggerService } from '../../../../shared/services/logger.service';
import { SharedModule } from '../../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CLNNodeLookupComponent } from './node-lookup.component';

describe('CLNNodeLookupComponent', () => {
  let component: CLNNodeLookupComponent;
  let fixture: ComponentFixture<CLNNodeLookupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNNodeLookupComponent],
      imports: [
        SharedModule,
        BrowserAnimationsModule
      ],
      providers: [LoggerService]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNNodeLookupComponent);
    component = fixture.componentInstance;
    component.lookupResult = {};
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
