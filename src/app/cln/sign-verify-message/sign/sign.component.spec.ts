import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoggerService } from '../../../shared/services/logger.service';
import { DataService } from '../../../shared/services/data.service';

import { CLNSignComponent } from './sign.component';
import { mockDataService, mockLoggerService } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('CLNSignComponent', () => {
  let component: CLNSignComponent;
  let fixture: ComponentFixture<CLNSignComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNSignComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule
      ],
      providers: [
        LoggerService,
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNSignComponent);
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

  it('should clear the signature when the message changes without a key press', async () => {
    await fixture.whenStable();
    enterValue('message', 'signed message');
    component.signedMessage = 'signed message';
    component.signature = 'signature of the signed message';
    enterValue('message', 'another message');
    expect(component.signature).toBe('');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
