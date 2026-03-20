import client from './client';

export const getReceipts = async (skip = 0, limit = 20) => {
    const response = await client.get('/receipts/', {
        params: { skip, limit }
    });
    return response.data;
};

export const getReceiptById = async (receiptId) => {
    const response = await client.get(`/receipts/${receiptId}`);
    return response.data;
};

export const uploadReceipt = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await client.post('/receipts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const updateReceipt = async (receiptId, data) => {
    const response = await client.put(`/receipts/${receiptId}`, data);
    return response.data;
};

export const deleteReceipt = async (receiptId) => {
    await client.delete(`/receipts/${receiptId}`);
    return true;
};


export const createManualReceipt = async (data) => {
    const response = await client.post('/receipts/', data);
    return response.data;
};

export const getDashboardSummary = async (currency = 'ILS') => {
    const response = await client.get('/dashboard/summary', {
        params: { currency }
    });
    return response.data;
};