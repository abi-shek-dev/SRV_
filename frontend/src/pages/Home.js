import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Building, Monitor, FlaskConical, Trophy, Video, BookOpen, Palette, Bus, MessageSquare, ChevronRight, CheckCircle2, Calendar, Award, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import heroVideo from '../assets/home/srv_revison4_60_fps.webm';
import heroImg1 from '../assets/home/home.webp';
import heroImg2 from '../assets/home/WhatsApp Image 2026-04-04 at 2.48.55 PM.webp';
import heroImg3 from '../assets/home/DSC08819.webp';
import heroImg4 from '../assets/home/DSC08691.webp';
import heroImg5 from '../assets/home/DSC08736.webp';

const mediaSequence = [
  { type: 'video', src: heroVideo },
  { type: 'image', src: heroImg1 },
  { type: 'image', src: heroImg2 },
  { type: 'image', src: heroImg3 },
  { type: 'image', src: heroImg4 },
  { type: 'image', src: heroImg5 },
];

const features = [
  {
    icon: Building,
    title: 'School Campus',
    description: '(SRV) Uppilliapuram serves the educational needs of more than 10 nearby villages of Uppilliapuram.',
    color: 'emerald'
  },
  {
    icon: Monitor,
    title: 'Computer Lab',
    description: 'These carefully created labs enable kids to see and apply the lessons they learn from books. The assistance is used to carry out the tests.',
    color: 'blue'
  },
  {
    icon: FlaskConical,
    title: 'Science Labs',
    description: 'Questions about how to erase stains, why certain chemicals have effervescence, or appear blue have all been satisfactorily addressed.',
    color: 'purple'
  },
  {
    icon: Trophy,
    title: 'Sports Activity',
    description: 'To cultivate a sound body and sound mind. Guaranteed psychological and physical well-being. Muscular strength is a particular focus.',
    color: 'amber'
  },
  {
    icon: Video,
    title: 'Audio-Visual Classroom',
    description: 'Human senses are greatly enhanced by auditory and visual stimuli. We rely on these sensory impacts to produce intellect quickly.',
    color: 'emerald'
  },
  {
    icon: BookOpen,
    title: 'Library',
    description: 'Reading is essential. Our everyday school lives attest to the continued value of books and the necessity of reading in a digital world.',
    color: 'blue'
  },
  {
    icon: Palette,
    title: 'Activity Room',
    description: 'Activity areas provide an excellent learning environment. They offer lots of room with windows that bring in natural light and fresh air.',
    color: 'purple'
  },
  {
    icon: Bus,
    title: 'Transport',
    description: 'School buses available to carry students. In addition to school tuition, students who use the bus service pay the bus fare.',
    color: 'amber'
  },
  {
    icon: MessageSquare,
    title: 'SMS Alert',
    description: 'Parents precisely receive updates on homework, attendance, exam results, and other pertinent student information via our school app.',
    color: 'emerald'
  }
];

function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  const numberMatch = value.match(/[\d,.]+/);
  if (!numberMatch) return <span ref={ref}>{value}</span>;

  const numStrRaw = numberMatch[0];
  const numClean = numStrRaw.replace(/,/g, '');
  const target = parseFloat(numClean);
  const suffix = value.substring(numberMatch.index + numStrRaw.length);
  const prefix = value.substring(0, numberMatch.index);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let startTime;
          const duration = 2000;
          const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(easeOutQuart * target);
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(target);
            }
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  const displayCount = target % 1 === 0 ? Math.floor(count) : Number(count.toFixed(1));
  const hasComma = value.includes(',');
  const formattedCount = hasComma ? displayCount.toLocaleString('en-US') : displayCount.toString();

  return <span ref={ref} className="inline-block">{prefix}{formattedCount}{suffix}</span>;
}

