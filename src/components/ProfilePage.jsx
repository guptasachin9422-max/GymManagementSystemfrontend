import { Camera, CheckCircle2, ImagePlus, Trash2, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { errorMessage, gymApi } from '../services/api';

const emptyProfile = {
  username: '',
  email: '',
  role: '',
  displayName: '',
  fullName: '',
  phone: '',
  age: '',
  specialty: '',
  membershipType: '',
  membershipStartDate: '',
  membershipEndDate: '',
  profileImageUrl: ''
};

export default function ProfilePage({ session, onSessionUpdate, pushToast }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const fileInput = useRef(null);

  const applyProfile = next => {
    const value = { ...emptyProfile, ...(next || {}) };
    setProfile(value);
    onSessionUpdate?.({
      displayName: value.fullName || value.displayName || session.displayName,
      profileImageUrl: value.profileImageUrl || ''
    });
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    gymApi.profile()
      .then(response => {
        if (!active) return;
        applyProfile(response.data);
      })
      .catch(error => {
        if (active) pushToast(errorMessage(error), 'error');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const openEdit = () => {
    setForm({ ...profile });
    setEditing(true);
  };

  const saveProfile = async event => {
    event.preventDefault();
    const fullName = String(form.fullName || '').trim();
    const displayName = String(form.displayName || '').trim();
    const phone = String(form.phone || '').trim();
    const age = String(form.age || '').trim();
    if (!fullName && !displayName) {
      pushToast('Please enter your name.', 'error');
      return;
    }
    if (phone && !/^\+?[0-9\s()\-]{7,20}$/.test(phone)) {
      pushToast('Please enter a valid phone number.', 'error');
      return;
    }
    if (age && (!/^\d+$/.test(age) || Number(age) < 1 || Number(age) > 120)) {
      pushToast('Age must be between 1 and 120.', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await gymApi.updateProfile({
        fullName: fullName || null,
        displayName: displayName || null,
        phone: phone || null,
        age: age ? Number(age) : null,
        specialty: String(form.specialty || '').trim() || null
      });
      applyProfile(response.data);
      setEditing(false);
      pushToast('Profile updated successfully.', 'success');
    } catch (error) {
      pushToast(errorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      pushToast('Only JPG, JPEG, PNG and WEBP images are allowed.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      pushToast('Profile photo must be 5 MB or smaller.', 'error');
      return;
    }
    setPhotoBusy(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const response = await gymApi.uploadProfilePhoto(data);
      applyProfile(response.data);
      pushToast('Profile photo updated successfully.', 'success');
    } catch (error) {
      pushToast(errorMessage(error), 'error');
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    try {
      const response = await gymApi.removeProfilePhoto();
      applyProfile(response.data);
      pushToast('Profile photo removed.', 'success');
    } catch (error) {
      pushToast(errorMessage(error), 'error');
    } finally {
      setPhotoBusy(false);
    }
  };

  const value = item => item === null || item === undefined || String(item).trim() === ''
    ? 'Not provided'
    : item;
  const name = profile.fullName || profile.displayName || session.displayName || 'User';
  const initial = String(name).trim().charAt(0).toUpperCase() || 'U';

  if (loading) {
    return <div className="loading-state"><span className="spinner"/>Loading your profile...</div>;
  }

  return <div className="dash-body profile-page">
    <div className="page-heading">
      <div>
        <span className="eyebrow">ACCOUNT / PROFILE</span>
        <h2>My Profile</h2>
        <p>View and manage your personal FitLife information.</p>
      </div>
      <button type="button" className="primary-btn" onClick={openEdit}>Edit Profile</button>
    </div>

    <section className="profile-box profile-management-card">
      <div className="profile-management-top">
        <div className="profile-photo-wrap">
          {profile.profileImageUrl
            ? <img src={profile.profileImageUrl} alt={`${name}'s profile`} className="profile-photo"/>
            : <span className="profile-photo profile-photo-placeholder"><UserRound size={38}/>{initial}</span>}
          <button type="button" className="profile-photo-button" disabled={photoBusy}
                  onClick={() => fileInput.current?.click()} title="Change photo">
            <Camera size={15}/>
          </button>
        </div>
        <div className="profile-management-heading">
          <span className="eyebrow">{value(profile.role)}</span>
          <h3>{name}</h3>
          <p>{value(profile.email)}</p>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp"
                 onChange={uploadPhoto} hidden/>
          <div className="profile-photo-actions">
            <button type="button" className="outline-btn" disabled={photoBusy}
                    onClick={() => fileInput.current?.click()}>
              <ImagePlus size={15}/> {photoBusy ? 'Uploading...' : profile.profileImageUrl ? 'Change Photo' : 'Upload Photo'}
            </button>
            {profile.profileImageUrl && <button type="button" className="text-danger-btn" disabled={photoBusy} onClick={removePhoto}>
              <Trash2 size={14}/> Remove
            </button>}
          </div>
        </div>
      </div>

      <div className="profile-grid profile-management-grid">
        {[
          ['Full Name', profile.fullName],
          ['Display Name', profile.displayName],
          ['Username', profile.username],
          ['Email', profile.email],
          ['Role', profile.role],
          ['Phone', profile.phone],
          ['Age', profile.age],
          ...(profile.role === 'TRAINER' ? [['Specialty', profile.specialty]] : []),
          ...(profile.role === 'MEMBER' ? [
            ['Membership Plan', profile.membershipType],
            ['Membership Ends', profile.membershipEndDate]
          ] : [])
        ].filter(([, item]) => item !== undefined).map(([label, item]) =>
          <div key={label}><small>{label}</small><b>{value(item)}</b></div>
        )}
      </div>
    </section>

    {editing && <div className="profile-edit-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">PERSONAL INFORMATION</span><h3>Edit Profile</h3></div>
        <button type="button" className="outline-btn" disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
      </div>
      <form className="modal-form" onSubmit={saveProfile}>
        <label>Full Name<input disabled={saving} value={form.fullName || ''} onChange={e => setForm({...form, fullName: e.target.value})}/></label>
        <label>Display Name<input disabled={saving} maxLength="120" value={form.displayName || ''} onChange={e => setForm({...form, displayName: e.target.value})}/></label>
        <label>Email<input readOnly className="readonly-field" value={profile.email || ''}/></label>
        <label>Username<input readOnly className="readonly-field" value={profile.username || ''}/></label>
        <label>Phone<input disabled={saving} value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})}/></label>
        <label>Age<input type="number" min="1" max="120" disabled={saving} value={form.age ?? ''} onChange={e => setForm({...form, age: e.target.value})}/></label>
        {profile.role === 'TRAINER' && <label>Specialty<input disabled={saving} value={form.specialty || ''} onChange={e => setForm({...form, specialty: e.target.value})}/></label>}
        <div className="modal-actions">
          <button type="button" className="outline-btn" disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
          <button className="primary-btn" disabled={saving}>{saving ? 'Saving...' : <><CheckCircle2 size={15}/> Save changes</>}</button>
        </div>
      </form>
    </div>}
  </div>;
}
