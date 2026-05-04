import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Calendar, Award, Shield, Users } from 'lucide-react';

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

export function StatsCtaBanner() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.15),_transparent_40%),linear-gradient(135deg,_#0f172a_0%,_#020617_100%)] py-20 sm:py-24">
      <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-emerald-500/12 blur-[90px]" />
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-amber-500/12 blur-[110px]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 border-b border-white/10 pb-14 pt-4 sm:grid-cols-2 sm:gap-6 sm:pb-20 xl:grid-cols-4 xl:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[28px] border border-white/10 bg-white/8 px-4 py-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur sm:px-5 sm:py-8"
          >
            <Calendar className="mx-auto mb-5 text-amber-400" size={40} strokeWidth={2} />
            <h3 className="mb-3 text-3xl font-display font-bold text-white sm:text-4xl md:text-5xl">
              <AnimatedCounter value="1988" />
            </h3>
            <p className="text-sm font-medium tracking-wide text-emerald-50/85">Established</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-[28px] border border-white/10 bg-white/8 px-4 py-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur sm:px-5 sm:py-8"
          >
            <Award className="mx-auto mb-5 text-amber-400" size={40} strokeWidth={2} />
            <h3 className="mb-3 text-3xl font-display font-bold text-white sm:text-4xl md:text-5xl">
              <AnimatedCounter value="36+" />
            </h3>
            <p className="text-sm font-medium tracking-wide text-emerald-50/85">Year Of Experience</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-[28px] border border-white/10 bg-white/8 px-4 py-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur sm:px-5 sm:py-8"
          >
            <Shield className="mx-auto mb-5 text-amber-400" size={40} strokeWidth={2} />
            <h3 className="mb-3 text-3xl font-display font-bold text-white sm:text-4xl md:text-5xl">
              <AnimatedCounter value="600+" />
            </h3>
            <p className="text-sm font-medium tracking-wide text-emerald-50/85">Students</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="rounded-[28px] border border-white/10 bg-white/8 px-4 py-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur sm:px-5 sm:py-8"
          >
            <Users className="mx-auto mb-5 text-amber-400" size={40} strokeWidth={2} />
            <h3 className="mb-3 text-3xl font-display font-bold text-white sm:text-4xl md:text-5xl">
              <AnimatedCounter value="30+" />
            </h3>
            <p className="text-sm font-medium tracking-wide text-emerald-50/85">Well Experienced Teachers</p>
          </motion.div>
        </div>

        {/* CTA Content */}
        <div className="grid items-center gap-8 pt-10 sm:gap-12 sm:pt-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
              Build The Future
            </p>
            <h2 className="luxurious-roman-regular text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6 leading-tight">
              Educating the next generation of leaders
            </h2>
            <p className="max-w-2xl text-emerald-50/85 leading-relaxed text-[16px]">
              We are dedicated to providing top-notch education and fostering a learning environment where students can thrive. Our mission is to inspire, educate, and empower individuals to achieve their full potential and contribute meaningfully to society
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:justify-self-end lg:text-right"
          >
            <div className="inline-flex w-full rounded-[32px] border border-white/10 bg-white/8 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur sm:w-auto">
              <Link to="/contact" className="inline-flex w-full items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#f59e0b_0%,#d97706_100%)] px-10 py-4 font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:brightness-105 sm:w-auto">
              Contact Us
              </Link>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
