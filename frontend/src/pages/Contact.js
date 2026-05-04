import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';
import {
  SCHOOL_LOCATION_HELPER,
  SCHOOL_LOCATION_LABEL,
  SCHOOL_LOCATION_LINK,
  SCHOOL_PHONE_DISPLAY,
  SCHOOL_PHONE_LINK,
} from '../config/siteContact';

const landingHighlights = [
  {
    title: 'Visit The Campus',
    description: 'Reach out to plan a school visit and experience the learning environment, facilities, and student culture firsthand.',
  },
  {
    title: 'Talk To Our Team',
    description: 'Get support for admissions, curriculum questions, and general school information from our office team.',
  },
  {
    title: 'Send An Enquiry',
    description: 'Use the contact form to share your message and we will get back to you as quickly as possible.',
  },
];

export function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    Swal.fire({
      title: 'Message Sent!',
      text: 'Thank you for reaching out. We will get back to you shortly.',
      icon: 'success',
      confirmButtonColor: '#059669',
      confirmButtonText: 'Awesome!'
    });
    e.target.reset();
  };

  return (
    <div className="srv-page-shell relative flex min-h-screen flex-col overflow-x-hidden bg-slate-50">
      <PageHero
        title="Connect with the SRV team for admissions, school information, and campus support."
        breadcrumb="Contact Us"
        description="Whether you are exploring admission, planning a visit, or simply need guidance, we are here to help you with clear and friendly support."
        highlights={landingHighlights}
      />
      <div className="srv-page-container relative mx-auto w-full max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-64 -top-64 h-[800px] w-[800px] rounded-full bg-emerald-100/40 blur-[120px]" />
          <div className="absolute -bottom-64 -left-64 h-[600px] w-[600px] rounded-full bg-amber-100/40 blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="text-emerald-600 font-semibold tracking-widest uppercase text-sm mb-4 block">
            We'd love to hear from you
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6">Get in Touch</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Whether you have a question about admissions, curriculum, or anything else, our team is highly responsive and ready to assist you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start mb-20">
          
          {/* Contact Info Cards */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 space-y-6"
          >
            {[
              { icon: MapPin, title: "Campus Address", color: "emerald" },
              { icon: Phone, title: "Phone Number", color: "amber" },
              { icon: Mail, title: "Email Address", color: "emerald" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-5 group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105
                  ${item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'}`}>
                  <item.icon size={24} />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-slate-900 text-lg mb-2">{item.title}</h4>
                  {item.title === 'Campus Address' ? (
                    <div className="space-y-1 text-sm leading-relaxed">
                      <p className="text-slate-600">{SCHOOL_LOCATION_LABEL}</p>
                      <a
                        href={SCHOOL_LOCATION_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-emerald-700 hover:text-emerald-600"
                      >
                        {SCHOOL_LOCATION_HELPER}
                      </a>
                    </div>
                  ) : null}
                  {item.title === 'Phone Number' ? (
                    <div className="space-y-1 text-sm leading-relaxed">
                      <a href={SCHOOL_PHONE_LINK} className="text-slate-600 hover:text-amber-600">
                        {SCHOOL_PHONE_DISPLAY}
                      </a>
                      <p className="text-slate-600">Mon - Sat, 8:30am - 5:00pm</p>
                    </div>
                  ) : null}
                  {item.title === 'Email Address' ? (
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                      {"info@srvmschool.in\nadmissions@srvmschool.in"}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7 bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50"
          >
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-8">Send us a Message</h2>
            
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                    <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                    <input type="email" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400" placeholder="john@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Subject</label>
                  <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400" placeholder="Admission Inquiry" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Message</label>
                  <textarea required rows={5} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none placeholder:text-slate-400" placeholder="How can we help you today?"></textarea>
                </div>
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30">
                  Send Message <Send size={18} />
                </button>
              </form>
          </motion.div>
        </div>
      </div>
      <StatsCtaBanner />
    </div>
  );
}
