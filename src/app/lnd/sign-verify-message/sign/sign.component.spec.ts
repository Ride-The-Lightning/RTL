import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoggerService } from '../../../shared/services/logger.service';
import { DataService } from '../../../shared/services/data.service';

import { SignComponent } from './sign.component';
import { SharedModule } from '../../../shared/shared.module';
import { StoreModule } from '@ngrx/store';
import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { mockDataService, mockLoggerService } from '../../../shared/test-helpers/mock-services';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('SignComponent', () => {
  let component: SignComponent;
  let fixture: ComponentFixture<SignComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SignComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignComponent);
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
