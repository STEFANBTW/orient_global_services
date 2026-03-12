
import React, { useState, useEffect, useRef } from 'react';
// ...
import Lenis from 'lenis';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { BakeryApp, BakeryNav } from './src/BakeryComponents';
import { SupermarketApp, SupermarketNav, SupermarketPage } from './src/supermarket/SupermarketWrapper';
import { DiningApp, DiningNav, DiningView } from './src/dining/DiningWrapper';
import { GamesApp, GamesNav, Page as GamesPage } from './src/games/GamesWrapper';
import { WaterApp, WaterNav, WaterPage } from './src/water/WaterWrapper';
import { LoungeApp, LoungeNav, LoungePage } from './src/lounge/LoungeWrapper';
import About from './src/components/About';
import { AmbientGlow } from './src/components/AmbientGlow';
import Reveal from './src/components/Reveal';
import { ScrollReveal, RevealItem } from './src/components/ScrollReveal';
import { SectionWrapper } from './src/components/SectionWrapper';
import StudioApp from './src/StudioApp';
import { ScrollContext } from './src/ScrollContext';

// --- Utility: Magnetic Tilt Hook ---
function useMagneticTilt() {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  
  // Physics-based spring for realistic weight/lag
  const springX = useSpring(x, { stiffness: 120, damping: 20, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 120, damping: 20, mass: 0.5 });

  const rotateX = useTransform(springY, [0, 1], [12, -12]);
  const rotateY = useTransform(springX, [0, 1], [-12, 12]);
  
  const spotlightX = useTransform(springX, [0, 1], ["0%", "100%"]);
  const spotlightY = useTransform(springY, [0, 1], ["0%", "100%"]);

  function onMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    x.set(px);
    y.set(py);
  }

  function onMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return { onMouseMove, onMouseLeave, rotateX, rotateY, spotlightX, spotlightY };
}

// --- Navigation Function Declaration for AI ---
const navigateToSectionTool: FunctionDeclaration = {
  name: 'navigateToSection',
  parameters: {
    type: Type.OBJECT,
    description: 'Scroll the visitor to a specific section of the website based on their request.',
    properties: {
      sectionId: {
        type: Type.STRING,
        description: 'The ID of the section to navigate to. Options: hero, services, bakery, market, lounge, standard, voices, location.',
      },
    },
    required: ['sectionId'],
  },
};

// --- Components ---


