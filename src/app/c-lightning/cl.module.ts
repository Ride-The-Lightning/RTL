import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { environment } from '../../environments/environment';
import { SharedModule } from '../shared/shared.module';

import { clRouting } from './cl.routing';
import { ClRootComponent } from './cl-root.component';
import { HomeComponent } from './home/home.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    clRouting,
    NgxChartsModule,
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
