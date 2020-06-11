import { Component, OnInit, Input } from '@angular/core';
import { LoopQuote } from '../../../shared/models/loopModels';
import { SwapProviderEnum } from '../../../shared/services/consts-enums-functions';


@Component({
  selector: 'rtl-loop-quote',
  templateUrl: './loop-quote.component.html',
  styleUrls: ['./loop-quote.component.scss']
})
export class LoopQuoteComponent implements OnInit {
  @Input() quote: LoopQuote = {};
  @Input() termCaption = '';
  @Input() showPanel = true;
  @Input() panelExpanded = false;
  @Input() swapProvider: SwapProviderEnum;
  public flgShowPanel = false;
  public swapProviderEnum = SwapProviderEnum;

  constructor() {}

  ngOnInit() {
    setTimeout(() => { this.flgShowPanel = true; }, 1200);
  }

}
