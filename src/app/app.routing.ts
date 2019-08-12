import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

export const routes: Routes = [
  { path: '', loadChildren: () => import('./lnd/lnd.module').then(childModule => childModule.LndModule)},
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
