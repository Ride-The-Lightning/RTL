import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { CLRootComponent } from './cl-root.component';
import { CLHomeComponent } from './home/home.component';

import { CLUnlockedGuard } from '../shared/services/auth.guard';
import { NotFoundComponent } from '../shared/components/not-found/not-found.component';

export const ClRoutes: Routes = [
  { path: '', component: CLRootComponent,
    children: [
    { path: 'home', component: CLHomeComponent, canActivate: [CLUnlockedGuard] },
    { path: '**', component: NotFoundComponent }
  ]}
];

export const CLRouting: ModuleWithProviders = RouterModule.forChild(ClRoutes);
