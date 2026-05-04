import { motion } from 'motion/react';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';
import { Building2, Volleyball, Microscope, Monitor, Tv, BookOpen, Trophy, Users, Utensils } from 'lucide-react';
import { facilitiesImages, getPageImage } from '../config/pageImages';

import imgFood1 from '../assets/Facilities/FOOD/14.png';
import imgFood2 from '../assets/Facilities/FOOD/15.png';
import imgFood3 from '../assets/Facilities/FOOD/16.png';

const infrastructureItems = [
  { icon: Microscope, label: 'Science Labs', color: 'emerald' },
  { icon: Monitor, label: 'Computer Labs', color: 'blue' },
  { icon: Tv, label: 'Smart Classrooms (LCD)', color: 'purple' },
  { icon: BookOpen, label: 'Resource Room', color: 'amber' },
  { icon: Building2, label: 'Auditorium', color: 'emerald' },
];

const sportsItems = [
  'Volleyball', 'Tennis', 'Basketball', 'Cricket Ground', 'Football Ground'
];

const programItems = [
  "Math & Science Olympiad",
  "Drug Awareness Program",
  "Scouts & Guides",
  "Social Science & Science Exhibitions",
  "Inter-School Sports Competitions",
  "Regional & National Level Events",
];

const colorMap = {
  emerald: 'bg-emerald-100 text-emerald-600',
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  amber: 'bg-amber-100 text-amber-600',
};

const landingHighlights = [
  {
    title: 'Modern Learning Spaces',
    description: 'Science labs, computer labs, smart classrooms, and a resource room support focused and practical learning.',
  },
  {
    title: 'Sports And Movement',
    description: 'Students benefit from dedicated grounds and courts that encourage physical fitness, teamwork, and competition.',
  },
  {
    title: 'All-Round Exposure',
    description: 'Infrastructure at SRV is designed to support academics, events, exhibitions, club activities, and student growth every day.',
  },
];

