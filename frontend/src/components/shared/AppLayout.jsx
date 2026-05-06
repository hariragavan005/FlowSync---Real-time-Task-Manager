import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import GlobalNavbar from './GlobalNavbar';
import PublicFooter from './PublicFooter';

const isAuthRoute = (path) => ['/login', '/signup'].includes(path);
const isDashboardRoute = (path) => path.startsWith('/dashboard') || path.startsWith('/projects') || path === '/profile';

const AppLayout = () => {
  const { pathname } = useLocation();
  const showFooter = !isAuthRoute(pathname) && !isDashboardRoute(pathname);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <GlobalNavbar />
      <main className="flex-1 flex flex-col relative">
        <Outlet />
      </main>
      {showFooter && <PublicFooter />}
    </div>
  );
};

export default AppLayout;
