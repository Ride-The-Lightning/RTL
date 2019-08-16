import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { AuthGuard } from '../shared/services/auth.guard';

import { ClRootComponent } from './cl-root.component';
import { HomeComponent } from './home/home.component';

export const clRoutes: Routes = [
  { path: '', redirectTo: '.', pathMatch: 'full', canActivate: [AuthGuard]},
  { path: '.', component: ClRootComponent, canActivate: [AuthGuard] },
  { path: './home', component: HomeComponent, canActivate: [AuthGuard] }
];

export const clRouting: ModuleWithProviders = RouterModule.forChild(clRoutes);
