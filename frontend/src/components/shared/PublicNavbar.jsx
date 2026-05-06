import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ClockIcon, Bars3Icon, XMarkIcon, PlusIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import CreateProjectModal from '../projects/CreateProjectModal';

const PublicNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProtectedAction = (action) => {
    setIsOpen(false);
    if (!user) return navigate('/login');
    if (action === 'create') setModalOpen(true);
    if (action === 'join') {
      const el = document.getElementById('join-project');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { name: 'Home', href: '/#home' },
    { name: 'About Us', href: '/#about' },
    { name: 'Services', href: '/#services' },
    { name: 'Contact Us', href: '/#contact' },
  ];

  return (
    <>
      <CreateProjectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <nav className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8">
        <div className={`mx-auto max-w-6xl rounded-full transition-all duration-500 ${
          scrolled ? 'bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/70'
                   : 'bg-white/60 backdrop-blur-md shadow-sm border border-white/40'
        }`}>
          <div className="flex justify-between items-center h-16 px-5 lg:px-8">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#1e40af] to-[#3b82f6] text-white shadow-md transition-transform group-hover:scale-105">
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
            <div className="hidden lg:flex flex-1 justify-center items-center">
              <div className="flex items-center space-x-1">
                {navLinks.map((link) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    whileHover={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#047857', scale: 1.03 }}
                    className="px-4 py-2 rounded-full text-[13px] font-semibold text-gray-600 transition-colors duration-200"
                  >
                    {link.name}
                  </motion.a>
                ))}
                <motion.button
                  onClick={() => handleProtectedAction('join')}
                  whileHover={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#047857', scale: 1.03 }}
                  className="px-4 py-2 rounded-full text-[13px] font-semibold text-gray-600 transition-colors duration-200"
                >
                  Join Project
                </motion.button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center space-x-2 flex-shrink-0">
              {user ? (
                <>
                  <span className="text-sm font-semibold text-gray-600 px-3">Hi, {user.name?.split(' ')[0]}</span>
                  <motion.button
                    onClick={() => handleProtectedAction('create')}
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 15px -3px rgba(16,185,129,0.35)' }}
                    className="flex items-center gap-1.5 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2 rounded-full shadow-md transition-all"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Create Project
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link to="/login" className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-emerald-700 transition rounded-full hover:bg-emerald-50">
                      Login
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link to="/signup" className="text-sm font-bold bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-5 py-2 rounded-full transition shadow-sm">
                      Signup
                    </Link>
                  </motion.div>
                  <motion.button
                    onClick={() => handleProtectedAction('create')}
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 15px -3px rgba(16,185,129,0.35)' }}
                    className="flex items-center gap-1.5 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full shadow-md transition-all"
                  >
                    <PlusIcon className="w-4 h-4" />
                    New Project
                  </motion.button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden lg:hidden p-2 rounded-full bg-white/60 hover:bg-white/90 transition text-gray-600"
            >
              {isOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              className="md:hidden absolute top-20 left-4 right-4 bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-2xl overflow-hidden z-40"
            >
              <div className="p-4 space-y-1">
                {navLinks.map((link) => (
                  <a key={link.name} href={link.href} onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                    {link.name}
                  </a>
                ))}
                <button onClick={() => handleProtectedAction('join')}
                  className="block w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                  Join Project
                </button>
                <div className="pt-3 mt-2 border-t border-gray-100 flex flex-col gap-3">
                  {user ? (
                    <button onClick={() => handleProtectedAction('create')}
                      className="w-full text-center px-4 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md">
                      + Create Project
                    </button>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsOpen(false)} className="w-full text-center px-4 py-3 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition">Login</Link>
                      <Link to="/signup" onClick={() => setIsOpen(false)} className="w-full text-center px-4 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md">Signup</Link>
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

export default PublicNavbar;
