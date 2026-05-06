import React from 'react';
import { ClockIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

const PublicFooter = () => {
  return (
    <footer className="bg-[#0f172a] text-white pt-24 pb-8 overflow-hidden relative">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-[#059669] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] bg-[#047857] rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Left Column: Logo & Description (4 cols) */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-6 cursor-pointer">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                <ClockIcon className="w-6 h-6" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col justify-center leading-none">
                <span className="font-['Outfit'] font-bold text-2xl tracking-tight text-white lowercase mb-[-2px]">task</span>
                <span className="font-['Outfit'] font-medium text-[9px] tracking-[0.35em] text-emerald-400 uppercase ml-[1px]">MANAGER</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm">
              The premium, modern platform designed to help teams work together more efficiently. Manage your projects, track progress, and hit deadlines with ease.
            </p>
          </div>

          {/* Middle Columns: Links (4 cols total, 2x2) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-white font-bold mb-5 uppercase text-xs tracking-widest">About</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Our Story</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-5 uppercase text-xs tracking-widest">Features</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Task Tracking</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Team Collaboration</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Analytics</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Integrations</a></li>
              </ul>
            </div>
          </div>

          {/* Right Column: Newsletter & Social (4 cols) */}
          <div className="lg:col-span-4">
            <h4 className="text-white font-bold mb-5 uppercase text-xs tracking-widest">Stay Updated</h4>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to our newsletter for the latest updates and features.
            </p>
            <form className="flex mb-8">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-4 py-3 rounded-l-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white/10 transition-all text-sm"
                required
              />
              <button 
                type="submit" 
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-3 rounded-r-xl font-bold transition-colors text-sm shadow-lg shadow-emerald-500/20"
              >
                Subscribe
              </button>
            </form>

            <h4 className="text-white font-bold mb-5 uppercase text-xs tracking-widest">Connect</h4>
            <div className="flex space-x-4">
              {['Twitter', 'LinkedIn', 'GitHub', 'YouTube'].map((social) => (
                <a key={social} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all text-gray-400 shadow-sm border border-white/5 hover:border-emerald-500">
                  <span className="text-[10px] uppercase font-bold">{social.substring(0,2)}</span>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Row */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} TaskManager Inc. All rights reserved.</p>
          <div className="flex space-x-6 font-medium">
            <a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
