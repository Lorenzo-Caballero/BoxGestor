import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isAuthenticated: localStorage.getItem('token') ? true : false,
    user: localStorage.getItem('user') || '',
    token: localStorage.getItem('token') || ''
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login(state, action) {
            const user = action.payload.user;
            state.user = user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            
        },
        register(state, action) {
            const user = action.payload.user;
            state.user = user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
        },
        logout(state) {
            localStorage.removeItem('token'); // Elimina el token del localStorage al cerrar sesión
            return {
                ...initialState,
                isAuthenticated: false // Establece isAuthenticated en false al hacer logout
            };
        }
    }
});

export const authActions = authSlice.actions;

export default authSlice;
