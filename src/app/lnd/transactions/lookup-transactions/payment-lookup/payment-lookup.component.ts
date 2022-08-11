import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

import { Payment, PayRequest } from '../../../../shared/models/lndModels';
import { DataService } from '../../../../shared/services/data.service';

@Component({
  selector: 'rtl-payment-lookup',
  templateUrl: './payment-lookup.component.html',
  styleUrls: ['./payment-lookup.component.scss']
})
export class PaymentLookupComponent implements OnInit, OnDestroy {

  @Input() payment: Payment;
  public paths = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private dataService: DataService) { }

  ngOnInit() {
    if (this.payment.htlcs && this.payment.htlcs[0] && this.payment.htlcs[0].route && this.payment.htlcs[0].route.hops && this.payment.htlcs[0].route.hops.length > 0) {
      const nodePubkeys = this.payment.htlcs[0].route.hops.reduce((pubkeys, hop) => (pubkeys === '' ? hop.pub_key : pubkeys + ',' + hop.pub_key), '');
      this.dataService.getAliasesFromPubkeys(nodePubkeys, true).pipe(takeUntil(this.unSubs[0])).
        subscribe((nodes: any) => {
          this.paths = nodes.reduce((pathAliases, node) => (pathAliases === '' ? node : pathAliases + '\n' + node), '');
        });
    }
    if (this.payment.payment_request && this.payment.payment_request.trim() !== '') {
      this.dataService.decodePayment(this.payment.payment_request, false).
        pipe(take(1)).subscribe((decodedPayment: PayRequest) => {
          if (decodedPayment && decodedPayment.description && decodedPayment.description !== '') {
            this.payment.description = decodedPayment.description;
          }
        });
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
