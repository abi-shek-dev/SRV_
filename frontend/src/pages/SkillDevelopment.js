import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Phone } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';
import srvNliteAcademyLogo from '../assets/Skill Development/Activity logo/SRV NLITE ACADEMY.png';
import srvCdcLogo from '../assets/Skill Development/Activity logo/SRV CDC.PNG';
import srvSuitsLogo from '../assets/Skill Development/Activity logo/SRV SUITS.png';
import srvSkillDevelopmentLogo from '../assets/Skill Development/Activity logo/SRV SKILL DEVELOPMENT.PNG';
import srvEcoClubLogo from '../assets/Skill Development/Activity logo/SRV ECO CLUB.png';
import srvSportsAcademyLogo from '../assets/Skill Development/Activity logo/SRV SPORTS ACADEMY.png';
import srvHeroLogo from '../assets/fav_logo/srv-w.png';

const programs = [
  {
    logo: srvNliteAcademyLogo,
    title: 'SRV NLITE ACADEMY',
    subtitle: "Teacher's Training Program",
    points: [
      'Equips teachers with the latest teaching methods, technology, and subject updates for effective classroom delivery.',
      'Improves student outcomes and strengthens classroom engagement.',
      'Builds classroom management, encourages continuous growth, and supports quality education.',
    ],
    color: 'amber',
  },
  {
    logo: srvCdcLogo,
    title: 'SRV CDC',
    subtitle: 'Communication Development Centre',
    points: [
      'Builds fluent English speaking, listening, reading, and writing for real-life situations.',
      'Removes fear of speaking, develops self-confidence, and helps students express ideas clearly.',
      'Enhances personality development, active participation, and readiness for academic and professional success.',
    ],
    color: 'emerald',
  },
  {
    logo: srvSuitsLogo,
    title: 'SRV SUITS',
    subtitle: 'Computer & IT Training Program',
    points: [
      'Provides essential computer knowledge, IT skills, and practical exposure to modern technologies.',
      'Improves digital literacy, problem-solving ability, and career readiness in a tech-driven world.',
      'Builds confidence with software tools, encourages innovation, and keeps students updated with new trends.',
    ],
    color: 'blue',
  },
  {
    logo: srvSkillDevelopmentLogo,
    title: 'SRV SKILL DEVELOPMENT',
    subtitle: "Teacher's Training Program",
    points: [
      'Equips teachers with essential teaching skills, modern methodologies, and updated subject knowledge.',
      'Enhances teaching efficiency, student engagement, and better learning outcomes.',
      'Develops classroom management, promotes professional growth, and maintains high standards in education.',
    ],
    color: 'amber',
  },
  {
    logo: srvEcoClubLogo,
    title: 'SRV ECO CLUB',
    subtitle: 'Environmental Training',
    points: [
      'Creates awareness about environmental protection, sustainability, and preserving natural resources.',
      'Encourages eco-friendly activities and responsibility toward nature and the community.',
      'Develops conservation habits, supports green initiatives, and nurtures environmental stewardship.',
    ],
    color: 'emerald',
  },
  {
    logo: srvSportsAcademyLogo,
    title: 'SRV SPORTS ACADEMY',
    subtitle: "Teacher's Training Program",
    points: [
      'Equips teachers with modern sports training techniques, coaching strategies, and physical education knowledge.',
      'Improves student participation, physical fitness, and promotes a healthy active lifestyle.',
      'Builds team management skills, discipline, sportsmanship, and quality sports education.',
    ],
    color: 'blue',
  },
];

const colorMap = {
  amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
};

const landingHighlights = [
  {
    title: 'Teacher Development',
    description: 'Training programs strengthen teaching methods, classroom quality, and continuous professional growth.',
  },
  {
    title: 'Student Readiness',
    description: 'Communication, digital skills, confidence, and practical awareness prepare students for real-world success.',
  },
  {
    title: 'Specialized Clubs',
    description: 'Programs like CDC, ECO Club, Sports Academy, and SUITS build focused abilities beyond academics.',
  },
];

