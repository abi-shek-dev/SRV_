import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ArrowRight, User, X } from 'lucide-react';
import { useState } from 'react';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';
import { newsMediaImages, getPageImage } from '../config/pageImages';

import imgAnnualDay from '../assets/NEWS & MEDIA/ANNUAL DAY/1.png';
import imgColoursDay from '../assets/NEWS & MEDIA/COLOURS DAY/17.png';
import imgFoundersDay from '../assets/NEWS & MEDIA/FOUNDERS  DDAY/17.png';
import imgIndependenceDay from '../assets/NEWS & MEDIA/INDEPENDENCE DAY/20.png';
import imgScienceDay from '../assets/NEWS & MEDIA/SCIENCE DAY/21.png';
import imgSportsDay from '../assets/NEWS & MEDIA/SPORTS DAY/17.png';
import imgTeachersDay from '../assets/NEWS & MEDIA/TEACHERS DAY/17.png';

const newsItems = [
  {
    title: 'Annual Day Celebrations',
    date: 'March 15, 2026',
    author: 'Admin',
    category: 'Events',
    color: 'amber',
    image: imgAnnualDay,
    excerpt: 'Celebrate the culmination of our academic year with breathtaking student performances, award ceremonies, and a showcase of our school\'s incredible talent.',
  },
  {
    title: 'Colours Day Fun',
    date: 'March 10, 2026',
    author: 'Principal Desk',
    category: 'Culture',
    color: 'emerald',
    image: imgColoursDay,
    excerpt: 'A vibrant celebration where our youngest learners explore the world of colors through engaging activities, dress-ups, and creative arts.',
  },
  {
    title: 'Founders Day',
    date: 'March 5, 2026',
    author: 'Management',
    category: 'Ceremony',
    color: 'blue',
    image: imgFoundersDay,
    excerpt: 'Honoring the visionaries who built SRV. A day of reflection, gratitude, and reaffirming our commitment to educational excellence.',
  },
  {
    title: 'Independence Day',
    date: 'August 15, 2025',
    author: 'Admin',
    category: 'Events',
    color: 'amber',
    image: imgIndependenceDay,
    excerpt: 'Patriotic fervor fills the campus as students and faculty come together to hoist the national flag, accompanied by cultural performances and inspiring speeches.',
  },
  {
    title: 'Science Day Exhibition',
    date: 'February 28, 2026',
    author: 'Science Dept',
    category: 'Academics',
    color: 'emerald',
    image: imgScienceDay,
    excerpt: 'Fostering a spirit of inquiry! Our students demonstrate innovative projects, robotics, and scientific models to solve real-world problems.',
  },
  {
    title: 'Annual Sports Day',
    date: 'January 20, 2026',
    author: 'Sports Dept',
    category: 'Sports',
    color: 'blue',
    image: imgSportsDay,
    excerpt: 'A thrilling display of athleticism, teamwork, and sportsmanship. Students compete across track and field events, showcasing their physical prowess.',
  },
  {
    title: 'Teachers Day Tribute',
    date: 'September 5, 2025',
    author: 'Student Council',
    category: 'Culture',
    color: 'amber',
    image: imgTeachersDay,
    excerpt: 'A heartfelt tribute to our dedicated educators. Students organize special performances and activities to express their deep appreciation for their mentors.',
  }
];

const landingHighlights = [
  {
    title: 'Academic Milestones',
    description: 'Follow important academic achievements, competitions, and student success stories from across the school.',
  },
  {
    title: 'Campus Announcements',
    description: 'Stay informed about new developments, special events, and meaningful updates from the SRV community.',
  },
  {
    title: 'Culture And Activities',
    description: 'Read about celebrations, performances, sports, and student experiences that bring campus life to the forefront.',
  },
];

import Swal from 'sweetalert2';

export function News() {
  const handleReadFullStory = (item) => {
    Swal.fire({
      title: `<h2 class="text-3xl font-display font-bold text-slate-900">${item.title}</h2>`,
      html: `
        <div class="text-left mt-4 px-4 pb-4">
          <div class="flex items-center gap-4 text-slate-500 text-sm mb-6 font-medium justify-center">
            <span>📅 ${item.date}</span>
            <div class="w-1 h-1 rounded-full bg-slate-300"></div>
            <span>👤 ${item.author}</span>
          </div>
          <p class="text-lg text-slate-600 leading-relaxed font-medium mb-4">${item.excerpt}</p>
          <p class="text-slate-600 leading-relaxed">This event brought together our incredible student body, dedicated teachers, and supportive parents to celebrate the spirit of our school. With enthusiastic participation and remarkable performances, it was truly a memorable occasion that highlighted the diverse talents and hard work of everyone involved.</p>
        </div>
      `,
      imageUrl: item.image,
      imageWidth: '100%',
      imageAlt: item.title,
      width: 'min(800px, calc(100vw - 2rem))',
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        popup: 'overflow-hidden rounded-[1.75rem] sm:rounded-3xl',
        image: 'h-[220px] object-cover sm:h-[300px] md:h-[400px]',
        closeButton: 'text-slate-900 hover:text-emerald-600 focus:outline-none'
      }
    });
  };
  return (
    <div className="srv-page-shell flex min-h-screen flex-col bg-slate-50">
      <PageHero
        title="Stories, achievements, events, and updates from across the vibrant SRV campus."
        breadcrumb="News & Media"
        description="From academic accomplishments to cultural moments and major announcements, this is where the latest school stories come together."
        highlights={landingHighlights}
      />
      <div className="srv-page-container mx-auto w-full max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="text-emerald-600 font-semibold tracking-widest uppercase text-sm mb-4 block">
            Stay Updated
          </span>
          <h1 className="luxurious-roman-regular mb-6 text-4xl font-bold text-slate-900 sm:text-5xl md:text-6xl">News & Media</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Read about the latest academic achievements, cultural events, and extraordinary happenings across our vibrant campus.
          </p>
        </motion.div>

        {/* Featured News (First item emphasized) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {newsItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full ${index === 0 ? 'lg:col-span-3 lg:flex-row' : 'lg:col-span-1'}`}
            >
              <div className={`relative shrink-0 overflow-hidden ${index === 0 ? 'h-64 sm:h-80 lg:h-[450px] lg:w-3/5' : 'h-64'}`}>
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute top-6 left-6 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                  ${item.color === 'amber' ? 'bg-amber-100/90 text-amber-700' : 
                    item.color === 'emerald' ? 'bg-emerald-100/90 text-emerald-700' : 
                    'bg-blue-100/90 text-blue-700'}`}>
                  {item.category}
                </div>
              </div>
              
              <div className={`flex flex-grow flex-col p-6 sm:p-8 md:p-10 ${index === 0 ? 'lg:w-2/5 lg:justify-center' : ''}`}>
                <div className="mb-5 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 sm:gap-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={16} className="text-amber-500" />
                    <span>{item.date}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className="flex items-center gap-1.5">
                    <User size={16} className="text-amber-500" />
                    <span>{item.author}</span>
                  </div>
                </div>
                
                <h3 className={`mb-4 font-display font-bold leading-tight text-slate-900 transition-colors group-hover:text-emerald-700 ${index === 0 ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl'}`}>
                  {item.title}
                </h3>
                
                <p className="text-slate-600 leading-relaxed mb-8 flex-grow">
                  {item.excerpt}
                </p>
                
                <button onClick={() => handleReadFullStory(item)} className="inline-flex items-center gap-2 text-slate-900 font-bold hover:text-emerald-600 transition-colors mt-auto group/btn">
                  Read Full Story <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
      <StatsCtaBanner />
    </div>
  );
}
