import { motion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  ChefHat,
  Compass,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import founderImage from '../assets/about/founder.png';
import chairmanImage from '../assets/about/chairman.jpeg';
import principalImage from '../assets/about/principal.png';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';

const highlights = [
  {
    title: 'Founded With Purpose',
    description:
      'Ramakrishna Vidyalaya Matriculation School began on 13.7.1988 with a clear promise to bring quality education to the heart of rural Tamil Nadu.',
  },
  {
    title: 'Rural Student Focus',
    description:
      'We work to uplift girls and boys from farming and rural communities through meaningful learning, discipline, and life-changing opportunities.',
  },
  {
    title: 'Holistic Growth',
    description:
      'Our campus culture encourages academic excellence, confidence, values, and harmony between introvert and extrovert learners.',
  },
];

const promiseCards = [
  {
    icon: Compass,
    title: 'Goal',
    description:
      'To be one of the best schools in the country, known for academic excellence, high standards of behavior, and rich after-school opportunities.',
  },
  {
    icon: Target,
    title: 'Impact',
    description:
      'To shape future generations into responsible, productive citizens who contribute meaningfully to the nation.',
  },
  {
    icon: Users,
    title: 'Inclusion',
    description:
      'We support students of all backgrounds, abilities, and aspirations so they can discover their strengths and reach their full potential.',
  },
  {
    icon: HeartHandshake,
    title: 'Values',
    description:
      'We promote lifelong self-discipline, love for learning, respect for others, and strong moral character.',
  },
];

const leadership = [
  {
    name: 'Mr. A. Sivanesan',
    role: 'Founder',
    image: founderImage,
    imageClassName: 'object-cover object-top scale-110',
    summary:
      'Founder of Ramakrishna Vidyalaya Matriculation School and the guiding force behind its early growth in Uppiliapuram.',
    points: [
      'Started the school on 13.7.1988 as Correspondent and President of the managing body.',
      'Known for neat, clean, and up-to-date work with a deep commitment to disciplined administration.',
      'Extended quality education to rural communities beyond social bias and helped transform young lives through learning.',
    ],
  },
  {
    name: 'Adv. Shiv. Umashankar',
    role: 'Chairman',
    image: chairmanImage,
    summary:
      'A dynamic leader whose experience in business, law, and public service strengthens the school\'s long-term vision.',
    points: [
      'Holds an MBA from the University of Madras and an LLB, supporting both leadership and legal advocacy work.',
      'Started his IT business in 1999 and brings over 20 years of experience, including work with HCL and Toshiba.',
      'Leads the school with a focus on quality rural education, holistic student development, modern learning, and strong values.',
      'Actively supports environmental protection, sustainable practices, and rural farming communities.',
    ],
  },
  {
    name: 'Mrs. Jayanthi',
    role: 'Principal',
    image: principalImage,
    summary:
      'For the past eight years, she has helped shape a disciplined, caring, and student-centered learning culture at SRVM School.',
    points: [
      'Provides steady academic leadership while building a warm and well-organized school environment.',
      'Encourages teachers and students to pursue consistent progress, confidence, and character along with strong results.',
      'Works closely with families to ensure every child feels supported, guided, and motivated to grow.',
    ],
  },
];

const supportSections = [
  {
    icon: ChefHat,
    title: 'Food Facilities',
    description:
      'SRV School ensures a safe, hygienic, and well-managed dining environment for all students. Nutritious and balanced meals are prepared under strict quality standards, promoting healthy eating habits and overall well-being.',
  },
  {
    icon: Building2,
    title: 'Infrastructure',
    description:
      'Our infrastructure reflects our commitment to a supportive and effective learning environment. With well-designed classrooms, essential facilities, and a clean, organized campus, students enjoy a comfortable space to learn and grow.',
  },
  {
    icon: Leaf,
    title: 'Nature-Centered Campus',
    description:
      'Thoughtful surroundings create the right atmosphere for the next generation of environmental leaders, encouraging harmony between students and nature.',
  },
];

export function About() {
  return (
    <div className="srv-page-shell min-h-screen bg-slate-50">
      <PageHero
        title="A school built to transform rural education with character, care, and conviction."
        breadcrumb="About SRVM School"
        description="Ramakrishna Vidyalaya Matriculation School is not just a place of education. It is a strong social reformation in the central part of Tamil Nadu, shaping a new generation with knowledge, values, discipline, and purpose."
        highlights={highlights}
      />

      <section className="srv-page-container mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[32px] bg-white p-8 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 md:p-10"
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Our Story
            </p>
            <h2 className="mb-5 text-3xl font-bold text-slate-900 md:text-4xl">
              Education that reaches where it matters most.
            </h2>
            <div className="space-y-5 text-base leading-8 text-slate-600 md:text-lg">
              <p>
                The school was started by Mr. A. Sivanesan, whose leadership and service laid the foundation for a campus that values order, excellence, and human dignity. His effort brought high-quality education to rural zones and opened doors for students who deserved opportunity beyond social limitations.
              </p>
              <p>
                SRVM continues to create a stunning harmony between quiet thinkers and expressive learners, helping every child grow in confidence, discipline, and curiosity. We believe true education transforms lifestyle, worldview, and future possibilities for the entire family.
              </p>
              <p>
                With a clear 2030 target of serving 5000 students, we remain committed to underprivileged girls and boys from every background who are ready to learn, lead, and contribute.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[32px] bg-slate-900 p-8 text-white shadow-xl shadow-slate-900/20 md:p-10"
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
              2030 Vision
            </p>
            <h2 className="mb-6 text-3xl font-bold">Growing with purpose and responsibility.</h2>
            <div className="space-y-5 text-emerald-50/85">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-4xl font-bold text-amber-300">5000</p>
                <p className="mt-2 text-sm uppercase tracking-[0.24em] text-emerald-100/70">Students by 2030</p>
              </div>
              <p>
                Our focus is to combine academic strength, values-based learning, and inclusive opportunities so rural students can step into the future with confidence.
              </p>
              <div className="flex items-center gap-3 text-sm font-medium text-amber-200">
                <ShieldCheck className="h-5 w-5" />
                High standards in behavior, discipline, and student care
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Vision And Mission
            </p>
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
              A promise rooted in learning, inclusion, and national progress.
            </h2>
            <p className="text-lg leading-8 text-slate-600">
              Every program at SRVM School is designed to build capable learners, confident individuals, and socially responsible citizens.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {promiseCards.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-7 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="leading-7 text-slate-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="srv-page-container mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Leadership
            </p>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              The people guiding the culture and future of SRVM.
            </h2>
          </div>
          <p className="max-w-xl text-slate-600">
            Their service connects educational quality with values, discipline, and deep commitment to the community.
          </p>
        </div>

        <div className="space-y-20 lg:space-y-28">
          {leadership.map((person, index) => {
            const isReversed = index % 2 !== 0;
            return (
              <motion.article
                key={person.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7 }}
                className={`grid items-center gap-8 lg:gap-16 lg:grid-cols-2 ${isReversed ? '' : ''}`}
              >
                {/* Photo */}
                <div className={`${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-300/50 ring-1 ring-slate-200">
                    <div className="aspect-[4/4.2] overflow-hidden bg-slate-100">
                      <img
                        src={person.image}
                        alt={person.name}
                        loading="lazy"
                        decoding="async"
                        className={`h-full w-full ${person.imageClassName || 'object-cover'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className={`${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
                    {person.role}
                  </p>
                  <h3 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
                    {person.name}
                  </h3>
                  <div className="mb-6 h-1 w-16 rounded-full bg-amber-400" />
                  <p className="mb-8 text-lg leading-8 text-slate-600">
                    {person.summary}
                  </p>
                  <div className="space-y-4">
                    {person.points.map((point) => (
                      <div key={point} className="flex items-start gap-3">
                        <div className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-[15px] leading-7 text-slate-600">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
              Student Support
            </p>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Facilities that strengthen everyday student life.
            </h2>
            <p className="text-lg leading-8 text-slate-300">
              Healthy routines, dependable infrastructure, and a clean learning atmosphere help students focus, belong, and thrive.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {supportSections.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-[28px] border border-white/10 bg-white/5 p-7 backdrop-blur"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-amber-300">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">{item.title}</h3>
                <p className="leading-7 text-slate-300">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <StatsCtaBanner />
    </div>
  );
}
