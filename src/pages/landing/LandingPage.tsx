import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  Shield,
  Lock,
  Eye,
  Zap,
  Users,
  CheckCircle,
  Key,
  Wallet,
  Server,
  Globe,
  FileText,
  Github,
  Twitter,
  Mail,
  ArrowRight,
  Cpu,
  Smartphone,
  Cloud,
} from "lucide-react";
import "./LandingPage.css";

// Animation variants for cinematic feel
const fadeInUp = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

// Animated card component with hover effects
const AnimatedCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = "", delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className={`landing-card ${className}`}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      whileHover={{
        y: -12,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" },
      }}
    >
      {children}
    </motion.div>
  );
};

// Cursor proximity glow component
const CursorGlow: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return <motion.div className="proximity-glow" style={{ x, y }} />;
};

// Particles component
const Particles: React.FC = () => (
  <div className="particle-field">
    {Array.from({ length: 50 }, (_, index) => (
      <div key={`particle-${index}`} className="particle" />
    ))}
  </div>
);

// Data pulse waves
const DataPulses: React.FC = () => (
  <>
    <div className="data-pulse" />
    <div className="data-pulse" />
    <div className="data-pulse" />
  </>
);

// Futuristic HUD Overlay
const HeroHUD: React.FC = () => (
  <div className="hero-hud-overlay">
    {/* Corner Brackets */}
    <div className="hud-corner hud-top-left" />
    <div className="hud-corner hud-top-right" />
    <div className="hud-corner hud-bottom-left" />
    <div className="hud-corner hud-bottom-right" />

    {/* Vertical Data Bars */}
    <div className="hud-v-bar hud-left-bar" />
    <div className="hud-v-bar hud-right-bar" />

    {/* Scanning Line */}
    <div className="hud-scanline" />
  </div>
);

// Animated section wrapper
const AnimatedSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ children, className = "", id }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      className={`landing-section ${className}`}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.section>
  );
};

// HeroCore component removed based on user feedback to prevent visual clutter

