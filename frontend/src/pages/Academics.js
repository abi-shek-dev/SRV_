import { motion } from 'motion/react';
import { BookOpen, Globe, Users, Lightbulb, CheckCircle2 } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';
import { academicImages, getPageImage } from '../config/pageImages';

const coCurricularActivities = [
  'Dance', 'Drama', 'Singing', 'Debates', 'Elocution', 'Yoga',
  'Karate', 'Silambam', 'Chess', 'Roller Skating', 'Swimming',
  'Taekwondo', 'Arts', 'Dramatics', 'Music',
];

const skillItems = [
  { title: 'Communication Skills', desc: 'Verbal and written communication in Hindi, English, Tamil, and Arabic.' },
  { title: 'Commercial Awareness', desc: 'Developing real-world awareness through practical learning scenarios.' },
  { title: 'Teamwork & Problem Solving', desc: 'Collaborative thinking and innovative approaches to challenges.' },
  { title: 'Lifelong Learning', desc: 'Cultivating a growth mindset and commitment to continuous improvement.' },
  { title: 'Self-Management', desc: 'Building strong work ethic, initiative, and a positive attitude towards work.' },
];

const landingHighlights = [
  {
    title: 'Recognized Curriculum',
    description: 'SRV follows the Tamil Nadu Directorate curriculum and builds a strong academic foundation from kindergarten to upper secondary.',
  },
  {
    title: 'Balanced Learning',
    description: 'Students grow through a healthy mix of classroom learning, co-curricular participation, discipline, and value-based education.',
  },
  {
    title: 'Language Strength',
    description: 'Special emphasis is given to communication and language development in Hindi, English, Tamil, and Arabic.',
  },
];

export function Academics() {
  return (
    <div className="srv-page-shell flex min-h-screen flex-col bg-slate-50">
      <PageHero
        title="Academic learning at SRV is built to shape knowledge, discipline, confidence, and lifelong curiosity."
        breadcrumb="Academics"
        description="We believe in comprehensive education that motivates children to pursue new opportunities while growing through strong academics, language skills, values, and co-curricular exposure."
        highlights={landingHighlights}
      />

      <div className="srv-page-container mx-auto w-full max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8">

        {/* Section 1 - Overview + Diamond Image */}
        <div className="mb-24 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">

          {/* Diamond Image Collage */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[320px] sm:h-[420px] md:h-[480px]"
          >
            <motion.div
              animate={{ y: [-12, 12, -12] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              {/* Center Diamond */}
              <div className="absolute left-1/2 top-1/2 z-20 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rotate-45 overflow-hidden rounded-[1.75rem] border-4 border-white shadow-2xl sm:h-60 sm:w-60 sm:rounded-[2.25rem] sm:border-[6px] md:h-72 md:w-72 lg:rounded-[2.5rem] lg:border-8">
                <img
                  src={getPageImage(academicImages, 0, academicImages[0]?.url)}
                  className="-rotate-45 scale-[1.35] object-cover w-full h-full"
                  alt="Student"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Top Right */}
              <div className="absolute right-6 top-6 z-10 h-28 w-28 rotate-45 overflow-hidden rounded-2xl border-4 border-white shadow-xl sm:h-36 sm:w-36 sm:rounded-3xl sm:border-[6px] md:right-4 md:top-4 md:h-44 md:w-44 lg:border-8">
                <img
                  src={getPageImage(academicImages, 1, academicImages[1]?.url)}
                  className="-rotate-45 scale-150 object-cover w-full h-full"
                  alt="Classroom"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Bottom Left */}
              <div className="absolute bottom-6 left-6 z-10 h-28 w-28 rotate-45 overflow-hidden rounded-2xl border-4 border-white shadow-xl sm:h-36 sm:w-36 sm:rounded-3xl sm:border-[6px] md:bottom-4 md:left-4 md:h-44 md:w-44 lg:border-8">
                <img
                  src={getPageImage(academicImages, 2, academicImages[2]?.url)}
                  className="-rotate-45 scale-150 object-cover w-full h-full"
                  alt="Science"
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
              <span className="text-amber-500 font-semibold tracking-widest uppercase text-sm mb-3 block">Our School</span>
              <h2 className="mb-5 text-3xl font-display font-bold leading-tight text-slate-900 sm:text-4xl">
                Sri Ramakrishna Vidyalaya<br />Matriculation School
              </h2>
            </div>

            <div className="space-y-4 text-slate-600 text-[15px] leading-relaxed">
              <p>
                We believe in offering a comprehensive education to our kids. Our primary goal is to motivate them to pursue new educational opportunities. In addition to academic successes, we place emphasis on discipline and value-based education. We give our pupils the opportunity to flourish in both scholastic and extracurricular activities. We admit students from kindergarten to upper secondary grades.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl">
                <p className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <BookOpen size={18} className="text-amber-500" /> Curriculum
                </p>
                <p className="text-sm">
                  Our school is recognized by the Tamil Nadu government and follows a curriculum that meets the Directorate of School Education's criteria. To improve linguistic skills, we have made three languages obligatory in grades I-V. Apart from academics, we encourage our students to participate in extracurricular activities.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Section 2 - Co-Curricular Activities */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl sm:p-10 md:p-14">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <Users size={22} />
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-900">Co-Curricular Activities</h3>
            </div>
            <div className="w-10 h-1 bg-emerald-500 rounded-full mb-6 ml-[52px]"></div>

            <p className="text-slate-600 text-[15px] leading-relaxed mb-6">
              The school also encourages co-curricular activities such as dance, drama, singing, debates, elocution, yoga, Karate, Silambam, Chess etc. through Inter House Competitions.
            </p>
            <p className="text-slate-600 text-[15px] leading-relaxed mb-8">
              SRV has always sought to achieve total development of each pupil, with emphasis on learning and co-curricular activities. The school endeavors to ensure that each child receives their fair share of individual attention. The school organizes various club activities and field trips for the students to explore and expand the classroom knowledge. The school's calendar is filled with various co-curricular activities.
            </p>

            <div className="flex flex-wrap gap-2.5">
              {coCurricularActivities.map((activity) => (
                <span
                  key={activity}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-full border border-emerald-200"
                >
                  {activity}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Section 3 - Skill Development */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12"
        >
          <div className="h-full rounded-3xl bg-slate-900 p-6 text-white sm:p-10 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                <Lightbulb size={20} className="text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold">Skill Development</h3>
            </div>
            <p className="text-emerald-100 text-[15px] leading-relaxed mb-4">
              In general, apart from the core subject expertise, some of the prominent employable skills that employers seek are: communication skills (verbal and written), commercial awareness, attitude towards work, lifelong learning, self-management, teamwork, problem solving, and initiative.
            </p>
            <p className="text-emerald-100 text-[15px] leading-relaxed">
              The school focuses specially on developing and enhancing required language skills in languages like <strong className="text-white">Hindi, English, Tamil and Arabic.</strong>
            </p>
          </div>

          <div className="space-y-4">
            {skillItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <CheckCircle2 className="text-amber-500 shrink-0 mt-0.5" size={20} strokeWidth={2.5} />
                <div>
                  <p className="font-semibold text-slate-900 text-sm mb-1">{item.title}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>

      <StatsCtaBanner />
    </div>
  );
}
