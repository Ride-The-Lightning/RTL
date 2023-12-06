import { HammerModule } from '@angular/platform-browser';
import { NgModule, isDevMode } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { provideUserIdleConfig } from 'angular-user-idle';
import { routing } from './app.routing';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';

import { AuthInterceptor } from './shared/services/auth.interceptor';
import { SessionService } from './shared/services/session.service';
import { LoopService } from './shared/services/loop.service';
import { DataService } from './shared/services/data.service';
import { WebSocketClientService } from './shared/services/web-socket.service';
import { CommonService } from './shared/services/common.service';
import { BoltzService } from './shared/services/boltz.service';

import { RTLEffects } from './store/rtl.effects';
import { LNDEffects } from './lnd/store/lnd.effects';
import { CLNEffects } from './cln/store/cln.effects';
import { ECLEffects } from './eclair/store/ecl.effects';
import { RootReducer } from './store/rtl.reducers';
import { LNDReducer } from './lnd/store/lnd.reducers';
import { CLNReducer } from './cln/store/cln.reducers';
import { ECLReducer } from './eclair/store/ecl.reducers';
import { HOUR_SECONDS } from './shared/services/consts-enums-functions';

let isDevEnvironemt = false;
if (isDevMode()) { isDevEnvironemt = true; }

@NgModule({
  imports: [
    BrowserAnimationsModule,
    SharedModule,
    routing,
    LayoutModule,
    HammerModule,
    StoreModule.forRoot(
      { root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer },
      {
        runtimeChecks: {
          strictStateImmutability: false,
          strictActionImmutability: false
        }
      }),
    EffectsModule.forRoot([RTLEffects, LNDEffects, CLNEffects, ECLEffects]),
    isDevEnvironemt ? StoreDevtoolsModule.instrument({ connectInZone: true }) : []
  ],
  declarations: [AppComponent],
  providers: [
    provideUserIdleConfig({ idle: (HOUR_SECONDS - 10), timeout: 10, ping: 12000 }),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    SessionService, DataService, WebSocketClientService, LoopService, CommonService, BoltzService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
