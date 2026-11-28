import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../store/ecl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';

import { ECLChannelOpenTableComponent } from './channel-open-table.component';
import { mockDataService, mockLoggerService, mockRouter, mockRTLEffects } from '../../../../../shared/test-helpers/mock-services';
import { RTLEffects } from '../../../../../store/rtl.effects';
import { SharedModule } from '../../../../../shared/shared.module';
import { DataService } from '../../../../../shared/services/data.service';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';

describe('ECLChannelOpenTableComponent', () => {
  let component: ECLChannelOpenTableComponent;
  let fixture: ComponentFixture<ECLChannelOpenTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLChannelOpenTableComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: Router, useClass: mockRouter },
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: RTLEffects, useClass: mockRTLEffects }
      ]

    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLChannelOpenTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should keep the actions cell as a table-cell and align its inner wrapper', () => {
    component.displayedColumns = ['alias', 'actions'];
    component.channels = new MatTableDataSource<any>([{ alias: 'bob' }]);
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('td.mat-column-actions') as HTMLElement;
    expect(getComputedStyle(cell).display).toBe('table-cell');
    const wrapper = cell.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('SPAN');
    expect(getComputedStyle(wrapper).display).toBe('flex');
    expect(getComputedStyle(wrapper).justifyContent).toMatch(/^(?:flex|flow)-end$/);
    expect(getComputedStyle(wrapper).alignItems).toBe('center');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
