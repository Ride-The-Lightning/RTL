import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';

import { environment } from '../../environments/environment';
import { SharedModule } from '../shared/shared.module';
import { CLReducer } from './store/cl.reducers';
import { CLEffects } from './store/cl.effects';

import { clRouting } from './cl.routing';
import { ClRootComponent } from './cl-root.component';
import { HomeComponent } from './home/home.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    clRouting,
    NgxChartsModule,
    EffectsModule.forFeature([CLEffects]),
    StoreModule.forFeature('cl', CLReducer),
    !environment.production ? StoreDevtoolsModule.instrument() : []
  ],
  declarations: [
    ClRootComponent,
    HomeComponent
  ],
  providers: [],
  bootstrap: [ClRootComponent]
})
export class ClModule {}
