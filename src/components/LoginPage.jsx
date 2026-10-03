import { ArrowLeft, ArrowUpRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';

export default function LoginPage({ onBack, onNotice, Brand }) {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    try {
      await login(email.trim(), password);
    } catch (error) {
      onNotice(errorMessage(error), 'error');
    }
  }

  return (
    <main className="signin-page">
      <section className="signin-story" aria-label="Welcome to FitLife">
        <img src="/images/fitlife-gym.jpg" alt="" className="signin-background" />
        <Brand light />
        <div className="signin-story-copy"><span className="site-kicker">YOUR GOALS. ALL IN ONE PLACE.</span><h1>Good to have<br />you <span>back.</span></h1><p>A little focus. A little consistency.<br />A stronger tomorrow starts here.</p><div className="signin-story-note"><Check size={18} /> Your next chapter is waiting.</div></div>
        <span className="signin-story-footer">FITLIFE / BUILT FOR STRONGER LIVES</span>
      </section>
      <section className="signin-panel" aria-labelledby="signin-title">
        <button className="signin-back" onClick={onBack}><ArrowLeft size={17} /> Back to website</button>
        <div className="signin-box">
          <div className="signin-mobile-brand"><Brand /></div>
          <span className="signin-lock"><LockKeyhole size={25} /></span>
          <span className="site-kicker">YOUR FITLIFE WORKSPACE</span>
          <h2 id="signin-title">Welcome back.</h2>
          <p>Sign in to pick up where you left off.</p>
          <form onSubmit={submit} aria-busy={loading}>
            <label htmlFor="signin-email">Email address</label>
            <input id="signin-email" name="email" type="email" autoComplete="username" autoFocus value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required />
            <label htmlFor="signin-password">Password</label>
            <div className="signin-password"><input id="signin-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
            <button type="submit" className="site-button site-button-dark signin-submit" disabled={loading}>{loading ? <><span className="spinner" /> Signing in…</> : <>Sign in to FitLife <ArrowUpRight size={18} /></>}</button>
          </form>
          <div className="signin-help">Need a hand? <button onClick={() => onNotice('Please contact your gym administrator for help with your account.', 'info')}>Contact your gym</button></div>
          <div className="signin-access-note"><ShieldCheck size={18} /><p>For owners, trainers, and members.<br />Use the account provided by your gym administrator.</p></div>
        </div>
        <span className="signin-copyright">© {new Date().getFullYear()} FitLife. Keep moving forward.</span>
      </section>
    </main>
  );
}
