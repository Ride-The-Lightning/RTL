import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { LoggerService } from '../../../shared/services/logger.service';
import { SharedModule } from '../../../shared/shared.module';

import { ECLNodeLookupComponent } from './node-lookup.component';

describe('ECLNodeLookupComponent', () => {
  let component: ECLNodeLookupComponent;
  let fixture: ComponentFixture<ECLNodeLookupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLNodeLookupComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule
      ],
      providers: [LoggerService]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLNodeLookupComponent);
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
