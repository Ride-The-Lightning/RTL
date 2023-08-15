import { OverlayContainer } from '@angular/cdk/overlay';
import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { Directive, Inject, OnDestroy } from '@angular/core';

@Directive()
export class ThemeOverlay extends OverlayContainer implements OnDestroy {

  constructor(@Inject(DOCUMENT) document: Document, _platform: Platform) {
    super(document, _platform);
  }

  protected _createContainer(): void {
    super._createContainer();
    if (!this._containerElement) { return; }
    const parent = document.querySelector('#rtl-container') || document.body;
    parent.appendChild(this._containerElement);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

}
