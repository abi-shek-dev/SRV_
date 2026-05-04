import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { twMerge } from 'tailwind-merge';
import srvLogo from '../assets/fav_logo/srv-t.png';

// Portal Login is intentionally NOT included here — it's a separate CTA button
const navLinks = [
  { name: 'Home', path: '/' },
  {
    name: 'About Us',
    path: '/about',
    dropdown: [
      { name: 'About SRVM', path: '/about' },
      { name: 'Academics', path: '/academics' },
      { name: 'Facilities', path: '/facilities' },
    ],
  },
  { name: 'Skill Development', path: '/skills' },
  { name: 'Co-Curricular', path: '/co-curricular' },
  { name: 'Admission', path: '/admission' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'News & Media', path: '/news' },
  // { name: 'Contact Us', path: '/contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      window.lenis?.stop();
    } else {
      window.lenis?.start();
    }
    return () => {
      window.lenis?.start();
    };
  }, [isOpen]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={twMerge(
          'fixed w-full top-0 z-50 transition-all duration-500 ease-in-out',
          scrolled || isOpen
            ? 'glass !bg-white/88 border-b border-white/50 py-2 shadow-[0_24px_70px_rgba(15,23,42,0.10)]'
            : 'bg-transparent py-3 sm:py-4'
        )}
      >
        {/* ── Inner container: full width up to 1400px, generous side padding ── */}
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 xl:px-8">
          <div className="flex items-center justify-between gap-2">

            {/* ── Logo ── */}
            <Link to="/" className="group flex shrink-0 items-center gap-2 sm:gap-2.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-emerald-900 p-[3px] shadow-md transition-transform duration-300 group-hover:scale-105 sm:h-12 sm:w-12 md:h-14 md:w-14 md:rounded-[16px]">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[11px] bg-white p-1 sm:rounded-[13px]">
                  <img src={srvLogo} alt="SRV Logo" className="w-full h-full object-contain scale-[1.15]" />
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span
                  className={twMerge(
                  'font-display text-lg font-bold tracking-tight transition-colors duration-300 sm:text-xl',
                    scrolled ? 'text-slate-900' : 'text-white drop-shadow'
                  )}
                >
                  SRV
                </span>
                <span
                  className={twMerge(
                    '-mt-0.5 text-[8px] font-semibold uppercase tracking-[0.28em] transition-colors duration-300 sm:text-[9px] sm:tracking-widest',
                    scrolled ? 'text-emerald-700' : 'text-emerald-200'
                  )}
                >
                  School
                </span>
              </div>
            </Link>

            {/* ── Desktop Nav — visible at lg (1024px+) ── */}
            <nav className="hidden flex-1 items-center justify-center gap-1 2xl:gap-2 xl:flex">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <div key={link.name} className="relative group">
                    <Link
                      to={link.path}
                      className={twMerge(
                        'relative flex items-center gap-0.5 whitespace-nowrap rounded-lg px-2 py-2 text-[13px] font-medium transition-colors 2xl:px-2.5 2xl:text-[14px]',
                        scrolled
                          ? isActive
                            ? 'text-amber-600'
                            : 'text-slate-700 hover:text-amber-500 hover:bg-slate-100'
                          : isActive
                          ? 'text-amber-400'
                          : 'text-slate-100 hover:text-white hover:bg-white/10'
                      )}
                    >
                      {link.name}
                      {link.dropdown && (
                        <ChevronDown size={12} className="mt-0.5 shrink-0" />
                      )}
                      {isActive && (
                        <motion.span
                          layoutId="nav-indicator"
                          className={twMerge(
                            'absolute bottom-0 left-2 right-2 h-0.5 rounded-full',
                            scrolled ? 'bg-amber-500' : 'bg-amber-400'
                          )}
                        />
                      )}
                    </Link>

                    {/* Dropdown */}
                    {link.dropdown && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-300 z-50">
                        <div className="glass !bg-white/92 shadow-[0_24px_70px_rgba(15,23,42,0.12)] border border-white/50 rounded-2xl py-2 w-52 flex flex-col overflow-hidden">
                          {link.dropdown.map((drop) => (
                            <Link
                              key={drop.name}
                              to={drop.path}
                              className="px-5 py-3 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors whitespace-nowrap"
                            >
                              {drop.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* ── CTA Buttons + Hamburger ── */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Portal Login — always visible on md+ */}
              <a
                href="http://localhost:3003/login"
                className={twMerge(
                  'hidden items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg md:flex xl:px-4 xl:text-sm',
                  scrolled
                    ? 'bg-slate-900 text-white hover:bg-slate-700 border-slate-900'
                    : 'bg-white/10 text-white hover:bg-white/20 border-white/30 backdrop-blur-sm'
                )}
              >
                <User size={14} className="shrink-0" />
                <span>Portal Login</span>
              </a>

              {/* Contact Us — visible on lg+ */}
              <Link
                to="/contact"
                className={twMerge(
                  'hidden items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg xl:flex xl:px-5 xl:text-sm',
                  scrolled
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/25'
                    : 'bg-[linear-gradient(135deg,#f59e0b_0%,#d97706_100%)] text-white hover:brightness-105 shadow-black/10'
                )}
              >
                Contact Us
              </Link>

              {/* Hamburger — shown below lg */}
              <button
                className={twMerge(
                  'rounded-lg p-2 transition-colors xl:hidden',
                  scrolled || isOpen
                    ? 'text-slate-800 hover:bg-slate-100'
                    : 'text-white hover:bg-white/10'
                )}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile / Tablet Nav ── */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 overflow-hidden border-t border-slate-100 bg-white/95 shadow-2xl backdrop-blur-xl xl:hidden"
            >
              <nav
                className="flex flex-col py-4 px-4 gap-1 max-h-[75vh] overflow-y-auto overscroll-contain"
                data-lenis-prevent="true"
              >
                {/* Include Portal Login in mobile menu */}
                {navLinks.map((link, i) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex flex-col"
                    >
                      <Link
                        to={link.path}
                        className={twMerge(
                          'px-4 py-3.5 rounded-xl text-[15px] font-medium flex items-center justify-between transition-colors',
                          location.pathname === link.path
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        {link.name}
                        {link.dropdown && (
                          <ChevronDown size={16} className="text-slate-400" />
                        )}
                      </Link>
                      {link.dropdown && (
                        <div className="flex flex-col pl-6 pr-4 py-1 gap-1 border-l-2 border-slate-100 ml-6 my-1">
                          {link.dropdown.map((drop) => (
                            <Link
                              key={drop.name}
                              to={drop.path}
                              className="py-2.5 text-sm text-slate-500 hover:text-emerald-600 font-medium"
                            >
                              {drop.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </motion.div>
                ))}

                {/* External Portal Link for mobile */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.04 }}
                  className="flex flex-col mt-1"
                >
                  <a
                    href="http://localhost:3003/login"
                    className="px-4 py-3.5 rounded-xl text-[15px] font-medium flex items-center justify-between text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Portal Login
                  </a>
                </motion.div>

                {/* Contact Us in mobile */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.04 + 0.04 }}
                  className="mt-2 pt-2 border-t border-slate-100"
                >
                  <Link
                    to="/contact"
                    className="block w-full text-center px-4 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-[15px] hover:bg-emerald-700 transition-colors"
                  >
                    Contact Us
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
