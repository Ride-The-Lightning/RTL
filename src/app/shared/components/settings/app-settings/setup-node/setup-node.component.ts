import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { UserPersonaEnum, ScreenSizeEnum, FIAT_CURRENCY_UNITS, NODE_SETTINGS, CURRENCY_UNITS } from '../../../../services/consts-enums-functions';

import { sliderAnimation } from '../../../../animation/slider-animation';
import { CommonService } from '../../../../services/common.service';

@Component({
  selector: 'rtl-setup-node',
  templateUrl: './setup-node.component.html',
  styleUrls: ['./setup-node.component.scss'],
  animations: [sliderAnimation]  
})
export class SetupNodeComponent implements OnInit {
  public animationDirection = '';
  public stepNumber = 1;
  public lnImplementations = [{id: 'LND', value: 'LND'}, {id: 'CLT', value: 'C-Lightning'}, {id: 'ECL', value: 'Eclair'}];
  public selectedLNImplementation = this.lnImplementations[0];
  public nodeName = '';
  public macaroonPath = '';
  public configPath = '';
  public bConfigPath = '';
  public channelBackupPath = '';
  public restAPIUrl = '';
  public userPersonas = [UserPersonaEnum.MERCHANT, UserPersonaEnum.OPERATOR];
  public selectedUserPersona = this.userPersonas[0];
  public currencyUnits = FIAT_CURRENCY_UNITS;
  public selectedCurrencyUnit = null;
  public themeModes = NODE_SETTINGS.modes;
  public themeColors = NODE_SETTINGS.themes;
  public selectedThemeMode = NODE_SETTINGS.modes[0];
  public selectedThemeColor = NODE_SETTINGS.themes[0].id;
  public currencyUnit = 'BTC';
  public enableLogging = false;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(private commonService: CommonService, public dialogRef: MatDialogRef<SetupNodeComponent>) {}

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.currencyUnits.unshift({id: 'NONE', name: 'Disabled'});
    this.selectedCurrencyUnit = this.currencyUnits[0];
  }

  onStepChanged(index: number) {
    this.animationDirection = index < this.stepNumber ? 'backward' : 'forward';
    this.stepNumber = index;
  }

  onSwipe(event: any) {
    if(event.direction === 2 && this.stepNumber < 8) {
      this.stepNumber++;
      this.animationDirection = 'forward';
    } else if(event.direction === 7 && this.stepNumber > 1) {
      this.stepNumber--;
      this.animationDirection = 'backward';
    }
  }

  changeThemeColor(newThemeColor: string) {
    this.selectedThemeColor = newThemeColor;
  }

  // onImplementationChange(event) {
  //   console.warn(event.value.id);
  // }

  onClose() {
    this.dialogRef.close(true);
  }
}
