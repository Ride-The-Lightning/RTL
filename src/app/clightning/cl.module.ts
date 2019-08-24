import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CLRouting } from './cl.routing';
import { SharedModule } from '../shared/shared.module';

import { CLRootComponent } from './cl-root.component';
import { CLHomeComponent } from './home/home.component';

import { CommonService } from '../shared/services/common.service';
import { LoggerService, ConsoleLoggerService } from '../shared/services/logger.service';
import { CLUnlockedGuard } from '../shared/services/auth.guard';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    CLRouting
  ],
  declarations: [
    CLRootComponent,
    CLHomeComponent
  ],
  providers: [
    { provide: LoggerService, useClass: ConsoleLoggerService },
    CLUnlockedGuard,
    CommonService
  ],
  bootstrap: [CLRootComponent]
})
export class CLModule {}
