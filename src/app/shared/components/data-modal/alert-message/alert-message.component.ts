import { Component, OnInit, AfterViewChecked, Inject, ViewChild, ElementRef, OnDestroy, Renderer2 } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CommonService } from '../../../services/common.service';
import { LoggerService } from '../../../services/logger.service';
import { AlertData } from '../../../models/alertData';
import { AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, LoopStateEnum } from '../../../services/consts-enums-functions';

@Component({
  selector: 'rtl-alert-message',
  templateUrl: './alert-message.component.html',
  styleUrls: ['./alert-message.component.scss']
})
export class AlertMessageComponent implements OnInit, AfterViewChecked, OnDestroy {
  private scrollContainer: ElementRef;
  @ViewChild('scrollContainer') set container(containerContent: ElementRef) {
    if(containerContent) { 
      this.scrollContainer = containerContent;
      if (this.scrollContainer && this.scrollContainer.nativeElement) {
        this.unlistenEnd = this.renderer.listen(this.scrollContainer.nativeElement, 'ps-y-reach-end', (event) => { 
          this.scrollDirection = 'UP';
        });
        this.unlistenStart = this.renderer.listen(this.scrollContainer.nativeElement, 'ps-y-reach-start', (event) => { 
          this.scrollDirection = 'DOWN';
        });
      }
    }
  }
  private unlistenStart: () => void;
  private unlistenEnd: () => void;
  public LoopStateEnum = LoopStateEnum;
  public showQRField = '';
  public showQRName = '';  
  public showCopyName = '';
  public showCopyField = '';
  public errorMessage = '';
  public messageObjs = [];
  public alertTypeEnum = AlertTypeEnum;
  public dataTypeEnum = DataTypeEnum;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public scrollDirection = 'DOWN';
  public shouldScroll = true;

  constructor(public dialogRef: MatDialogRef<AlertMessageComponent>, @Inject(MAT_DIALOG_DATA) public data: AlertData, private logger: LoggerService, private snackBar: MatSnackBar, private commonService: CommonService, private renderer: Renderer2) { }

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.messageObjs = this.data.message;
    this.showQRField = this.data.showQRField ? this.data.showQRField : '';
    this.showQRName = this.data.showQRName ? this.data.showQRName : '';
    this.showCopyName = this.data.showCopyName ? this.data.showCopyName : '';
    this.showCopyField = this.data.showCopyField ? this.data.showCopyField : '';
    if (this.data.type === AlertTypeEnum.ERROR) {
      if (!this.data.message && !this.data.titleMessage && this.messageObjs.length <= 0) {
        this.data.titleMessage = 'Please Check Server Connection';
      }
    }
    this.logger.info(this.messageObjs);
  }

  ngAfterViewChecked() {
    setTimeout(() => {
      this.shouldScroll = this.scrollContainer && this.scrollContainer.nativeElement && this.scrollContainer.nativeElement.classList.value.includes('ps--active-y');
    }, 500);
  }

  onScroll() {
    if (this.scrollDirection === 'DOWN') {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollTop + 62.6;
    } else {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollTop - 62.6;
    }
  }

  onCopyField(payload: string) {
    this.snackBar.open((this.showQRName ? this.showQRName : this.showCopyName) + ' copied.');
    this.logger.info('Copied Text: ' + payload);
  }

  onClose() {
    this.dialogRef.close(false);
  }

  ngOnDestroy() {
    if (this.unlistenStart) { this.unlistenStart(); }
    if (this.unlistenEnd) { this.unlistenEnd(); }
  }
}
