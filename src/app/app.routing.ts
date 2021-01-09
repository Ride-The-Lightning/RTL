import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { SettingsComponent } from './shared/components/settings/settings.component';
import { AppSettingsComponent } from './shared/components/settings/app-settings/app-settings.component';
import { AuthSettingsComponent } from './shared/components/settings/auth-settings/auth-settings.component';
import { ServerConfigComponent } from './shared/components/settings/server-config/server-config.component';
import { ServicesComponent } from './shared/components/services/services.component';
import { LoopComponent } from './shared/components/services/loop/loop.component';
import { BoltzRootComponent } from './shared/components/services/boltz/boltz-root.component';
import { HelpComponent } from './shared/components/help/help.component';
import { LoginComponent } from './shared/components/login/login.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { ErrorComponent } from './shared/components/error/error.component';
import { AuthGuard } from './shared/services/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'lnd' },
  { path: 'lnd', loadChildren: () => import('./lnd/lnd.module').then(childModule => childModule.LNDModule), canActivate: [AuthGuard] },
  { path: 'cl', loadChildren: () => import('./clightning/cl.module').then(childModule => childModule.CLModule), canActivate: [AuthGuard] },
  { path: 'ecl', loadChildren: () => import('./eclair/ecl.module').then(childModule => childModule.ECLModule), canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard], children: [
    { path: '', pathMatch: 'full', redirectTo: 'layout' },
    { path: 'layout', component: AppSettingsComponent, canActivate: [AuthGuard] },
    { path: 'auth', component: AuthSettingsComponent, canActivate: [AuthGuard] },
    { path: 'lnconfig', component: ServerConfigComponent, canActivate: [AuthGuard] },
    { path: 'bconfig', component: ServerConfigComponent, canActivate: [AuthGuard] }
  ]},
  { path: 'services', component: ServicesComponent, canActivate: [AuthGuard], children: [
    { path: '', pathMatch: 'full', redirectTo: 'loop' },
    { path: 'loop', pathMatch: 'full', redirectTo: 'loop/loopout' },
    { path: 'loop/:selTab', component: LoopComponent },
    { path: 'boltz', pathMatch: 'full', redirectTo: 'boltz/swapout' },
    { path: 'boltz/:selTab', component: BoltzRootComponent },
  ]},
  { path: 'help', component: HelpComponent },
  { path: 'login', component: LoginComponent },
  { path: 'error', component: ErrorComponent },
  { path: '**', component: NotFoundComponent } 
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forRoot(routes);
