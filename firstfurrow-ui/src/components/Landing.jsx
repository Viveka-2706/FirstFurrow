import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { landingImages } from '../data/dummyData';
import { useReference } from '../data/useReference';
import { useLang } from '../i18n/useLang';
import LangToggle from './LangToggle';
import './Landing.css';

const lineDraw = {
  hidden: { pathLength: 0, opacity: 0 },
  show: (i) => ({
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: 1.4, delay: 0.15 * i, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 0.4, delay: 0.15 * i } },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const PARTICLES = [
  { icon: '🌱', top: '18%', left: '8%', delay: 0, duration: 5.5 },
  { icon: '🍃', top: '62%', left: '14%', delay: 0.8, duration: 6.5 },
  { icon: '🌾', top: '30%', left: '92%', delay: 1.4, duration: 6 },
  { icon: '🍃', top: '75%', left: '85%', delay: 0.4, duration: 5 },
  { icon: '🌱', top: '48%', left: '4%', delay: 2, duration: 7 },
];

const STEP_ICONS = ['🧭', '🌾', '📋'];

export default function Landing({ isLoggedIn, onPrimaryCta, onLogin, onSignup }) {
  const { t, lang, soil: loc } = useLang();
  const { soilTypes, cropNames } = useReference();
  const STEPS = [1, 2, 3].map((n, i) => ({ icon: STEP_ICONS[i], title: t(`landing.step${n}.title`), body: t(`landing.step${n}.body`) }));
  // scrolling ticker: every soil + crop the app knows, in the active language
  const TICKER_ITEMS = [
    ...soilTypes.map((s) => loc(s).name),
    ...cropNames.map((c) => (lang === 'ta' ? `${c.ta?.localName ?? c.localName} (${c.ta?.name ?? c.name})` : `${c.localName} (${c.name})`)),
  ];
  const { scrollYProgress } = useScroll();
  const furrows = [
    'M -40 120 Q 220 60, 480 130 T 980 110',
    'M -40 220 Q 240 160, 500 230 T 980 210',
    'M -40 320 Q 260 260, 520 330 T 980 310',
    'M -40 420 Q 220 380, 480 430 T 980 410',
  ];

  const [spot, setSpot] = useState({ x: 50, y: 40 });
  const handleHeroMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpot({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const media1Ref = useRef(null);
  const media2Ref = useRef(null);
  const { scrollYProgress: p1 } = useScroll({ target: media1Ref, offset: ['start end', 'end start'] });
  const { scrollYProgress: p2 } = useScroll({ target: media2Ref, offset: ['start end', 'end start'] });
  const y1 = useTransform(p1, [0, 1], [-30, 30]);
  const y2 = useTransform(p2, [0, 1], [-30, 30]);

  return (
    <div className="landing">
      <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} />

      <nav className="landing-nav">
        <motion.div className="wordmark-inline" whileHover="hover" initial="rest">
          <motion.span
            className="wordmark-dot"
            variants={{ rest: { rotate: 0, scale: 1 }, hover: { rotate: 180, scale: 1.3 } }}
            transition={{ duration: 0.4 }}
          />
          FirstFurrow
        </motion.div>
        <div className="nav-actions">
          <LangToggle variant="light" />
          {!isLoggedIn ? (
            <>
              <motion.button className="btn btn-ghost" onClick={onLogin} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{t('landing.login')}</motion.button>
              <motion.button className="btn btn-primary" onClick={onSignup} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{t('landing.getStarted')}</motion.button>
            </>
          ) : (
            <motion.button className="btn btn-primary" onClick={onPrimaryCta} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{t('landing.goToFarm')}</motion.button>
          )}
        </div>
      </nav>

      <section
        className="hero"
        onMouseMove={handleHeroMove}
        style={{ backgroundImage: `linear-gradient(150deg, rgba(18,38,26,0.88) 10%, rgba(18,38,26,0.55) 60%, rgba(13,22,15,0.85) 100%), url(${landingImages.heroFarmer})` }}
      >
        <div
          className="hero-spotlight"
          style={{ background: `radial-gradient(circle at ${spot.x}% ${spot.y}%, rgba(231,169,62,0.22), transparent 45%)` }}
          aria-hidden="true"
        />

        <svg className="hero-furrows" viewBox="0 0 940 480" preserveAspectRatio="none" aria-hidden="true">
          {furrows.map((d, i) => (
            <motion.path
              key={d}
              d={d}
              stroke="rgba(246,242,231,0.16)"
              strokeWidth="1.5"
              fill="none"
              custom={i}
              variants={lineDraw}
              initial="hidden"
              animate="show"
            />
          ))}
        </svg>

        <div className="hero-particles" aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <motion.span
              key={i}
              className="hero-particle"
              style={{ top: p.top, left: p.left }}
              animate={{ y: [0, -18, 0], rotate: [0, 8, -8, 0], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
            >
              {p.icon}
            </motion.span>
          ))}
        </div>

        <div className="hero-content">
          <motion.p className="eyebrow hero-eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
            {t('landing.eyebrow')}
          </motion.p>
          <h1 className="hero-title">
            {t('landing.title1').split(' ').map((word, i) => (
              <motion.span
                key={word}
                className="hero-word"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                {word}{' '}
              </motion.span>
            ))}
            <br />
            {t('landing.title2').split(' ').map((word, i) => (
              <motion.span
                key={word}
                className="hero-word"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.54 + i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                {word}{' '}
              </motion.span>
            ))}
            <motion.span
              className="hero-title-accent hero-word"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.78, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {t('landing.titleAccent')}
            </motion.span>
          </h1>
          <motion.p className="hero-sub" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.6 }}>
            {t('landing.sub')}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.6 }} className="hero-cta-row">
            <motion.button className="btn btn-primary" onClick={onPrimaryCta} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              {isLoggedIn ? t('landing.goToFarm') : t('landing.ctaPlant')}
            </motion.button>
            <span className="hero-cta-hint">{t('landing.ctaHint')}</span>
          </motion.div>
        </div>

        <motion.div
          className="hero-scroll-cue"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          ⌄
        </motion.div>
      </section>

      {/* Scrolling ticker of soils + crops the app understands */}
      <div className="ticker">
        <motion.div
          className="ticker-track"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span className="ticker-item" key={i}>{t}<span className="ticker-dot">●</span></span>
          ))}
        </motion.div>
      </div>

      <section className="strip">
        <motion.div className="strip-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
          <StripItem number={18} suffix="+" label={t('landing.strip1')} delay={0} />
          <StripItem number={6} suffix="" label={t('landing.strip2')} delay={0.12} />
          <StripItem number={0} suffix="" label={t('landing.strip3')} delay={0.24} />
        </motion.div>
      </section>

      {/* How it works — three-step animated walkthrough */}
      <section className="how-it-works">
        <motion.p className="eyebrow how-eyebrow" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          {t('landing.howEyebrow')}
        </motion.p>
        <motion.h2 className="how-title" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}>
          {t('landing.howTitle')}
        </motion.h2>

        <div className="how-steps">
          <div className="how-line" />
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              className="how-step"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ type: 'spring', stiffness: 140, damping: 14, delay: i * 0.18 }}
            >
              <motion.div
                className="how-step-icon"
                whileHover={{ scale: 1.1, rotate: 6 }}
                animate={{ y: [0, -6, 0] }}
                transition={{ y: { duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' } }}
              >
                {s.icon}
              </motion.div>
              <span className="how-step-number">{t('landing.stepN', { n: i + 1 })}</span>
              <h3 className="how-step-title">{s.title}</h3>
              <p className="how-step-body">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="feature-split">
        <motion.div className="feature-media" ref={media1Ref} style={{ y: y1 }} initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.7 }} whileHover={{ scale: 1.03 }}>
          <motion.img
            src={landingImages.aerialField}
            alt={t('landing.f1.alt')}
            loading="lazy"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        <motion.div className="feature-copy" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} variants={fadeUp}>
          <p className="eyebrow">{t('landing.f1.eyebrow')}</p>
          <h2>{t('landing.f1.title')}</h2>
          <p className="feature-body">{t('landing.f1.body')}</p>
        </motion.div>
      </section>

      <section className="feature-split reverse">
        <motion.div className="feature-media" ref={media2Ref} style={{ y: y2 }} initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.7 }} whileHover={{ scale: 1.03 }}>
          <motion.img
            src={landingImages.seedlings}
            alt={t('landing.f2.alt')}
            loading="lazy"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        <motion.div className="feature-copy" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} variants={fadeUp}>
          <p className="eyebrow">{t('landing.f2.eyebrow')}</p>
          <h2>{t('landing.f2.title')}</h2>
          <p className="feature-body">{t('landing.f2.body')}</p>
        </motion.div>
      </section>

      <section className="final-cta">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }} variants={fadeUp}>
          <h2>{t('landing.finalTitle')}</h2>
          <motion.div
            className="glow-ring"
            animate={{ boxShadow: ['0 0 0 0 rgba(231,169,62,0.5)', '0 0 0 22px rgba(231,169,62,0)', '0 0 0 0 rgba(231,169,62,0)'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
          >
            <motion.button className="btn btn-primary" onClick={onPrimaryCta} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              {isLoggedIn ? t('landing.goToFarm') : t('landing.finalCta')}
            </motion.button>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}

function StripItem({ number, suffix, label, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start;
    const duration = 1100;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplay(Math.floor(progress * number));
      if (progress < 1) requestAnimationFrame(step);
      else setDisplay(number);
    }
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, number]);

  return (
    <motion.div className="strip-item" ref={ref} variants={fadeUp} transition={{ delay }}>
      <span className="strip-number">{display}{suffix}</span>
      <span className="strip-label">{label}</span>
    </motion.div>
  );
}

