import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BsFillGridFill, BsList } from 'react-icons/bs';
import { productsActions } from '../../store/products-slice';
import { uiActions } from '../../store/ui-slice'; // Importar uiActions

const Sort = () => {
    const dispatch = useDispatch();
    const totalProducts = useSelector((state) => state.products.totalProducts);
    const sort = useSelector((state) => state.products.sort);
    const gridView = useSelector((state) => state.ui.gridView); // Obtener el estado de gridView

    const toggleHandler = () => {
        dispatch(uiActions.toggleView()); // Despachar la acción toggleView al hacer clic en los botones
    };

    const sortProducts = (e) => {
        const value = e.target.value;
        dispatch(productsActions.sortProducts(value));
    };

    return (
        <div className='flex justify-between items-center mb-8'>
            <div className='flex space-x-2'>
                <button className={`border-2 border-black rounded-md p-1 inline-block ${gridView ? 'bg-gray-200' : ''}`} onClick={toggleHandler}>
                    <BsFillGridFill />
                </button>
                <button className={`border-2 border-black rounded-md p-1 inline-block ${!gridView ? 'bg-gray-200' : ''}`} onClick={toggleHandler}>
                    <BsList />
                </button>
            </div>
            <p className='text-sm inline-block capitalize'>{totalProducts} diseños encontrados</p>
            <div className='h-[1px] w-1/2 bg-gray-500'></div>
            <form className='ml-4'>
                <label htmlFor="sort" className='capitalize'>Ordenar Por..</label>
                <select name="sort" id="sort" value={sort} className='capitalize cursor-pointer' onChange={sortProducts}>
                    <option value="price-lowest">precio (menor a mayor)</option>
                    <option value="price-highest">precio (mayor a menor)</option>
                    <option value="name-a">nombre (a - z)</option>
                    <option value="name-z">nombre (z - a)</option>
                </select>
            </form>
        </div>
    );
};

export default Sort;
