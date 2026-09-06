import { Activity, CalendarDays, CheckCircle2, Clock, Dumbbell, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { errorMessage, gymApi } from '../services/api';
import { formatPlanName, membershipPrice, normalizeMembershipPlan } from '../services/membership';
import '../member-dashboard.css';

const DAY_MS = 86400000;

function money(value) {
  return `INR ${Number(value || 0).toLocaleString('en-IN')}`;
}

function dateLabel(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function paymentStatusValue(payment) {
  const value = String(payment?.paymentStatus || payment?.status || 'PENDING').toUpperCase();
  if (value === 'CREATED' || value === 'PROCESSING') return 'PENDING';
  if (value === 'COMPLETED' || value === 'SUCCESS') return 'PAID';
  return ['PENDING', 'PAID', 'FAILED'].includes(value) ? value : 'PENDING';
}

function StatusBadge({ status }) {
  const value = String(status || 'PENDING').toUpperCase();
  return <span className={`member-status member-status--${value.toLowerCase().replace(/\s+/g, '-')}`}>{value}</span>;
}

function EmptyState({ children }) {
  return <div className="member-empty-state">{children}</div>;
}

export default function MemberDashboard({ session, data, onPaymentSuccess, pushToast }) {
  const member = data.members?.[0] || {};
  const payments = Array.isArray(data.payments) ? data.payments : [];
  const latestPayment = useMemo(
    () => [...payments].sort((a, b) => String(b.paymentDate || '').localeCompare(String(a.paymentDate || '')))[0],
    [payments],
  );
  const plan = normalizeMembershipPlan(member.membershipType) || 'NOT ASSIGNED';
  const planLabel = formatPlanName(plan);
  const price = member.membershipPrice || membershipPrice(plan);
  const trainer = member.trainerName || '';
  const now = new Date();
  const parseDate = value => {
    if (!value) return null;
    const date = new Date(`${value}T23:59:59`);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const startDate = parseDate(member.membershipStartDate);
  const endDate = parseDate(member.membershipEndDate);
  const validDates = startDate && endDate && endDate >= startDate;
  const totalDays = validDates ? Math.max(1, Math.ceil((endDate - startDate) / DAY_MS)) : 0;
  const remainingDays = validDates ? Math.max(0, Math.ceil((endDate - now) / DAY_MS)) : null;
  const elapsedDays = validDates ? Math.max(0, Math.ceil((now - startDate) / DAY_MS)) : 0;
  const progress = validDates ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100))) : 0;
  const membershipStatus = !endDate
    ? 'NOT SET'
    : endDate < now
      ? 'EXPIRED'
      : remainingDays <= 30
        ? 'EXPIRING SOON'
        : 'ACTIVE';
  const paymentStatus = paymentStatusValue(latestPayment);
  const greetingHour = now.getHours();
  const greeting = greetingHour < 12 ? 'Morning' : greetingHour < 17 ? 'Afternoon' : 'Evening';
  const motivation = greeting === 'Morning'
    ? 'Start steady. Small wins set the tone for the day.'
    : greeting === 'Afternoon'
      ? 'Consistency is what turns goals into results.'
      : 'Keep showing up. You are doing great.';
  const memberName = member.name || session.displayName || 'Member';
  const firstName = String(memberName).trim().split(/\s+/)[0];
  const dueDate = latestPayment?.dueDate || latestPayment?.paymentDueDate || member.membershipEndDate;
  const activity = [];
  if (member.membershipStartDate) {
    activity.push({
      label: 'Membership started',
      detail: `${planLabel} membership · ${dateLabel(member.membershipStartDate)}`,
      Icon: CalendarDays,
    });
  }
  if (paymentStatus === 'PAID') {
    activity.push({
      label: 'Payment completed',
      detail: `${money(latestPayment?.amount || price)} · ${dateLabel(latestPayment?.paymentDate) || 'Date unavailable'}`,
      Icon: CheckCircle2,
    });
  }
  if (trainer) activity.push({ label: 'Trainer assigned', detail: trainer, Icon: Dumbbell });

  const [processing, setProcessing] = useState(false);
  const startPayment = async () => {
    if (!price) {
      pushToast('Select a valid membership plan before payment.', 'error');
      return;
    }
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!key) {
      pushToast('Razorpay is not configured. Add VITE_RAZORPAY_KEY_ID to the frontend environment file.', 'error');
      return;
    }
    setProcessing(true);
    pushToast('Processing your payment...', 'info');
    try {
      const orderResponse = await gymApi.createRazorpayOrder({ amount: price, memberId: Number(member.id) });
      const order = orderResponse.data;
      if (!order?.orderId) throw new Error('Unable to create Razorpay order.');
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
      const checkout = new window.Razorpay({
        key: order.keyId || key,
        order_id: order.orderId,
        amount: order.amount || price * 100,
        currency: order.currency || 'INR',
        name: 'FitLife Gym',
        description: `${plan} Membership`,
        prefill: { name: memberName, email: session.email || '' },
        notes: { memberId: String(member.id || '') },
        theme: { color: '#173a2e' },
        handler: async response => {
          try {
            const verified = await gymApi.verifyRazorpayPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            const successfulPayment = {
              ...verified.data,
              paymentId: verified.data?.paymentId || response.razorpay_payment_id,
              razorpayPaymentId: response.razorpay_payment_id,
              amount: price,
              paymentDate: new Date().toISOString().slice(0, 10),
              membershipType: plan,
              paymentStatus: 'PAID',
              status: 'PAID',
            };
            onPaymentSuccess?.(successfulPayment);
            pushToast('Payment successful. Your payment history has been refreshed.', 'success');
          } catch (error) {
            pushToast(errorMessage(error), 'error');
          } finally {
            setProcessing(false);
          }
        },
      });
      checkout.on('payment.failed', async response => {
        setProcessing(false);
        pushToast(response.error?.description || 'Payment failed. Please try again.', 'error');
        try {
          await gymApi.markRazorpayPaymentFailed({
            orderId: response.error?.metadata?.order_id || order.orderId,
          });
        } catch {
          // The payment failure has already been shown to the member.
        }
      });
      checkout.open();
    } catch (error) {
      setProcessing(false);
      pushToast(errorMessage(error), 'error');
    }
  };

  return (
    <div className="dash-body member-dashboard member-dashboard--redesigned">
      <header className="member-dashboard-heading">
        <div>
          <span className="eyebrow">MEMBER PORTAL / MY PROFILE</span>
          <h1>Good {greeting}, <span>{firstName}</span></h1>
          <p>{motivation}</p>
        </div>
        <span className="member-profile-avatar">{String(memberName).charAt(0).toUpperCase()}</span>
      </header>

      <section className="member-overview-panel">
        <div className="member-overview-top">
          <div>
            <span className="eyebrow">MEMBERSHIP OVERVIEW</span>
        <h2>{planLabel} Membership</h2>
            <p>{validDates ? `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} remaining` : 'Dates are not available yet'}</p>
          </div>
          <StatusBadge status={membershipStatus} />
        </div>
        <div className="member-overview-grid">
          <div><small>Membership fee</small><strong>{price ? money(price) : 'Not available'}</strong></div>
          <div><small>Started</small><strong>{dateLabel(member.membershipStartDate) || 'Not available'}</strong></div>
          <div><small>Expires</small><strong>{dateLabel(member.membershipEndDate) || 'Not available'}</strong></div>
          <div><small>Days remaining</small><strong>{remainingDays === null ? '—' : remainingDays}</strong></div>
        </div>
        <div className="member-progress-block">
          <div><span>Membership progress</span><b>{validDates ? `${progress}%` : 'Not available'}</b></div>
          <div className="member-progress-track"><i style={{ width: `${validDates ? progress : 0}%` }} /></div>
        </div>
      </section>

      <section className="member-section">
        <div className="member-section-heading"><span className="eyebrow">QUICK FITNESS STATS</span><h2>Your activity at a glance</h2></div>
        <div className="member-stat-grid">
          {[
            ['Workout streak', 'No activity data available yet', Clock],
            ['Total workouts', 'Start your fitness journey', Dumbbell],
            ['Gym attendance', 'Attendance tracking will appear here', CalendarDays],
          ].map(([label, message, Icon]) => (
            <article className="member-stat-empty" key={label}>
              <Icon size={17} />
              <div><small>{label}</small><strong>—</strong><span>{message}</span></div>
            </article>
          ))}
        </div>
      </section>

      <div className="member-dashboard-columns">
        <section className="member-dashboard-panel">
          <div className="member-panel-heading"><div><span className="eyebrow">TODAY</span><h2>Today's activity</h2></div><Dumbbell size={18} /></div>
          <EmptyState>No workout has been scheduled for today.</EmptyState>
        </section>

        <section className="member-dashboard-panel">
          <div className="member-panel-heading"><div><span className="eyebrow">COACHING</span><h2>Your trainer</h2></div><UserRound size={18} /></div>
          {trainer ? <div className="member-trainer-card"><span className="member-trainer-avatar">{trainer.charAt(0).toUpperCase()}</span><div><strong>{trainer}</strong><span>Assigned trainer</span></div></div> : <EmptyState>No trainer has been assigned yet.</EmptyState>}
        </section>
      </div>

      <section className="member-dashboard-panel member-attendance-panel">
        <div className="member-panel-heading"><div><span className="eyebrow">ATTENDANCE</span><h2>Attendance & activity</h2></div><CalendarDays size={18} /></div>
        <EmptyState>Attendance tracking will appear here once available.</EmptyState>
      </section>

      <section className="member-dashboard-panel member-payment-panel">
        <div className="member-panel-heading">
          <div><span className="eyebrow">FINANCE</span><h2>Payment overview</h2></div>
          {paymentStatus !== 'PAID' && <button className="primary-btn member-pay-button" type="button" onClick={startPayment} disabled={processing}>{processing ? 'Processing...' : 'Pay now'}</button>}
        </div>
        <div className="member-payment-grid">
          <div><small>Membership fee</small><strong>{latestPayment?.amount || price ? money(latestPayment?.amount || price) : 'Not available'}</strong></div>
          <div><small>Status</small><StatusBadge status={paymentStatus} /></div>
          <div><small>Payment date</small><strong>{dateLabel(latestPayment?.paymentDate) || 'Not paid yet'}</strong></div>
          <div><small>Due date</small><strong>{dateLabel(dueDate) || 'Not available'}</strong></div>
        </div>
      </section>

      <section className="member-dashboard-panel member-activity-panel">
        <div className="member-panel-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Your latest updates</h2></div><Activity size={18} /></div>
        {activity.length ? <div className="member-timeline">{activity.map(({ label, detail, Icon }) => <div className="member-timeline-item" key={label}><span><Icon size={15} /></span><div><strong>{label}</strong><small>{detail}</small></div></div>)}</div> : <EmptyState>No recent activity available yet.</EmptyState>}
      </section>
    </div>
  );
}
