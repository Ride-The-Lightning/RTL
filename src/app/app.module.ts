import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

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
import { CommonService } from './shared/services/common.service';
import { BoltzService } from './shared/services/boltz.service';

import { RTLReducer } from './store/rtl.reducers';
import { RTLEffects } from './store/rtl.effects';
import { LNDEffects } from './lnd/store/lnd.effects';
import { CLEffects } from './clightning/store/cl.effects';
import { ECLEffects } from './eclair/store/ecl.effects';
import { LayoutModule } from '@angular/cdk/layout';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    routing,
    LayoutModule,
    HammerModule,
    UserIdleModule.forRoot({idle: 3590, timeout: 10, ping: 12000}), // One hour
    StoreModule.forRoot(RTLReducer, {
      runtimeChecks: {
        strictStateImmutability: false,
        strictActionImmutability: false
      }
    }),
    EffectsModule.forRoot([RTLEffects, LNDEffects, CLEffects, ECLEffects]),
    !environment.production ? StoreDevtoolsModule.instrument() : []
  ],
  declarations: [AppComponent],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    AuthGuard, SessionService, DataService, LoopService, CommonService, BoltzService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
