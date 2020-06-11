import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { SettingsComponent } from './shared/components/settings/settings.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { HelpComponent } from './shared/components/help/help.component';
import { LoginComponent } from './shared/components/login/login.component';
import { ErrorComponent } from './shared/components/error/error.component';
import { AuthGuard } from './shared/services/auth.guard';

export const routes: Routes = [
  { path: 'lnd', loadChildren: () => import('./lnd/lnd.module').then(childModule => childModule.LNDModule), canActivate: [AuthGuard] },
  { path: 'cl', loadChildren: () => import('./clightning/cl.module').then(childModule => childModule.CLModule), canActivate: [AuthGuard] },
  { path: 'eclr', loadChildren: () => import('./eclair/eclr.module').then(childModule => childModule.ECLRModule), canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  { path: 'help', component: HelpComponent },
  { path: 'login', component: LoginComponent },
  { path: 'error', component: ErrorComponent },
  { path: '**', component: NotFoundComponent } 
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
