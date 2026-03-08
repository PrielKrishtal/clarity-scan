import apiClient from './client'


export const login = async (email, password) => {
    try {
        const responseData = await apiClient.post('/auth/login', 
            { username: email, password },
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const token = responseData.data.access_token
        localStorage.setItem('token', token);
        return responseData.data;
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
};


export const register = async (email, password, fullName) => {
   try {
        const responseData = await apiClient.post('/auth/register',{email,password,fullName});
        return responseData.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};