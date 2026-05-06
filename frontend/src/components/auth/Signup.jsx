import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { showPriorityAlert } from '../../utils/priorityAlerts';
import { EnvelopeIcon, LockClosedIcon, UserIcon, BriefcaseIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Member');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password, role);
      navigate('/');
    } catch (error) {
      showPriorityAlert(error.response?.data?.message || 'Registration failed', 'high');
    }
  };

  return (
    <div className="flex-1 w-full bg-white relative overflow-hidden font-sans flex pt-20">
      {/* Global Background Blobs & Particles */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft Mint Green Blob */}
        <motion.div 
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-100/40 blur-[100px]"
        />
        {/* Small floating bubbles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -30, 0], 
              x: [0, (i % 2 === 0 ? 20 : -20), 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 5 + i, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: i * 0.4
            }}
            className={`absolute rounded-full bg-emerald-400/20 blur-md`}
            style={{
              width: `${25 + i * 10}px`,
              height: `${25 + i * 10}px`,
              top: `${10 + i * 15}%`,
              left: `${65 + i * 8}%`
            }}
          />
        ))}
      </div>
      {/* Left Background Area */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex flex-col items-center justify-center pt-24 absolute top-0 left-0 w-[50%] h-full z-0 bg-[#f4f9f7] pointer-events-none overflow-hidden"
      >
        {/* Artistic Curved Background (Windows-like) */}
        <div className="absolute inset-0 z-0">
          <svg viewBox="0 0 1440 900" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="curveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#059669" stopOpacity="0.8"/>
              </linearGradient>
              <linearGradient id="curveGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.7"/>
              </linearGradient>
            </defs>
            <path d="M0,0 L1440,0 L1440,300 C1100,600 300,100 0,700 Z" fill="url(#curveGrad1)" className="opacity-60 mix-blend-multiply" />
            <path d="M0,900 L1440,900 L1440,500 C1000,800 400,400 0,800 Z" fill="url(#curveGrad2)" className="opacity-70 mix-blend-multiply" />
          </svg>
        </div>
        
        {/* Floating Illustration */}
        <div className="w-[80%] max-w-[420px] z-10 animate-float pointer-events-none relative flex items-center justify-center">
          <img src="/illustration2.png" alt="Team Collaboration" className="w-full h-auto drop-shadow-2xl mix-blend-multiply opacity-95" />
        </div>

        {/* Stylish Text below illustration */}
        <div className="mt-8 text-center z-10 px-8 relative">
          <h3 className="text-2xl font-bold text-gray-800 mb-3 tracking-tight drop-shadow-sm">Streamline Your Work</h3>
          <p className="text-gray-600 text-sm max-w-[280px] mx-auto leading-relaxed font-medium">
            Join thousands of teams managing their workflows and achieving goals faster.
          </p>
          <div className="flex justify-center gap-2 mt-6">
            <span className="w-2 h-1.5 rounded-full bg-emerald-200 shadow-sm"></span>
            <span className="w-6 h-1.5 rounded-full bg-emerald-500 shadow-sm"></span>
            <span className="w-2 h-1.5 rounded-full bg-emerald-200 shadow-sm"></span>
          </div>
        </div>
      </motion.div>

      {/* Right Side Form */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full lg:w-[50%] ml-auto flex items-center justify-center p-8 pt-16 z-10 relative bg-white/80 backdrop-blur-sm min-h-[calc(100vh-6rem)]"
      >
        <div className="w-full max-w-md text-center">
          <h2 className="text-[2.2rem] font-bold text-gray-800 mb-3 tracking-tight">Create an Account</h2>
          <p className="text-gray-400 text-sm mb-10 px-6 leading-relaxed">
            Sign up to get started with TaskManager.<br />
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 px-4 text-left">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white border border-transparent focus:border-emerald-400 shadow-sm transition-all duration-300 text-sm"
                placeholder="Full Name"
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white border border-transparent focus:border-emerald-400 shadow-sm transition-all duration-300 text-sm"
                placeholder="Email address"
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white border border-transparent focus:border-emerald-400 shadow-sm transition-all duration-300 text-sm"
                placeholder="Password"
                required
              />
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-500 mb-2 pl-1 uppercase tracking-wider">Join as</label>
              <div className="relative flex p-1 bg-gray-100 rounded-xl">
                {['Member', 'Admin'].map((r) => (
                  <div
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex-1 relative cursor-pointer py-2.5 flex items-center justify-center text-sm font-semibold z-10 transition-colors duration-300 ${
                      role === r ? 'text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {r === 'Admin' ? <BriefcaseIcon className="w-4 h-4 mr-2" /> : <UserIcon className="w-4 h-4 mr-2" />}
                    {r}
                    {role === r && (
                      <motion.div
                        layoutId="role-indicator"
                        className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full max-w-[280px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300"
              >
                Signup
              </motion.button>
            </div>
          </form>

          <p className="mt-6 text-xs text-center text-gray-400">
            Already received an invite code?{' '}
            <a href="/#join-project" className="font-semibold text-emerald-600 hover:text-emerald-700 transition underline underline-offset-2">
              Join a project
            </a>
          </p>
        </div>
      </motion.div>

    </div>
  );
};

export default Signup;
