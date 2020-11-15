import { Component, OnInit, Input } from '@angular/core';
import { LoopQuote } from '../../../shared/models/loopModels';


@Component({
  selector: 'rtl-boltz-quote',
  templateUrl: './boltz-quote.component.html',
  styleUrls: ['./boltz-quote.component.scss']
})
export class BoltzQuoteComponent implements OnInit {
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
