import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ECLRRouting } from './eclr.routing';
import { SharedModule } from '../shared/shared.module';

import { ECLRRootComponent } from './eclr-root.component';
import { ECLRHomeComponent } from './home/home.component';
import { ECLRUnlockedGuard } from '../shared/services/auth.guard';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ECLRRouting
  ],
  declarations: [
    ECLRRootComponent,
    ECLRHomeComponent
  ],
  providers: [
    ECLRUnlockedGuard
  ],
  bootstrap: [ECLRRootComponent]
})
export class ECLRModule {}