const ScrollItem: React.FC<{ children: React.ReactNode; className?: string; index?: number }> = ({ children, className = "", index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: "-20% 0% -20% 0%", once: false }}
      transition={{ duration: 0.6, delay: index * 0.0735, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Text Reveal Component for High-End Typography
export const TextReveal: React.FC<{ text: string; className?: string; delay?: number; stagger?: number }> = ({ text, className = "", delay = 0, stagger = 0.0245 }) => {
  const words = text.split(" ");
  return (
    <span className={`inline-flex flex-wrap gap-x-[0.2em] ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.1em]">
          <motion.span
            initial={{ y: "100%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: delay + i * stagger }}
            className="inline-block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
};

const Preloader: React.FC<{ onComplete: () => void; theme: 'dark' | 'light' }> = ({ onComplete, theme }) => {
  return (
    <motion.div
      initial={{ y: 0 }}
      exit={{ y: "-100%", transition: { duration: 0.8, ease: [0.83, 0, 0.17, 1] } }}
      className={`fixed inset-0 z-[100] ${theme === 'dark' ? 'bg-black' : 'bg-white'} flex items-center justify-center`}
    >
      {/* Increased wrapper size to prevent clipping during rotation */}
      <div className="w-40 h-40 flex items-center justify-center">
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={() => setTimeout(onComplete, 100)}
          className="flex flex-col items-center gap-6"
        >
           <motion.div 
             animate={{ rotate: 360, scale: [1, 1.1, 1] }}
             transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
             // Box background orange, circle in middle white, sharp edges
             className="w-24 h-24 bg-orange-500 flex items-center justify-center shadow-[0_0_30px_rgba(242,158,13,0.3)]"
            >
              <span className="text-white font-black text-3xl tracking-tighter">O</span>
            </motion.div>
           <div className="flex flex-col items-center">
             <span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-heading font-bold text-2xl tracking-[0.2em] uppercase`}>Orient Global</span>
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const ParallaxImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = "" }) => {
  const ref = useRef(null);
  const { scrollContainerRef } = React.useContext(ScrollContext);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="absolute inset-0 w-full h-[210%] -top-[55%]">
        <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
        />
      </motion.div>
    </div>
  );
};

const Navbar: React.FC<{ 
  theme: 'dark' | 'light', 
  toggleTheme: () => void, 
  setCurrentView: (v: any) => void, 
  scrolled: boolean, 
  navHidden: boolean,
  isSubpage?: boolean,
  isReady?: boolean,
  skipAnimation?: boolean,
  setCurrentSectionIndex?: (i: number) => void
}> = ({ theme, toggleTheme, setCurrentView, scrolled, navHidden, isSubpage = false, isReady = true, skipAnimation = false, setCurrentSectionIndex }) => {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = (tab: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setActiveTab(tab);
    };

    const handleMouseLeave = () => {
      timeoutRef.current = setTimeout(() => {
        setActiveTab(null);
      }, 300);
    };

    const handleNavigation = (view: string, sectionId: string) => {
      if (view === 'home' && setCurrentSectionIndex) {
        const sectionMap: Record<string, number> = {
          'hero': 0, 'services': 1, 'trust': 2, 'water-deep': 3, 'market-deep': 4,
          'bakery-deep': 5, 'dining-deep': 6, 'lounge-deep': 7, 'games-deep': 8,
          'voices': 9, 'location': 10, 'cta': 11, 'footer': 12
        };
        if (sectionMap[sectionId] !== undefined) {
          setCurrentSectionIndex(sectionMap[sectionId]);
        }
      }
      
      setCurrentView(view as any);
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    };

    useEffect(() => {
      const checkMobile = () => window.innerWidth < 1024;
      const handleResize = () => setIsMobile(checkMobile());
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navLinks = [
      { name: 'Bakery', view: 'bakery', icon: 'bakery_dining', 
        menu: {
          cols: [
            { title: 'Products', items: ['Artisan Breads', 'French Pastries', 'Custom Cakes'] },
            { title: 'Services', items: ['Wholesale', 'Catering', 'Subscription'] }
          ]
        }
      },
      { name: 'Market', view: 'supermarket', icon: 'storefront',
        menu: {
          cols: [
            { title: 'Shop', items: ['Fresh Produce', 'Global Spices', 'Organic Dairy'] },
            { title: 'Tools', items: ['Smart Paste', 'Daily Deals', 'Store Map'] }
          ]
        }
      },
      { name: 'Dining', view: 'dining', icon: 'restaurant',
        menu: {
          cols: [
            { title: 'Menu', items: ['Traditional', 'Continental', 'Wine List'] },
            { title: 'Booking', items: ['Reservations', 'Private Dining', 'Delivery'] }
          ]
        }
      },
      { name: 'Games', view: 'games', icon: 'sports_esports',
        menu: {
          cols: [
            { title: 'Arena', items: ['FIFA Arena', 'CODM Zone', 'VR Pods'] },
            { title: 'Events', items: ['Tournaments', 'Leaderboards', 'Hardware'] }
          ]
        }
      },
      { name: 'Water', view: 'water', icon: 'water_drop',
        menu: {
          cols: [
            { title: 'Quality', items: ['7-Step Process', 'Lab Reports', 'Sustainability'] },
            { title: 'Orders', items: ['Home Delivery', 'Bulk Supply', 'Logistics'] }
          ]
        }
      },
      { name: 'Lounge', view: 'lounge', icon: 'nightlife',
        menu: {
          cols: [
            { title: 'Experience', items: ['The Lab', 'Visualizer', 'Concierge'] },
            { title: 'Access', items: ['Membership', 'Booking', 'Events'] }
          ]
        }
      },
      { name: 'About', view: 'about', icon: 'info',
        menu: {
          cols: [
            { title: 'Company', items: ['Our Story', 'Mission', 'Contact'] },
            { title: 'Community', items: ['Careers', 'Impact', 'News'] }
          ]
        }
      }
    ];

    const isHomepage = !isSubpage;

    return (
      <motion.div 
        animate={{ 
          y: (navHidden && !isHomepage) ? (isMobile ? 128 : -128) : 0 
        }}
        transition={{ 
          y: { duration: (navHidden && !isHomepage) ? 0.2 : 0.4, ease: "easeOut" }
        }}
        className={`fixed z-[100] ${isMobile ? (isHomepage ? 'bottom-6 left-0 right-0 mx-auto w-[95%]' : 'top-4 left-0 right-0 mx-auto w-[95%]') : 'top-0 left-0 w-full'}`}
      >
        {/* Main Nav Container */}
        <nav className={`relative transition-all duration-300 flex items-center 
          ${isMobile 
            ? `rounded-[40px] h-14 sm:h-16 px-4 sm:px-6 ${isHomepage ? 'bg-transparent border-transparent' : 'shadow-soft bg-white/10 dark:bg-zinc-900/10 backdrop-blur-[10px] border border-black/5 dark:border-white/10'}` 
            : `h-12 sm:h-14 px-6 sm:px-12 transition-all duration-300 ${isHomepage ? (activeTab ? 'bg-white dark:bg-background-dark border-b border-black/5 dark:border-white/10' : 'bg-transparent border-transparent') : 'shadow-soft bg-white/10 dark:bg-zinc-900/10 backdrop-blur-[10px] border-b border-black/5 dark:border-white/10'}`
          }`}
        >
          <div className={`${isMobile ? 'w-full flex items-center justify-between' : 'mx-auto w-full flex items-center justify-between'}`}>
            {/* Logo Section */}
            <motion.div 
              initial={skipAnimation ? { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' } : { clipPath: 'polygon(0% -50%, 100% -150%, 100% -150%, 0% -50%)' }}
              animate={isReady ? { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' } : { clipPath: 'polygon(0% -50%, 100% -150%, 100% -150%, 0% -50%)' }}
              transition={{ duration: 1.5, delay: skipAnimation ? 0 : (isReady ? 2.9 : 0), ease: [0.76, 0, 0.24, 1] }}
              className={`flex items-center gap-2 sm:gap-3 cursor-pointer ${isMobile ? 'pl-2 pr-4 border-r border-white/10' : ''}`} onClick={() => { setCurrentView('home'); document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-icons text-white text-lg sm:text-xl">diamond</span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-black text-xs sm:text-sm tracking-tighter dark:text-white text-slate-900 leading-none uppercase">Orient</span>
                <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.3em] text-primary uppercase leading-none mt-0.5">Global</span>
              </div>
            </motion.div>

            {/* Links Section */}
            {!isMobile && (
              <div 
                className="flex-1 flex items-center relative h-full justify-center space-x-1 sm:space-x-2"
                onMouseLeave={() => handleMouseLeave()}
              >
                {navLinks.map((link, i) => (
                  <motion.button 
                    initial={skipAnimation ? { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' } : { clipPath: 'polygon(0% -50%, 100% -150%, 100% -150%, 0% -50%)' }}
                    animate={isReady ? { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' } : { clipPath: 'polygon(0% -50%, 100% -150%, 100% -150%, 0% -50%)' }}
                    transition={{ duration: 1.5, delay: skipAnimation ? 0 : (isReady ? 2.9 + ((i + 1) * 0.1) : 0), ease: [0.76, 0, 0.24, 1] }}
                    key={link.name}
                    onMouseEnter={() => handleMouseEnter(link.name)}
                    onClick={() => {
                      setCurrentView(link.view as any);
                      document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`relative z-10 px-2 sm:px-3 h-full flex items-center justify-center transition-all duration-300 text-[clamp(0.75rem,1.1vw,0.9rem)] font-bold uppercase tracking-widest hover:text-primary dark:hover:text-white ${scrolled ? 'dark:text-gray-300 text-slate-600' : 'dark:text-white text-slate-900'}`}
                  >
                    <div className="flex flex-col items-center group">
                      <motion.span whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="relative py-1 block">
                        {link.name}
                        {activeTab === link.name && (
                          <motion.div
                            layoutId="nav-indicator"
                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary shadow-[0_0_15px_rgba(242,158,13,0.8)] rounded-full"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                      </motion.span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Actions Section */}
            <motion.div 
              initial={skipAnimation ? { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' } : { clipPath: 'polygon(0% -50%, 100% -150%, 100% -150%, 0% -50%)' }}
              animate={isReady ? { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' } : { clipPath: 'polygon(0% -50%, 100% -150%, 100% -150%, 0% -50%)' }}
              transition={{ duration: 1.5, delay: skipAnimation ? 0 : (isReady ? 2.9 + ((navLinks.length + 1) * 0.1) : 0), ease: [0.76, 0, 0.24, 1] }}
              className={`flex items-center gap-1 sm:gap-3 ${isMobile ? 'pl-4 border-l border-white/10' : ''}`}>
              <button onClick={toggleTheme} className="p-1.5 sm:p-2 rounded-full hover:bg-primary/10 transition-all duration-300 dark:text-white text-slate-900">
                <span className="material-icons text-sm sm:text-base">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
              </button>
              <button 
                onClick={() => setCurrentView('login')}
                className="p-1.5 sm:p-2 rounded-full bg-primary/10 dark:bg-white/5 text-primary dark:text-white hover:bg-primary hover:text-white transition-all duration-300"
                title="Portal"
              >
                <span className="material-icons text-sm sm:text-base">person</span>
              </button>
              {isMobile && (
                <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-1.5 sm:p-2 rounded-full bg-primary/10 dark:bg-white/5 text-primary dark:text-white hover:bg-primary hover:text-white transition-all duration-300 ml-1"
                >
                  <span className="material-icons text-sm sm:text-base">{mobileMenuOpen ? 'close' : 'menu'}</span>
                </button>
              )}
            </motion.div>
          </div>
        </nav>

        {/* Mega Menu & Mobile Menu */}
        <AnimatePresence>
          {(!isMobile && activeTab) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => handleMouseEnter(activeTab)}
              onMouseLeave={() => handleMouseLeave()}
              className={`absolute w-full border border-black/5 dark:border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.4)] z-[-1] overflow-hidden top-full left-0 rounded-none border-t-0 p-12 ${isHomepage ? 'bg-white dark:bg-background-dark' : 'bg-white/10 dark:bg-zinc-900/10 backdrop-blur-[10px]'}`}
            >
              <div className="lg:max-w-[67vw] mx-auto relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 sm:gap-24">
                {(() => {
                  const activeLink = navLinks.find(l => l.name === activeTab);
                  if (!activeLink) return null;
                  
                  return activeLink.menu.cols.map((col, idx) => (
                    <div key={idx} className="space-y-6">
                      <motion.h4 
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                        className="text-primary font-black text-xs uppercase tracking-[0.4em] border-b border-primary/20 pb-3"
                      >
                        {col.title}
                      </motion.h4>
                      <ul className="space-y-4">
                        {col.items.map((item, i) => (
                          <motion.li 
                            key={i}
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                          >
                            <button 
                              onClick={() => handleNavigation(activeLink.view, item.toLowerCase().replace(/\s+/g, '-'))} 
                              className="text-lg sm:text-xl font-medium dark:text-white/90 text-slate-800 hover:text-primary dark:hover:text-white transition-all hover:translate-x-2 flex items-center gap-3 group"
                            >
                              <span className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                              {item}
                            </button>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  ));
                })()}
              </div>

              {/* Large Background Text */}
              <div className="absolute right-0 bottom-0 pointer-events-none select-none overflow-hidden h-full flex items-end justify-end p-8 lg:p-12">
                <motion.h3 
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 0.15 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="text-[12rem] lg:text-[20rem] font-black uppercase tracking-tighter italic leading-none text-slate-400 dark:text-white"
                >
                  {activeTab}
                </motion.h3>
              </div>
            </motion.div>
          )}

          {(isMobile && mobileMenuOpen) && (
            <motion.div 
              initial={{ opacity: 0, y: isHomepage ? 20 : -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isHomepage ? 20 : -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute ${isHomepage ? 'bottom-20 left-0 w-full rounded-[2.5rem] p-6 bg-white dark:bg-background-dark fixed inset-0 h-[100dvh] z-50 overflow-y-auto' : 'top-20 left-0 w-full rounded-[2.5rem] p-6 bg-white/10 dark:bg-zinc-900/10 backdrop-blur-[10px] border border-black/5 dark:border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] z-[-1] max-h-[70vh] overflow-y-auto'} flex flex-col gap-2`}
            >
              {isHomepage && (
                <div className="flex justify-end mb-4">
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white">
                    <span className="material-icons">close</span>
                  </button>
                </div>
              )}
              {navLinks.map((link, linkIdx) => (
                <motion.div 
                  key={link.name} 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: linkIdx * 0.05 }}
                  className="flex flex-col"
                >
                  <button 
                    onClick={() => setActiveTab(activeTab === link.name ? null : link.name)}
                    className="flex items-center justify-between py-4 text-sm font-black uppercase tracking-widest dark:text-white text-slate-900 border-b border-black/5 dark:border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <span className="material-icons text-primary">{link.icon}</span>
                      {link.name}
                    </div>
                    <span className="material-icons text-sm">{activeTab === link.name ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  <AnimatePresence>
                    {activeTab === link.name && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="py-4 grid grid-cols-2 gap-4">
                          {link.menu.cols.map((col, idx) => (
                            <div key={idx} className="space-y-3">
                              <h4 className="text-primary font-black text-[10px] uppercase tracking-[0.2em]">{col.title}</h4>
                              <ul className="space-y-2">
                                {col.items.map((item, i) => (
                                  <li key={i}>
                                    <button 
                                      onClick={() => {
                                        setMobileMenuOpen(false);
                                        setActiveTab(null);
                                        handleNavigation(link.view, item.toLowerCase().replace(/\s+/g, '-'));
                                      }} 
                                      className="text-xs font-bold dark:text-gray-300 text-slate-600 hover:text-primary transition-colors text-left"
                                    >
                                      {item}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
};

const Hero: React.FC<{ isReady: boolean; isActive?: boolean }> = ({ isReady, isActive = false }) => {
  const ref = useRef(null);
  const { scrollContainerRef } = React.useContext(ScrollContext);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 1.15]);
  const blur = useTransform(scrollYProgress, [0, 0.5], ["blur(0px)", "blur(12px)"]);

  return (
    <div ref={ref} className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-transparent">
      <motion.div style={{ y: yBg, scale, filter: blur }} className="absolute inset-0 z-0">
        <motion.img 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity }}
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-70 dark:opacity-40" 
            alt="Luxury Ambience" 
        />
      </motion.div>
      
      <div className="content-container relative z-20 max-w-5xl flex flex-col items-center justify-center h-full pt-[50px]">
        <div className="flex flex-col items-center justify-center gap-8 w-full">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            animate={isReady ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            transition={{ duration: 2.4, delay: 3.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden inline-block py-1 px-2"
          >
            <span className="text-slate-900 dark:text-white font-black tracking-[0.4em] uppercase text-sm block drop-shadow-[0_0_12px_rgba(0,0,0,0.5)]">
              Welcome to Orient <span className="text-orange-400 dark:text-primary">Global</span>
            </span>
          </motion.div>

          <div className="font-heading font-black text-5xl sm:text-6xl md:text-8xl lg:text-[8.5rem] dark:text-white text-slate-900 tracking-tighter leading-[0.8] uppercase flex flex-col items-center gap-2">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }}
              transition={{ duration: 2.0, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
            >
              ELEVATE
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }}
              transition={{ duration: 2.0, delay: 1.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-transparent bg-clip-text bg-[linear-gradient(to_right,rgba(242,158,13,0.45)_0%,rgba(242,158,13,1)_20%,rgba(242,158,13,1)_80%,rgba(242,158,13,0.45)_100%)]"
            >
              EVERYDAY.
            </motion.div>
          </div>

          <div className="relative w-full flex justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.7)_0%,_rgba(255,255,255,0)_70%)] dark:hidden pointer-events-none -z-10 blur-xl scale-150" />
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 2.0, delay: 2.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 px-6 py-4 rounded-2xl bg-white/10 dark:bg-transparent backdrop-blur-md dark:backdrop-blur-none border border-white/20 dark:border-transparent shadow-lg dark:shadow-none"
            >
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl dark:text-white/90 text-slate-950 max-w-4xl mx-auto font-light tracking-wide leading-relaxed drop-shadow-xl dark:drop-shadow-lg text-center">
                Experience a convergence of global excellence and Plateau soul across six premium lifestyle divisions.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      
      <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-24 z-20">
        <div className="w-[1px] h-32 bg-gradient-to-b from-primary via-primary/50 to-transparent mx-auto" />
      </motion.div>
    </div>
  );
};

const FinalCTA: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  return (
    <section className="relative flex flex-col justify-center bg-transparent border-t border-black/5 dark:border-white/5 items-center">
      <ScrollReveal isActive={isActive} className="content-container relative z-10 text-center w-full">
        <RevealItem index={0} totalItems={4}>
          <div className="flex flex-col items-center mb-12 group">
            <span className="text-primary font-black uppercase tracking-[0.6em] text-[12px] relative">
              The New Standard of Excellence
            </span>
          </div>
        </RevealItem>

        <RevealItem index={1} totalItems={4}>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black dark:text-white text-slate-900 mb-6 leading-[0.8] uppercase tracking-tighter">
            ORIENT<br />
            <span className="text-primary">Global</span>
          </h2>
        </RevealItem>

        <RevealItem index={2} totalItems={4}>
          <p className="text-sm md:text-base dark:text-gray-400 text-slate-500 max-w-xl mx-auto leading-relaxed font-medium mb-8">
            Ready to experience the future of Jos? Join us at the flagship destination where every detail is engineered for perfection.
          </p>
        </RevealItem>

        <RevealItem index={3} totalItems={4}>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-6 py-3 bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-[0_10px_20px_rgba(242,158,13,0.3)] hover:scale-105 hover:shadow-[0_15px_30px_rgba(242,158,13,0.4)] transition-all duration-500">Visit Us Today</button>
          </div>
        </RevealItem>
      </ScrollReveal>
    </section>
  );
};

const BakeryShowcase: React.FC<{ setCurrentView: (v: any) => void }> = ({ setCurrentView }) => {
  return (
    <section id="bakery" className="flex flex-col justify-center px-4 md:px-12 lg:max-w-[67vw] mx-auto dark:bg-background-dark bg-white transition-colors duration-500 relative items-center h-screen">
      <div className="lg:max-w-[67vw] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="md:w-1/2">
          <Reveal>
            <span className="text-primary font-bold tracking-[0.5em] uppercase text-[10px] mb-4 block">The Bakery</span>
            <h2 className="text-4xl md:text-6xl font-black dark:text-white text-slate-900 mb-6 font-heading leading-[0.85] uppercase tracking-tighter">
              GOLDEN<br/><span className="text-primary">Crust</span>
            </h2>
            <p className="dark:text-gray-400 text-slate-500 text-base leading-relaxed mb-8 font-medium max-w-lg">Morning excellence starts here. From artisanal sourdoughs to delicate pastries, our bakery combines European techniques with local flavors like Coconut and Plantain.</p>
            <button onClick={() => { setCurrentView('bakery'); document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group flex items-center gap-2 dark:text-white text-slate-900 border-b-2 border-primary pb-1 hover:text-primary transition-all uppercase text-xs font-black tracking-[0.3em] font-heading">
              <span>View Menu</span>
              <span className="material-icons text-lg group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </button>
          </Reveal>
        </div>
        <div className="md:w-1/2 grid grid-cols-1 gap-8">
          <Reveal animation="slide-from-right">
            <ParallaxImage src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1926&auto=format&fit=crop" alt="Golden Crust Croissants" className="rounded-3xl h-[50vh] border border-black/5 dark:border-white/5 shadow-elite" />
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const BakeryDeepDive: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  return (
    <div className="flex flex-col justify-center px-6 bg-transparent border-t border-black/5 dark:border-white/5 relative items-center h-screen">
      <ScrollReveal isActive={isActive} className="lg:max-w-[67vw] mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-16 items-center w-full max-h-[90vh] justify-center">
        <div className="lg:hidden order-1 text-center w-full">
          <RevealItem index={1} totalItems={7}>
            <span className="text-primary font-black tracking-[0.5em] uppercase text-[10px] mb-2 block">Artisanal Process</span>
          </RevealItem>
          <RevealItem index={2} totalItems={7}>
            <h2 className="text-3xl font-black dark:text-white text-slate-900 uppercase tracking-tighter leading-tight">THE SCIENCE OF <br/><span className="text-primary">Fermentation</span></h2>
          </RevealItem>
        </div>
        <RevealItem className="order-2 lg:order-1 w-full" index={0} totalItems={7}>
          <div className="relative aspect-video lg:aspect-square max-h-[30vh] lg:max-h-none rounded-2xl lg:rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 shadow-elite">
            <ParallaxImage src="https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop" alt="Baking Process" className="w-full h-full" />
          </div>
        </RevealItem>
        <div className="order-3 lg:order-2 flex flex-col w-full">
          <div className="hidden lg:block">
            <RevealItem index={1} totalItems={7}>
              <span className="text-primary font-black tracking-[0.5em] uppercase text-[10px] mb-4 block">Artisanal Process</span>
            </RevealItem>
            <RevealItem index={2} totalItems={7}>
              <h2 className="text-4xl sm:text-5xl font-black dark:text-white text-slate-900 uppercase tracking-tighter mb-6 leading-tight">THE SCIENCE OF <br/><span className="text-primary">Fermentation</span></h2>
            </RevealItem>
          </div>
          <RevealItem index={3} totalItems={7}>
            <p className="text-sm lg:text-base dark:text-gray-400 text-slate-600 leading-relaxed mb-6 lg:mb-8 font-medium text-center lg:text-left">Our master bakers utilize a 48-hour cold fermentation process, allowing complex flavors to develop naturally. We source our grains from sustainable farms, ensuring every loaf meets the Orient Global standard of purity.</p>
          </RevealItem>
          <ul className="space-y-3 lg:space-y-4">
            {['Natural Sourdough Starters', 'Stone-Ground Flour', 'No Artificial Additives'].map((item, i) => (
              <RevealItem key={item} index={4 + i} totalItems={7}>
                <li className="flex items-center gap-3 lg:gap-4 dark:text-white text-slate-900 font-bold uppercase tracking-widest text-[10px] lg:text-xs justify-center lg:justify-start">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_15px_rgba(242,158,13,0.5)]" />
                  {item}
                </li>
              </RevealItem>
            ))}
          </ul>
        </div>
      </ScrollReveal>
    </div>
  );
};

const MarketShowcase: React.FC<{ setCurrentView: (v: any) => void }> = ({ setCurrentView }) => {
  return (
    <section id="market" className="flex flex-col justify-center px-4 md:px-12 lg:max-w-[67vw] mx-auto dark:bg-background-dark bg-white transition-colors duration-500 relative items-center h-screen">
      <div className="lg:max-w-[67vw] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="md:w-1/2">
          <Reveal>
            <span className="text-primary font-bold tracking-[0.5em] uppercase text-[10px] mb-4 block">The Market</span>
            <h2 className="text-4xl md:text-6xl font-black dark:text-white text-slate-900 mb-6 font-heading leading-[0.85] uppercase tracking-tighter">
              GLOBAL<br/><span className="text-primary">Standards</span>
            </h2>
            <p className="dark:text-gray-400 text-slate-500 text-base leading-relaxed mb-8 font-medium max-w-lg">We've redefined the shopping experience. Wide aisles, perfect lighting, and a curated selection of international and local products. Quality you can trust, right here in Rayfield, Jos.</p>
            <button onClick={() => { setCurrentView('supermarket'); document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group flex items-center gap-2 dark:text-white text-slate-900 border-b-2 border-primary pb-1 hover:text-primary transition-all uppercase text-xs font-black tracking-[0.3em] font-heading">
              <span>Shop Online</span>
              <span className="material-icons text-lg group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </button>
          </Reveal>
        </div>
        <div className="md:w-1/2 grid grid-cols-2 gap-4">
          <Reveal animation="slide-from-left" className="col-span-2">
            <ParallaxImage src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop" alt="Supermarket Wide" className="rounded-3xl h-[35vh] border border-black/5 dark:border-white/5 shadow-elite" />
          </Reveal>
          <Reveal animation="slide-from-left" delay="delay-150">
            <ParallaxImage src="https://images.unsplash.com/photo-1543083477-4f7f4b23832c?q=80&w=1970&auto=format&fit=crop" alt="Fresh Produce" className="rounded-3xl h-[20vh] border border-black/5 dark:border-white/5 shadow-soft" />
          </Reveal>
          <Reveal animation="slide-from-left" delay="delay-300">
            <ParallaxImage src="https://images.unsplash.com/photo-1506484334402-40ff22e05a6d?q=80&w=2070&auto=format&fit=crop" alt="Market Shelves" className="rounded-3xl h-[20vh] border border-black/5 dark:border-white/5 shadow-soft" />
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const MarketDeepDive: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  return (
    <div className="flex flex-col justify-center px-6 bg-transparent border-t border-black/5 dark:border-white/5 relative items-center h-screen">
      <ScrollReveal isActive={isActive} className="lg:max-w-[67vw] mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-16 items-center w-full max-h-[90vh] justify-center">
        <div className="lg:hidden order-1 text-center w-full">
          <RevealItem index={0} totalItems={5}>
            <span className="text-primary font-black tracking-[0.3em] uppercase text-xs mb-2 block">Supply Chain</span>
          </RevealItem>
          <RevealItem index={1} totalItems={5}>
            <h2 className="text-3xl font-black dark:text-white text-slate-900 uppercase tracking-tighter leading-tight">INSTITUTIONAL <br/><span className="text-primary">Quality</span></h2>
          </RevealItem>
        </div>
        <RevealItem index={4} totalItems={5} className="order-2 lg:order-2 w-full">
          <div className="relative aspect-video lg:aspect-square max-h-[30vh] lg:max-h-none rounded-2xl lg:rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 shadow-elite">
            <ParallaxImage src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1974&auto=format&fit=crop" alt="Market Logistics" className="w-full h-full" />
          </div>
        </RevealItem>
        <div className="order-3 lg:order-1 flex flex-col w-full">
          <div className="hidden lg:block">
            <RevealItem index={0} totalItems={5}>
              <span className="text-primary font-black tracking-[0.3em] uppercase text-sm mb-4 block">Supply Chain</span>
            </RevealItem>
            <RevealItem index={1} totalItems={5}>
              <h2 className="text-4xl sm:text-5xl font-black dark:text-white text-slate-900 uppercase tracking-tighter mb-6 leading-tight">INSTITUTIONAL <br/><span className="text-primary">Quality</span></h2>
            </RevealItem>
          </div>
          <RevealItem index={2} totalItems={5}>
            <p className="text-sm lg:text-base dark:text-gray-400 text-slate-600 leading-relaxed mb-6 lg:mb-8 font-medium text-center lg:text-left">Our global procurement network ensures that the finest products from around the world are available in Jos. From organic dairy to international spices, we maintain a strict cold chain and quality control protocol.</p>
          </RevealItem>
          <RevealItem index={3} totalItems={5}>
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              <div className="p-4 lg:p-6 rounded-2xl lg:rounded-3xl dark:bg-white/5 bg-white border dark:border-white/10 border-black/5 shadow-soft text-center lg:text-left">
                <h4 className="dark:text-white text-slate-900 font-black uppercase text-[10px] lg:text-xs tracking-widest mb-1 lg:mb-2">Cold Chain</h4>
                <p className="dark:text-gray-500 text-slate-500 text-[10px] lg:text-xs font-medium">24/7 Temperature Monitoring</p>
              </div>
              <div className="p-4 lg:p-6 rounded-2xl lg:rounded-3xl dark:bg-white/5 bg-white border dark:border-white/10 border-black/5 shadow-soft text-center lg:text-left">
                <h4 className="dark:text-white text-slate-900 font-black uppercase text-[10px] lg:text-xs tracking-widest mb-1 lg:mb-2">Sourcing</h4>
                <p className="dark:text-gray-500 text-slate-500 text-[10px] lg:text-xs font-medium">Direct from Global Producers</p>
              </div>
            </div>
          </RevealItem>
        </div>
      </ScrollReveal>
    </div>
  );
};

const RestaurantShowcase: React.FC<{ setCurrentView: (v: any) => void }> = ({ setCurrentView }) => {
  return (
    <section id="restaurant" className="flex flex-col justify-center px-4 md:px-12 lg:max-w-[67vw] mx-auto dark:bg-background-dark bg-white transition-colors duration-500 relative items-center h-screen">
      <div className="lg:max-w-[67vw] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="md:w-1/2">
          <Reveal delay="delay-100">
            <span className="text-primary font-bold tracking-[0.3em] uppercase text-sm mb-4 block">The Restaurant</span>
          </Reveal>
          <Reveal delay="delay-200">
            <h2 className="text-4xl md:text-6xl font-black dark:text-white text-slate-900 mb-6 font-heading leading-[0.85] uppercase tracking-tighter">
              CULINARY<br/><span className="text-primary">Artistry</span>
            </h2>
          </Reveal>
          <Reveal delay="delay-300">
            <p className="dark:text-gray-400 text-slate-500 text-base leading-relaxed mb-8 font-medium max-w-lg">A symphony of flavors crafted by world-class chefs. From local delicacies like Pounded Yam & Egusi to international fusion, every dish is a masterpiece of taste and presentation.</p>
          </Reveal>
          <Reveal delay="delay-400">
            <button onClick={() => { setCurrentView('dining'); document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group flex items-center gap-2 dark:text-white text-slate-900 border-b-2 border-primary pb-1 hover:text-primary transition-all uppercase text-xs font-black tracking-[0.3em] font-heading">
              <span>View Menu</span>
              <span className="material-icons text-lg group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </button>
          </Reveal>
        </div>
        <div className="md:w-1/2">
          <Reveal animation="slide-from-right">
            <ParallaxImage src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop" alt="Fine Dining Experience" className="rounded-3xl h-[50vh] border border-black/5 dark:border-white/5 shadow-elite" />
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const DiningDeepDive: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  return (
    <div className="flex flex-col justify-center px-6 bg-transparent border-t border-black/5 dark:border-white/5 relative items-center h-screen">
      <ScrollReveal isActive={isActive} className="lg:max-w-[67vw] mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-16 items-center w-full max-h-[90vh] justify-center">
        <div className="lg:hidden order-1 text-center w-full">
          <RevealItem index={1} totalItems={7}>
            <span className="text-primary font-black tracking-[0.3em] uppercase text-[10px] mb-2 block">Chef's Philosophy</span>
          </RevealItem>
          <RevealItem index={2} totalItems={7}>
            <h2 className="text-3xl font-black dark:text-white text-slate-900 uppercase tracking-tighter leading-tight">FUSION OF <br/><span className="text-primary">Heritage</span></h2>
          </RevealItem>
        </div>
        <RevealItem className="order-2 lg:order-1 w-full" index={0} totalItems={7}>
          <div className="relative aspect-video lg:aspect-square max-h-[30vh] lg:max-h-none rounded-2xl lg:rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 shadow-elite">
            <ParallaxImage src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop" alt="Chef at Work" className="w-full h-full" />
          </div>
        </RevealItem>
        <div className="order-3 lg:order-2 flex flex-col w-full">
          <div className="hidden lg:block">
            <RevealItem index={1} totalItems={7}>
              <span className="text-primary font-black tracking-[0.3em] uppercase text-sm mb-4 block">Chef's Philosophy</span>
            </RevealItem>
            <RevealItem index={2} totalItems={7}>
              <h2 className="text-4xl sm:text-5xl font-black dark:text-white text-slate-900 uppercase tracking-tighter mb-6 leading-tight">FUSION OF <br/><span className="text-primary">Heritage</span></h2>
            </RevealItem>
          </div>
          <RevealItem index={3} totalItems={7}>
            <p className="text-sm lg:text-base dark:text-gray-400 text-slate-600 leading-relaxed mb-6 lg:mb-8 font-medium text-center lg:text-left">Our culinary team explores the intersection of traditional Plateau ingredients and modern gastronomic techniques. We believe in "Root-to-Table" dining, where every ingredient tells a story of the land.</p>
          </RevealItem>
          <div className="space-y-2">
            {['Locally Sourced Produce', 'Artisanal Plating', 'Curated Wine Pairings'].map((item, i) => (
              <RevealItem key={item} index={4 + i} totalItems={7}>
                <div className="flex items-center gap-4 lg:gap-6 p-2 lg:p-3 rounded-xl lg:rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-black/5 shadow-soft justify-center lg:justify-start">
                  <span className="material-icons text-primary text-xl lg:text-2xl">restaurant_menu</span>
                  <span className="dark:text-white text-slate-900 font-bold uppercase tracking-widest text-[10px] lg:text-xs">{item}</span>
                </div>
              </RevealItem>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};

const WaterShowcase: React.FC<{ setCurrentView: (v: any) => void }> = ({ setCurrentView }) => {
  return (
    <section id="water" className="flex flex-col justify-center px-4 md:px-12 lg:max-w-[67vw] mx-auto dark:bg-background-dark bg-white transition-colors duration-500 relative items-center h-screen">
      <div className="lg:max-w-[67vw] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="md:w-1/2">
          <Reveal>
            <span className="text-primary font-bold tracking-[0.3em] uppercase text-sm mb-4 block">Orient Water</span>
            <h2 className="text-5xl md:text-6xl font-black dark:text-white text-slate-900 mb-6 font-heading leading-[0.85] uppercase tracking-tighter">
              PURE<br/><span className="text-primary">Hydration</span>
            </h2>
            <p className="dark:text-gray-400 text-slate-500 text-base leading-relaxed mb-8 font-medium max-w-xl">The gold standard of purity. Our 7-step filtration process ensures every drop is as crisp and clean as nature intended. NAFDAC Certified quality for your peace of mind.</p>
            <button onClick={() => { setCurrentView('water'); document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group flex items-center gap-4 dark:text-white text-slate-900 border-b-2 border-primary pb-2 hover:text-primary transition-all uppercase text-xs font-black tracking-[0.3em] font-heading">
              <span>Explore Purity</span>
              <span className="material-icons text-lg group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </button>
          </Reveal>
        </div>
        <div className="md:w-1/2">
          <Reveal animation="slide-from-left">
            <ParallaxImage src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=1888&auto=format&fit=crop" alt="Orient Water Bottle" className="rounded-3xl h-[45vh] border border-black/5 dark:border-white/5 shadow-elite" />
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const WaterDeepDive: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  return (
    <div className="flex flex-col justify-center px-6 bg-transparent border-t border-black/5 dark:border-white/5 relative items-center h-screen">
      <ScrollReveal isActive={isActive} className="lg:max-w-[67vw] mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-16 items-center w-full max-h-[90vh] justify-center">
        <div className="lg:hidden order-1 text-center w-full">
          <RevealItem index={0} totalItems={5}>
            <span className="text-primary font-black tracking-[0.3em] uppercase text-xs mb-2 block">Technical Purity</span>
          </RevealItem>
          <RevealItem index={1} totalItems={5}>
            <h2 className="text-3xl font-black dark:text-white text-slate-900 uppercase tracking-tighter leading-tight">7-STEP <br/><span className="text-primary">Filtration</span></h2>
          </RevealItem>
        </div>
        <RevealItem index={4} totalItems={5} className="order-2 lg:order-2 w-full">
          <div className="relative aspect-video lg:aspect-square max-h-[30vh] lg:max-h-none rounded-2xl lg:rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 shadow-elite">
            <ParallaxImage src="https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=2036&auto=format&fit=crop" alt="Water Laboratory" className="w-full h-full" />
          </div>
        </RevealItem>
        <div className="order-3 lg:order-1 flex flex-col w-full">
          <div className="hidden lg:block">
            <RevealItem index={0} totalItems={5}>
              <span className="text-primary font-black tracking-[0.3em] uppercase text-sm mb-4 block">Technical Purity</span>
            </RevealItem>
            <RevealItem index={1} totalItems={5}>
              <h2 className="text-4xl sm:text-5xl font-black dark:text-white text-slate-900 uppercase tracking-tighter mb-6 leading-tight">7-STEP <br/><span className="text-primary">Filtration</span></h2>
            </RevealItem>
          </div>
          <RevealItem index={2} totalItems={5}>
            <p className="text-sm lg:text-base dark:text-gray-400 text-slate-600 leading-relaxed mb-6 lg:mb-8 font-medium text-center lg:text-left">Beyond standard purification, Orient Water undergoes a rigorous 7-step process including Reverse Osmosis, UV Sterilization, and Ozone Treatment. We test every batch in our on-site laboratory to ensure absolute safety.</p>
          </RevealItem>
          <RevealItem index={3} totalItems={5}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              {['Reverse Osmosis', 'UV Sterilization', 'Ozone Treatment', 'Mineral Balancing'].map(step => (
                <div key={step} className="flex items-center gap-4 p-3 lg:p-4 rounded-2xl lg:rounded-3xl dark:bg-white/5 bg-white border dark:border-white/10 border-black/5 shadow-soft">
                  <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                  <span className="dark:text-white text-slate-900 text-[10px] font-black uppercase tracking-widest">{step}</span>
                </div>
              ))}
            </div>
          </RevealItem>
        </div>
      </ScrollReveal>
    </div>
  );
};

const CuratedExperiences: React.FC<{ setCurrentView: (v: any) => void }> = ({ setCurrentView }) => {
  return (
    <section id="lounge" className="relative h-screen flex flex-col justify-center dark:bg-background-dark bg-white transition-colors duration-500 items-center">
      <div className="lg:max-w-[67vw] mx-auto px-6">
        <div className="mb-16 text-center">
          <Reveal>
            <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">Our Worlds</h2>
            <h3 className="text-5xl md:text-6xl font-serif dark:text-white text-slate-900 italic font-light tracking-tight leading-none">Curated <br/><span className="not-italic font-display font-black dark:text-gray-500 text-slate-400 uppercase tracking-tighter">Experiences</span></h3>
          </Reveal>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/2">
            <Reveal animation="slide-from-left">
              <ParallaxImage src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=2069&auto=format&fit=crop" alt="Lounge Experience" className="rounded-3xl aspect-[4/5] border border-black/5 dark:border-white/10 shadow-elite" />
            </Reveal>
          </div>
          <div className="w-full md:w-1/2">
            <Reveal animation="slide-from-right">
              <div className="w-12 h-1 bg-primary mb-8 rounded-full"></div>
              <h4 className="text-4xl font-black dark:text-white text-slate-900 mb-6 uppercase tracking-tighter leading-none">The <br/><span className="text-primary">Nightscape</span> Lounge</h4>
              <p className="dark:text-gray-400 text-slate-500 text-base leading-relaxed mb-8 font-medium">Where mixology meets mystery. Our lounge offers a secluded environment perfect for high-stakes meetings or unwinding after a long week. Featuring Zobo-infused cocktails and a curated cigar selection.</p>
              <ul className="space-y-4 mb-8">
                {['Premium Bottle Service', 'Private Booths', 'Live Jazz Weekends'].map(li => (
                  <li key={li} className="flex items-center dark:text-gray-300 text-slate-600 font-bold text-sm tracking-wide uppercase">
                    <span className="w-2 h-2 bg-primary rounded-full mr-4 shadow-[0_0_20px_rgba(242,158,13,0.5)]"></span>
                    {li}
                  </li>
                ))}
              </ul>
              <button onClick={() => { setCurrentView('lounge'); document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group flex items-center gap-4 dark:text-white text-slate-900 border-b-2 border-primary pb-2 hover:text-primary transition-all uppercase text-xs font-black tracking-[0.3em] font-heading">
                <span>Explore Menu</span>
                <span className="material-icons text-lg group-hover:translate-x-2 transition-transform">arrow_forward</span>
              </button>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};

const LoungeDeepDive: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  return (
    <div className="flex flex-col justify-center px-6 bg-transparent border-t border-black/5 dark:border-white/5 relative items-center h-screen">
      <ScrollReveal isActive={isActive} className="lg:max-w-[67vw] mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-16 items-center w-full max-h-[90vh] justify-center">
        <div className="lg:hidden order-1 text-center w-full">
          <RevealItem index={0} totalItems={7}>
            <span className="text-primary font-black tracking-[0.3em] uppercase text-[10px] mb-2 block">Atmosphere</span>
          </RevealItem>
          <RevealItem index={1} totalItems={7}>
            <h2 className="text-3xl font-black dark:text-white text-slate-900 uppercase tracking-tighter leading-tight">SONIC <br/><span className="text-primary">Architecture</span></h2>
          </RevealItem>
        </div>
        <RevealItem index={6} totalItems={7} className="order-2 lg:order-2 w-full">
          <div className="relative aspect-video lg:aspect-square max-h-[30vh] lg:max-h-none rounded-2xl lg:rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 shadow-elite">
            <ParallaxImage src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974&auto=format&fit=crop" alt="Lounge Atmosphere" className="w-full h-full" />
          </div>
        </RevealItem>
        <div className="order-3 lg:order-1 flex flex-col w-full">
          <div className="hidden lg:block">
            <RevealItem index={0} totalItems={7}>
              <span className="text-primary font-black tracking-[0.3em] uppercase text-sm mb-4 block">Atmosphere</span>
            </RevealItem>
            <RevealItem index={1} totalItems={7}>
              <h2 className="text-4xl sm:text-5xl font-black dark:text-white text-slate-900 uppercase tracking-tighter mb-6 leading-tight">SONIC <br/><span className="text-primary">Architecture</span></h2>
            </RevealItem>
          </div>
          <RevealItem index={2} totalItems={7}>
            <p className="text-sm lg:text-base dark:text-gray-400 text-slate-600 leading-relaxed mb-6 lg:mb-8 font-medium text-center lg:text-left">The lounge is acoustically treated to provide perfect sound isolation. Our resident DJs curate soundscapes that evolve through the night, paired with our signature mixology program.</p>
          </RevealItem>
          <div className="space-y-2">
            {['Void Acoustics Sound System', 'Custom Lighting Rig', 'VIP Concierge'].map((item, i) => (
              <RevealItem key={item} index={3 + i} totalItems={7}>
                <div className="flex items-center justify-between p-2 lg:p-3 rounded-xl lg:rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-black/5 shadow-soft">
                  <span className="dark:text-white text-slate-900 font-bold uppercase tracking-widest text-[10px] lg:text-xs">{item}</span>
                  <span className="material-icons text-primary text-lg lg:text-xl">graphic_eq</span>
                </div>
              </RevealItem>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};

const GamesShowcase: React.FC<{ setCurrentView: (v: any) => void }> = ({ setCurrentView }) => {
  return (
    <section id="games" className="flex flex-col justify-center px-4 md:px-12 lg:max-w-[67vw] mx-auto dark:bg-background-dark bg-white transition-colors duration-500 relative items-center h-screen">
      <div className="lg:max-w-[67vw] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="md:w-1/2">
          <Reveal>
            <span className="text-primary font-bold tracking-[0.3em] uppercase text-sm mb-4 block">The Arena</span>
            <h2 className="text-5xl md:text-6xl font-black dark:text-white text-slate-900 mb-6 font-heading leading-[0.85] uppercase tracking-tighter">
              HIGH<br/><span className="text-primary">Performance</span>
            </h2>
            <p className="dark:text-gray-400 text-slate-500 text-base leading-relaxed mb-8 font-medium max-w-xl">Step into the future of competitive gaming. From high-refresh rate PC arenas to immersive VR pods, we provide the infrastructure for champions.</p>
            <button onClick={() => { setCurrentView('games'); document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group flex items-center gap-4 dark:text-white text-slate-900 border-b-2 border-primary pb-2 hover:text-primary transition-all uppercase text-xs font-black tracking-[0.3em] font-heading">
              <span>Enter Arena</span>
              <span className="material-icons text-lg group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </button>
          </Reveal>
        </div>
        <div className="md:w-1/2">
          <Reveal animation="slide-from-right">
            <ParallaxImage src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" alt="Gaming Arena" className="rounded-3xl h-[45vh] border border-black/5 dark:border-white/5 shadow-elite" />
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const VerticalFerrisCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = [
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2165&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2070&auto=format&fit=crop"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden [perspective:1500px] bg-transparent">
      {images.map((src, index) => {
        let offset = index - activeIndex;
        if (offset < -2) offset += images.length;
        if (offset > 2) offset -= images.length;

        // Calculate rotation based on offset (e.g., -65deg, 0deg, 65deg)
        const rotateX = offset * -40; 
        
        // Push items out along the Z axis so they form a circle, then rotate them, then push the whole circle back
        const radius = 400; // The radius of our "Ferris wheel"

        const up = 15;
        
        // We want the active item (offset 0) to be at Z=0 relative to the container.
        // If we just rotate and translateZ(radius), the active item will be at Z=radius.
        // So we translate the whole container back by -radius.
        
        const scale = 1 - Math.abs(offset) * 0.2;
        const opacity = offset === 0 ? 1 : Math.abs(offset) === 1 ? 0.6 : 0.2;
        const zIndex = 10 - Math.abs(offset);

        return (
          <div
            key={index}
            className="absolute w-[85%] h-[60%] rounded-2xl overflow-hidden shadow-2xl transition-all duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{
              transform: `translateZ(-${radius}px) rotateX(${rotateX}deg) translateZ(${radius}px) scale(${scale}) translateY(${up}px)`,
              opacity,
              zIndex,
            }}
          >
            <img src={src} alt="Gaming Infrastructure" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        );
      })}
    </div>
  );
};

const GamesDeepDive: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  return (
    <div className="flex flex-col justify-center px-6 bg-transparent border-t border-black/5 dark:border-white/5 relative items-center h-screen">
      <ScrollReveal isActive={isActive} className="lg:max-w-[67vw] mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-16 items-center w-full max-h-[90vh] justify-center">
        <div className="order-1 lg:order-1 flex flex-col w-full text-center lg:text-left">
          <RevealItem index={0} totalItems={7}>
            <span className="text-primary font-black tracking-[0.3em] uppercase text-[10px] lg:text-sm mb-2 lg:mb-4 block">Tech Ecosystem</span>
          </RevealItem>
          <RevealItem index={1} totalItems={7}>
            <h2 className="text-3xl lg:text-4xl sm:text-5xl font-black dark:text-white text-slate-900 uppercase tracking-tighter mb-4 lg:mb-6 leading-tight">ZERO LAG <br/><span className="text-primary">Infrastructure</span></h2>
          </RevealItem>
          <RevealItem index={2} totalItems={7}>
            <p className="text-sm lg:text-base dark:text-gray-400 text-slate-600 leading-relaxed mb-6 lg:mb-8 font-medium">We've built a dedicated fiber-optic network to ensure sub-10ms latency for competitive play. Our hardware is refreshed quarterly, featuring the latest RTX GPUs and high-fidelity VR peripherals.</p>
          </RevealItem>
          <div className="space-y-2">
            {['Fiber-Optic Backbone', 'RTX 40-Series GPUs', '240Hz Displays'].map((spec, i) => (
              <RevealItem key={spec} index={3 + i} totalItems={7}>
                <div className="flex items-center justify-between p-2 lg:p-3 rounded-xl lg:rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-black/5 shadow-soft">
                  <span className="dark:text-white text-slate-900 font-bold uppercase tracking-widest text-[10px] lg:text-xs">{spec}</span>
                  <span className="material-icons text-primary text-lg lg:text-xl">bolt</span>
                </div>
              </RevealItem>
            ))}
          </div>
        </div>
        <RevealItem index={6} totalItems={7} className="order-2 lg:order-2 w-full h-[30vh] lg:h-full lg:min-h-[400px]">
          <div className="relative h-full w-full rounded-2xl lg:rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 shadow-elite">
            <VerticalFerrisCarousel />
          </div>
        </RevealItem>
      </ScrollReveal>
    </div>
  );
};

const VoicesOfJos: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  const reviews = [
    { name: 'Sarah N.', role: 'Rayfield Resident', text: "I've never seen a supermarket this clean in Jos. It feels like I'm abroad...", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop" },
    { name: 'David O.', role: 'Gamer', text: "The internet speed at the gaming lounge is insane. No lag at all.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop" },
    { name: 'Fatima A.', role: 'Foodie', text: "The jollof rice at the restaurant... honestly, it's the best I've had in years.", img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1974&auto=format&fit=crop" }
  ];
  return (
    <section className="flex flex-col justify-center bg-transparent border-y border-black/5 dark:border-white/5 transition-colors duration-500 relative overflow-hidden items-center min-h-screen py-24 md:py-0">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(242,158,13,0.03),transparent_70%)] pointer-events-none" />
      <ScrollReveal isActive={isActive} className="w-full px-4 sm:px-8 md:px-12 lg:max-w-[75vw] xl:max-w-[67vw] mx-auto flex flex-col justify-center">
        <RevealItem index={0} totalItems={4}>
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black dark:text-white text-slate-900 mb-3 md:mb-4 uppercase tracking-tighter leading-none">VOICES OF <br className="md:hidden"/><span className="text-primary">Jos</span></h2>
            <p className="dark:text-gray-400 text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em]">Real stories from our community.</p>
          </div>
        </RevealItem>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {reviews.map((rev, idx) => (
            <RevealItem key={rev.name} index={1 + idx} totalItems={4}>
              <motion.div whileHover={{ y: -8 }} className="dark:bg-background-dark bg-white p-6 md:p-8 rounded-3xl border border-black/5 dark:border-white/5 hover:border-primary/50 transition-all group shadow-soft hover:shadow-elite relative h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <img src={rev.img} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-primary/20 object-cover shadow-lg" alt={rev.name} />
                  <div>
                    <h4 className="dark:text-white text-slate-900 font-black text-sm md:text-base uppercase tracking-tight">{rev.name}</h4>
                    <p className="text-[8px] md:text-[9px] dark:text-gray-500 text-slate-400 uppercase font-black tracking-[0.2em] mt-0.5">{rev.role}</p>
                  </div>
                </div>
                <div className="dark:bg-zinc-800/50 bg-slate-50 rounded-2xl p-3 md:p-4 flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <button className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white shadow-xl hover:bg-orange-600 transition-colors">
                    <span className="material-icons text-lg md:text-xl">play_arrow</span>
                  </button>
                  <div className="flex gap-1 md:gap-1.5 h-6 md:h-8 items-center flex-1 overflow-hidden">
                    {[...Array(15)].map((_, i) => (
                      <div key={i} className="w-1 bg-primary/40 rounded-full wave-bar" style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 100}%` }}></div>
                    ))}
                  </div>
                  <span className="text-[9px] md:text-[10px] text-gray-500 font-mono font-bold">0:24</span>
                </div>
                <p className="dark:text-gray-300 text-slate-500 text-xs md:text-sm italic font-medium leading-relaxed flex-grow">"{rev.text}"</p>
                <span className="material-icons absolute top-4 right-4 md:top-6 md:right-6 text-primary/10 text-3xl md:text-4xl">format_quote</span>
              </motion.div>
            </RevealItem>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
};

const MagneticCard: React.FC<{ 
  id: string; 
  title: string; 
  subtitle?: string; 
  icon: string; 
  img: string; 
  onClick?: () => void;
  className?: string;
  style?: any;
  titleSize?: string;
}> = ({ id, title, subtitle, icon, img, onClick, className = "", style = {}, titleSize = "text-2xl" }) => {
  const { onMouseMove, onMouseLeave, rotateX, rotateY, spotlightX, spotlightY } = useMagneticTilt();
  const [isHovered, setIsHovered] = useState(false);

  const ref = useRef(null);
  const { scrollContainerRef } = React.useContext(ScrollContext);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <motion.div
      ref={ref}
      id={id}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -15 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`relative rounded-2xl sm:rounded-[2rem] overflow-hidden cursor-pointer border border-black/5 dark:border-white/10 dark:bg-zinc-900/40 bg-white shadow-soft hover:shadow-elite transition-all duration-500 group ${className}`}
      style={{ ...style, perspective: 1000, rotateX: isHovered ? rotateX : 0, rotateY: isHovered ? rotateY : 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, mass: 1 }}
      onClick={onClick}
    >
      <motion.div style={{ y: parallaxY }} className="absolute inset-0 w-full h-[125%] -top-[12.5%]">
        <motion.img 
            src={img} 
            className="w-full h-full object-cover opacity-60 dark:opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000 ease-out" 
            alt={title} 
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-noir-black opacity-90" />
      <motion.div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: useTransform([spotlightX, spotlightY], ([x, y]) => `radial-gradient(600px circle at ${x} ${y}, rgba(242,158,13,0.08), transparent 40%)`) }} />
      <div className="absolute inset-0 p-10 flex flex-col justify-end items-start z-10">
        <span className="material-icons text-primary text-4xl mb-4 group-hover:scale-125 transition-transform duration-500">{icon}</span>
        <h3 className={`${titleSize} font-black dark:text-white text-slate-900 font-heading uppercase tracking-tight leading-none group-hover:translate-x-2 transition-transform duration-500`}>{title}</h3>
        {subtitle && !className.includes('h-') && (
          <p className="text-[10px] dark:text-gray-400 text-slate-500 mt-2 font-black tracking-[0.3em] uppercase opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">{subtitle}</p>
        )}
      </div>
      <div className="absolute inset-0 border-[1px] border-white/5 pointer-events-none rounded-[3rem]" />
    </motion.div>
  );
};

const ServicesGrid: React.FC<{ setCurrentView: (v: any) => void; isActive?: boolean }> = ({ setCurrentView, isActive = false }) => {
  const handleNavigate = (view: string) => {
    setCurrentView(view);
    document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="relative z-30 bg-transparent h-[90vh] sm:h-[87vh] flex flex-col justify-center px-4 sm:px-8 items-center mt-0 sm:mt-0">
      <div className="lg:max-w-[67vw] mx-auto w-full flex flex-col items-center justify-center h-full">
        <ScrollReveal isActive={isActive} className="w-full flex flex-col items-center">
          <RevealItem className="text-center w-full" index={0}>
            <span className="text-primary font-black tracking-[0.3em] uppercase text-sm mb-2 sm:mb-4 block">
              Bespoke Services
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black dark:text-white text-slate-900 uppercase tracking-tighter max-w-3xl mx-auto mb-4 sm:mb-8">
              FOR THOSE WHO DEMAND <span className="dark:text-white/40 text-slate-300 italic">EXCELLENCE.</span>
            </h2>
          </RevealItem>

          <div className="grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-3 gap-3 sm:gap-4 mx-auto w-full lg:w-[55vw] h-[60vh] sm:h-[55vh] lg:h-[60vh] min-h-[400px] sm:min-h-[500px]">
            <RevealItem className='h-full lg:col-span-2 lg:row-span-2' index={1} totalItems={6}>
              <MagneticCard 
                id="card-bakery" 
                title="Bakery" 
                subtitle="Artisanal Breads" 
                icon="bakery_dining" 
                img="https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop" 
                onClick={() => handleNavigate('bakery')}
                className="h-full"
              />
            </RevealItem>
            <RevealItem className='h-full lg:col-span-2 lg:row-span-1' index={2} totalItems={6}>
              <MagneticCard 
                id="card-restaurant" 
                title="Dining" 
                subtitle="Chef-Curated" 
                icon="restaurant" 
                img="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop" 
                onClick={() => handleNavigate('dining')}
                className="h-full"
              />
            </RevealItem>
            <RevealItem className='h-full lg:col-span-1 lg:row-span-2' index={3} totalItems={6}>
              <MagneticCard 
                id="card-lounge" 
                title="Lounge" 
                subtitle="Premium Spirits" 
                icon="liquor" 
                img="https://images.unsplash.com/photo-1574096079513-d8259312b785?q=80&w=2070&auto=format&fit=crop" 
                onClick={() => handleNavigate('lounge')}
                className="h-full"
              />
            </RevealItem>
            <RevealItem className='h-full lg:col-span-1 lg:row-span-1' index={4} totalItems={6}>
              <MagneticCard 
                id="card-market" 
                title="Market" 
                subtitle="Global Sourcing" 
                icon="shopping_cart" 
                img="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2074&auto=format&fit=crop" 
                onClick={() => handleNavigate('supermarket')}
                className="h-full"
              />
            </RevealItem>
            <RevealItem className='h-full lg:col-span-2 lg:row-span-1' index={5} totalItems={6}>
              <MagneticCard 
                id="card-games" 
                title="Games" 
                subtitle="VR Frontier" 
                icon="sports_esports" 
                img="https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?q=80&w=2012&auto=format&fit=crop" 
                onClick={() => handleNavigate('games')}
                className="h-full"
              />
            </RevealItem>
            <RevealItem className='h-full lg:col-span-1 lg:row-span-1' index={6} totalItems={6}>
              <MagneticCard 
                id="card-water" 
                title="Water" 
                subtitle="Pure Excellence" 
                icon="water_drop" 
                img="https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=2070&auto=format&fit=crop" 
                onClick={() => handleNavigate('water')}
                className="h-full"
              />
            </RevealItem>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

const TrustSection: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  const certifications = [
    { name: "NAFDAC Certified", icon: "verified", desc: "Meeting the highest national safety standards for food and water production." },
    { name: "ISO 9001:2015", icon: "workspace_premium", desc: "International quality management systems ensuring consistent excellence." },
    { name: "Global Standards", icon: "public", desc: "Imported hardware and premium ingredients sourced from world-class partners." }
  ];

  return (
    <section className="flex flex-col justify-center px-6 relative overflow-hidden bg-transparent border-t border-black/5 dark:border-white/5 items-center h-screen">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_right,rgba(242,158,13,0.02),transparent_50%)] pointer-events-none" />
      <ScrollReveal isActive={isActive} className="lg:max-w-[67vw] mx-auto flex flex-col justify-center w-full">
        <div className="text-center mb-16">
          <RevealItem index={0} totalItems={6}>
            <span className="text-primary font-black tracking-[0.3em] uppercase text-sm mb-4 block">
              The Standard of Trust
            </span>
          </RevealItem>
          <RevealItem index={1} totalItems={6}>
            <h2 className="text-4xl sm:text-5xl font-black dark:text-white text-slate-900 uppercase tracking-tighter leading-tight mb-6">
              UNCOMPROMISING <br/><span className="text-primary">Quality</span>
            </h2>
          </RevealItem>
          <RevealItem index={2} totalItems={6}>
            <p className="text-base dark:text-gray-400 text-slate-600 leading-relaxed font-medium max-w-2xl mx-auto">
              We don't just meet standards; we set them. Orient Global operates under strict international compliance protocols, ensuring that every product and service delivers safety, quality, and reliability.
            </p>
          </RevealItem>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {certifications.map((cert, i) => (
            <RevealItem key={cert.name} index={3 + i} totalItems={6}>
              <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/40 border border-black/5 dark:border-white/5 shadow-soft group hover:border-primary/30 transition-all duration-700 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full group-hover:bg-primary/10 transition-colors duration-500" />
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <span className="material-icons text-primary text-3xl">{cert.icon}</span>
                </div>
                <h3 className="text-xl font-black dark:text-white text-slate-900 uppercase mb-4 tracking-tight leading-none">{cert.name}</h3>
                <p className="dark:text-gray-400 text-slate-600 leading-relaxed font-medium text-sm">{cert.desc}</p>
              </div>
            </RevealItem>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
};

const LocationSection: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  return (
    <section className="flex flex-col justify-center px-6 bg-transparent border-t border-black/5 dark:border-white/5 relative overflow-hidden items-center h-screen">
      <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(242,158,13,0.02),transparent_50%)] pointer-events-none" />
      <ScrollReveal isActive={isActive} className="lg:max-w-[67vw] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        <div className="flex flex-col">
          <RevealItem index={0} totalItems={6}>
            <span className="text-primary font-black tracking-[0.3em] uppercase text-sm mb-4 block">
              Our Presence
            </span>
          </RevealItem>
          <RevealItem index={1} totalItems={6}>
            <h2 className="text-4xl sm:text-5xl font-black dark:text-white text-slate-900 uppercase tracking-tighter mb-6 leading-tight">
              RAYFIELD, <br/><span className="text-primary">Jos</span>
            </h2>
          </RevealItem>
          <RevealItem index={2} totalItems={6}>
            <p className="text-base dark:text-gray-400 text-slate-600 leading-relaxed mb-8 font-medium">
              Visit our flagship destination at Amanda Plaza. A convergence of all lifestyle divisions in the heart of Plateau State.
            </p>
          </RevealItem>
          <div className="space-y-4">
            <RevealItem index={3} totalItems={6}>
              <div className="flex items-center gap-6 p-6 rounded-3xl dark:bg-white/5 bg-white border border-black/5 dark:border-white/10 shadow-soft group hover:border-primary/30 transition-all duration-500">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <span className="material-icons text-primary text-3xl">location_on</span>
                </div>
                <div>
                  <h4 className="dark:text-white text-slate-900 font-black uppercase tracking-tight text-lg mb-1">Amanda Plaza</h4>
                  <p className="dark:text-gray-500 text-slate-400 text-sm font-medium">Rayfield, Jos, Plateau State</p>
                </div>
              </div>
            </RevealItem>
            <RevealItem index={4} totalItems={6}>
              <div className="flex items-center gap-6 p-6 rounded-3xl dark:bg-white/5 bg-white border border-black/5 dark:border-white/10 shadow-soft group hover:border-primary/30 transition-all duration-500">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <span className="material-icons text-primary text-3xl">schedule</span>
                </div>
                <div>
                  <h4 className="dark:text-white text-slate-900 font-black uppercase tracking-tight text-lg mb-1">Open Daily</h4>
                  <p className="dark:text-gray-500 text-slate-400 text-sm font-medium">8:00 AM - 11:00 PM</p>
                </div>
              </div>
            </RevealItem>
          </div>
        </div>
        <RevealItem index={5} totalItems={6}>
          <div className="relative aspect-square rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 shadow-elite">
            <ParallaxImage src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2066&auto=format&fit=crop" alt="Jos Landscape" className="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
              <div className="flex items-center gap-4 text-white">
                <span className="material-icons text-primary">explore</span>
                <span className="font-black uppercase tracking-widest text-xs">Discover Plateau State</span>
              </div>
            </div>
          </div>
        </RevealItem>
      </ScrollReveal>
    </section>
  );
};
const VoicesSection: React.FC = () => {
  return null; // This will be removed as we are using VoicesOfJos
};

const Footer: React.FC<{ setCurrentView: (v: any) => void }> = ({ setCurrentView }) => {
  const handleNavigate = (view: string) => {
    setCurrentView(view);
    document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="min-h-screen lg:h-screen py-20 lg:py-0 bg-slate-50 dark:bg-background-dark dark:text-white text-slate-900 border-t border-black/5 dark:border-white/10 relative flex flex-col justify-center">
      <div className="lg:max-w-[67vw] mx-auto px-4 md:px-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white font-heading font-black text-xl shadow-xl shadow-primary/20">O</div>
              <span className="font-heading font-black text-2xl tracking-tight dark:text-white text-slate-900 uppercase">Orient Global</span>
            </div>
            <p className="dark:text-gray-400 text-slate-500 text-sm leading-relaxed mb-8 font-medium max-w-sm">
              Redefining lifestyle standards in Plateau State. A convergence of culinary art, premium retail, and luxury entertainment environments.
            </p>
            <div className="flex gap-4">
              {[
                { icon: 'facebook', label: 'Facebook' },
                { icon: 'camera_alt', label: 'Instagram' },
                { icon: 'alternate_email', label: 'Email' },
                { icon: 'business', label: 'LinkedIn' }
              ].map(social => (
                <a key={social.icon} className="w-10 h-10 rounded-xl dark:bg-white/5 bg-white dark:text-white text-slate-900 hover:bg-primary hover:text-white flex items-center justify-center transition-all shadow-soft border border-black/5 dark:border-white/10" href="#" aria-label={social.label}>
                  <i className="material-icons text-lg">{social.icon}</i>
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="dark:text-white text-slate-900 font-black uppercase tracking-[0.2em] mb-6 text-xs">Divisions</h3>
            <ul className="space-y-3 dark:text-gray-400 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              {[
                { name: 'The Bakery', view: 'bakery' },
                { name: 'Supermarket', view: 'supermarket' },
                { name: 'Restaurant', view: 'dining' },
                { name: 'Gaming Arena', view: 'games' },
                { name: 'Orient Water', view: 'water' },
                { name: 'VIP Lounge', view: 'lounge' }
              ].map(li => (
                <li key={li.name}><button onClick={() => handleNavigate(li.view)} className="hover:text-primary transition-colors flex items-center gap-2 uppercase tracking-widest text-[10px]">{li.name}</button></li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="dark:text-white text-slate-900 font-black uppercase tracking-[0.2em] mb-6 text-xs">Corporate</h3>
            <ul className="space-y-3 dark:text-gray-400 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              {['About Us', 'Careers', 'Investor Relations', 'Press & Media', 'Contact Support'].map(li => (
                <li key={li}><a className="hover:text-primary transition-colors flex items-center gap-2" href="#">{li}</a></li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="dark:text-white text-slate-900 font-black uppercase tracking-[0.2em] mb-6 text-xs">Newsletter</h3>
            <p className="text-xs dark:text-gray-400 text-slate-500 mb-4 leading-relaxed font-medium">Subscribe to receive corporate updates and exclusive offers.</p>
            <div className="relative">
              <input className="w-full dark:bg-white/5 bg-white border border-black/5 dark:border-white/10 rounded-xl py-3 px-4 dark:text-white text-slate-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium shadow-inner" placeholder="Email Address" type="email"/>
              <button className="absolute right-2 top-2 bg-primary text-white p-1.5 rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-primary/20">
                <span className="material-icons text-lg">arrow_forward</span>
              </button>
            </div>
            <p className="text-[9px] dark:text-gray-600 text-slate-400 mt-4 uppercase tracking-widest font-black">By subscribing, you agree to our Privacy Policy.</p>
          </div>
        </div>
        
        <div className="border-t border-black/5 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] dark:text-gray-500 text-slate-400 uppercase tracking-[0.2em] font-black">
          <p>© {new Date().getFullYear()} Orient Global Services Ltd. All rights reserved.</p>
          <div className="flex gap-6 flex-wrap justify-center">
            <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-colors" href="#">Cookie Policy</a>
            <a className="hover:text-primary transition-colors" href="#">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string | React.ReactNode}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      // Strictly defined tools configuration: Only Function calling is enabled to avoid conflicts.
      // Search Grounding is not used here to ensure 'navigateToSectionTool' works reliably as per strict exclusivity rules.
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: "You are the Orient Global AI Concierge. Your primary goal is to help users navigate this website. If a user asks to see the bakery, market, restaurant, lounge, or standard sections, you MUST use the `navigateToSection` tool. If they ask general questions, answer them as a helpful luxury concierge. Be brief, elite, and polite.",
          tools: [{ 
            functionDeclarations: [navigateToSectionTool]
          }],
        }
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'navigateToSection') {
            const sectionId = (fc.args as any).sectionId;
            const element = document.getElementById(sectionId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
              setMessages(prev => [...prev, { role: 'bot', text: `Certainly. I have navigated you to the ${sectionId} section.` }]);
            } else {
               // Fallback if ID doesn't exist (should not happen with correct enum)
              setMessages(prev => [...prev, { role: 'bot', text: `I attempted to take you to the ${sectionId}, but I am unable to locate it on the map.` }]);
            }
          }
        }
      } else if (response.text) {
        setMessages(prev => [...prev, { role: 'bot', text: response.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: "I'm here to serve. How may I assist you?" }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'bot', text: "I apologize, but I am currently updating my navigational systems. Please try again momentarily." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 sm:bottom-12 sm:right-12 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 50 }} className="absolute bottom-20 sm:bottom-24 right-0 w-[calc(100vw-3rem)] sm:w-[380px] h-[45vh] sm:h-[480px] max-h-[500px] rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden dark:bg-zinc-900 bg-white">
            <div className="p-6 sm:p-8 border-b border-white/5 bg-gradient-to-r from-primary/20 to-transparent">
               <div className="flex items-center gap-4 mb-2">
                 <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black"><span className="material-icons text-xl">smart_toy</span></div>
                 <div><h4 className="dark:text-white text-slate-900 font-black uppercase tracking-tight text-lg leading-none">AI Concierge</h4><p className="text-green-500 text-[10px] uppercase tracking-widest font-black mt-1">Online Now</p></div>
               </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
               {messages.length === 0 && (<div className="bg-primary/10 border border-primary/20 p-6 rounded-[2rem] rounded-tl-none"><p className="dark:text-gray-200 text-slate-700 text-sm leading-relaxed italic font-medium">"Welcome to Orient Global. I can help you find products, check our filtration standards, or navigate the site for you. What would you like to see?"</p></div>)}
               {messages.map((m, i) => (<div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed font-medium ${m.role === 'user' ? 'bg-primary text-black rounded-br-none shadow-lg' : 'dark:bg-white/10 bg-slate-100 dark:text-gray-200 text-slate-700 border border-white/5 rounded-bl-none shadow-md'}`}>{m.text}</div></div>))}
               {isTyping && (<div className="flex justify-start"><div className="dark:bg-white/10 bg-slate-100 p-5 rounded-[2rem] rounded-bl-none flex gap-1.5 shadow-md"><span className="w-2 h-2 bg-primary rounded-full animate-bounce" /><span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" /><span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" /></div></div>)}
            </div>
            <div className="p-6 dark:bg-black/50 bg-slate-50 border-t border-white/5"><div className="flex gap-4 items-center dark:bg-white/5 bg-white px-6 py-4 rounded-[2rem] border border-white/10 focus-within:border-primary/50 transition-all shadow-inner"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Take me to the bakery..." className="bg-transparent border-none focus:ring-0 dark:text-white text-slate-900 text-sm flex-1 placeholder:text-gray-600 font-bold" /><button onClick={handleSend} className="text-primary hover:text-orange-500 transition-colors"><span className="material-icons font-black">send</span></button></div></div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 10 }} 
        whileTap={{ scale: 0.9 }} 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-black shadow-2xl shadow-primary/40 z-50 relative group border-2 border-transparent hover:border-white/10 transition-all"
      >
        <span className="material-icons text-2xl">{isOpen ? 'close' : 'smart_toy'}</span>
        {!isOpen && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background-dark animate-pulse shadow-lg" />}
      </motion.button>
    </div>
  );
};

const Login: React.FC<{ onLogin: () => void, onCancel: () => void }> = ({ onLogin, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'orient2024') {
      onLogin();
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-slate-50 px-4">
      <div className="max-w-md w-full p-8 rounded-[3rem] border border-white/10 shadow-2xl dark:bg-zinc-900/80 bg-white/80 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white font-heading font-black text-3xl shadow-[0_0_30px_rgba(242,158,13,0.4)] mb-6">O</div>
          <h2 className="text-3xl font-black dark:text-white text-slate-900 uppercase tracking-tighter">Admin Access</h2>
          <p className="dark:text-gray-400 text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Orient Global Systems</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold text-center">{error}</div>}
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.2em] dark:text-gray-400 text-slate-500 mb-2">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-6 dark:text-white text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium" placeholder="Enter username" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.2em] dark:text-gray-400 text-slate-500 mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-6 dark:text-white text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium" placeholder="Enter password" />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onCancel} className="flex-1 py-4 rounded-2xl border border-black/10 dark:border-white/10 dark:text-white text-slate-900 font-black uppercase tracking-[0.2em] text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-all">Cancel</button>
            <button type="submit" className="flex-1 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-orange-600 transition-all shadow-lg shadow-primary/20">Login</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const divisions = ['Bakery', 'Market', 'Restaurant', 'Games', 'Water', 'Lounge'];
  const [activeTab, setActiveTab] = useState(divisions[0]);

  return (
    <div className="min-h-screen dark:bg-background-dark bg-slate-50 pt-24 pb-12 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black dark:text-white text-slate-900 uppercase tracking-tighter font-heading">Command Center</h1>
            <p className="dark:text-gray-400 text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Manage Orient Global Divisions</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 px-6 py-3 rounded-full border border-black/10 dark:border-white/10 dark:text-white text-slate-900 font-black uppercase tracking-widest text-xs hover:bg-red-500 hover:text-white hover:border-red-500 transition-all group">
            <span className="material-icons text-sm group-hover:-translate-x-1 transition-transform">logout</span>
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-2">
            {divisions.map(div => (
              <button 
                key={div}
                onClick={() => setActiveTab(div)}
                className={`w-full text-left px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-between ${activeTab === div ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'dark:bg-zinc-900/50 bg-white dark:text-gray-400 text-slate-500 hover:dark:bg-zinc-800 hover:bg-slate-100 border border-black/5 dark:border-white/5'}`}
              >
                {div}
                <span className="material-icons text-lg">{activeTab === div ? 'chevron_right' : ''}</span>
              </button>
            ))}
          </div>
          
          <div className="lg:col-span-3">
            <div className="rounded-[3rem] p-8 md:p-12 border border-black/5 dark:border-white/10 shadow-2xl dark:bg-zinc-900/40 bg-white/60 backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-icons text-2xl">settings_applications</span>
                </div>
                <h2 className="text-3xl font-black dark:text-white text-slate-900 uppercase tracking-tight">{activeTab} Configuration</h2>
              </div>
              
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.2em] dark:text-gray-400 text-slate-500 mb-3">Division Name</label>
                    <input type="text" defaultValue={activeTab} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-6 dark:text-white text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.2em] dark:text-gray-400 text-slate-500 mb-3">Status</label>
                    <select className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-6 dark:text-white text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium appearance-none">
                      <option>Active / Operational</option>
                      <option>Maintenance Mode</option>
                      <option>Coming Soon</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] dark:text-gray-400 text-slate-500 mb-3">Hero Description</label>
                  <textarea rows={4} defaultValue={`Experience the finest ${activeTab.toLowerCase()} offerings at Orient Global.`} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-6 dark:text-white text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium resize-none"></textarea>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] dark:text-gray-400 text-slate-500 mb-3">Featured Image URL</label>
                  <div className="flex gap-4">
                    <input type="text" defaultValue={`https://images.unsplash.com/photo-placeholder-${activeTab.toLowerCase()}`} className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-6 dark:text-white text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium" />
                    <button className="px-6 py-4 rounded-2xl bg-zinc-800 text-white font-black uppercase tracking-widest text-xs hover:bg-zinc-700 transition-all">Preview</button>
                  </div>
                </div>

                <div className="pt-8 border-t border-black/10 dark:border-white/10 flex justify-end gap-4">
                  <button className="px-8 py-4 rounded-2xl border border-black/10 dark:border-white/10 dark:text-white text-slate-900 font-black uppercase tracking-[0.2em] text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-all">Discard Changes</button>
                  <button className="px-8 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-orange-600 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                    <span className="material-icons text-sm">save</span>
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const lastScrollY = React.useRef(0);
  const [globalTheme, setGlobalTheme] = useState<'dark' | 'light'>('light');
  const [divisionThemes, setDivisionThemes] = useState<Record<string, 'dark' | 'light'>>({
    home: 'light', login: 'dark', admin: 'dark', bakery: 'dark',
    supermarket: 'dark', dining: 'dark', games: 'dark', water: 'dark', lounge: 'dark'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'admin' | 'bakery' | 'supermarket' | 'dining' | 'games' | 'water' | 'lounge' | 'about'>('home');
  const [bakeryView, setBakeryView] = useState<'home' | 'architect' | 'wholesale' | 'story'>('home');
  const [supermarketPage, setSupermarketPage] = useState<SupermarketPage>('Home');
  const [isSmartPasteOpen, setIsSmartPasteOpen] = useState(false);
  const [diningView, setDiningView] = useState<DiningView>('about');
  const [gamesPage, setGamesPage] = useState<GamesPage>(GamesPage.LANDING);
  const [waterPage, setWaterPage] = useState<WaterPage>('home');
  const [loungePage, setLoungePage] = useState<LoungePage>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const sectionCount = 13; // Total sections in home view

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // --- NATIVE SCROLL SNAPPING LOGIC ---
  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container) return;

    const handleNativeScroll = () => {
      if (!container) return;
      const currentScrollY = container.scrollTop;
      setScrolled(currentScrollY > 50);
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setScrollDirection('down');
        setNavHidden(true);
      } else {
        setScrollDirection('up');
        setNavHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };

    container.addEventListener('scroll', handleNativeScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleNativeScroll);
  }, [currentView]);

  useEffect(() => {
    if (currentView !== 'home') {
      setScrolled(false);
      setNavHidden(false);
      lastScrollY.current = 0;
      const container = document.getElementById('main-scroll-container');
      if (container) container.scrollTop = 0;
    }
  }, [currentView]);

  useEffect(() => {
    setScrolled(currentSectionIndex > 0);
    setNavHidden(scrollDirection === 'down' && currentSectionIndex > 0);
  }, [currentSectionIndex, scrollDirection]);

  useEffect(() => {
    const activeTheme = divisionThemes[currentView] || 'dark';
    document.documentElement.classList.toggle('dark', activeTheme === 'dark');
  }, [currentView, divisionThemes]);

  const toggleGlobalTheme = () => {
    const newTheme = globalTheme === 'dark' ? 'light' : 'dark';
    setGlobalTheme(newTheme);
    setDivisionThemes(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => updated[key] = newTheme);
      return updated;
    });
  };

  const toggleLocalTheme = (division: string) => {
    setDivisionThemes(prev => ({
      ...prev,
      [division]: prev[division] === 'dark' ? 'light' : 'dark'
    }));
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentView('admin');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('home');
  };

  const getAmbientColor = () => {
    switch(currentView) {
      case 'bakery': return 'bg-amber-500';
      case 'supermarket': return 'bg-emerald-500';
      case 'dining': return 'bg-rose-600';
      case 'games': return 'bg-cyan-500';
      case 'water': return 'bg-sky-500';
      case 'lounge': return 'bg-yellow-600';
      default: return 'bg-primary';
    }
  };

  return (
    <>
        <AnimatePresence>
            {isLoading && <Preloader onComplete={() => setIsLoading(false)} theme={globalTheme} />}
        </AnimatePresence>
        {/* Outer wrapper requires h-[100dvh] and overflow-hidden for the snap container to work securely */}
        <div className="bg-white dark:bg-background-dark transition-colors duration-700 dark:text-white text-slate-900 selection:bg-primary selection:text-black relative z-10 h-[100dvh] overflow-hidden">
          
          {/* Main Scroll Container with Native Snap Classes */}
          <div ref={scrollContainerRef} className={`fixed inset-0 w-full h-full bg-transparent overflow-y-auto ${currentView === 'home' ? 'snap-y snap-mandatory scroll-smooth' : ''} no-scrollbar`} id="main-scroll-container">
            <ScrollContext.Provider value={{ scrollContainerRef, activeSectionId, setActiveSectionId, currentSectionIndex, setCurrentSectionIndex, scrollDirection, setScrollDirection }}>
            {currentView === 'home' && (
              <div className="relative w-full">
                <Navbar theme={globalTheme} toggleTheme={toggleGlobalTheme} setCurrentView={setCurrentView} scrolled={scrolled} navHidden={navHidden} isReady={!isLoading} skipAnimation={false} setCurrentSectionIndex={setCurrentSectionIndex} />

                <SectionWrapper id="hero" index={0} className="relative z-20 w-full h-[100dvh] flex flex-col justify-center cinematic-section snap-start shrink-0">
                  <Hero isReady={!isLoading} isActive={currentSectionIndex === 0} />
                </SectionWrapper>
                
                <div className="relative z-10 bg-transparent">
                  <SectionWrapper id="services" index={1} className="relative w-full h-[100dvh] flex flex-col justify-center cinematic-section snap-start shrink-0">
                      <ServicesGrid setCurrentView={setCurrentView} />
                  </SectionWrapper>
                  <SectionWrapper id="trust" index={2} className="relative w-full !h-[85vh] sm:h-[100dvh] flex flex-col justify-center cinematic-section snap-start shrink-0">
                      <TrustSection />
                  </SectionWrapper>
                  <SectionWrapper id="water-deep" index={3} className="relative w-full h-[100dvh] flex flex-col justify-center cinematic-section snap-start shrink-0">
                      <WaterDeepDive />
                  </SectionWrapper>
                  <SectionWrapper id="market-deep" index={4} className="relative w-full h-[100dvh] flex flex-col justify-center cinematic-section snap-start shrink-0">
                      <MarketDeepDive />
                  </SectionWrapper>
                  <SectionWrapper id="bakery-deep" index={5} className="relative w-full h-[100dvh] flex flex-col justify-center cinematic-section snap-start shrink-0">
                    <BakeryDeepDive />
                  </SectionWrapper>
                  <SectionWrapper id="dining-deep" index={6} className="relative w-full h-[100dvh] flex flex-col justify-center cinematic-section snap-start shrink-0">
                    <DiningDeepDive />
                  </SectionWrapper>
                  <SectionWrapper id="lounge-deep" index={7} className="relative w-full h-[100dvh] flex flex-col justify-center cinematic-section snap-start shrink-0">
                    <LoungeDeepDive />
                  </SectionWrapper>
                  <SectionWrapper id="games-deep" index={8} className="relative w-full h-[100dvh] flex flex-col justify-center cinematic-section snap-start shrink-0">
                    <GamesDeepDive />
                  </SectionWrapper>
                  <SectionWrapper id="voices" index={9} className="relative w-full !h-[85vh] sm:h-[100dvh] flex flex-col justify-center cinematic-section snap-start shrink-0">
                    <VoicesOfJos />
                  </SectionWrapper>
                  <SectionWrapper id="location" index={10} className="relative w-full h-[100dvh] flex flex-col justify-center cinematic-section snap-start shrink-0">
                    <LocationSection />
                  </SectionWrapper>
                  <SectionWrapper id="cta" index={11} className="relative w-full h-[100dvh] flex flex-col justify-center cinematic-section snap-start shrink-0">
                    <FinalCTA />
                  </SectionWrapper>
                </div>

                <SectionWrapper id="footer" index={12} className="relative z-20 w-full min-h-screen lg:h-[100dvh] flex flex-col justify-center cinematic-section snap-start shrink-0">
                  <Footer setCurrentView={setCurrentView} />
                </SectionWrapper>
                <ChatBot />
              </div>
            )}
            {(currentView === 'login' || currentView === 'admin') && (
              <div className="pt-16 sm:pt-20 min-h-screen">
                <StudioApp onCancel={() => setCurrentView('home')} />
              </div>
            )}
            {currentView === 'bakery' && (
              <div className="relative">
                <Navbar theme={globalTheme} toggleTheme={toggleGlobalTheme} setCurrentView={setCurrentView} scrolled={scrolled} navHidden={navHidden} isSubpage skipAnimation />
                <div className="pt-12 sm:pt-14">
                  <BakeryNav navHidden={navHidden} currentView={bakeryView} setView={setBakeryView} localTheme={divisionThemes['bakery']} toggleLocalTheme={() => toggleLocalTheme('bakery')} />
                  <div className="pt-12">
                    <BakeryApp currentView={bakeryView} />
                  </div>
                  <Footer setCurrentView={setCurrentView} />
                </div>
              </div>
            )}
            {currentView === 'supermarket' && (
              <div className="relative">
                <Navbar theme={globalTheme} toggleTheme={toggleGlobalTheme} setCurrentView={setCurrentView} scrolled={scrolled} navHidden={navHidden} isSubpage skipAnimation />
                <div className="pt-12 sm:pt-14">
                  <SupermarketNav navHidden={navHidden} activePage={supermarketPage} setActivePage={setSupermarketPage} setIsSmartPasteOpen={setIsSmartPasteOpen} localTheme={divisionThemes['supermarket']} toggleLocalTheme={() => toggleLocalTheme('supermarket')} />
                  <div className="pt-12">
                    <SupermarketApp activePage={supermarketPage} setActivePage={setSupermarketPage} isSmartPasteOpen={isSmartPasteOpen} setIsSmartPasteOpen={setIsSmartPasteOpen} />
                  </div>
                  <Footer setCurrentView={setCurrentView} />
                </div>
              </div>
            )}
            {currentView === 'dining' && (
              <div className="relative">
                <Navbar theme={globalTheme} toggleTheme={toggleGlobalTheme} setCurrentView={setCurrentView} scrolled={scrolled} navHidden={navHidden} isSubpage skipAnimation />
                <div className="pt-12 sm:pt-14">
                  <DiningNav navHidden={navHidden} currentView={diningView} setView={setDiningView} localTheme={divisionThemes['dining']} toggleLocalTheme={() => toggleLocalTheme('dining')} />
                  <div className="pt-12">
                    <DiningApp currentView={diningView} />
                  </div>
                  <Footer setCurrentView={setCurrentView} />
                </div>
              </div>
            )}
            {currentView === 'games' && (
              <div className="relative">
                <Navbar theme={globalTheme} toggleTheme={toggleGlobalTheme} setCurrentView={setCurrentView} scrolled={scrolled} navHidden={navHidden} isSubpage skipAnimation />
                <div className="pt-12 sm:pt-14">
                  <GamesNav navHidden={navHidden} currentPage={gamesPage} onNavigate={setGamesPage} localTheme={divisionThemes['games']} toggleLocalTheme={() => toggleLocalTheme('games')} />
                  <div className="pt-12">
                    <GamesApp currentPage={gamesPage} onNavigate={setGamesPage} />
                  </div>
                  <Footer setCurrentView={setCurrentView} />
                </div>
              </div>
            )}
            {currentView === 'water' && (
              <div className="relative">
                <Navbar theme={globalTheme} toggleTheme={toggleGlobalTheme} setCurrentView={setCurrentView} scrolled={scrolled} navHidden={navHidden} isSubpage skipAnimation />
                <div className="pt-12 sm:pt-14">
                  <WaterNav navHidden={navHidden} currentPage={waterPage} onNavigate={setWaterPage} localTheme={divisionThemes['water']} toggleLocalTheme={() => toggleLocalTheme('water')} />
                  <div className="pt-12">
                    <WaterApp currentPage={waterPage} onNavigate={setWaterPage} />
                  </div>
                  <Footer setCurrentView={setCurrentView} />
                </div>
              </div>
            )}
            {currentView === 'lounge' && (
              <div className="relative">
                <Navbar theme={globalTheme} toggleTheme={toggleGlobalTheme} setCurrentView={setCurrentView} scrolled={scrolled} navHidden={navHidden} isSubpage skipAnimation />
                <div className="pt-12 sm:pt-14">
                  <LoungeNav navHidden={navHidden} currentPage={loungePage} onNavigate={setLoungePage} localTheme={divisionThemes['lounge']} toggleLocalTheme={() => toggleLocalTheme('lounge')} />
                  <div className="pt-12">
                    <LoungeApp currentPage={loungePage} onNavigate={setLoungePage} />
                  </div>
                  <Footer setCurrentView={setCurrentView} />
                </div>
              </div>
            )}
            {currentView === 'about' && (
              <div className="relative">
                <Navbar theme={globalTheme} toggleTheme={toggleGlobalTheme} setCurrentView={setCurrentView} scrolled={scrolled} navHidden={navHidden} isSubpage skipAnimation />
                <div className="pt-12 sm:pt-14">
                  <About setCurrentView={setCurrentView} />
                  <Footer setCurrentView={setCurrentView} />
                </div>
              </div>
            )}
            </ScrollContext.Provider>
          </div>
        </div>
    </>
  );
};

export default App;
