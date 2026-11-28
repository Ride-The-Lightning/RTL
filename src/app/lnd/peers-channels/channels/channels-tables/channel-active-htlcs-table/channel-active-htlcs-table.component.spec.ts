import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';

import { ChannelActiveHTLCsTableComponent } from './channel-active-htlcs-table.component';
import { mockDataService, mockLoggerService } from '../../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../../../shared/services/data.service';
import { MatTableDataSource } from '@angular/material/table';

describe('ChannelActiveHTLCsTableComponent', () => {
  let component: ChannelActiveHTLCsTableComponent;
  let fixture: ComponentFixture<ChannelActiveHTLCsTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ChannelActiveHTLCsTableComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
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
    fixture = TestBed.createComponent(ChannelActiveHTLCsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should keep the actions cell as a table-cell and align its inner column wrapper when collapsed and expanded', () => {
    component.displayedColumns = ['incoming', 'amount', 'actions'];
    component.channels = new MatTableDataSource<any>([{
      remote_alias: 'bob',
      is_expanded: false,
      pending_htlcs: [{ amount: '1000', incoming: true, expiration_height: 100, hash_lock: 'aa' }]
    }]);
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('td.mat-column-actions') as HTMLElement;
    expect(getComputedStyle(cell).display).toBe('table-cell');
    const wrapper = cell.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
    expect(getComputedStyle(wrapper).display).toBe('flex');
    expect(getComputedStyle(wrapper).flexDirection).toBe('column');
    expect(getComputedStyle(wrapper).justifyContent).toBe('center');
    expect(getComputedStyle(wrapper).alignItems).toMatch(/^(?:flex|flow)-end$/);

    const expandBtn = wrapper.querySelector('button.btn-htlc-expand') as HTMLButtonElement;
    expandBtn.click();
    fixture.detectChanges();
    expect(getComputedStyle(cell).display).toBe('table-cell');
    expect(wrapper.querySelectorAll('button.btn-htlc-info').length).toBe(1);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
