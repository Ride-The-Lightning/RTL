import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { LoggerService } from '../../../shared/services/logger.service';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CLNodeLookupComponent } from './node-lookup.component';

describe('CLNodeLookupComponent', () => {
  let component: CLNodeLookupComponent;
  let fixture: ComponentFixture<CLNodeLookupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNodeLookupComponent],
      imports: [
        SharedModule,
        BrowserAnimationsModule
      ],
      providers: [LoggerService]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNodeLookupComponent);
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
