import { productsActions } from '../products-slice';
import { uiActions } from '../ui-slice';

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
        imageUrl: 'https://i.pinimg.com/474x/d7/b2/02/d7b202c2f1e00d9702cd72dff19fce8b.jpg'
    },
    {
        id: 6,
        name: 'Tattoo Dinosaurio',
        price: 32.00,
        description: 'Un feroz dinosaurio suave y esponjoso.',
        imageUrl: 'https://i.pinimg.com/474x/7e/4a/e0/7e4ae0594029b7fd5fca0c55d77d213e.jpg'
    },
    {
        id: 7,
        name: 'Tattoo Elefante',
        price: 27.00,
        description: 'Un pequeño elefante con una trompa larga.',
        imageUrl: 'https://i.pinimg.com/474x/f3/60/72/f36072719bb1d0affbca8ad2597ed678.jpg'
    },
    {
        id: 8,
        name: 'Tattoo León',
        price: 30.00,
        description: 'El rey de la selva en formato mini.',
        imageUrl: 'https://example.com/images/leon.png'
    }
];

// Obtener productos (usando los productos simulados)
export const getProducts = () => {
    return async dispatch => {
        dispatch(uiActions.productsLoading());

        // En vez de llamar a la API, usamos los productos simulados
     
        const response = await axios.post(
            "restapi-lennitabb-production.up.railway.app/api/designs",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          )

        try {
            const products = await fetchData();
            
            // Aquí reemplazamos los productos del estado con los productos simulados
            dispatch(productsActions.replaceProducts(products));
            dispatch(uiActions.productsLoading());
            
        } catch (error) {
            console.log('failed to fetch products');
        }
    };
};

// Obtener detalles de un producto específico
export const getProductDetails = (id) => {
    return async (dispatch, getState) => {
        dispatch(uiActions.pDetailLoading());
        const { products } = getState().products;
        
        try {
            const product = products.find((p) => p.id === parseInt(id));
            if (product) {
                dispatch(productsActions.setProductDetails(product));
            } else {
                console.error("Product not found");
            }
        } catch (error) {
            console.error("Error fetching product details:", error);
        } finally {
            dispatch(uiActions.pDetailLoading());
        }
    };
};

// Añadir un nuevo producto (simulado)
export const addProduct = ({ product }) => {
    return async dispatch => {
        dispatch(uiActions.addPrductLoading());

        const postData = async () => {
            // Simulamos agregar el producto al arreglo de productos
            const newProduct = {
                ...product,
                id: sampleProducts.length + 1 // Creamos un id único
            };
            sampleProducts.push(newProduct);
            return 'Producto añadido con éxito'; // Mensaje simulado de éxito
        };

        try {
            const message = await postData();
            console.log('message : ', message);

            // Simulamos obtener los productos actualizados
            dispatch(getProducts());
            dispatch(uiActions.addPrductLoading());
            
        } catch (error) {
            console.log(error);
        }
    };
};

// Actualizar un producto existente (simulado)
export const updateProduct = ({ product, id }) => {
    return async dispatch => {
        dispatch(uiActions.updateProductLoading());

        const putData = async () => {
            // Encontramos el producto que se va a actualizar
            const productIndex = sampleProducts.findIndex(p => p.id === id);
            if (productIndex !== -1) {
                // Actualizamos el producto en el arreglo de productos
                sampleProducts[productIndex] = { ...product, id };
                return 'Producto actualizado con éxito';
            } else {
                throw new Error('Producto no encontrado');
            }
        };

        try {
            await putData();
            dispatch(getProducts());
            dispatch(uiActions.updateProductLoading());
            
        } catch (error) {
            console.log(error);
        }
    };
};
