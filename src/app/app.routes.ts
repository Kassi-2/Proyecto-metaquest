import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { LayoutComponent } from './core/layout/layout';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ClaseConfigComponent } from './pages/clase-config/clase-config';
import { EditorComponent } from './pages/editor/editor';
import { ResultadosComponent } from './pages/resultados/resultados';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, 
  { path: 'login', component: LoginComponent },

  // Rutas Protegidas
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'clase-config/:id', component: ClaseConfigComponent },
      { path: 'editor', component: EditorComponent },
      { path: 'editor/:id', component: EditorComponent },
      { path: 'resultados', component: ResultadosComponent },
    ],
  },
  //
  { path: '**', redirectTo: 'login' },
];
