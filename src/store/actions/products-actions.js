import { productsActions } from '../products-slice';
import { uiActions } from '../ui-slice';
import axios from 'axios';

// URL de la API
const API_URL = 'https://dimgrey-gnu-703361.hostingersite.com/index.php?recurso=designs';

// Función para obtener los productos desde la API
export const getProducts = () => {
    return async (dispatch) => {
        try {
            // Dispatch de la acción para indicar que estamos cargando productos
            dispatch(uiActions.productsLoading());

            // Realizamos la petición a la API
            const response = await axios.get(API_URL);

            if (response.status === 200) {
                // En caso de éxito, despachamos los productos al estado global
                const products = response.data;  // Suponemos que la API devuelve los productos directamente
                dispatch(productsActions.replaceProducts(products));
            } else {
                // Si la respuesta no es 200, lanzamos un error
                throw new Error('Error fetching products from API');
            }
        } catch (error) {
            // Manejamos errores con un mensaje adecuado
            console.error('Error fetching products:', error);
            dispatch(uiActions.setError('Failed to load products'));
        } finally {
            // Independientemente de si la solicitud fue exitosa o no, desactivamos el estado de carga
            dispatch(uiActions.productsLoading(false));
        }
    };
};

// Obtener detalles de un producto específico
export const getProductDetails = (id) => {
    return async (dispatch, getState) => {
        try {
            // Indicamos que estamos cargando los detalles del producto
            dispatch(uiActions.pDetailLoading());

            // Obtenemos los productos del estado global
            const { products } = getState().products;

            // Buscamos el producto por ID
            const product = products.find((p) => p.id === parseInt(id));

            if (product) {
                // Si encontramos el producto, lo enviamos al estado global
                dispatch(productsActions.setProductDetails(product));
            } else {
                // Si no encontramos el producto, lanzamos un error
                throw new Error('Product not found');
            }
        } catch (error) {
            console.error('Error fetching product details:', error);
            dispatch(uiActions.setError('Failed to load product details'));
        } finally {
            // Independientemente de si hubo éxito o error, desactivamos el estado de carga
            dispatch(uiActions.pDetailLoading(false));
        }
    };
};

// Añadir un nuevo producto
export const addProduct = ({ product }) => {
    return async (dispatch) => {
        try {
            // Activamos el estado de carga
            dispatch(uiActions.addProductLoading());

            // Simulamos la adición del producto (en la vida real, se haría una petición POST)
            const newProduct = {
                ...product,
                id: new Date().getTime(), // Usamos el tiempo actual como ID único para la simulación
            };

            // En la práctica, enviaríamos una petición POST a la API para agregar el producto.
            // Simulamos una respuesta exitosa.
            dispatch(productsActions.addProduct(newProduct));

            // Después de agregar el producto, recargamos los productos
            dispatch(getProducts());
        } catch (error) {
            console.error('Error adding product:', error);
            dispatch(uiActions.setError('Failed to add product'));
        } finally {
            // Terminamos el estado de carga
            dispatch(uiActions.addProductLoading(false));
        }
    };
};
// Eliminar un producto
export const deleteProduct = (id) => {
    return async (dispatch) => {
        try {
            // Activamos el estado de carga
            dispatch(uiActions.productsLoading());

            // Hacemos la petición DELETE a la API
            const response = await axios.delete(`${API_URL}/${id}`);

            if (response.status === 200) {
                // Eliminamos el producto en el estado global
                dispatch(productsActions.deleteProduct(id));

                // Volvemos a cargar la lista de productos
                dispatch(getProducts());
            } else {
                throw new Error('Error al eliminar el producto');
            }
        } catch (error) {
            console.error('Error eliminando producto:', error);
            dispatch(uiActions.setError('Error al eliminar el producto'));
        } finally {
            dispatch(uiActions.productsLoading(false));
        }
    };
};

// Actualizar un producto existente
export const updateProduct = ({ product, id }) => {
    return async (dispatch) => {
        try {
            // Activamos el estado de carga
            dispatch(uiActions.updateProductLoading());

            // Actualizamos el producto en el estado
            const updatedProduct = { ...product, id };

            // Simulamos la actualización en el arreglo de productos (en la práctica, enviaríamos una petición PUT a la API)
            dispatch(productsActions.updateProduct(updatedProduct));

            // Después de actualizar el producto, recargamos los productos
            dispatch(getProducts());
        } catch (error) {
            console.error('Error updating product:', error);
            dispatch(uiActions.setError('Failed to update product'));
        } finally {
            // Terminamos el estado de carga
            dispatch(uiActions.updateProductLoading(false));
        }
    };
};
