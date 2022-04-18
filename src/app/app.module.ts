import { HammerModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { UserIdleModule } from 'angular-user-idle';
import { routing } from './app.routing';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';

import { environment } from '../environments/environment';
import { AuthGuard } from './shared/services/auth.guard';
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

@NgModule({
  imports: [
    BrowserAnimationsModule,
    SharedModule,
    routing,
    LayoutModule,
    HammerModule,
    UserIdleModule.forRoot({ idle: 3590, timeout: 10, ping: 12000 }), // One hour
    StoreModule.forRoot(
      { root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer },
      {
        runtimeChecks: {
          strictStateImmutability: false,
          strictActionImmutability: false
        }
      }),
    EffectsModule.forRoot([RTLEffects, LNDEffects, CLNEffects, ECLEffects]),
    !environment.production ? StoreDevtoolsModule.instrument() : []
  ],
  declarations: [AppComponent],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    AuthGuard, SessionService, DataService, WebSocketClientService, LoopService, CommonService, BoltzService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