// Mouse-reactive parallax hook
const useMouseParallax = (intensity: number = 20) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 50, stiffness: 100 };
  const x = useSpring(
    useTransform(mouseX, [0, 1], [-intensity, intensity]),
    springConfig,
  );
  const y = useSpring(
    useTransform(mouseY, [0, 1], [-intensity, intensity]),
    springConfig,
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return { x, y };
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroRef = useRef(null);
  const { x: parallaxX, y: parallaxY } = useMouseParallax(25);

  // Parallax effect for hero background scroll
  const heroScrollY = useTransform(scrollYProgress, [0, 0.3], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.3]);

  return (
    <div className="landing-page-container min-h-screen text-white overflow-x-hidden">
      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      {/* Cursor proximity glow */}
      <CursorGlow />

      {/* ========================================
          Hero Section - Premium Edition
          ======================================== */}
      <section className="hero-section" ref={heroRef}>
        {/* Layer 1: Deep Background & Grid (Slow Parallax) */}
        <motion.div
          className="parallax-layer parallax-layer-1"
          style={{
            x: useTransform(parallaxX, (x) => x * 0.5),
            y: useTransform(parallaxY, (y) => y * 0.5),
          }}
        >
          <motion.div
            className="cyber-grid-bg"
            style={{ y: heroScrollY, opacity: heroOpacity }}
          >
            <div className="noise-overlay" />
          </motion.div>
        </motion.div>

        {/* Layer 2: Floating Particles (Medium Parallax) */}
        <motion.div
          className="parallax-layer parallax-layer-2"
          style={{ x: parallaxX, y: parallaxY }}
        >
          <Particles />
          <DataPulses />
        </motion.div>

        {/* Layer 3: HUD Overlay - Static relative to viewport or parallaxed slightly */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <HeroHUD />
        </div>

        {/* Layer 4: Central Visual Anchor - Removed to prevent overlap */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ y: heroScrollY }}
        >
          {/* Visuals removed for clarity */}
        </motion.div>

        {/* Hero Content - Z-Index above visuals */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Headline with cinematic reveal */}
          <div className="hero-headline mb-8">
            <motion.div className="hero-text-line">
              <motion.span
                className="hero-word block"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
              >
                Privacy you
              </motion.span>
            </motion.div>

            <motion.div className="hero-text-line">
              <motion.span
                className="hero-word block"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.7 }}
              >
                <span className="hero-flicker">can't trace.</span>
              </motion.span>
            </motion.div>

            <motion.div className="hero-text-line mt-2">
              <motion.span
                className="hero-word block text-[#FDDA24]"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 1.2 }}
              >
                <motion.span
                  animate={{
                    textShadow: [
                      "0 0 20px rgba(253,218,36,0.5)",
                      "0 0 40px rgba(253,218,36,0.3)",
                      "0 0 20px rgba(253,218,36,0.5)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Powered by Zero-Knowledge.
                </motion.span>
              </motion.span>
            </motion.div>
          </div>

          {/* Subheadline - Delayed fade in */}
          <motion.p
            className="hero-subheadline text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.8, ease: "easeOut" }}
          >
            Opaque Wallet brings{" "}
            <span className="text-white font-medium">
              shielded transactions
            </span>{" "}
            to Stellar — fast, compliant, and mathematically secure.
          </motion.p>

          {/* CTAs - Powered feel */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.2, ease: "easeOut" }}
          >
            <button
              className="hero-cta-primary"
              onClick={() => {
                void navigate("/wallet");
              }}
            >
              Launch Testnet
              <ArrowRight size={20} />
            </button>
            <button className="hero-cta-secondary">
              <FileText size={18} />
              Read Whitepaper
            </button>
          </motion.div>

          {/* Stats badges - Subtle fade */}
          <motion.div
            className="mt-20 flex flex-wrap justify-center gap-10 text-sm text-gray-500 font-medium tracking-wide uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 2.8 }}
          >
            {[
              { icon: Shield, text: "ZK-SNARKs" },
              { icon: Zap, text: "Wait-Free" },
              { icon: CheckCircle, text: "Audit-Ready" },
            ].map((item) => (
              <motion.div
                key={item.text}
                className="flex items-center gap-3 transition-colors hover:text-[#FDDA24]"
              >
                <item.icon size={18} className="text-[#FDDA24]" />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================
          Problem Section
          ======================================== */}
      <AnimatedSection className="landing-section-alt">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            className="section-title"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            The Privacy Gap in Public Blockchains
          </motion.h2>
          <motion.p
            className="section-subtitle"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Current blockchain infrastructure exposes users to surveillance and
            financial profiling.
          </motion.p>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Eye,
                title: "Exposed Balances",
                desc: "Public transaction histories reveal your complete financial activity to anyone who looks.",
              },
              {
                icon: Lock,
                title: "No Private-by-Default",
                desc: "Most wallets lack fundamental privacy features, leaving users vulnerable by design.",
              },
              {
                icon: Users,
                title: "False Dichotomy",
                desc: "Compliance and privacy are wrongly treated as opposites when they can coexist.",
              },
            ].map((item, index) => (
              <AnimatedCard key={item.title} delay={index * 0.1}>
                <motion.div
                  className="feature-icon"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <item.icon />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </AnimatedCard>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ========================================
          Solution Section
          ======================================== */}
      <AnimatedSection>
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            className="section-title"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Opaque <span className="text-[#FDDA24]">Protocol</span>
          </motion.h2>
          <motion.p
            className="section-subtitle"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            A new paradigm for private transactions on Stellar, powered by
            cutting-edge cryptography.
          </motion.p>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Shield,
                title: "Shielded Transactions",
                desc: "Zero-knowledge proofs hide balances and transaction history while maintaining integrity.",
              },
              {
                icon: Zap,
                title: "Stellar Native",
                desc: "Built on Stellar Protocol 25 and Soroban smart contracts for maximum performance.",
              },
              {
                icon: CheckCircle,
                title: "Compliance-Ready Privacy",
                desc: "Viewing keys, association sets, and AML-friendly design for regulatory harmony.",
              },
            ].map((item, index) => (
              <AnimatedCard key={item.title} delay={index * 0.1}>
                <motion.div
                  className="feature-icon"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  <item.icon />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </AnimatedCard>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ========================================
          Architecture Section
          ======================================== */}
      <AnimatedSection className="landing-section-alt">
        <div className="max-w-4xl mx-auto px-6">
          <motion.h2
            className="section-title"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            How <span className="text-[#FDDA24]">Opaque</span> Works
          </motion.h2>
          <motion.p
            className="section-subtitle"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            A multi-layered architecture for privacy-preserving transactions.
          </motion.p>

          <div className="architecture-flow">
            {[
              {
                icon: Wallet,
                title: "User Wallet",
                subtitle: "Secure key management",
              },
              {
                icon: Cpu,
                title: "ZK Proof Generator",
                subtitle: "Client-side proving",
              },
              {
                icon: Cloud,
                title: "Privacy Relayer",
                subtitle: "Anonymous submission",
              },
              {
                icon: Server,
                title: "Soroban Shielded Pool",
                subtitle: "On-chain verification",
              },
              {
                icon: Globe,
                title: "Stellar Network",
                subtitle: "Global settlement",
              },
            ].map((node, index) => (
              <React.Fragment key={node.title}>
                <motion.div
                  className="arch-node"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.15,
                    ease: "easeOut",
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    className="arch-node-icon"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                  >
                    <node.icon />
                  </motion.div>
                  <h4 className="text-white font-bold">{node.title}</h4>
                  <p className="text-gray-500 text-sm mt-1">{node.subtitle}</p>
                </motion.div>
                {index < 4 && (
                  <motion.div
                    className="arch-connector"
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.15 + 0.3 }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ========================================
          Core Features Grid
          ======================================== */}
      <AnimatedSection>
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            className="section-title"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Core <span className="text-[#FDDA24]">Features</span>
          </motion.h2>
          <motion.p
            className="section-subtitle"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Built for privacy, optimized for performance.
          </motion.p>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Cpu,
                title: "Client-side ZK",
                desc: "Proofs generated locally on your device for maximum security.",
              },
              {
                icon: Wallet,
                title: "Dual Balances",
                desc: "Manage shielded and public balances seamlessly in one wallet.",
              },
              {
                icon: Zap,
                title: "Gasless Transactions",
                desc: "Relayer-powered transactions without gas token requirements.",
              },
              {
                icon: Smartphone,
                title: "Mobile Optimized",
                desc: "Lightweight ZK circuits designed for mobile devices.",
              },
            ].map((item, index) => (
              <AnimatedCard key={item.title} delay={index * 0.1}>
                <motion.div
                  className="feature-icon"
                  whileHover={{ scale: 1.15, rotate: 5 }}
                >
                  <item.icon />
                </motion.div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </AnimatedCard>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ========================================
          Compliance Section
          ======================================== */}
      <AnimatedSection className="landing-section-alt">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h2
            className="section-title"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Privacy Without Breaking the{" "}
            <span className="text-[#FDDA24]">Rules</span>
          </motion.h2>
          <motion.p
            className="section-subtitle"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Opaque is designed with regulatory realities in mind, enabling
            privacy while supporting audits, AML, and Travel Rule compliance.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-12 mt-12"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { icon: Shield, text: "Viewing Keys" },
              { icon: Key, text: "Selective Disclosure" },
              { icon: CheckCircle, text: "AML Compatible" },
            ].map((item) => (
              <motion.div
                key={item.text}
                className="flex flex-col items-center gap-4"
                variants={staggerItem}
                transition={{ duration: 0.6, ease: "easeOut" }}
                whileHover={{ y: -5, scale: 1.05 }}
              >
                <motion.div
                  className="compliance-icon"
                  whileHover={{
                    boxShadow: "0 0 40px rgba(253,218,36,0.5)",
                    scale: 1.1,
                  }}
                >
                  <item.icon size={28} className="text-[#FDDA24]" />
                </motion.div>
                <span className="text-white font-medium">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ========================================
          Team Section
          ======================================== */}
      <AnimatedSection>
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            className="section-title"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Built by <span className="text-[#FDDA24]">Privacy Engineers</span>
          </motion.h2>
          <motion.p
            className="section-subtitle"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            A team passionate about cryptography and financial privacy.
          </motion.p>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { name: "Swapnil Shinde", initials: "SS" },
              { name: "Ankit Kokane", initials: "AK" },
              { name: "Prathmesh Mutkure", initials: "PM" },
              { name: "Ahad Hasan", initials: "AH" },
            ].map((member) => (
              <motion.div
                key={member.name}
                className="team-card"
                variants={fadeInScale}
                transition={{ duration: 0.7, ease: "easeOut" }}
                whileHover={{ scale: 1.08, y: -8 }}
              >
                <motion.div
                  className="team-avatar"
                  whileHover={{
                    scale: 1.1,
                    boxShadow: "0 0 40px rgba(253,218,36,0.5)",
                  }}
                >
                  {member.initials}
                </motion.div>
                <h3 className="text-white font-bold text-lg">{member.name}</h3>
                <p className="text-gray-500 text-sm mt-1">Core Contributor</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ========================================
          Final CTA Section
          ======================================== */}
      <AnimatedSection className="cta-section">
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Enter the{" "}
            <motion.span
              className="text-[#FDDA24]"
              animate={{
                textShadow: [
                  "0 0 20px rgba(253,218,36,0.5)",
                  "0 0 40px rgba(253,218,36,0.8)",
                  "0 0 20px rgba(253,218,36,0.5)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Shielded
            </motion.span>{" "}
            Future
          </motion.h2>
          <motion.p
            className="text-gray-400 text-lg mb-10"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Be among the first to experience private transactions on Stellar.
          </motion.p>
          <motion.button
            className="landing-btn-primary landing-btn-cta"
            onClick={() => {
              void navigate("/wallet");
            }}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            whileHover={{
              scale: 1.08,
              boxShadow:
                "0 0 60px rgba(253,218,36,0.6), 0 0 100px rgba(253,218,36,0.3)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            Join the Testnet
            <ArrowRight size={18} />
          </motion.button>
        </div>
      </AnimatedSection>

      {/* ========================================
          Footer
          ======================================== */}
      <footer className="landing-footer">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="flex flex-col md:flex-row justify-between items-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FDDA24] to-yellow-300 flex items-center justify-center"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(253,218,36,0.3)",
                    "0 0 30px rgba(253,218,36,0.5)",
                    "0 0 20px rgba(253,218,36,0.3)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-black font-bold text-lg">◉</span>
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">OPAQUE</h3>
                <p className="text-xs text-gray-500">Privacy Protocol</p>
              </div>
            </motion.div>

            {/* Links */}
            <nav className="flex flex-wrap justify-center gap-8">
              {[
                { icon: FileText, text: "Docs", href: "#" },
                {
                  icon: Github,
                  text: "GitHub",
                  href: "https://github.com/OpaqueProtocol",
                },
                { icon: Twitter, text: "Twitter", href: "#" },
                { icon: Mail, text: "Contact", href: "#" },
              ].map((link) => (
                <motion.a
                  key={link.text}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    link.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="footer-link flex items-center gap-2"
                  whileHover={{ scale: 1.05, color: "#FDDA24" }}
                >
                  <link.icon size={16} />
                  {link.text}
                </motion.a>
              ))}
            </nav>
          </motion.div>

          <motion.div
            className="mt-12 pt-8 border-t border-gray-800 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} Opaque Protocol. Licensed under{" "}
              <a
                href="http://www.apache.org/licenses/LICENSE-2.0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FDDA24] hover:underline"
              >
                Apache License 2.0
              </a>
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
