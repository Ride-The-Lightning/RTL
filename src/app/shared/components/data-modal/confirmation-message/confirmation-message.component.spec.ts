import { TestBed, fakeAsync, flush } from '@angular/core/testing';
import { Location } from '@angular/common';
import { SpyLocation } from '@angular/common/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';

import { LoggerService } from '../../../services/logger.service';
import { AlertTypeEnum, DataTypeEnum } from '../../../services/consts-enums-functions';
import { mockLoggerService } from '../../../test-helpers/mock-services';
import { mockRTLStoreState } from '../../../test-helpers/test-data';
import { SharedModule } from '../../../shared.module';
import { closeConfirmation } from '../../../../store/rtl.actions';

import { ConfirmationMessageComponent } from './confirmation-message.component';

describe('ConfirmationMessageComponent', () => {
  let dialog: MatDialog;
  let location: SpyLocation;
  let store: Store;
  let dispatchSpy: jasmine.Spy;

  const openConfirmationDialog = (): MatDialogRef<ConfirmationMessageComponent> => dialog.open(ConfirmationMessageComponent, {
    data: { type: AlertTypeEnum.CONFIRM, alertTitle: 'Confirm Send Payment', noBtnText: 'Cancel', yesBtnText: 'Send Payment', message: [] }
  });

  const closeConfirmationReplies = () => dispatchSpy.calls.allArgs().map((args) => args[0]).filter((action) => action.type === closeConfirmation.type);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule],
      providers: [
        { provide: Location, useClass: SpyLocation },
        { provide: LoggerService, useClass: mockLoggerService },
        provideMockStore({ initialState: mockRTLStoreState })
      ]
    });
    dialog = TestBed.inject(MatDialog);
    location = TestBed.inject(Location) as SpyLocation;
    store = TestBed.inject(Store);
    dispatchSpy = spyOn(store, 'dispatch');
  });

  it('answers no when browser navigation closes the dialog before the operator answers', fakeAsync(() => {
    openConfirmationDialog();
    flush();
    location.simulateUrlPop('/lnd/transactions');
    flush();
    expect(dialog.openDialogs.length).toBe(0);
    expect(closeConfirmationReplies()).toEqual([closeConfirmation({ payload: false })]);
  }));

  it('answers no when a fragment change closes the dialog before the operator answers', fakeAsync(() => {
    openConfirmationDialog();
    flush();
    location.simulateHashChange('/lnd/transactions#x');
    flush();
    expect(dialog.openDialogs.length).toBe(0);
    expect(closeConfirmationReplies()).toEqual([closeConfirmation({ payload: false })]);
  }));

  it('sends only the operator\'s answer when the operator confirms', fakeAsync(() => {
    const dialogRef = openConfirmationDialog();
    flush();
    dialogRef.componentInstance.onClose(true);
    dialogRef.close();
    flush();
    expect(closeConfirmationReplies()).toEqual([closeConfirmation({ payload: true })]);
  }));

  it('sends only the operator\'s answer when the operator cancels', fakeAsync(() => {
    const dialogRef = openConfirmationDialog();
    flush();
    dialogRef.componentInstance.onClose(false);
    dialogRef.close();
    flush();
    expect(closeConfirmationReplies()).toEqual([closeConfirmation({ payload: false })]);
  }));

  // A list entry is a string from the node or from RTL; the dialog shows it as that string.
  it('shows each entry of a list field as the text it is', fakeAsync(() => {
    const entries = ['type: dns    address: <b>node</b> <img src="x.png"> &amp; more', 'type: ipv4    address: 10.0.0.1'];
    dialog.open(ConfirmationMessageComponent, {
      data: {
        type: AlertTypeEnum.CONFIRM, alertTitle: 'Liquidity Ad', noBtnText: 'Cancel', yesBtnText: 'Open Channel',
        message: [[{ key: 'address', value: entries, title: 'Address', width: 100, type: DataTypeEnum.ARRAY }]]
      }
    });
    flush();
    const container = document.querySelector('mat-dialog-container') as HTMLElement;
    const shown = Array.from(container.querySelectorAll('.list-entry')).map((entry) => entry.textContent);
    expect(shown).toEqual(entries);
    expect(container.querySelectorAll('.list-entry *').length).toBe(0);
  }));

  afterEach(() => {
    dialog.closeAll();
    TestBed.resetTestingModule();
  });
});
