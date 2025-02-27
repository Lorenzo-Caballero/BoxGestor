import { createSlice } from '@reduxjs/toolkit';

// Función para obtener el carrito del localStorage
const getLocaleStorage = () => {
    let cart = localStorage.getItem('cart');
    if (cart) {
        return JSON.parse(localStorage.getItem('cart'));
    } else {
        return [];
    }
};

// Estado inicial con datos persistidos
const initialState = {
    items: getLocaleStorage(),
    totalQuantity: 0,
    totalPrice: 0
};

// Slice del carrito
const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addItemsToCart(state, action) {
            const newItem = action.payload;
            const existingItem = state.items.find((item) => item.id === newItem.id);
            newItem.price = Number(newItem.price);

            if (!existingItem) {
                state.items.push(newItem);
            } else {
                existingItem.quantity += newItem.quantity;
                existingItem.totalPrice += newItem.totalPrice;
            }
            
            state.totalPrice += newItem.totalPrice;
            state.totalQuantity += newItem.quantity;

            // Guardar el carrito en localStorage
            localStorage.setItem('cart', JSON.stringify(state.items));
        },
        addItemToCart(state, action) {
            const id = action.payload;
            const existingItem = state.items.find((item) => item.id === id);
            state.totalQuantity++;

            if (existingItem) {
                existingItem.quantity++;
                existingItem.totalPrice += existingItem.price;
                state.totalPrice += existingItem.price;
            }

            // Guardar el carrito en localStorage
            localStorage.setItem('cart', JSON.stringify(state.items));
        },
        removeItemFromCart(state, action) {
            const id = action.payload;
            const existingItem = state.items.find((item) => item.id === id);

            if (existingItem) {
                if (existingItem.quantity === 1) {
                    state.items = state.items.filter((item) => item.id !== id);
                } else {
                    existingItem.quantity--;
                    existingItem.totalPrice -= existingItem.price;
                }

                state.totalPrice -= existingItem.price;
                state.totalQuantity--;
            }

            // Guardar el carrito en localStorage
            localStorage.setItem('cart', JSON.stringify(state.items));
        },
        clearCart(state) {
            state.items = [];
            state.totalPrice = 0;
            state.totalQuantity = 0;

            // Limpiar el carrito en localStorage
            localStorage.removeItem('cart');
        }
    }
});

export const cartActions = cartSlice.actions;

export default cartSlice;
