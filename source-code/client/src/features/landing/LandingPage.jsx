import React, { useState, useEffect, useRef, useCallback } from "react";
import { translations } from "./i18n";

/* ═══════════════════════════════════════════════════════════════════════════
   TAY ALRAWI - Marketing Landing Page
   Design: Clean white, Apple-inspired, professional
   Colors: White + Navy #1C2B59 + Red #E31E24
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Flag emoji to SVG mapping (Windows doesn't render emoji flags) ──────────
const flagMap = {
  "\u{1f1ee}\u{1f1f6}": "/flags/iq.svg",
  "\u{1f1f8}\u{1f1fe}": "/flags/sy.svg",
  "\u{1f1ef}\u{1f1f4}": "/flags/jo.svg",
  "\u{1f1f8}\u{1f1e6}": "/flags/sa.svg",
  "\u{1f1e8}\u{1f1f3}": "/flags/cn.svg",
  "\u{1f1ee}\u{1f1f7}": "/flags/ir.svg",
};
function FlagImg({ flag, size = 20, className = "" }) {
  const src = flagMap[flag] || flag;
  if (src.startsWith("/")) {
    return <img src={src} alt="" className={`inline-block rounded-sm ${className}`} style={{ width: size, height: size * 0.75 }} />;
  }
  return <span className={className} style={{ fontSize: size }}>{flag}</span>;
}

// ─── Image Slideshow (auto-rotate) ───────────────────────────────────────────
function ImageSlideshow({ images, alt = "", className = "", interval = 4000 }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);
  return (
    <div className={`relative w-full h-full ${className}`}>
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Reveal on Scroll ─────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, className = "", delay = 0, style = {} }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Parallax Hook ────────────────────────────────────────────────────────────
function useParallax(speed = 0.3) {
  const [offsetY, setOffsetY] = useState(0);
  useEffect(() => {
    const handler = () => setOffsetY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return offsetY * speed;
}

// ─── Counter Animation Hook ──────────────────────────────────────────────────
function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    // Extract number from string like "+500", "+10,000", "24/7", "+15"
    // If target contains "/" (like "24/7"), treat as static text
    if (target.includes("/")) {
      setCount(target);
      return;
    }
    const numStr = target.replace(/[^0-9]/g, "");
    const num = parseInt(numStr, 10);
    if (isNaN(num) || num === 0) {
      setCount(target);
      return;
    }

    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * num);
      setCount(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, target, duration]);

  // Format the count back with prefix/suffix
  const formatCount = useCallback(() => {
    if (typeof count === "string") return count;
    const hasPlus = target.startsWith("+");
    const hasComma = target.includes(",");
    let formatted = count.toString();
    if (hasComma && count >= 1000) {
      formatted = count.toLocaleString();
    }
    if (hasPlus) formatted = "+" + formatted;
    // Add any suffix after numbers (like % or similar)
    const suffix = target.replace(/^[+]?[\d,]+/, "");
    return formatted + suffix;
  }, [count, target]);

  return [ref, formatCount()];
}

// ─── Floating Particles Component ────────────────────────────────────────────
function FloatingParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    const PARTICLE_COUNT = 35;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 1,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.3 - 0.2, // slight upward drift
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
    />
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ t, lang, onLangSwitch }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [showPassDialog, setShowPassDialog] = useState(false);
  const [passValue, setPassValue] = useState("");
  const [passError, setPassError] = useState(false);
  const tapTimer = useRef(null);

  const handleLogoClick = (e) => {
    e.preventDefault();
    const newCount = tapCount + 1;
    setTapCount(newCount);
    clearTimeout(tapTimer.current);
    if (newCount >= 5) {
      setTapCount(0);
      setShowPassDialog(true);
      setPassValue("");
      setPassError(false);
    } else {
      tapTimer.current = setTimeout(() => setTapCount(0), 2000);
    }
  };

  const handlePassSubmit = () => {
    if (passValue === "admin") {
      setShowPassDialog(false);
      window.location.href = "/admin";
    } else {
      setPassError(true);
      setTimeout(() => setPassError(false), 1500);
    }
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { id: "about", label: t.nav.about },
    { id: "services", label: t.nav.services },
    { id: "ports", label: t.nav.ports },
    { id: "seaport", label: t.nav.seaport },
    { id: "system", label: t.nav.system },
    { id: "contact", label: t.nav.contact },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.05)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between h-[72px] px-6">
        {/* Logo - Secret admin access on 5 taps */}
        <div onClick={handleLogoClick} className="flex items-center gap-3 group cursor-pointer select-none">
          <img
            src="/logo_trimmed_transparent.png"
            alt="Tay Alrawi"
            className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
          />
          <div className="hidden sm:block">
            <div className={`font-bold text-[15px] leading-tight transition-colors duration-500 ${scrolled ? 'text-[#1C2B59]' : 'text-white'}`}>
              {lang === "ar" ? "طي الراوي" : "TAY ALRAWI"}
            </div>
            <div className={`text-[10px] font-medium transition-colors duration-500 ${scrolled ? 'text-gray-400' : 'text-white/60'}`}>
              {lang === "ar" ? "للنقل والتخليص الكمركي" : "Transport & Customs"}
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className={`px-4 py-2 text-[13px] font-medium rounded-full transition-all duration-300 ${
                scrolled
                  ? 'text-[#1C2B59]/70 hover:text-[#1C2B59] hover:bg-[#1C2B59]/[0.04]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLangSwitch}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-full transition-all duration-300 ${
              scrolled
                ? 'text-gray-400 hover:text-[#1C2B59] hover:bg-gray-50'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {t.nav.switchLang}
          </button>


          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors duration-300 ${
              scrolled ? 'text-[#1C2B59] hover:bg-gray-50' : 'text-white hover:bg-white/10'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-5 shadow-xl">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-[#1C2B59] text-[15px] font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
            <a href="/merchants" className="flex-1 text-center py-3 rounded-xl bg-[#1C2B59] text-white text-[13px] font-semibold">
              {t.nav.merchantPortal}
            </a>
          </div>
        </div>
      )}
      {/* Password Dialog */}
      {showPassDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPassDialog(false)}>
          <div
            className="bg-white rounded-2xl p-8 w-[340px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'fadeInScale 0.25s ease' }}
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-[#1C2B59]/[0.06] flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-[#1C2B59]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h3 className="text-[17px] font-bold text-[#1C2B59]">{t.dir === 'rtl' ? '\u062f\u062e\u0648\u0644 \u0627\u0644\u0625\u062f\u0627\u0631\u0629' : 'Admin Access'}</h3>
              <p className="text-[13px] text-gray-400 mt-1">{t.dir === 'rtl' ? '\u0623\u062f\u062e\u0644 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631' : 'Enter password'}</p>
            </div>
            <input
              type="password"
              value={passValue}
              onChange={(e) => setPassValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePassSubmit()}
              autoFocus
              className={`w-full px-4 py-3 rounded-xl border-2 text-center text-[15px] font-medium outline-none transition-all duration-200 ${
                passError
                  ? 'border-[#E31E24] bg-red-50 text-[#E31E24]'
                  : 'border-gray-200 focus:border-[#1C2B59] text-[#1C2B59]'
              }`}
              placeholder="••••••"
              dir="ltr"
            />
            {passError && (
              <p className="text-[#E31E24] text-[12px] text-center mt-2 font-medium">
                {t.dir === 'rtl' ? '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629' : 'Incorrect password'}
              </p>
            )}
            <button
              onClick={handlePassSubmit}
              className="w-full mt-4 py-3 rounded-xl bg-[#1C2B59] text-white text-[14px] font-bold hover:bg-[#152247] transition-colors"
            >
              {t.dir === 'rtl' ? '\u062f\u062e\u0648\u0644' : 'Enter'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </header>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function Hero({ t, lang }) {
  const parallaxOffset = useParallax(0.3);
  const [truckLoaded, setTruckLoaded] = useState(false);

  useEffect(() => {
    // Trigger truck slide-in after a short delay for dramatic effect
    const timer = setTimeout(() => setTruckLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative h-[60vh] sm:h-[75vh] min-h-[400px] sm:min-h-[500px] flex items-center overflow-hidden w-full">
      {/* Background Image with Parallax + Truck Slide-in */}
      <img
        src="/hero_banner.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-right"
        style={{
          transform: `translateY(${parallaxOffset}px) translateX(${truckLoaded ? '0' : '100px'})`,
          opacity: truckLoaded ? 1 : 0,
          transition: 'transform 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 1.2s ease',
        }}
      />

      {/* Floating Particles - Desert Dust Effect */}
      <FloatingParticles />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-l rtl:bg-gradient-to-r from-[#0a0f1c]/85 via-[#0a0f1c]/60 to-transparent z-[2]" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-20 w-full">
        <div className="max-w-[550px] ms-auto text-end rtl:text-start px-2 sm:px-0">



          {/* Description */}
          <Reveal delay={300}>
            <p className="text-white/80 text-base sm:text-lg md:text-xl leading-relaxed font-medium">
              {t.hero.description}
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={450}>
            <div className="mt-6 sm:mt-10 flex flex-wrap items-center justify-end rtl:justify-start gap-3 sm:gap-4">
              <a
                href="/merchants"
                className="group inline-flex items-center gap-2 sm:gap-2.5 px-5 sm:px-7 py-3 sm:py-3.5 rounded-full bg-white text-[#1C2B59] text-[13px] sm:text-[14px] font-bold hover:bg-white/90 transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
              >
                {t.hero.cta1}
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="#contact"
                className="inline-flex items-center px-5 sm:px-7 py-3 sm:py-3.5 rounded-full bg-white/15 border-2 border-white/40 text-white text-[13px] sm:text-[14px] font-semibold hover:bg-white/25 hover:border-white/60 backdrop-blur-md transition-all duration-200"
              >
                {t.hero.cta2}
              </a>
            </div>
          </Reveal>
        </div>
      </div>


    </section>
  );
}

// ─── Stats Counter Item ──────────────────────────────────────────────────────
function StatItem({ value, label, delay }) {
  const [ref, displayValue] = useCounter(value, 2200);
  const [revealRef, visible] = useReveal();

  return (
    <div
      ref={(el) => {
        ref.current = el;
        revealRef.current = el;
      }}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      <div className="text-center">
        <div className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1C2B59] tabular-nums">{displayValue}</div>
        <div className="mt-2 text-[13px] text-gray-400 font-medium">{label}</div>
      </div>
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function Stats({ t }) {
  return (
    <section className="py-16 bg-[#f9fafb] border-y border-gray-100">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {t.about.stats.map((s, i) => (
            <StatItem key={i} value={s.value} label={s.label} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
function About({ t }) {
  return (
    <section id="about" className="py-24 sm:py-32 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid lg:grid-cols-5 gap-16 items-center">
          {/* Text - 3 cols */}
          <div className="lg:col-span-3">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C2B59]/[0.04] mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E31E24]" />
                <span className="text-[11px] font-semibold text-[#1C2B59] uppercase tracking-wider">
                  {t.about.title}
                </span>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#1C2B59] leading-[1.15]">
                {t.about.title}
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 text-gray-500 text-[15px] sm:text-base leading-[1.9]">
                {t.about.description}
              </p>
            </Reveal>
            <Reveal delay={300}>
              <p className="mt-4 text-gray-400 text-[15px] sm:text-base leading-[1.9]">
                {t.about.description2}
              </p>
            </Reveal>
          </div>

          {/* Visual - 2 cols */}
          <div className="lg:col-span-2">
            <Reveal delay={200}>
              <div className="relative">
                <img
                  src="/marketing_warehouse.png"
                  alt="Tay Alrawi Warehouse"
                  className="w-full h-auto rounded-[24px] shadow-[0_16px_48px_rgba(28,43,89,0.12)] object-cover"
                />
                {/* Decorative accent */}
                <div className="absolute -bottom-3 -start-3 w-24 h-24 rounded-2xl bg-[#E31E24]/5 -z-10" />
                <div className="absolute -top-3 -end-3 w-20 h-20 rounded-2xl bg-[#1C2B59]/5 -z-10" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Services ─────────────────────────────────────────────────────────────────
function Services({ t }) {
  const serviceImages = ["/marketing_8.png", "/marketing_4.png"];

  const iconPaths = {
    FileCheck: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 15l2 2 4-4",
    Truck: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    MessageSquare: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    Package: "M16.5 9.4L7.55 4.24 M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12",
  };

  return (
    <section id="services" className="py-24 sm:py-32 bg-[#f9fafb]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <Reveal>
          <div className="text-center max-w-[540px] mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C2B59]/[0.04] mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E31E24]" />
              <span className="text-[11px] font-semibold text-[#1C2B59] uppercase tracking-wider">
                {t.services.title}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#1C2B59] leading-[1.15]">
              {t.services.title}
            </h2>
            <p className="mt-4 text-gray-400 text-[15px]">{t.services.subtitle}</p>
          </div>
        </Reveal>

        {/* Service Images Showcase */}
        <Reveal delay={100}>
          <div className="grid sm:grid-cols-2 gap-6 mb-14">
            <div className="relative group rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(28,43,89,0.1)] hover:shadow-[0_12px_48px_rgba(28,43,89,0.16)] transition-all duration-500">
              <img
                src="/marketing_8.png"
                alt="Customs Clearance"
                className="w-full h-[260px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C2B59]/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 start-5 end-5">
                <span className="text-white font-bold text-[15px] drop-shadow-lg">{t.services.items[0]?.title}</span>
              </div>
            </div>
            <div className="relative group rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(28,43,89,0.1)] hover:shadow-[0_12px_48px_rgba(28,43,89,0.16)] transition-all duration-500">
              <img
                src="/marketing_4.png"
                alt="Land Transport"
                className="w-full h-[260px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C2B59]/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 start-5 end-5">
                <span className="text-white font-bold text-[15px] drop-shadow-lg">{t.services.items[1]?.title}</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {t.services.items.map((item, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="group bg-white rounded-2xl p-7 h-full border border-gray-100 hover:border-transparent hover:shadow-[0_8px_40px_rgba(28,43,89,0.08)] transition-all duration-300">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-[#1C2B59]/[0.04] group-hover:bg-[#1C2B59] flex items-center justify-center mb-6 transition-all duration-300">
                  <svg className="w-5 h-5 text-[#1C2B59] group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    {(iconPaths[item.icon] || iconPaths.Package).split(" M").map((d, idx) => (
                      <path key={idx} d={idx === 0 ? d : `M${d}`} />
                    ))}
                  </svg>
                </div>
                <h3 className="text-[15px] font-bold text-[#1C2B59] mb-2.5">{item.title}</h3>
                <p className="text-[13px] text-gray-400 leading-[1.8]">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Border Ports Section ────────────────────────────────────────────────
function BorderPorts({ t }) {
  const portImages = [
    ["/port_qaim.jpg", "/port_qaim_2.jpg", "/port_qaim_3.jpg"],
    ["/port_trebil.jpg", "/port_trebil_2.jpg", "/port_trebil_3.jpg"],
    ["/port_saudi.jpg", "/port_saudi_2.jpg", "/port_saudi_3.jpg"],
    ["/port_yarubiya.jpg", "/port_yarubiya_2.jpg", "/port_yarubiya_3.jpg"],
    ["/port_mundhiriya.jpg", "/port_mundhiriya_2.jpg", "/port_mundhiriya_3.jpg"],
  ];

  return (
    <section id="ports" className="py-24 sm:py-32 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <Reveal>
          <div className="text-center max-w-[600px] mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C2B59]/[0.04] mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E31E24]" />
              <span className="text-[11px] font-semibold text-[#1C2B59] uppercase tracking-wider">
                {t.ports.title}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#1C2B59] leading-[1.15]">
              {t.ports.title}
            </h2>
            <p className="mt-4 text-gray-400 text-[15px]">{t.ports.subtitle}</p>
          </div>
        </Reveal>

        {/* Ports Grid - Top row 3, Bottom row 2 centered */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {t.ports.items.slice(0, 3).map((port, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="group bg-white rounded-2xl h-full border border-gray-100 hover:border-[#1C2B59]/10 hover:shadow-[0_8px_40px_rgba(28,43,89,0.08)] transition-all duration-300 relative overflow-hidden">
                {/* Port Image */}
                <div className="relative h-[180px] overflow-hidden">
                  <ImageSlideshow images={portImages[i]} alt={port.name} interval={4000 + i * 500} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C2B59]/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 start-4 end-4 flex items-center justify-between">
                    <span className="text-white font-bold text-[15px] drop-shadow-lg">{port.name}</span>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20">
                      <FlagImg flag={port.flag} size={22} />
                      <span className="text-[10px] font-medium text-white">{port.country}</span>
                    </div>
                  </div>
                </div>
                {/* Content */}
                <div className="p-5">
                  <p className="text-[13px] text-gray-400 leading-[1.9]">{port.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-[800px] mx-auto">
          {t.ports.items.slice(3).map((port, i) => (
            <Reveal key={i + 3} delay={(i + 3) * 100}>
              <div className="group bg-white rounded-2xl h-full border border-gray-100 hover:border-[#1C2B59]/10 hover:shadow-[0_8px_40px_rgba(28,43,89,0.08)] transition-all duration-300 relative overflow-hidden">
                {/* Port Image */}
                <div className="relative h-[180px] overflow-hidden">
                  <ImageSlideshow images={portImages[i + 3]} alt={port.name} interval={4000 + (i + 3) * 500} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C2B59]/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 start-4 end-4 flex items-center justify-between">
                    <span className="text-white font-bold text-[15px] drop-shadow-lg">{port.name}</span>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20">
                      <FlagImg flag={port.flag} size={22} />
                      <span className="text-[10px] font-medium text-white">{port.country}</span>
                    </div>
                  </div>
                </div>
                {/* Content */}
                <div className="p-5">
                  <p className="text-[13px] text-gray-400 leading-[1.9]">{port.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Land Transport Section ──────────────────────────────────────────────────
function LandTransport({ t }) {
  const routeIcons = [
    // Within Iraq
    "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
    // From Syria
    "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    // From Jordan
    "M17 8l4 4m0 0l-4 4m4-4H3",
    // From Saudi Arabia
    "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  ];

  return (
    <section className="py-24 sm:py-32 bg-[#f9fafb]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <Reveal>
          <div className="text-center max-w-[650px] mx-auto mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C2B59]/[0.04] mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E31E24]" />
              <span className="text-[11px] font-semibold text-[#1C2B59] uppercase tracking-wider">
                {t.transport.title}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#1C2B59] leading-[1.15]">
              {t.transport.title}
            </h2>
            <p className="mt-4 text-gray-400 text-[15px]">{t.transport.subtitle}</p>
          </div>
        </Reveal>

        {/* Description */}
        <Reveal delay={100}>
          <p className="text-center text-gray-500 text-[15px] leading-[1.9] max-w-[700px] mx-auto mb-14">
            {t.transport.description}
          </p>
        </Reveal>

        {/* Routes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {t.transport.routes.map((route, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="group bg-white rounded-2xl p-4 sm:p-7 h-full border border-gray-100 hover:border-transparent hover:shadow-[0_8px_40px_rgba(28,43,89,0.08)] transition-all duration-300 text-center">
                {/* Flag + Icon */}
                <div className="relative w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-3 sm:mb-5">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-[#1C2B59]/[0.04] group-hover:bg-[#1C2B59] flex items-center justify-center transition-all duration-300">
                    <svg className="w-6 h-6 text-[#1C2B59] group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      {(routeIcons[i] || routeIcons[0]).split(" M").map((d, idx) => (
                        <path key={idx} d={idx === 0 ? d : `M${d}`} />
                      ))}
                    </svg>
                  </div>
                  <FlagImg flag={route.flag} size={28} className="absolute -top-1 -end-1" />
                </div>

                <h3 className="text-[14px] sm:text-[16px] font-bold text-[#1C2B59] mb-1.5 sm:mb-2.5">{route.title}</h3>
                <p className="text-[11px] sm:text-[13px] text-gray-400 leading-[1.7] sm:leading-[1.8]">{route.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Seaport Section ──────────────────────────────────────────────────
function Seaport({ t }) {
  const featureIcons = [
    // Container clearance
    "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    // Ship tracking
    "M3 17h1m16 0h1M5.6 10.6l.7.7m12.1-.7-.7.7M12 2v2m0 16v2M4.2 19.8l1.4-1.4m12.7 1.4-1.4-1.4M12 6a6 6 0 100 12 6 6 0 000-12z",
    // Loading/Unloading
    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M12 18v-6M9 15l3 3 3-3",
    // Port to door
    "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
  ];

  return (
    <section id="seaport" className="py-24 sm:py-32 bg-[#f9fafb]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <Reveal>
          <div className="text-center max-w-[600px] mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C2B59]/[0.04] mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E31E24]" />
              <span className="text-[11px] font-semibold text-[#1C2B59] uppercase tracking-wider">
                {t.seaport.title}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#1C2B59] leading-[1.15]">
              {t.seaport.title}
            </h2>
            <p className="mt-4 text-gray-400 text-[15px]">{t.seaport.subtitle}</p>
          </div>
        </Reveal>

        {/* Image + Description */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 items-center mb-10 sm:mb-16">
          <Reveal>
            <div className="relative rounded-2xl overflow-hidden shadow-[0_16px_48px_rgba(28,43,89,0.12)] h-[220px] sm:h-[320px]">
              <ImageSlideshow
                images={["/port_seaport.jpg", "/port_seaport_2.jpg", "/port_seaport_3.jpg"]}
                alt={t.seaport.title}
                interval={5000}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C2B59]/40 via-transparent to-transparent" />
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div>
              <p className="text-gray-500 text-[15px] leading-[2] mb-8">
                {t.seaport.description}
              </p>
              {/* Features grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {t.seaport.features.map((feat, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-[#1C2B59]/10 hover:shadow-[0_4px_16px_rgba(28,43,89,0.06)] transition-all duration-300">
                    <div className="w-9 h-9 rounded-xl bg-[#1C2B59]/[0.06] flex items-center justify-center mb-3">
                      <svg className="w-4 h-4 text-[#1C2B59]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        {(featureIcons[i] || featureIcons[0]).split(" M").map((d, idx) => (
                          <path key={idx} d={idx === 0 ? d : `M${d}`} />
                        ))}
                      </svg>
                    </div>
                    <h4 className="text-[13px] font-bold text-[#1C2B59] mb-1">{feat.title}</h4>
                    <p className="text-[11px] text-gray-400 leading-[1.7]">{feat.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── System Section ───────────────────────────────────────────────────
function System({ t }) {
  const featureIcons = [
    "M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z",
    "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  ];

  return (
    <section id="system" className="py-24 sm:py-32 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="bg-gradient-to-br from-[#1C2B59] to-[#0f1a3a] rounded-[20px] sm:rounded-[32px] p-6 sm:p-10 md:p-16 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 end-0 w-[400px] h-[400px] bg-[#E31E24]/[0.03] rounded-full -translate-y-1/2 translate-x-1/3 rtl:-translate-x-1/3" />
          <div className="absolute bottom-0 start-0 w-[250px] h-[250px] bg-white/[0.02] rounded-full translate-y-1/2 -translate-x-1/3 rtl:translate-x-1/3" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          <div className="relative z-10">
            {/* Header */}
            <Reveal>
              <div className="text-center max-w-[600px] mx-auto mb-14">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }}>
                  <div className="w-2 h-2 rounded-full bg-[#E31E24]" />
                  <span className="text-[12px] font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {t.system.subtitle}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black leading-[1.15]" style={{ color: '#ffffff' }}>
                  {t.system.title}
                </h2>
                <p className="mt-5 text-[15px] sm:text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{t.system.description}</p>
              </div>
            </Reveal>

            {/* System mockup image */}
            <Reveal delay={150}>
              <div className="mb-12 flex justify-center">
                <img
                  src="/system_features.png"
                  alt="System Features"
                  className="w-full max-w-[650px] h-auto rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.3)] border border-white/[0.08]"
                />
              </div>
            </Reveal>

            {/* CTA */}
            <Reveal delay={500}>
              <div className="text-center mt-12">
                <a
                  href="/merchants"
                  className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-white text-[#1C2B59] text-[14px] font-bold hover:bg-gray-50 transition-all duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
                >
                  {t.nav.merchantPortal}
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────
function Contact({ t }) {
  const phoneIcon = "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z";
  const emailIcon = "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6";
  const addressIcon = "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z";

  const renderIcon = (icon) => icon.split(" M").map((d, idx) => (
    <path key={idx} d={idx === 0 ? d : `M${d}`} />
  ));

  return (
    <section id="contact" className="py-24 sm:py-32 bg-[#f9fafb]">
      <div className="max-w-[1200px] mx-auto px-6">
        <Reveal>
          <div className="text-center max-w-[540px] mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C2B59]/[0.04] mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E31E24]" />
              <span className="text-[11px] font-semibold text-[#1C2B59] uppercase tracking-wider">
                {t.contact.title}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#1C2B59] leading-[1.15]">
              {t.contact.title}
            </h2>
            <p className="mt-3 text-gray-400 text-[15px]">{t.contact.subtitle}</p>
          </div>
        </Reveal>

        <div className="max-w-[800px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {/* Phones Card */}
          <Reveal delay={0}>
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300">
              <div className="w-11 h-11 rounded-2xl bg-[#1C2B59]/[0.04] flex items-center justify-center mx-auto mb-4">
                <svg className="w-[18px] h-[18px] text-[#1C2B59]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  {renderIcon(phoneIcon)}
                </svg>
              </div>
              <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2">{t.contact.phoneLabel}</div>
              <div className="flex flex-col gap-1.5">
                {t.contact.phones.map((phone, i) => (
                  <a key={i} href={`tel:${phone}`} dir="ltr" className="text-[14px] font-semibold text-[#1C2B59] hover:text-[#E31E24] transition-colors">{phone}</a>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Email Card */}
          <Reveal delay={100}>
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300">
              <div className="w-11 h-11 rounded-2xl bg-[#1C2B59]/[0.04] flex items-center justify-center mx-auto mb-4">
                <svg className="w-[18px] h-[18px] text-[#1C2B59]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  {renderIcon(emailIcon)}
                </svg>
              </div>
              <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1.5">{t.contact.emailLabel}</div>
              <a href={`mailto:${t.contact.email}`} dir="ltr" className="text-[14px] font-semibold text-[#1C2B59] hover:text-[#E31E24] transition-colors">{t.contact.email}</a>
            </div>
          </Reveal>

          {/* Address Card */}
          <Reveal delay={200}>
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300">
              <div className="w-11 h-11 rounded-2xl bg-[#1C2B59]/[0.04] flex items-center justify-center mx-auto mb-4">
                <svg className="w-[18px] h-[18px] text-[#1C2B59]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  {renderIcon(addressIcon)}
                </svg>
              </div>
              <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1.5">{t.contact.addressLabel}</div>
              <div className="text-[14px] font-semibold text-[#1C2B59]">{t.contact.address}</div>
            </div>
          </Reveal>
        </div>

        {/* WhatsApp Button */}
        <Reveal delay={400}>
          <div className="text-center mt-10">
            <a
              href="https://wa.me/96407811333222"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#25D366] text-white text-[15px] font-bold hover:bg-[#1fb855] transition-all duration-200 shadow-[0_8px_24px_rgba(37,211,102,0.3)] hover:shadow-[0_12px_32px_rgba(37,211,102,0.4)]"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {t.dir === 'rtl' ? 'تواصل معنا عبر واتساب' : 'Chat with us on WhatsApp'}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ t, lang }) {
  return (
    <footer className="bg-white border-t border-gray-100 py-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo_trimmed_transparent.png" alt="" className="h-7 w-auto opacity-60" />
            <span className="text-gray-400 text-[13px] font-medium">
              {lang === "ar" ? "طي الراوي" : "TAY ALRAWI"}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/merchants" className="text-gray-400 text-[12px] hover:text-[#1C2B59] transition-colors">
              {t.nav.merchantPortal}
            </a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-300 text-[11px]">{t.footer.copyright}</p>
          <p className="text-gray-200 text-[11px]">{t.footer.poweredBy}</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const [lang, setLang] = useState(() => localStorage.getItem("landing_lang") || "ar");
  const t = translations[lang];

  const switchLang = () => {
    const next = lang === "ar" ? "en" : "ar";
    setLang(next);
    localStorage.setItem("landing_lang", next);
  };

  return (
    <div dir={t.dir} lang={t.lang} className="antialiased bg-white overflow-x-hidden w-full" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap');
        html, body { scroll-behavior: smooth; margin: 0; padding: 0; overflow-x: hidden; width: 100%; }
        ::selection { background: rgba(28, 43, 89, 0.08); color: #1C2B59; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
        .animate-bounce { animation: bounce 2s infinite; }
      `}</style>
      <Navbar t={t} lang={lang} onLangSwitch={switchLang} />
      <Hero t={t} lang={lang} />
      <Stats t={t} />
      <About t={t} />
      <Services t={t} />
      <BorderPorts t={t} />
      <LandTransport t={t} />
      <Seaport t={t} />
      <System t={t} />
      <Contact t={t} />
      <Footer t={t} lang={lang} />
    </div>
  );
}
