import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/helpers';


const CartSummary = ({ totalPrice }) => {
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    return (
        <div className='flex flex-col border-2 border-solid border-gray-700 rounded-xl text-center p-5'>
            <h2 className='uppercase text-2xl tracking-wide'>Orden de Compra</h2>
            <div className='my-4 flex justify-between'>
                <span className='capitalize text-lg'>subtotal</span>
                <span className='italic'>{formatPrice(totalPrice)}</span>
            </div>
        
            <div className='my-4 flex justify-between'>
                <span className='capitalize text-lg'>Descuentos aplicados</span>
                <span className='italic'>{formatPrice(-0.00)}</span>
            </div>
            <div className='my-4 flex justify-between'>
                <span className='capitalize text-xl font-bold'>total</span>
                <span className='italic'>{formatPrice(totalPrice)}</span>
            </div>
            {isAuthenticated && <Link to='/checkout' className='block w-full uppercase p-3 text-white bg-black font-semibold'>
                Checkout now
            </Link>}
            {!isAuthenticated && <Link to='/login' className='block w-full uppercase p-3 text-white bg-black font-semibold mt-auto'>
                Login
            </Link>}
        </div>
    );
};


export default CartSummary;