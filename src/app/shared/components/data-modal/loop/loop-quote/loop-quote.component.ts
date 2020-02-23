import { Component, OnInit, Input } from '@angular/core';
import { LoopQuote } from '../../../../models/loopModels';

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
  public flgShowPanel = false;

  constructor() {}

  ngOnInit() {
    setTimeout(() => { this.flgShowPanel = true; }, 1200);
  }

}
