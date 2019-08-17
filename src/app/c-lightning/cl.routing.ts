import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { AuthGuard } from '../shared/services/auth.guard';
import { NotFoundComponent } from '../shared/components/not-found/not-found.component';

import { ClRootComponent } from './cl-root.component';
import { HomeComponent } from './home/home.component';

export const clRoutes: Routes = [
  { path: '', component: ClRootComponent,
    children: [
      { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
      { path: '**', component: NotFoundComponent }      
    ]
  }  
];

export const clRouting: ModuleWithProviders = RouterModule.forChild(clRoutes);
