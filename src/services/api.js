import axios from 'axios';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});
api.interceptors.request.use((config) => { const raw=localStorage.getItem('fitlife_session'); if(raw){ try{const s=JSON.parse(raw); if(s.token) config.headers.Authorization=`Bearer ${s.token}`;}catch{} } return config; });
export const authApi={ login:(email,password)=>api.post('/user/login',{email,password}), register:(data)=>api.post('/user/register',data), logout:()=>api.post('/user/logout') };
export const gymApi={
 users:()=>api.get('/user'), updateUserDisplayName:(id,displayName)=>api.put(`/user/${id}/display-name`,{displayName}), deleteUser:(id)=>api.delete(`/user/${id}`),
 members:()=>api.get('/members'), myMembers:()=>api.get('/members/my-members'), createMember:(data)=>api.post('/members',data), updateMember:(id,data)=>api.put(`/members/${id}`,data), deleteMember:(id)=>api.delete(`/members/${id}`), memberProfile:()=>api.get('/members/my-profile'),
 trainers:()=>api.get('/trainers'), trainer:(id)=>api.get(`/trainers/${id}`), createTrainer:(data)=>api.post('/trainers',data), updateTrainer:(id,data)=>api.put(`/trainers/${id}`,data), deleteTrainer:(id)=>api.delete(`/trainers/${id}`), trainerProfile:()=>api.get('/trainers/my-profile'), updateMyTrainerProfile:(data)=>api.put('/trainers/my-profile',data),
  payments:()=>api.get('/payments'), myPayments:()=>api.get('/payments/my-payment'), createPayment:(data)=>api.post('/payments',data), deletePayment:(id)=>api.delete(`/payments/${id}`), createRazorpayOrder:(data)=>api.post('/payments/razorpay/order',data), verifyRazorpayPayment:(data)=>api.post('/payments/razorpay/verify',data), markRazorpayPaymentFailed:(data)=>api.post('/payments/razorpay/failed',data), dashboard:()=>api.get('/dashboard')
};
export function errorMessage(error){
  if (!error?.response) return 'Could not connect to the server. Make sure the Spring Boot backend is running on port 8080.';
  return error.response.data?.message
    || (typeof error.response.data === 'string' && error.response.data.trim() ? error.response.data : null)
    || (error.response.status===400 ? 'Invalid request. Please check your email and password.'
    : error.response.status===401 ? 'Invalid credentials or session expired.'
    : error.response.status===403 ? 'Access denied.'
    : error.response.status===404 ? 'Resource not found.'
    : error.response.status>=500 ? 'Server error. Please try again.'
    : `Request failed (${error.response.status}).`);
}
