 // src/routes.js
import { lazy } from 'react';

// Importazione lazy per migliorare le performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const NegoziPage = lazy(() => import('./pages/NegoziPage'));
const NegozioFormPage = lazy(() => import('./pages/NegozioFormPage'));
const DipendentiPage = lazy(() => import('./pages/DipendentiPage'));
const DipendenteFormPage = lazy(() => import('./pages/DipendenteFormPage'));
const TurniListPage = lazy(() => import('./pages/TurniListPage'));
const TurniEditorPage = lazy(() => import('./pages/TurniEditorPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));

// Definizione delle route dell'applicazione
export const routes = [
  {
    path: '/',
    exact: true,
    redirectTo: '/dashboard',
    protected: true
  },
  {
    path: '/login',
    component: LoginPage,
    exact: true,
    protected: false
  },
  {
    path: '/register',
    component: RegisterPage,
    exact: true,
    protected: false
  },
  {
    path: '/dashboard',
    component: DashboardPage,
    exact: true,
    protected: true
  },
  {
    path: '/negozi',
    component: NegoziPage,
    exact: true,
    protected: true
  },
  {
    path: '/negozi/nuovo',
    component: NegozioFormPage,
    exact: true,
    protected: true
  },
  {
    path: '/negozi/:id',
    component: NegozioFormPage,
    exact: true,
    protected: true
  },
  {
    path: '/negozi/:negozioId/dipendenti',
    component: DipendentiPage,
    exact: true,
    protected: true
  },
  {
    path: '/negozi/:negozioId/dipendenti/nuovo',
    component: DipendenteFormPage,
    exact: true,
    protected: true
  },
  {
    path: '/negozi/:negozioId/dipendenti/:id',
    component: DipendenteFormPage,
    exact: true,
    protected: true
  },
  {
    path: '/negozi/:negozioId/turni',
    component: TurniListPage,
    exact: true,
    protected: true
  },
  {
    path: '/negozi/:negozioId/turni/:anno/:mese',
    component: TurniEditorPage,
    exact: true,
    protected: true
  },
  {
    path: '/impostazioni',
    component: SettingsPage,
    exact: true,
    protected: true
  },
  {
    path: '/error',
    component: ErrorPage,
    exact: true,
    protected: false
  },
  {
    path: '*',
    component: NotFoundPage,
    protected: false
  }
];