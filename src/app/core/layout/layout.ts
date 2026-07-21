import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="brand-mark">M</span>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">Clases</a>
          <a routerLink="/editor" routerLinkActive="active" class="nav-item">Gestion de contenido</a>
          <a routerLink="/resultados" routerLinkActive="active" class="nav-item">Rendimiento global</a>
        </nav>
        <div class="sidebar-footer">
          <a routerLink="/" class="nav-item logout">Cerrar sesión</a>
        </div>
      </aside>
      <main class="main-area">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .shell { display: flex; min-height: 100vh; }
    .sidebar {
      width: 200px;
      flex-shrink: 0;
      background: var(--white);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 1.5rem 0;
      position: fixed; top: 0; left: 0; height: 100vh;
    }
    .sidebar-brand {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1rem;
    }
    .brand-mark {
      width: 28px; height: 28px;
      background: var(--accent); color: var(--white);
      font-family: var(--font-serif); font-size: 0.85rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border-radius: 2px;
    }
    .brand-label {
      font-family: var(--font-serif); font-size: 0.95rem; font-weight: 600;
      color: var(--text-primary);
    }
    .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; padding: 0 0.75rem; }
    .nav-item {
      display: block; padding: 0.5rem 0.6rem;
      color: var(--text-secondary); text-decoration: none;
      font-size: 0.875rem; font-weight: 500;
      border-radius: var(--radius);
      transition: background 0.15s, color 0.15s;
    }
    .nav-item:hover { background: var(--bg-page); color: var(--text-primary); }
    .nav-item.active { background: var(--bg-page); color: var(--accent); font-weight: 600; }
    .sidebar-footer { padding: 0.75rem; border-top: 1px solid var(--border); margin-top: 1rem; }
    .logout { font-size: 0.8rem; color: var(--text-secondary); }
    .logout:hover { color: var(--alert); }
    .main-area {
      margin-left: 200px; flex: 1;
      padding: 2rem;
      max-width: 1200px;
    }
  `]
})
export class LayoutComponent {}
