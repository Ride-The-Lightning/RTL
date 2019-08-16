import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { ServerConfigComponent } from './shared/components/server-config/server-config.component';
import { HelpComponent } from './shared/components/help/help.component';
import { SigninComponent } from './shared/components/signin/signin.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { SsoFailedComponent } from './shared/components/sso-failed/sso-failed.component';
import { AuthGuard } from './shared/services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/lnd', pathMatch: 'full' },
  { path: 'lnd', loadChildren: () => import('./lnd/lnd.module').then(childModule => childModule.LndModule)},
  { path: 'cl', loadChildren: () => import('./c-lightning/cl.module').then(childModule => childModule.ClModule)},
  { path: 'sconfig', component: ServerConfigComponent, canActivate: [AuthGuard] },
  { path: 'login', component: SigninComponent },
  { path: 'help', component: HelpComponent },
  { path: 'ssoerror', component: SsoFailedComponent },
  { path: '**', component: NotFoundComponent }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