export function Home() {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    let timeout;
    const scheduleNext = () => {
      timeout = setTimeout(() => {
        // Prevent framer-motion from getting stuck by not transitioning if tab is in the background
        if (document.hidden) {
          scheduleNext();
        } else {
          setCurrentMediaIndex((prevIndex) => {
            return prevIndex >= mediaSequence.length - 1 ? 1 : prevIndex + 1;
          });
        }
      }, document.hidden ? 1000 : 5000);
    };

    if (mediaSequence[currentMediaIndex].type === 'image') {
      scheduleNext();
    }

    return () => clearTimeout(timeout);
  }, [currentMediaIndex]);

  return (
    <div className="srv-page-shell relative flex flex-col bg-slate-50">

      {/* Premium Minimal Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-black">
          <AnimatePresence initial={false}>
            {currentMediaIndex === 0 ? (
              <motion.video
                key="hero-video"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                autoPlay
                muted
                playsInline
                onEnded={() => setCurrentMediaIndex(1)}
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              >
                <source src={mediaSequence[0].src} type="video/webm" />
              </motion.video>
            ) : (
              <motion.img
                key={`hero-img-${currentMediaIndex}`}
                src={mediaSequence[currentMediaIndex].src}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                alt="School Hero"
              />
            )}
          </AnimatePresence>
          {/* Clean, single uniform overlay to let the video shine */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pt-24 text-center sm:px-6 sm:pt-16 lg:px-8">
          <AnimatePresence>
            {currentMediaIndex > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center"
              >
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="luxurious-roman-regular mb-6 text-4xl font-display font-semibold leading-[1.1] tracking-wide text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-[68px]"
                >
                  SRV Matriculation School
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="mb-10 max-w-3xl px-2 text-base font-light leading-relaxed text-white/90 drop-shadow-md sm:mb-12 sm:px-0 sm:text-lg md:text-2xl"
                >
                  Empowering minds, shaping the future, and achieving excellence.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
                >
                  <Link
                    to="/about"
                    className="w-full rounded-full border border-white/40 bg-white/10 px-8 py-3.5 font-medium text-white transition-all duration-300 hover:bg-white/20 sm:w-auto sm:min-w-[180px]"
                  >
                    Know More
                  </Link>
                  <Link
                    to="/contact"
                    className="w-full rounded-full bg-white px-8 py-3.5 font-medium text-slate-900 transition-all duration-300 hover:border-2 hover:border-green-300 hover:bg-green-100 sm:w-auto sm:min-w-[180px]"
                  >
                    Contact Us
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-20 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="rounded-2xl border border-green-300 bg-white p-6 shadow-xl shadow-green-50 sm:p-8 md:p-12">
          <div className="grid grid-cols-1 gap-6 divide-slate-200/60 sm:grid-cols-2 sm:gap-8 xl:grid-cols-4 xl:gap-12 xl:divide-x">
            {[
              { label: 'Enrolled Students', value: '1,200+' },
              { label: 'Expert Faculty', value: '150+' },
              { label: 'Years of Legacy', value: '36+' },
              { label: 'Alumni Worldwide', value: '10k+' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1 }}
                className="luxurious-roman-regular text-center xl:px-4"
              >
                <div className="mb-2 text-3xl font-display font-bold text-slate-900 sm:text-4xl md:text-5xl">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-emerald-600 text-sm md:text-base font-semibold tracking-wide uppercase">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">

            {/* Image Composition (Diamond Layout) */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[320px] sm:h-[420px] md:h-[500px] lg:h-[600px]"
            >
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0"
                style={{ willChange: 'transform' }}
              >
                {/* Center Diamond */}
                <div className="absolute left-1/2 top-1/2 z-20 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rotate-45 overflow-hidden rounded-[1.75rem] border-4 border-white shadow-2xl sm:h-60 sm:w-60 sm:rounded-[2.25rem] sm:border-[6px] md:h-72 md:w-72 lg:h-80 lg:w-80 lg:rounded-[2.5rem] lg:border-8">
                  <img src={heroImg4} loading="lazy" decoding="async" className="-rotate-45 scale-[1.35] object-cover w-full h-full" alt="Students" />
                </div>
                {/* Top Right Diamond */}
                <div className="absolute right-6 top-6 z-10 h-28 w-28 rotate-45 overflow-hidden rounded-2xl border-4 border-white shadow-xl sm:h-36 sm:w-36 sm:rounded-3xl sm:border-[6px] md:right-4 md:top-4 md:h-40 md:w-40 lg:h-48 lg:w-48 lg:border-8">
                  <img src={heroImg5} loading="lazy" decoding="async" className="-rotate-45 scale-150 object-cover w-full h-full" alt="Campus trees" />
                </div>
                {/* Bottom Left Diamond */}
                <div className="absolute bottom-6 left-6 z-10 h-28 w-28 rotate-45 overflow-hidden rounded-2xl border-4 border-white shadow-xl sm:h-36 sm:w-36 sm:rounded-3xl sm:border-[6px] md:bottom-4 md:left-4 md:h-40 md:w-40 lg:h-48 lg:w-48 lg:border-8">
                  <img src={heroImg3} loading="lazy" decoding="async" className="-rotate-45 scale-150 object-cover w-full h-full" alt="Activities" />
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
              <h2 className="text-3xl font-display font-bold leading-tight text-amber-500 sm:text-4xl lg:text-4xl">
                Welcome To Sri Ramakrishna Vidyalaya Matriculation School
              </h2>

              <div className="space-y-4 text-sm leading-relaxed text-slate-700 sm:text-[15px]">
                <p>
                  Sri Ramakrishna Vidyalaya Matriculation School (SRV) Uppilliapuram serves the educational needs of more than 10 nearby villages of Uppilliapuram & Pachamalai hills in Tiruchirappalli district. SRV School is established in 13.07.1988 by Mr. Sivanesan. It is a co-educational school offering classes from Kindergarten to Class X. School is recognized by government of Tamilnadu.
                </p>
                <p>
                  School currently caters to the educational needs of more than 600+ students belonging to different socio-economic groups with 30+ teaching staffs & 10 Non teaching staffs. SRV is one of the renowned Matriculation schools in Uppilliapuram. School provides a truly enabling environment to contribute to the holistic development of each student.
                </p>
                <p>
                  It is a unique school with an extraordinary dedication, spanning well more than 36 years! The school has gradually developed over the years have till 10 std. We provide academic excellence to our students. This is facilitated by dedicated educators who are trained to channelize their energy and resources towards child-centered qualitative learning.
                </p>
              </div>

              <div className="space-y-5 pt-4">
                <div className="flex gap-4 items-start">
                  <CheckCircle2 className="text-amber-500 shrink-0 mt-0.5" strokeWidth={2.5} size={22} />
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">This institution is managed by a very effective team of educators under the direction of an intellectual advisory group. Excellent amenities, well-spaced infrastructure, and qualified personnel.</p>
                </div>
                <div className="flex gap-4 items-start">
                  <CheckCircle2 className="text-amber-500 shrink-0 mt-0.5" strokeWidth={2.5} size={22} />
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">With integrated courses, students may receive a comprehensive education through interdisciplinary learning that promotes critical thinking and practical application.</p>
                </div>
              </div>

              <div className="pt-6">
                <Link to="/about" className="inline-flex items-center justify-center px-8 py-3.5 bg-amber-500 text-white rounded-full font-bold hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shadow-amber-500/20">
                  Learn More
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us / Features */}
      <section className="relative bg-slate-50 py-20 sm:py-24 lg:py-32">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-amber-100/40 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-16 text-center sm:mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-amber-500 font-semibold uppercase tracking-widest text-sm mb-3"
            >
              Why Choose SRV
            </motion.h2>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mb-6 text-3xl font-display font-bold text-slate-900 sm:text-4xl md:text-5xl"
            >
              Excellence in Every Step
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-600 max-w-2xl mx-auto"
            >
              We provide an enriching atmosphere that blends deep academic rigor with robust personal development.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/10 sm:p-8"
              >
                {/* Decorative hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-md flex items-center justify-center mb-8 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                    ${feature.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                      feature.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                        feature.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                          'bg-purple-100 text-purple-600'}`}
                  >
                    <feature.icon size={36} strokeWidth={2} className="md:w-10 md:h-10 w-8 h-8" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-display title-serif font-bold text-slate-900 mb-4">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-[15px]">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Skill Development Section */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
        {/* Decorative Dotted Pattern (from the image) */}
        <div className="absolute top-8 right-8 p-8 opacity-20 hidden lg:block pointer-events-none">
          <svg width="250" height="250" viewBox="0 0 200 200">
            <defs>
              <pattern id="dot-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="#10b981" />
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#dot-pattern)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 lg:order-1 order-2"
            >
              <h2 className="text-3xl font-display font-medium leading-tight text-amber-500 sm:text-4xl lg:text-4xl">
                Skill development
              </h2>

              <div className="space-y-4 text-sm leading-relaxed text-slate-700 sm:text-[15px]">
                <p>
                  <strong className="text-slate-900 font-semibold">Go beyond academics</strong> and develop the essential skills needed for success in the 21st century. Our comprehensive Extracurricular (EC) Program equips you with not only core subject expertise but also the <strong className="text-slate-900 font-semibold">highly sought-after employability skills</strong> employers crave:
                </p>

                <ul className="space-y-4 pt-4">
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Communication Mastery:</strong> Sharpen your <strong className="text-slate-900 font-semibold">verbal and written communication</strong> skills in <strong className="text-slate-900 font-semibold">Hindi, English, Tamil, and Arabic</strong> to excel in any situation. (<strong className="text-amber-500 font-semibold">New!</strong> Develop commercial awareness through real-world scenarios.)</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Effective Teamwork & Problem Solving:</strong> Collaborate seamlessly, tackle challenges with innovative solutions, and demonstrate <strong className="text-slate-900 font-semibold">initiative</strong>.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Lifelong Learner:</strong> Cultivate a growth mindset and a commitment to <strong className="text-slate-900 font-semibold">lifelong learning</strong>.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Positive Work Attitude:</strong> Develop a strong work ethic, self-management skills, and a <strong className="text-slate-900 font-semibold">positive attitude towards work</strong>.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Holistic Wellbeing:</strong> Prioritize your physical and mental health.</p>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link to="/skills" className="inline-flex items-center justify-center px-8 py-3.5 bg-amber-500 text-white rounded-md font-bold hover:bg-amber-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  Learn More
                </Link>
              </div>
            </motion.div>

            {/* Circular Image Layout */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 relative flex items-center justify-center lg:order-2 lg:h-[600px] lg:justify-end"
            >
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-20 aspect-square w-full max-w-[20rem] overflow-hidden rounded-[60px] border-4 border-white/50 shadow-xl sm:max-w-md sm:rounded-[120px] sm:border-[6px] lg:max-w-lg lg:rounded-[200px] lg:border-8"
                style={{ willChange: 'transform' }}
              >
                <img src={heroImg2} loading="lazy" decoding="async" className="object-cover w-full h-full scale-105" alt="Students" />
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Co-Curricular Activities Section */}
      <section className="relative overflow-hidden bg-slate-50 py-16 sm:py-20 lg:py-24">
        {/* Decorative Dotted Pattern */}
        <div className="absolute top-8 left-8 p-8 opacity-20 hidden lg:block pointer-events-none">
          <svg width="250" height="250" viewBox="0 0 200 200">
            <defs>
              <pattern id="dot-pattern-2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="#f59e0b" />
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#dot-pattern-2)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">

            {/* Blob Image Layout */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative lg:h-[600px] flex items-center justify-center lg:justify-start"
            >
              {/* Organic blob shape using border-radius */}
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-20 aspect-square w-full max-w-[20rem] overflow-hidden border-4 border-white/50 shadow-xl sm:max-w-md sm:border-[6px] lg:max-w-lg lg:border-8"
                style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', willChange: 'transform' }}
              >
                <img src={heroImg1} loading="lazy" decoding="async" className="object-cover w-full h-full scale-105" alt="Kids playing outside" />
              </motion.div>
            </motion.div>

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-display font-medium leading-tight text-amber-500 sm:text-4xl lg:text-4xl">
                Co-Curricular Activities
              </h2>

              <div className="space-y-4 text-sm leading-relaxed text-slate-700 sm:text-[15px]">
                <p>
                  Our school offers a variety of co-curricular activities to complement academic learning and foster personal growth.
                </p>

                <ul className="space-y-4 pt-4">
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Sports and Physical Education:</strong> Activities include football, basketball, athletics, and yoga, promoting health, teamwork, and resilience.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Arts and Crafts:</strong> Students explore their creativity through drawing, painting, and craft projects.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Music and Dance:</strong> Programs include learning musical instruments, vocal techniques, and dance forms, enhancing appreciation of the performing arts.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Drama and Theatre:</strong> Develops acting skills, confidence, and communication abilities through plays and performances.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Clubs and Societies:</strong> Includes Science Club, Literary Club, Math Club, and Eco Club for in-depth exploration of interests.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Community Service:</strong> Encourages responsibility and compassion through societal contributions.</p>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link to="/co-curricular" className="inline-flex items-center justify-center px-8 py-3.5 bg-amber-500 text-white rounded-md font-bold hover:bg-amber-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  Learn More
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Footer CTA & Stats Banner */}
      <section className="relative overflow-hidden bg-slate-900 py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 luxurious-roman-regular">

          {/* Stats Grid */}
          <div className="mt-8 mb-14 grid grid-cols-1 gap-8 border-b border-white/10 pb-14 sm:mb-20 sm:grid-cols-2 sm:gap-12 sm:pb-20 xl:grid-cols-4">
            {/* Stat 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center"
            >
              <Calendar className="text-amber-500 mb-5 w-12 h-12 md:w-14 md:h-14" strokeWidth={2} />
              <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-3"><AnimatedCounter value="1988" /></h3>
              <p className="text-slate-300 font-medium tracking-wide">Established</p>
            </motion.div>

            {/* Stat 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <Award className="text-amber-500 mb-5 w-12 h-12 md:w-14 md:h-14" strokeWidth={2} />
              <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-3"><AnimatedCounter value="36+" /></h3>
              <p className="text-slate-300 font-medium tracking-wide">Year Of Experience</p>
            </motion.div>

            {/* Stat 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <Shield className="text-amber-500 mb-5 w-12 h-12 md:w-14 md:h-14" strokeWidth={2} />
              <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-3"><AnimatedCounter value="600+" /></h3>
              <p className="text-slate-300 font-medium tracking-wide">Students</p>
            </motion.div>

            {/* Stat 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              <Users className="text-amber-500 mb-5 w-12 h-12 md:w-14 md:h-14" strokeWidth={2} />
              <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-3"><AnimatedCounter value="30+" /></h3>
              <p className="text-slate-300 font-medium tracking-wide">Well Experienced Teachers</p>
            </motion.div>
          </div>

          {/* CTA Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-6 text-3xl font-display font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                Educating the next generation of leaders
              </h2>
              <p className="text-slate-300 leading-relaxed text-[16px]">
                We are dedicated to providing top-notch education and fostering a learning environment where students can thrive. Our mission is to inspire, educate, and empower individuals to achieve their full potential and contribute meaningfully to society
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:text-right"
            >
              <Link to="/contact" className="inline-flex w-full items-center justify-center rounded-md bg-amber-500 px-10 py-4 font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-lg sm:w-auto">
                Contact Us
              </Link>
            </motion.div>
          </div>

        </div>
      </section>

    </div>
  );
}
