import { createSlice } from '@reduxjs/toolkit';
// Arreglo de productos simulados para pruebas
const sampleProducts = [
    {
        id: 1,
        name: 'Tattoo Oso',
        price: 25.00,
        description: 'Un adorable oso tejido a mano.',
        imageUrl: 'https://example.com/images/oso.png'
    },
    {
        id: 2,
        name: 'Tattoo Gato',
        price: 30.00,
        description: 'Un pequeño gato de lana con ojos grandes.',
        imageUrl: 'https://example.com/images/gato.png'
    },
    {
        id: 3,
        name: 'Tattoo Conejo',
        price: 20.00,
        description: 'Este conejito es perfecto para abrazar.',
        imageUrl: 'https://example.com/images/conejo.png'
    },
    {
        id: 4,
        name: 'Tattoo Perro',
        price: 28.00,
        description: 'Un fiel compañero tejido a mano.',
        imageUrl: 'https://example.com/images/perro.png'
    },
    {
        id: 5,
        name: 'Tattoo Unicornio',
        price: 35.00,
        description: 'Un unicornio mágico lleno de colores.',
        imageUrl: 'https://example.com/images/unicornio.png'
    },
    {
        id: 6,
        name: 'Tattoo Dinosaurio',
        price: 32.00,
        description: 'Un feroz dinosaurio suave y esponjoso.',
        imageUrl: 'https://example.com/images/dinosaurio.png'
    },
    {
        id: 7,
        name: 'Tattoo Elefante',
        price: 27.00,
        description: 'Un pequeño elefante con una trompa larga.',
        imageUrl: 'https://example.com/images/elefante.png'
    },
    {
        id: 8,
        name: 'Tattoo León',
        price: 30.00,
        description: 'El rey de la selva en formato mini.',
        imageUrl: 'https://example.com/images/leon.png'
    }
];

const initialState = {
    products: sampleProducts,
    filteredProducts: [],
    productDetails: null, // Iniciamos como null en lugar de sampleProducts
    totalProducts: 0,
    minPrice: 0,
    maxPrice: 0,
    sort: 'price-lowest',
    filters: {
        search: '',
        category: 'all',
        company: 'all',
        price: 0,
        shipping: false
    }
};



const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        replaceProducts: (state, action) => {
            state.products = action.payload;
            state.filteredProducts = action.payload;
            state.totalProducts = action.payload.length;
            // set min and max prices
            let prices = state.products.map((product) => product.price);
            state.maxPrice = Math.max(...prices);
            state.minPrice = Math.min(...prices);
            state.filters.price = Math.max(...prices);
        },
        setFilters: (state, action) => {
            state.filters = action.payload;
        },
        sortProducts: (state, action) => {
            const value = action.payload;
            let tempProducts = [];
            if (value === 'price-lowest') {
                tempProducts = state.filteredProducts.sort((a, b) => {
                    return a.price - b.price;
                })
            }
            if (value === 'price-highest') {
                tempProducts = state.filteredProducts.sort((a, b) => {
                    return b.price - a.price;
                })
            }
            if (value === 'name-a') {
                tempProducts = state.filteredProducts.sort((a, b) => {
                    return a.name.localeCompare(b.name);
                })
            }
            if (value === 'name-z') {
                tempProducts = state.filteredProducts.sort((a, b) => {
                    return b.name.localeCompare(a.name);
                })
            }
            state.filteredProducts = tempProducts;
            state.sort = value;
        },
        filterProducts: (state, action) => {
            const { search, category, company, price, shipping } = action.payload;
            let tempProducts = state.products;
            if (search) {
                tempProducts = tempProducts.filter((product) => 
                    product.name.toLowerCase().includes(search)
                );
            }
            if (category !== 'all') {
                tempProducts = tempProducts.filter(
                    (product) => product.category === category
                )
            }
            if (company !== 'all') {
                tempProducts = tempProducts.filter(
                    (product) => product.brand === company
                )
            }
            if (shipping) {
                tempProducts = tempProducts.filter(
                    (product) => product.shipping === 1
                )
            }
            tempProducts = tempProducts.filter(
                (product) => product.price <= price
            )
            state.filteredProducts = tempProducts;
            state.totalProducts = tempProducts.length;
        },
        clearFilter: (state, action) => {
            // state.filteredProducts = state.products;
            // state.totalProducts = state.products.length;
            state.filters = {
                ...state.filters,
                search: '',
                category: 'all',
                company: 'all',
                price: state.maxPrice,
                shipping: false
            }
        },
        setProductDetails: (state, action) => {
            state.productDetails = action.payload;
        },
        // addProduct: (state, action) => {
        //     const product = action.payload;
        //     state.products.unshift(product);
        // }
    }
});



export const productsActions = productsSlice.actions;

export default productsSlice;