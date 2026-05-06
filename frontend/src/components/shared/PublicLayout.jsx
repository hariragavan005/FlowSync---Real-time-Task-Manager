import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

const PublicLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />
      <main className="flex-1 flex flex-col relative">
        <Outlet />
      </main>
      {!isAuthPage && <PublicFooter />}
    </div>
  );
};

export default PublicLayout;
