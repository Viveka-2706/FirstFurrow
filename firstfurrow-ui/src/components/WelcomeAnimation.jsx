import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import './WelcomeAnimation.css';

export default function WelcomeAnimation({ name, onDone }) {
  const { t } = useLang();
  useEffect(() => {
    const timer = setTimeout(onDone, 3200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <AnimatePresence>
      <motion.div
        className="welcome-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        onClick={onDone}
      >
        <div className="welcome-sky">
          <motion.div 
            className="welcome-sun"
            initial={{ y: 200, scale: 0.8, opacity: 0.8 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </div>
        
        <div className="welcome-ground" />
        
        {[...Array(15)].map((_, i) => (
           <motion.div
             key={i}
             className="welcome-particle"
             initial={{ 
               x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0, 
               y: typeof window !== 'undefined' ? window.innerHeight : 0,
               opacity: 0
             }}
             animate={{ 
               y: 0,
               opacity: [0, 0.8, 0]
             }}
             transition={{ 
               duration: 2 + Math.random() * 2,
               ease: "easeOut",
               delay: Math.random() * 1
             }}
             style={{
               width: Math.random() * 6 + 2 + 'px',
               height: Math.random() * 6 + 2 + 'px',
               background: '#fff',
               borderRadius: '50%',
               position: 'absolute'
             }}
           />
        ))}

        <motion.div
          className="welcome-text-glass"
          initial={{ opacity: 0, y: 30, scale: 0.95, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="welcome-eyebrow">FirstFurrow</span>
          <h2>{t('welcome.hello', { name }).replace('🌿', '🌾')}</h2>
          <p>{t('welcome.sub')}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
