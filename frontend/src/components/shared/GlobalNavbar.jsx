import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  ClockIcon, PlusIcon, Bars3Icon, XMarkIcon,
  UserCircleIcon, Squares2X2Icon, ArrowRightOnRectangleIcon,
  Cog6ToothIcon, ChevronDownIcon
} from '@heroicons/react/24/solid';
import CreateProjectModal from '../projects/CreateProjectModal';

const GlobalNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    window.addEventListener('scroll', onScroll);
    document.addEventListener('mousedown', onClickOutside);
    return () => { window.removeEventListener('scroll', onScroll); document.removeEventListener('mousedown', onClickOutside); };
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleProtectedNav = (action) => {
    if (!user) return navigate('/login');
    if (action === 'create') setModalOpen(true);
    if (action === 'join') {
      navigate('/');
      setTimeout(() => document.getElementById('join-project')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    ...(user ? [{ label: 'Dashboard', href: '/dashboard' }] : []),
    { label: 'Services', href: '/#services' },
    { label: 'About', href: '/#about' },
    { label: 'Contact', href: '/#contact' },
  ];

  const dropdownItems = [
    { icon: UserCircleIcon, label: 'Profile', action: () => navigate('/profile') },
    { icon: Squares2X2Icon, label: 'Dashboard', action: () => navigate('/dashboard') },
    ...(user?.role === 'Admin' ? [{ icon: Cog6ToothIcon, label: 'Manage Projects', action: () => navigate('/dashboard') }] : []),
    { icon: ArrowRightOnRectangleIcon, label: 'Logout', action: handleLogout, danger: true },
  ];

  return (
    <>
      <CreateProjectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <nav className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8">
        <div className={`mx-auto max-w-6xl rounded-full transition-all duration-500 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/70'
            : 'bg-white/60 backdrop-blur-md shadow-sm border border-white/40'
        }`}>
          <div className="flex justify-between items-center h-16 px-5 lg:px-8">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#1e40af] to-[#3b82f6] flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
                <ClockIcon className="w-4 h-4" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-2 h-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-['Outfit'] font-bold text-xl tracking-tight text-[#1e40af] lowercase mb-[-2px]">task</span>
                <span className="font-['Outfit'] font-medium text-[8px] tracking-[0.35em] text-gray-500 uppercase">MANAGER</span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex flex-1 justify-center items-center gap-0.5">
              {navLinks.map(link => (
                link.href.startsWith('/#') ? (
                  <motion.a key={link.label} href={link.href}
                    whileHover={{ scale: 1.04, backgroundColor: 'rgba(16,185,129,0.08)', color: '#047857' }}
                    className="px-4 py-2 rounded-full text-[13px] font-semibold text-gray-600 transition-colors duration-200">
                    {link.label}
                  </motion.a>
                ) : (
                  <motion.div key={link.label} whileHover={{ scale: 1.04 }}>
                    <Link to={link.href}
                      className={`block px-4 py-2 rounded-full text-[13px] font-semibold transition-colors duration-200 ${
                        location.pathname === link.href
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}>
                      {link.label}
                    </Link>
                  </motion.div>
                )
              ))}
              {user && (
                <motion.button onClick={() => handleProtectedNav('join')}
                  whileHover={{ scale: 1.04, backgroundColor: 'rgba(16,185,129,0.08)', color: '#047857' }}
                  className="px-4 py-2 rounded-full text-[13px] font-semibold text-gray-600 transition-colors duration-200">
                  Join Project
                </motion.button>
              )}
            </div>

            {/* Right CTAs */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              {user ? (
                <>
                    <motion.button onClick={() => setModalOpen(true)}
                      whileHover={{ scale: 1.05, boxShadow: '0 8px 20px -4px rgba(16,185,129,0.4)' }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-1.5 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2 rounded-full shadow-md shadow-emerald-500/20">
                      <PlusIcon className="w-4 h-4" /> Create Project
                    </motion.button>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <motion.button onClick={() => setDropdownOpen(v => !v)} whileHover={{ scale: 1.03 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 transition-all text-sm font-semibold text-gray-700 shadow-sm">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <span>Hi, {user.name?.split(' ')[0]}</span>
                      <ChevronDownIcon className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </motion.button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -8 }}
                          transition={{ duration: 0.14, ease: 'easeOut' }}
                          className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-2xl border border-white/70 rounded-2xl shadow-2xl overflow-hidden z-50">
                          <div className="px-4 py-3 border-b border-gray-100/80">
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            <span className={`mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${user?.role === 'Admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                              {user?.role}
                            </span>
                          </div>
                          <div className="p-1.5">
                            {dropdownItems.map(item => (
                              <button key={item.label} onClick={() => { item.action(); setDropdownOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                  item.danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}>
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : !isAuthPage && (
                <>
                  <motion.div whileHover={{ scale: 1.04 }}>
                    <Link to="/login" className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-emerald-700 rounded-full hover:bg-emerald-50 transition">Login</Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.04 }}>
                    <Link to="/signup" className="text-sm font-bold bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-5 py-2 rounded-full transition shadow-sm">Signup</Link>
                  </motion.div>
                  <motion.button onClick={() => handleProtectedNav('create')}
                    whileHover={{ scale: 1.05, boxShadow: '0 8px 20px -4px rgba(16,185,129,0.4)' }}
                    className="flex items-center gap-1.5 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full shadow-md">
                    <PlusIcon className="w-4 h-4" /> New Project
                  </motion.button>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(v => !v)}
              className="lg:hidden p-2 rounded-full bg-white/60 hover:bg-white/90 text-gray-600 transition">
              {mobileOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="lg:hidden absolute top-20 left-4 right-4 bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-2xl overflow-hidden z-40">
              <div className="p-4 space-y-1">
                {navLinks.map(link => (
                  link.href.startsWith('/#') ? (
                    <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition">
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.label} to={link.href} onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition">
                      {link.label}
                    </Link>
                  )
                ))}
                {user && <button onClick={() => { handleProtectedNav('join'); setMobileOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition">
                  Join Project
                </button>}
                <div className="border-t border-gray-100 mt-2 pt-3 space-y-2">
                  {user ? (
                    <>
                      <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition">Profile</Link>
                        <button onClick={() => { setModalOpen(true); setMobileOpen(false); }}
                          className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white">+ Create Project</button>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition">Logout</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-bold text-center bg-gray-50 hover:bg-gray-100 text-gray-700 transition">Login</Link>
                      <Link to="/signup" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-bold text-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white">Signup</Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default GlobalNavbar;
