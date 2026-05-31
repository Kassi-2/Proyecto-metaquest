import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ClaseConfigComponent } from './pages/clase-config/clase-config';
import { EditorComponent } from './pages/editor/editor';
import { ResultadosComponent } from './pages/resultados/resultados';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'clase-config/:id', component: ClaseConfigComponent },
  { path: 'editor', component: EditorComponent },
  { path: 'editor/:id', component: EditorComponent },
  { path: 'resultados', component: ResultadosComponent },
  { path: '**', redirectTo: '' },
];
