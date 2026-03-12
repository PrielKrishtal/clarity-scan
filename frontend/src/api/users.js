import client from './client';

export const getMe = () => client.get('/auth/me');

export const updateBudget = (amount) =>
    client.put('/auth/me', { monthly_budget: amount });