export function Facilities() {
  return (
    <div className="srv-page-shell flex min-h-screen flex-col bg-slate-50">
      <PageHero
        title="A campus designed to support learning, discovery, movement, and daily student wellbeing."
        breadcrumb="Facilities"
        description="SRV provides a clean, organized, and student-friendly environment with the essential infrastructure needed for strong academics and all-round development."
        highlights={landingHighlights}
      />

      <div className="srv-page-container mx-auto w-full max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8">

        {/* Section 1 — Infrastructure & Facilities with Diamond Collage */}
        <div className="mb-24 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">

          {/* Diamond Image Collage */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[320px] sm:h-[420px] md:h-[480px]"
          >
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              {/* Center Diamond */}
              <div className="absolute left-1/2 top-1/2 z-20 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rotate-45 overflow-hidden rounded-[1.75rem] border-4 border-white shadow-2xl sm:h-60 sm:w-60 sm:rounded-[2.25rem] sm:border-[6px] md:h-72 md:w-72 lg:rounded-[2.5rem] lg:border-8">
                <img
                  src={getPageImage(facilitiesImages, 0, facilitiesImages[0]?.url)}
                  className="-rotate-45 scale-[1.35] object-cover w-full h-full"
                  alt="Students on Campus"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Top Right */}
              <div className="absolute right-6 top-6 z-10 h-28 w-28 rotate-45 overflow-hidden rounded-2xl border-4 border-white shadow-xl sm:h-36 sm:w-36 sm:rounded-3xl sm:border-[6px] md:right-4 md:top-4 md:h-44 md:w-44 lg:border-8">
                <img
                  src={getPageImage(facilitiesImages, 1, facilitiesImages[1]?.url)}
                  className="-rotate-45 scale-150 object-cover w-full h-full"
                  alt="Science Lab"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Bottom Left */}
              <div className="absolute bottom-6 left-6 z-10 h-28 w-28 rotate-45 overflow-hidden rounded-2xl border-4 border-white shadow-xl sm:h-36 sm:w-36 sm:rounded-3xl sm:border-[6px] md:bottom-4 md:left-4 md:h-44 md:w-44 lg:border-8">
                <img
                  src={getPageImage(facilitiesImages, 2, facilitiesImages[2]?.url)}
                  className="-rotate-45 scale-150 object-cover w-full h-full"
                  alt="Sports Ground"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <span className="text-amber-500 font-semibold tracking-widest uppercase text-sm mb-3 block">Our Infrastructure</span>
              <h2 className="mb-5 text-3xl font-display font-bold leading-tight text-slate-900 sm:text-4xl">
                Infrastructure &<br />Facilities
              </h2>
            </div>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              The school is well equipped with all modern educational infrastructures like science labs, computer labs, an auditorium with LCD projectors (Smart Class), and a resource room to facilitate learning among students.
            </p>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              The campus also has all the major sporting facilities like volleyball, tennis, basketball courts, a cricket and football ground, etc. SRV encourages students to participate in various inter-school, regional and national level sports competitions. Regular organization of co-curricular activities such as Math & Science Olympiad, drug awareness program, Scouts & Guides, Social Science & Science exhibitions makes SRV one of the top schools.
            </p>

            {/* Infrastructure Quick Tags */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              {infrastructureItems.map(({ icon: Icon, label, color }) => (
                <span key={label} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${colorMap[color]} border border-current/10`}>
                  <Icon size={14} strokeWidth={2.5} />
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Section 2 — Sports + Programs */}
        <div className="mb-20 grid gap-8 md:grid-cols-2">

          {/* Sports Facilities */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl sm:p-10"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                <Trophy size={20} />
              </div>
              <h3 className="text-xl font-display font-bold text-slate-900">Sports Facilities</h3>
            </div>
            <div className="w-10 h-0.5 bg-amber-500 rounded-full mb-6 ml-[52px]"></div>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              SRV encourages students to participate in various inter-school, regional and national level sports competitions with world-class sporting infrastructure.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {sportsItems.map((sport) => (
                <span key={sport} className="px-4 py-2 bg-amber-50 text-amber-700 text-sm font-semibold rounded-full border border-amber-200">
                  {sport}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Programs & Activities */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-slate-900 p-6 text-white shadow-xl sm:p-10"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                <Users size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-display font-bold">Programs & Events</h3>
            </div>
            <div className="w-10 h-0.5 bg-amber-500 rounded-full mb-6 ml-[52px]"></div>
            <p className="text-emerald-200 text-sm leading-relaxed mb-6">
              Regular organization of co-curricular activities makes SRV one of the top schools in the region.
            </p>
            <ul className="space-y-3">
              {programItems.map((item) => (
                <li key={item} className="flex items-center gap-3 text-emerald-100 text-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Section 2.5 - Cafeteria & Dining */}
        <div className="mb-24 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <span className="text-amber-500 font-semibold tracking-widest uppercase text-sm mb-3 block">Student Wellbeing</span>
              <h2 className="mb-5 text-3xl font-display font-bold leading-tight text-slate-900 sm:text-4xl">
                Hygienic Cafeteria &<br />Dining
              </h2>
            </div>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              Our campus features a spacious, clean, and modern cafeteria designed to provide students with nutritious and delicious meals throughout the day. We prioritize hygiene, food quality, and a balanced diet to ensure our students remain energetic and focused.
            </p>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              With a comfortable seating arrangement and strict safety protocols, the dining area serves as a vibrant social hub where students can relax, interact, and build friendships while enjoying their meals.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
                <span className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-600 border border-current/10">
                  <Utensils size={14} strokeWidth={2.5} />
                  Nutritious Meals
                </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:h-[450px]"
          >
            <div className="relative min-h-[240px] overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-xl sm:min-h-0">
              <img src={imgFood1} alt="Cafeteria seating" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="grid h-full min-h-0 grid-cols-2 gap-4 sm:grid-cols-1 sm:grid-rows-2">
              <div className="relative min-h-[180px] overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-xl sm:min-h-0">
                <img src={imgFood2} alt="Nutritious food" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="relative min-h-[180px] overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-xl sm:min-h-0">
                <img src={imgFood3} alt="Students dining" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Section 3 — Facilities Grid Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-amber-500 font-semibold tracking-widest uppercase text-sm mb-3 block">Infrastructure</span>
          <h3 className="text-3xl font-display font-bold text-slate-900">World-Class Infrastructure</h3>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { img: getPageImage(facilitiesImages, 3, facilitiesImages[3]?.url), label: 'Smart Classrooms', desc: 'Equipped with LCD projectors and interactive boards for immersive learning.' },
            { img: getPageImage(facilitiesImages, 4, facilitiesImages[4]?.url), label: 'Science Laboratories', desc: 'Fully equipped labs for Physics, Chemistry, and Biology experiments.' },
            { img: getPageImage(facilitiesImages, 5, facilitiesImages[5]?.url), label: 'Computer Labs', desc: 'Modern computer labs for digital skills and software learning.' },
            { img: getPageImage(facilitiesImages, 6, facilitiesImages[6]?.url), label: 'Resource Room', desc: 'A dedicated space to facilitate research, self-study, and collaborative work.' },
            { img: getPageImage(facilitiesImages, 7, facilitiesImages[7]?.url), label: 'Sports Ground', desc: 'Volleyball, cricket, football and basketball facilities for physical fitness.' },
            { img: getPageImage(facilitiesImages, 8, facilitiesImages[8]?.url), label: 'Auditorium', desc: 'A spacious auditorium for cultural events, competitions, and assemblies.' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={item.img}
                  alt={item.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h4 className="font-display font-bold text-slate-900 text-lg mb-2">{item.label}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      <StatsCtaBanner />
    </div>
  );
}
