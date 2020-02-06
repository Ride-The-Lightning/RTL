import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, of, Observable } from 'rxjs';
import { take, map, takeUntil, catchError } from 'rxjs/operators';
import { environment, API_URL } from '../../../environments/environment';

@Injectable()
export class DataService implements OnInit, OnDestroy {
  private CHILD_API_URL = API_URL + '/lnd';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private httpClient: HttpClient) {}

  ngOnInit() {}

  getFiatRates() {
    return this.httpClient.get(environment.CONF_API + '/rates');
  }

  getAliasesFromPubkeys(pubkeys: any) {
    let nodes$: Array<Observable<any>> = [];
    pubkeys.forEach(pubkey => {
      nodes$.push(
        this.httpClient.get(this.CHILD_API_URL + environment.NETWORK_API + '/node/' + pubkey)
        .pipe(takeUntil(this.unSubs[0]),
        catchError(err => of({node: {alias: pubkey}})))
      );
    });
    return nodes$;
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
