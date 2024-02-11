import React from 'react';

import { Link } from 'react-router-dom';

const PageHero = ({ title, product }) => {
    return (
        <div className='bg-purple-100 w-full min-h-[20vh] flex items-center'>
            <div className='w-[80vw] mx-auto'>
                <h3 className='sm:text-2xl md:text-[2rem] capitalize font-bold tracking-wider'>
                    <Link className='text-primary' to="/">Inicio </Link>
                    {product && <Link className='text-primary' to="/products">/ Diseños </Link>}/ {title}
                </h3>
            </div>
        </div>
    );
};

export default PageHero;