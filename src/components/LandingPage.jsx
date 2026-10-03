import { ArrowDown, ArrowRight, ArrowUpRight, Check, Dumbbell, Menu, MoveUpRight, ShieldCheck, Sparkles, Target, TrendingUp, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const navigation = [['#about', 'The experience'], ['#features', 'Our approach'], ['#plans', 'Membership']];

export default function LandingPage({ onLogin, Brand, MembershipPlans, ExperienceSwitcher }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);

  useEffect(() => {
    const onEscape = event => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [menuOpen]);

  return (
    <div className="fitlife-site" id="top">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="site-nav page-width">
          <a className="brand-link" href="#top" aria-label="FitLife home"><Brand /></a>
          <nav className="desktop-navigation" aria-label="Main navigation">
            {navigation.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <div className="nav-actions">
            <button className="site-button site-button-dark nav-signin" onClick={onLogin}>Sign in <ArrowUpRight size={16} /></button>
            <button ref={menuButton} className="mobile-menu-button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        <nav id="mobile-navigation" className="mobile-navigation" aria-label="Mobile navigation" hidden={!menuOpen}>
          {navigation.map(([href, label]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}<ArrowUpRight size={16} /></a>)}
        </nav>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="club-hero page-width" aria-labelledby="hero-title">
          <div className="club-hero-copy">
            <span className="site-kicker"><span className="kicker-dot" /> A LITTLE STRONGER. EVERY DAY.</span>
            <h1 id="hero-title">Your best self.<br /><span>Built here.</span><Sparkles className="hero-sparkle" aria-hidden="true" /></h1>
            <p>More than a place to work out. A place to find your rhythm, build your confidence, and keep moving forward.</p>
            <div className="club-hero-actions">
              <a className="site-button site-button-dark" href="#plans">Find your membership <ArrowUpRight size={18} /></a>
              <a className="site-text-link" href="#about">Explore FitLife <ArrowRight size={17} /></a>
            </div>
            <div className="hero-reassurance">
              <span className="reassurance-icon"><Users size={23} /></span>
              <div><strong>Every goal. Every starting point.</strong><span>There’s a place for you at FitLife.</span></div>
            </div>
            <a className="hero-discover" href="#features"><span><ArrowDown size={15} /></span> GOOD ENERGY STARTS HERE</a>
          </div>
          <div className="club-hero-visual">
            <div className="hero-photo-frame">
              <img className="hero-photo" src="/images/fitlife-gym.jpg" alt="A bright training space with free weights and strength equipment" fetchPriority="high" width="1200" height="800" />
              <span className="photo-label"><span /> ROOM TO GROW</span>
              <div className="photo-caption"><span>SHOW UP FOR YOU.</span><p>Make your<br />next move count.</p></div>
              <a className="photo-explore" href="#about" aria-label="Explore the FitLife experience"><ArrowUpRight size={27} /></a>
            </div>
            <div className="hero-intent-card"><span className="intent-icon"><TrendingUp size={23} /></span><div><small>THE ONLY DIRECTION</small><strong>Forward, together.</strong></div><span className="intent-bars" aria-hidden="true"><i /><i /><i /><i /><i /></span></div>
            <div className="hero-roundel" aria-hidden="true"><Dumbbell size={29} /><span>FIND YOUR<br />STRONG</span></div>
          </div>
        </section>

        <div className="club-values" aria-label="The FitLife philosophy">
          <div className="page-width">{[[Dumbbell, 'Train with purpose'], [Users, 'Grow together'], [Target, 'Build better habits'], [TrendingUp, 'Celebrate progress']].map(([Icon, label]) => <span key={label}><Icon size={20} />{label}<span className="value-star" aria-hidden="true">✳</span></span>)}</div>
        </div>

        <section id="about" className="club-about page-width" aria-labelledby="about-title">
          <div className="about-photo-frame">
            <img src="/images/fitlife-training.jpg" alt="An athlete preparing for a strength training session" loading="lazy" width="900" height="600" />
            <div className="about-photo-note"><Dumbbell size={21} /><span>Less pressure.<br /><b>More possibility.</b></span></div>
          </div>
          <div className="about-copy">
            <span className="site-kicker">01 / THE FITLIFE EXPERIENCE</span>
            <h2>Not just a gym.<br /><span>Your kind of place.</span></h2>
            <p>Some days you chase a personal best. Other days, showing up is the win. Wherever you are in your journey, build a routine that feels right for you.</p>
            <ul className="club-checklist">
              <li><Check size={16} /> Space to train at your own pace</li>
              <li><Check size={16} /> Guidance to help you move with confidence</li>
              <li><Check size={16} /> Membership options that fit real life</li>
            </ul>
            <a className="site-text-link" href="#features">Meet your next chapter <ArrowUpRight size={18} /></a>
          </div>
        </section>

        <section id="features" className="club-method" aria-labelledby="method-title">
          <div className="page-width">
            <div className="club-section-heading"><div><span className="site-kicker">02 / A LITTLE STRUCTURE. A LOT OF POTENTIAL.</span><h2 id="method-title">Good habits.<br /><span>Great things ahead.</span></h2></div><p>A stronger routine starts with the right support. Discover the details that keep you moving.</p></div>
            <ExperienceSwitcher />
          </div>
        </section>

        <MembershipPlans onChoose={onLogin} />

        <section id="contact" className="club-cta page-width" aria-labelledby="cta-title">
          <div className="club-cta-inner">
            <div><span className="site-kicker">YOUR NEXT CHAPTER STARTS WITH YOU</span><h2 id="cta-title">Make room for<br /><span>a stronger you.</span></h2><p>Bring your goals. Find your people. Build your rhythm.</p></div>
            <div className="club-cta-actions"><a className="site-button site-button-lime" href="#plans">Explore memberships <ArrowUpRight size={19} /></a><button className="cta-signin" onClick={onLogin}>Already part of FitLife? Sign in <ArrowRight size={16} /></button></div>
            <MoveUpRight className="cta-background-arrow" aria-hidden="true" />
          </div>
        </section>
      </main>

      <footer className="club-footer page-width">
        <div className="footer-main"><a className="brand-link" href="#top" aria-label="FitLife home"><Brand /></a><p>A stronger life starts with a little movement.</p><a className="back-to-top" href="#top">Back to top <ArrowUpRight size={16} /></a></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} FitLife. Built for stronger lives.</span><nav aria-label="Footer navigation">{navigation.map(([href, label]) => <a href={href} key={href}>{label}</a>)}</nav><span className="footer-signoff"><ShieldCheck size={14} /> Your goals. Your pace.</span></div>
      </footer>
    </div>
  );
}
