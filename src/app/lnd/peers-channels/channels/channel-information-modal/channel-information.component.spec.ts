import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';

import { ChannelInformationComponent } from './channel-information.component';
import { mockDataService, mockLoggerService, mockMatDialogRef } from '../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../shared/shared.module';
import { DataService } from '../../../../shared/services/data.service';

describe('ChannelInformationComponent', () => {
  let component: ChannelInformationComponent;
  let fixture: ComponentFixture<ChannelInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ChannelInformationComponent],
      imports: [SharedModule],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { channel: {}, selNode: { settings: {} } } }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the block explorer without giving it access to the RTL tab', () => {
    const openSpy = spyOn(window, 'open');
    component.selNode = <any>{ settings: { blockExplorerUrl: 'https://mempool.space' } };
    component.channel = { channel_point: 'abcd:0' };
    fixture.detectChanges();
    const explorerIcon = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('fa-icon.fa-icon-primary')).find((icon) => icon.parentElement?.textContent?.includes('abcd:0'));
    explorerIcon?.click();
    expect(openSpy).toHaveBeenCalledOnceWith('https://mempool.space/tx/abcd:0', '_blank', 'noopener,noreferrer');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
