import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoggerService } from '../../../shared/services/logger.service';
import { DataService } from '../../../shared/services/data.service';

import { CLNVerifyComponent } from './verify.component';
import { mockDataService, mockLoggerService } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('CLNVerifyComponent', () => {
  let component: CLNVerifyComponent;
  let fixture: ComponentFixture<CLNVerifyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNVerifyComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule
      ],
      providers: [
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNVerifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Typing into a field: an input event and no key press, as when pasting or dropping with the mouse.
  const enterValue = (fieldName: string, value: string) => {
    const field: HTMLInputElement | HTMLTextAreaElement = fixture.nativeElement.querySelector('[name="' + fieldName + '"]');
    field.value = value;
    field.dispatchEvent(new Event('input'));
  };

  const verified = async () => {
    await fixture.whenStable();
    enterValue('message', 'verified message');
    enterValue('signature', 'verified signature');
    component.verifiedMessage = 'verified message';
    component.verifiedSignature = 'verified signature';
    component.showVerifyStatus = true;
  };

  it('should hide the result when the message changes without a key press', async () => {
    await verified();
    enterValue('message', 'another message');
    expect(component.showVerifyStatus).toBe(false);
  });

  it('should hide the result when the signature changes without a key press', async () => {
    await verified();
    enterValue('signature', 'another signature');
    expect(component.showVerifyStatus).toBe(false);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
