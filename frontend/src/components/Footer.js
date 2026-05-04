import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter, Youtube, ArrowRight, BookOpen } from 'lucide-react';
import srvLogo from '../assets/fav_logo/srv-t.png';
import {
  SCHOOL_LOCATION_HELPER,
  SCHOOL_LOCATION_LABEL,
  SCHOOL_LOCATION_LINK,
  SCHOOL_PHONE_DISPLAY,
  SCHOOL_PHONE_LINK,
} from '../config/siteContact';

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.15),_transparent_40%),linear-gradient(145deg,_#0f172a_0%,_#020617_100%)] pb-8 pt-16 text-slate-300 sm:pt-20">
      <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute top-0 right-0 -mr-32 -mt-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-16 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Brand */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="flex items-center gap-3 sm:gap-4">
              <div className="h-14 w-14 shrink-0 rounded-[18px] bg-emerald-900 p-[4px] shadow-lg shadow-emerald-900/40 sm:h-16 sm:w-16 md:h-20 md:w-20 md:rounded-[20px]">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-white p-1.5 md:rounded-[16px]">
                  <img src={srvLogo} alt="SRV" className="w-full h-full object-contain scale-[1.15]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="mb-0.5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">SRV</span>
                <span className="text-[11px] uppercase tracking-widest font-semibold text-emerald-400 block -mt-1">School</span>
              </div>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              Sri Ramakrishna Vidyalaya Matriculation School. Empowering students with knowledge, integrity, and the vision to lead the world towards a brighter future.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/80 shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-amber-500 hover:text-white sm:h-11 sm:w-11 md:h-12 md:w-12">
                  <Icon size={22} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h3 className="text-white font-display font-semibold text-lg mb-6 flex items-center gap-2">
              Explore <span className="w-8 h-0.5 bg-amber-500 block"></span>
            </h3>
            <ul className="space-y-3.5">
              {[
                { label: 'About Us', path: '/about' },
                { label: 'Admissions', path: '/admission' },
                { label: 'Skill Development', path: '/skills' },
                { label: 'Gallery', path: '/gallery' },
                { label: 'News & Media', path: '/news' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 group">
                    <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-amber-500" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Academics */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-display font-semibold text-lg mb-6 flex items-center gap-2">
              Academics <span className="w-8 h-0.5 bg-emerald-500 block"></span>
            </h3>
            <ul className="space-y-3.5">
              {['Curriculum', 'Co-curricular', 'Faculty Directory', 'Library', 'Calendar'].map((link) => (
                <li key={link}>
                  <Link to="/co-curricular" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 group">
                    <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-emerald-500" />
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3 lg:col-start-10">
            <h3 className="text-white font-display font-semibold text-lg mb-6 flex items-center gap-2">
              Get in Touch <span className="w-8 h-0.5 bg-slate-600 block"></span>
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="p-2 bg-slate-800 rounded-lg text-amber-500 shrink-0 mt-0.5"><MapPin size={16} /></div>
                <span className="text-sm leading-relaxed text-slate-400">
                  {SCHOOL_LOCATION_LABEL}
                  <br />
                  <a
                    href={SCHOOL_LOCATION_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    {SCHOOL_LOCATION_HELPER}
                  </a>
                </span>
              </li>
              <li className="flex items-center gap-4">
                <div className="p-2 bg-slate-800 rounded-lg text-amber-500 shrink-0"><Phone size={16} /></div>
                <a href={SCHOOL_PHONE_LINK} className="text-sm text-slate-400 hover:text-amber-400">
                  {SCHOOL_PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex items-center gap-4">
                <div className="p-2 bg-slate-800 rounded-lg text-amber-500 shrink-0"><Mail size={16} /></div>
                <span className="text-sm text-slate-400">info@srvmschool.in</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800/80 pt-8 mt-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-center sm:px-6 md:flex-row md:items-center md:justify-between md:text-left lg:px-8">
          <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} SRV Matriculation School. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 border-t border-slate-800 pt-4 text-xs text-slate-500 sm:gap-6 md:w-auto md:justify-start md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <Link to="#" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link to="#" className="hover:text-slate-300 transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
