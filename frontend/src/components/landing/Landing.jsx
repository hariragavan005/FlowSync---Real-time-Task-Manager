import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { joinProject } from '../../services/projectService';
import { showPriorityAlert } from '../../utils/priorityAlerts';
import { 
  CheckCircleIcon, UsersIcon, ChartBarIcon, 
  ClockIcon, BellAlertIcon, MapPinIcon, 
  PhoneIcon, EnvelopeIcon, PaperAirplaneIcon,
  PresentationChartLineIcon, RectangleGroupIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

// Helper component for animated counters
const AnimatedCounter = ({ from, to, duration, suffix = "" }) => {
  const [count, setCount] = useState(from);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // Easing function (easeOutExpo)
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(Math.floor(easeProgress * (to - from) + from));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [isInView, from, to, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Join project state
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(null);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      const { data } = await joinProject(inviteCode.trim());
      setJoinSuccess(data.project?.name || 'your project');
      setInviteCode('');
      showPriorityAlert(data.message || 'Joined successfully!', 'low');
    } catch (err) {
      showPriorityAlert(err.response?.data?.message || 'Invalid invite code.', 'high');
    } finally {
      setJoining(false);
    }
  };
  return (
    <div className="bg-[#f8fafc] font-sans text-gray-800 overflow-x-hidden relative">
      
      {/* Global Background Blobs & Windows 11 Curves */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        {/* Soft Mint Green Blob */}
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-300/20 blur-[120px]"
        />
        {/* Soft Navy Blob */}
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-blue-300/20 blur-[150px]"
        />
        {/* Soft Cream Blob */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full bg-teal-100/30 blur-[100px]"
        />
      </div>

      {/* ======================================== */}
      {/* SECTION 1: HERO BANNER */}
      {/* ======================================== */}
      <section id="home" className="relative pt-40 pb-24 lg:pt-48 lg:pb-32 z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-1/2 text-center lg:text-left relative z-10"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                v2.0 is now live
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
                Task Management <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                  Done Right.
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-gray-500 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Organize projects, manage teams, and track progress with clarity and speed. The ultimate tool for modern productivity.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {user ? (
                  <motion.button 
                    onClick={() => navigate('/dashboard')}
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.2)" }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all text-center"
                  >
                    Go to Dashboard
                  </motion.button>
                ) : (
                  <motion.a 
                    href="/signup"
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.2)" }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all text-center"
                  >
                    Get Started
                  </motion.a>
                )}
                <motion.a 
                  href="#showcase"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-gray-700 font-bold text-lg border border-gray-200 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 transition-all text-center"
                >
                  Live Demo
                </motion.a>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="w-full lg:w-1/2 relative z-10"
            >
              <div className="relative w-full max-w-lg mx-auto aspect-square">
                {/* Main floating mockup */}
                <motion.div 
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white p-6 z-10"
                >
                  <div className="w-full h-8 flex gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-100 rounded-full w-1/3"></div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-32 bg-emerald-50 rounded-xl border border-emerald-100 p-4">
                         <div className="w-8 h-8 rounded bg-emerald-200 mb-2"></div>
                         <div className="h-2 bg-emerald-200 rounded w-full mb-1"></div>
                         <div className="h-2 bg-emerald-200 rounded w-2/3"></div>
                      </div>
                      <div className="h-32 bg-blue-50 rounded-xl border border-blue-100 p-4">
                         <div className="w-8 h-8 rounded bg-blue-200 mb-2"></div>
                         <div className="h-2 bg-blue-200 rounded w-full mb-1"></div>
                         <div className="h-2 bg-blue-200 rounded w-2/3"></div>
                      </div>
                      <div className="h-32 bg-purple-50 rounded-xl border border-purple-100 p-4">
                         <div className="w-8 h-8 rounded bg-purple-200 mb-2"></div>
                         <div className="h-2 bg-purple-200 rounded w-full mb-1"></div>
                         <div className="h-2 bg-purple-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="h-24 bg-gray-50 rounded-xl border border-gray-100 p-4 flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                        <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating elements around mockup */}
                <motion.div 
                  animate={{ y: [15, -15, 15], rotate: [-2, 2, -2] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -top-10 -right-10 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/50 z-20 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircleIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Task Completed</p>
                    <p className="text-[10px] text-gray-500">Just now</p>
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="absolute -bottom-8 -left-8 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/50 z-20"
                >
                   <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-200 border-2 border-white"></div>
                    <div className="w-8 h-8 rounded-full bg-purple-200 border-2 border-white"></div>
                    <div className="w-8 h-8 rounded-full bg-emerald-200 border-2 border-white"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold">+5</div>
                  </div>
                  <p className="text-xs font-bold text-gray-800 mt-2">Team Online</p>
                </motion.div>
              </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* ======================================== */}
      {/* JOIN PROJECT SECTION */}
      {/* ======================================== */}
      <section id="join-project" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_20px_60px_rgba(16,185,129,0.08)] overflow-hidden p-10 md:p-14"
            >
              {/* Gradient border glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 pointer-events-none" />
              {/* Decorative blob */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, 10, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none"
              />

              <div className="relative text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/60 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-4">
                  <UsersIcon className="w-3.5 h-3.5" />
                  Collaborate Instantly
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                  Join your team <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">instantly.</span>
                </h2>
                <p className="text-gray-500 text-lg max-w-lg mx-auto">
                  Enter your project invite code and start collaborating with your team in seconds.
                </p>
              </div>

              {joinSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircleIcon className="w-9 h-9 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">You joined <span className="text-emerald-600">{joinSuccess}</span>!</p>
                    <p className="text-sm text-gray-500 mt-1">Head to your dashboard to start collaborating.</p>
                  </div>
                  <button onClick={() => navigate('/dashboard')}
                    className="mt-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-lg hover:bg-emerald-600 transition">
                    Go to Dashboard
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="Enter invite code e.g. X7K29P"
                      maxLength={6}
                      className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 outline-none text-lg font-bold tracking-[0.3em] text-gray-800 placeholder-gray-300 placeholder:tracking-normal shadow-sm transition-all"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={joining}
                    whileHover={{ scale: 1.04, boxShadow: '0 15px 25px -5px rgba(16,185,129,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-60 whitespace-nowrap"
                  >
                    {joining ? 'Joining...' : <><ArrowRightIcon className="w-5 h-5" /> Join Project</>}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================================== */}
      {/* SECTION 2: TRUST / ACHIEVEMENTS */}
      {/* ======================================== */}
      <section className="py-16 relative z-10 border-y border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Tasks Managed", value: 10000, suffix: "+" },
              { label: "Active Teams", value: 500, suffix: "+" },
              { label: "Reliability", value: 99, suffix: ".9%" },
              { label: "Support", value: 24, suffix: "/7" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 mb-2 drop-shadow-sm group-hover:scale-105 transition-transform">
                  <AnimatedCounter from={0} to={stat.value} duration={2000} suffix={stat.suffix} />
                </div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================== */}
      {/* SECTION 3: SERVICES / FEATURES */}
      {/* ======================================== */}
      <section id="services" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
            >
              Everything you need to succeed
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-500 max-w-2xl mx-auto"
            >
              Powerful features packed into an intuitive, beautiful interface.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Real-Time Collaboration", icon: UsersIcon, desc: "Work together instantly. See who is viewing, editing, and completing tasks in real-time." },
              { title: "Todo & Sprint Tracking", icon: RectangleGroupIcon, desc: "Organize work into sprints, lists, and boards to perfectly match your team's agile workflow." },
              { title: "Performance Analytics", icon: ChartBarIcon, desc: "Visualize progress with beautiful charts and insights. Understand bottlenecks instantly." },
              { title: "Smart Dependencies", icon: PresentationChartLineIcon, desc: "Link tasks together to ensure work happens in the correct order without blockers." },
              { title: "Timeline Management", icon: ClockIcon, desc: "Plan projects over time with intuitive Gantt-style charts and calendar views." },
              { title: "Notifications & Alerts", icon: BellAlertIcon, desc: "Stay informed without the noise. Highly customizable alerts keep you in the loop." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.1)] transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                  <feature.icon className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================== */}
      {/* SECTION 4: ABOUT US */}
      {/* ======================================== */}
      <section id="about" className="py-24 relative z-10 bg-white/40 border-y border-white/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-1/2"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Built for modern <br/><span className="text-emerald-600">productive teams.</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We help teams streamline collaboration, improve productivity, and manage workflows efficiently using modern cloud-based tools. Our mission is to eliminate the friction in your daily operations.
              </p>
              <div className="space-y-4">
                {[
                  "Cloud-first architecture for speed and reliability",
                  "Enterprise-grade security and permissions",
                  "Beautiful, frictionless user experience"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-1/2 relative"
            >
              {/* Abstract Team Illustration via CSS shapes */}
              <div className="relative w-full aspect-video bg-gradient-to-br from-emerald-50 to-blue-50 rounded-3xl border border-white shadow-xl overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiMwMDAiLz48L3N2Zz4=')] [background-size:20px_20px]"></div>
                
                {/* Simulated Team Avatars overlapping */}
                <div className="relative z-10 flex -space-x-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + 0.5, type: "spring" }}
                      className="w-16 h-16 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 font-bold"
                    >
                      U{i+1}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================================== */}
      {/* SECTION 5: PROJECT SHOWCASE / DASHBOARD */}
      {/* ======================================== */}
      <section id="showcase" className="py-24 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">A dashboard you'll love using</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Experience the cleanest interface designed to keep you focused on what matters most.</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="w-full max-w-5xl mx-auto bg-white/80 backdrop-blur-2xl rounded-t-3xl border-t border-x border-white/60 shadow-[0_-20px_60px_rgba(0,0,0,0.05)] overflow-hidden"
          >
            {/* Mock Dashboard UI */}
            <div className="h-12 bg-gray-50/80 border-b border-gray-100 flex items-center px-6 gap-4">
               <div className="flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-400"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                 <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
               </div>
               <div className="h-6 w-64 bg-white rounded-md mx-auto shadow-sm"></div>
            </div>
            
            <div className="p-8 flex gap-8">
              {/* Sidebar */}
              <div className="w-48 hidden md:block space-y-4">
                <div className="h-8 bg-gray-100 rounded-lg w-full mb-8"></div>
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-4 bg-gray-50 rounded w-full"></div>
                ))}
              </div>
              
              {/* Main Content: Kanban */}
              <div className="flex-1">
                <div className="flex justify-between mb-8">
                  <div className="h-8 bg-gray-200 rounded-lg w-48"></div>
                  <div className="h-8 bg-emerald-100 rounded-lg w-24"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1 */}
                  <div className="bg-gray-50/50 rounded-2xl p-4 min-h-[400px]">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                    <div className="space-y-4">
                      {[1,2].map(i => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-24">
                           <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                           <div className="h-2 bg-gray-100 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Column 2 */}
                  <div className="bg-gray-50/50 rounded-2xl p-4 min-h-[400px]">
                    <div className="h-4 bg-emerald-200 rounded w-24 mb-4"></div>
                    <div className="space-y-4">
                      {[1,2,3].map(i => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-emerald-50 h-24 relative overflow-hidden">
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400"></div>
                           <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                           <div className="h-2 bg-gray-100 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Column 3 */}
                  <div className="bg-gray-50/50 rounded-2xl p-4 min-h-[400px]">
                    <div className="h-4 bg-blue-200 rounded w-24 mb-4"></div>
                    <div className="space-y-4">
                      {[1].map(i => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-blue-50 h-24 relative overflow-hidden">
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>
                           <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                           <div className="h-2 bg-gray-100 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======================================== */}
      {/* SECTION 6: CONTACT US */}
      {/* ======================================== */}
      <section id="contact" className="py-24 relative z-10 bg-white/60 backdrop-blur-xl border-t border-white/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Let's talk.</h2>
              <p className="text-gray-500 mb-10 text-lg">
                Have questions about pricing, features, or integrations? Our team is here to help you build the perfect workflow.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <EnvelopeIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Email us</h4>
                    <p className="text-gray-500">hello@taskmanager.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                    <PhoneIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Call us</h4>
                    <p className="text-gray-500">+1 (800) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <MapPinIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Office</h4>
                    <p className="text-gray-500">123 Workflow Street, Suite 400<br/>San Francisco, CA 94103</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100"
            >
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none" placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none" placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <input type="email" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none" placeholder="john@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                  <textarea rows="4" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none resize-none" placeholder="How can we help you?"></textarea>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                >
                  Send Message
                  <PaperAirplaneIcon className="w-5 h-5" />
                </motion.button>
              </form>
            </motion.div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default Landing;
