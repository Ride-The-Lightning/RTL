import { Component, OnInit, Input } from '@angular/core';
import { LoopQuote } from '../../../../models/loopModels';

@Component({
  selector: 'rtl-boltz-swap-quote',
  templateUrl: './swap-quote.component.html',
  styleUrls: ['./swap-quote.component.scss']
})
export class SwapQuoteComponent implements OnInit {
  @Input() quote: LoopQuote = {};
  @Input() termCaption = '';
  @Input() showPanel = true;
  @Input() panelExpanded = false;
  public flgShowPanel = false;

  constructor() {}

  ngOnInit() {
    setTimeout(() => { this.flgShowPanel = true; }, 1200);
  }

}
