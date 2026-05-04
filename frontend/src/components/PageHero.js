import { motion } from 'motion/react';

/**
 * Reusable landing hero for all inner pages.
 * Props:
 *   title       - Primary landing statement
 *   breadcrumb  - Label chip for the page
 *   description - Supporting text below the heading
 *   highlights  - Array of three short cards with title + description
 */
export function PageHero({ title, breadcrumb, description, highlights = [] }) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.15),_transparent_40%),linear-gradient(135deg,_#0f172a_0%,_#020617_100%)] pb-16 pt-24 sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-32">
      <div className="absolute inset-0 z-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute -left-16 top-1/3 h-52 w-52 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -right-12 top-20 h-56 w-56 rounded-full bg-amber-500/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:gap-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          <p className="mb-4 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-500 backdrop-blur sm:mb-5 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.28em]">
            {breadcrumb || title}
          </p>
          <h1 className="luxurious-roman-regular mb-6 text-3xl font-display font-semibold leading-tight tracking-wide text-white drop-shadow-lg sm:text-5xl lg:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-base font-light leading-7 text-slate-300 sm:text-lg sm:leading-8 md:text-xl">
              {description}
            </p>
          ) : null}
        </motion.div>

        {highlights.length > 0 ? (
          <div className="mt-2 grid gap-4 sm:mt-4 sm:grid-cols-2 xl:grid-cols-3">
            {highlights.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-[28px] border border-white/10 bg-slate-800/50 p-5 text-white shadow-2xl shadow-black/20 backdrop-blur sm:p-6"
              >
                <h2 className="mb-3 text-lg font-display font-semibold text-amber-400 sm:text-xl">{item.title}</h2>
                <p className="text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">{item.description}</p>
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