export function SkillDevelopment() {
  return (
    <div className="srv-page-shell flex min-h-screen flex-col bg-slate-50">
      <PageHero
        title="Programs that strengthen communication, leadership, teaching quality, and practical readiness."
        breadcrumb="Skill Development"
        description="SRV's structured development programs help teachers and students grow with stronger skills, better confidence, and deeper readiness for future opportunities."
        highlights={landingHighlights}
      />

      <div className="srv-page-container mx-auto w-full max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8">
        <div className="mb-24 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-amber-500 font-semibold tracking-widest uppercase text-sm mb-3 block">
              SRV Programs
            </span>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 leading-tight mb-6">
              Skill Development
              <br />
              <span className="text-amber-500">Activities We Provide</span>
            </h2>
            <p className="text-slate-600 text-[15px] leading-relaxed mb-6">
              Our Skill Development page highlights the structured activity programs offered by SRV for both students and teachers. These initiatives are designed to strengthen communication, teaching quality, technology readiness, environmental awareness, and sports education through practical training and continuous development.
            </p>
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-r-xl">
              <p className="text-emerald-800 text-sm font-semibold">
                Focused growth for every learner:
              </p>
              <p className="text-emerald-700 text-sm mt-1">
                From teacher training to student development, each program is built to create confidence, discipline, and real-world readiness.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="flex items-center justify-center"
          >
            <motion.div
              animate={{ y: [-12, 12, -12] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="flex h-56 w-56 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white p-5 shadow-2xl ring-4 ring-amber-200 ring-offset-4 sm:h-72 sm:w-72 sm:border-8 sm:p-6 md:h-80 md:w-80 md:p-8">
                <img
                  src={srvHeroLogo}
                  alt="SRV logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute bottom-2 right-2 rounded-2xl border border-amber-100 bg-white px-4 py-2.5 text-center shadow-xl sm:-bottom-4 sm:-right-4 sm:px-5 sm:py-3">
                <p className="text-amber-500 font-display font-bold text-lg leading-none">6 Programs</p>
                <p className="text-slate-500 text-[9px] uppercase tracking-widest mt-0.5">SRV Activities</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-amber-500 font-semibold tracking-widest uppercase text-sm mb-3 block">Our Activities</span>
          <h3 className="text-3xl font-display font-bold text-slate-900">Skill Development Programs at SRV</h3>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {programs.map((program, idx) => {
            const c = colorMap[program.color];
            return (
              <motion.div
                key={program.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="group p-8 bg-white rounded-3xl border border-slate-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-6 ${c.bg} group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
                  <img
                    src={program.logo}
                    alt={`${program.title} logo`}
                    className="w-full h-full object-contain p-2 rounded-xl"
                  />
                </div>
                <h4 className="font-display font-bold text-slate-900 text-lg md:text-xl mb-1">{program.title}</h4>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-4">{program.subtitle}</p>
                <div className="space-y-3">
                  {program.points.map((point) => (
                    <div key={point} className="flex gap-3">
                      <CheckCircle2 size={16} className={`shrink-0 mt-0.5 ${c.text}`} />
                      <p className="text-slate-500 text-sm md:text-[15px] leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-slate-900 p-6 text-white sm:p-10 md:p-14"
        >
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-amber-400 font-semibold uppercase tracking-widest text-sm mb-3 block">Join Us</span>
              <h3 className="text-3xl font-display font-bold mb-4 leading-tight">
                Nurturing Minds &
                <br />
                Building Character
              </h3>
              <p className="text-emerald-100 text-[15px] leading-relaxed mb-6">
                At Sri Ramakrishna Vidyalaya Matriculation School, we believe education goes beyond academics. We focus on fostering well-rounded individuals by providing a strong academic foundation alongside opportunities for character development and confidence building.
              </p>
              <ul className="space-y-3">
                {['Holistic curriculum from KG to upper secondary', '30+ experienced teachers', 'Open admissions year-round'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-emerald-100 text-sm">
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <Link
                to="/admission"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all text-sm shadow-md"
              >
                <ArrowRight size={18} /> Apply for Admission
              </Link>
              <Link
                to="/contact"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all text-sm"
              >
                <Phone size={18} /> Contact Us
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <StatsCtaBanner />
    </div>
  );
}
