import { useState } from 'react';
import { calculateMembershipEndDate, fallbackMembershipPlans, formatPlanName, normalizeMembershipPlan, planDetails } from '../services/membership';

export default function MembershipForm({ member, trainers, users, busy, onClose, onSave, Modal, pushToast, money }) {
  const [form, setForm] = useState({
    name: member?.name || '',
    age: member?.age || '',
    phone: member?.phone || '',
    membershipType: normalizeMembershipPlan(member?.membershipType || ''),
    membershipStartDate: member?.membershipStartDate || '',
    membershipEndDate: member?.membershipEndDate || '',
    trainerId: member?.trainerId || member?.trainer?.trainerId || '',
    userId: member?.userId || member?.user?.id || '',
  });

  const updateMembership = (field, value) => {
    setForm(current => {
      const next = { ...current, [field]: value };
      if (field === 'membershipType' || field === 'membershipStartDate') {
        next.membershipEndDate = calculateMembershipEndDate(
          field === 'membershipStartDate' ? value : current.membershipStartDate,
          field === 'membershipType' ? value : current.membershipType,
        );
      }
      return next;
    });
  };

  const submit = event => {
    event.preventDefault();
    if (!form.membershipType || !form.membershipStartDate || !form.membershipEndDate) {
      pushToast('Select a membership plan and start date.', 'error');
      return;
    }
    const payload = {
      name: form.name.trim(),
      age: Number(form.age),
      phone: form.phone.trim(),
      membershipType: normalizeMembershipPlan(form.membershipType),
      membershipStartDate: form.membershipStartDate,
      membershipEndDate: form.membershipEndDate,
    };
    if (form.trainerId) payload.trainer = { id: Number(form.trainerId) };
    if (form.userId) payload.user = { id: Number(form.userId) };
    onSave(payload);
  };

  const selectedPlan = planDetails(form.membershipType);

  return (
    <Modal title={member ? 'Edit member' : 'Add member'} onClose={onClose}>
      <form className="member-form" onSubmit={submit}>
        <label>Full name<input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <label>Age<input required type="number" min="1" max="120" value={form.age} onChange={event => setForm({ ...form, age: event.target.value })} /></label>
        <label>Phone<input required value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></label>
        <label>Membership plan
          <select required value={form.membershipType} onChange={event => updateMembership('membershipType', event.target.value)}>
            <option value="">Select membership plan</option>
            {fallbackMembershipPlans.map(plan => <option key={plan.name} value={plan.name}>{formatPlanName(plan.name)} · {plan.duration}</option>)}
          </select>
        </label>
        <div className="membership-price"><small>{selectedPlan?.duration || 'Plan duration'}</small><b>{selectedPlan ? money(selectedPlan.price) : 'Select a plan'}</b></div>
        <label>Start date<input required type="date" value={form.membershipStartDate} onChange={event => updateMembership('membershipStartDate', event.target.value)} /></label>
        <label>End date<input required type="date" value={form.membershipEndDate} readOnly /><small className="form-help">Calculated automatically from the plan and start date.</small></label>
        <label>Assigned trainer
          <select value={form.trainerId} onChange={event => setForm({ ...form, trainerId: event.target.value })}>
            <option value="">No trainer assigned</option>
            {trainers.map(trainer => <option key={trainer.trainerId || trainer.id} value={trainer.trainerId || trainer.id}>{trainer.name}{trainer.specialty ? ` - ${trainer.specialty}` : ''}</option>)}
          </select>
        </label>
        <label>User account
          <select value={form.userId} onChange={event => setForm({ ...form, userId: event.target.value })}>
            <option value="">No linked account</option>
            {users.filter(user => !user.role || String(user.role).toUpperCase() === 'MEMBER').map(user => <option key={user.id} value={user.id}>{user.displayName || user.username || 'Unnamed'} - {user.email}</option>)}
          </select>
        </label>
        <div className="modal-actions">
          <button type="button" className="outline-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" disabled={busy}>{busy ? 'Saving...' : 'Save member'}</button>
        </div>
      </form>
    </Modal>
  );
}
