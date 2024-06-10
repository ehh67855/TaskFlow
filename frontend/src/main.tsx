import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';

import LayoutPage from './layout/LayoutPage';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import LandingPage from './landingPage/LandingPage';
import RegisterPage from './register/RegisterPage';
import Login from './login/Login';
import NotFound from './notFound/NotFound';
import AppRoutes from './app/AppRoutes';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);
