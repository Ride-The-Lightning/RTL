import { Injectable } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

@Injectable()
export class ThemeOverlay extends OverlayContainer {

  _createContainer(): void {
    const container = document.createElement('div');
    container.classList.add('cdk-overlay-container');
    document.getElementById('rtl-container').appendChild(container);
    this._containerElement = container;
  }

}
