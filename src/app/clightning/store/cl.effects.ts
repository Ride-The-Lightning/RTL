import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, withLatestFrom } from 'rxjs/operators';

import { environment, API_URL } from '../../../environments/environment';
import { LoggerService } from '../../shared/services/logger.service';
import { GetInfoCL, FeesCL } from '../../shared/models/clModels';

import * as fromRTLReducer from '../../store/rtl.reducers';
import * as RTLActions from '../../store/rtl.actions';

@Injectable()
export class CLEffects implements OnDestroy {
	dialogRef: any;
	CHILD_API_URL = API_URL + '/cl';

	constructor(
		private actions$: Actions,
		private httpClient: HttpClient,
		private store: Store<fromRTLReducer.RTLState>,
		private logger: LoggerService) { }

	@Effect()
	infoFetchCL = this.actions$.pipe(
		ofType(RTLActions.FETCH_CL_INFO),
		withLatestFrom(this.store.select('root')),
		mergeMap(([action, store]) => {
			this.store.dispatch(new RTLActions.ClearEffectErrorCl('FetchCLInfo'));
			return this.httpClient.get<GetInfoCL>(this.CHILD_API_URL + environment.GETINFO_API)
				.pipe(
					map((info) => {
            this.logger.info(info);
            let chainObj = {chain: '', network: ''};
            if (info.network === 'testnet') {
              chainObj.chain = 'Bitcoin';
              chainObj.network = 'Testnet';
            } else if (info.network === 'bitcoin') {
              chainObj.chain = 'Bitcoin';
              chainObj.network = 'Mainnet';
            } else if (info.network === 'litecoin') {
              chainObj.chain = 'Litecoin';
              chainObj.network = 'Mainnet';
            } else if (info.network === 'litecoin-testnet') {
              chainObj.chain = 'Litecoin';
              chainObj.network = 'Testnet';
            }
						sessionStorage.setItem('clUnlocked', 'true');
						const node_data = {
							identity_pubkey: info.id,
							alias: info.alias,
							testnet: (info.network === 'testnet' || info.network === 'litecoin-testnet') ? true : false,
							chains: [chainObj],
							version: info.version,
							currency_unit: 'BTC',
							smaller_currency_unit: 'Sats',
							numberOfPendingChannels: info.num_pending_channels
						};
						this.store.dispatch(new RTLActions.SetNodeData(node_data));
						return {
							type: RTLActions.SET_CL_INFO,
							payload: (undefined !== info) ? info : {}
						};
					}),
					catchError((err) => {
						this.logger.error(err);
						this.store.dispatch(new RTLActions.EffectErrorCl({ action: 'FetchCLInfo', code: err.status, message: err.error.error }));
						return of();
					})
				);
		}
		));

	@Effect()
	fetchFeesCL = this.actions$.pipe(
		ofType(RTLActions.FETCH_CL_FEES),
		mergeMap((action: RTLActions.FetchCLFees) => {
			this.store.dispatch(new RTLActions.ClearEffectErrorCl('FetchCLFees'));
			return this.httpClient.get<FeesCL>(this.CHILD_API_URL + environment.FEES_API);
		}),
		map((fees) => {
			this.logger.info(fees);
			return {
				type: RTLActions.SET_CL_FEES,
				payload: (undefined !== fees) ? fees : {}
			};
		}),
		catchError((err: any) => {
			this.logger.error(err);
			this.store.dispatch(new RTLActions.EffectErrorCl({ action: 'FetchCLFees', code: err.status, message: err.error.error }));
			return of();
		}
		));

	ngOnDestroy() { }

}
