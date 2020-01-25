import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { UserIdleModule } from 'angular-user-idle';
import { OverlayContainer } from '@angular/cdk/overlay';
import { routing } from './app.routing';
import { SharedModule } from './shared/shared.module';
import { ThemeOverlay } from './shared/theme/overlay-container/theme-overlay';
import { AppComponent } from './app.component';

import { environment } from '../environments/environment';
import { SessionService } from './shared/services/session.service';
import { CommonService } from './shared/services/common.service';
import { LoopService } from './shared/services/loop.service';
import { LoggerService, ConsoleLoggerService } from './shared/services/logger.service';
import { AuthGuard } from './shared/services/auth.guard';
import { AuthInterceptor } from './shared/services/auth.interceptor';

import { RTLReducer } from './store/rtl.reducers';
import { RTLEffects } from './store/rtl.effects';
import { LNDEffects } from './lnd/store/lnd.effects';
import { CLEffects } from './clightning/store/cl.effects';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LayoutModule } from '@angular/cdk/layout';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    routing,
    UserIdleModule.forRoot({idle: 60 * 60, timeout: 1, ping: null}),
    StoreModule.forRoot(RTLReducer),
    EffectsModule.forRoot([RTLEffects, LNDEffects, CLEffects]),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    LayoutModule
  ],
  declarations: [
    AppComponent
  ],
  providers: [
    { provide: LoggerService, useClass: ConsoleLoggerService },
    { provide: OverlayContainer, useClass: ThemeOverlay },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    CommonService, AuthGuard, SessionService, LoopService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
