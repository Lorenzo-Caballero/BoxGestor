import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    gridView: false,
    productDetailLoading: false,
    productsLoading: false,
    loginLoading: false,
    registerLoading: false,
    addProductLoading: false,
    updateProductLoading: false,
    error: null // <-- Agregamos la propiedad para manejar errores
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        toggleView(state) {
            state.gridView = !state.gridView;
        },
        pDetailLoading(state) {
            state.productDetailLoading = !state.productDetailLoading;
        },
        productsLoading(state) {
            state.productsLoading = !state.productsLoading;
        },
        loginLoading(state) {
            state.loginLoading = !state.loginLoading;
        },
        registerLoading(state) {
            state.registerLoading = !state.registerLoading;
        },
        addProductLoading(state) {
            state.addProductLoading = !state.addProductLoading;
        },
        updateProductLoading(state) {
            state.updateProductLoading = !state.updateProductLoading;
        },
        setError(state, action) { // <-- Agregamos la acción setError
            state.error = action.payload;
        },
        clearError(state) { // <-- Acción para limpiar el error si lo necesitas
            state.error = null;
        }
    }
});

export const uiActions = uiSlice.actions;

export default uiSlice;
