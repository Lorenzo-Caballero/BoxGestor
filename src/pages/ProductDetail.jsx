import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
//import ProductImages from '../components/productDetail/ProductImages';
//import Stars from '../components/productDetail/Stars';
import PageHero from '../layout/PageHero';
import AddToCart from '../components/productDetail/AddToCart';
import { getProductDetails } from '../store/actions/products-actions';
//import { formatPrice } from '../utils/helpers';
import TheSpinner from '../layout/TheSpinner';

const containerVariants = {
    hidden: {
        opacity: 0
    },
    visible: {
        opacity: 1,
        transition: { duration: .3 }
    },
    exit: {
        x: '-100vw',
        transition: { ease: 'easeInOut' }
    }
}

const ProductDetail = () => {
    const { productId } = useParams();
    const dispatch = useDispatch();
    const loading = useSelector((state) => state.ui.productDetailLoading);

    useEffect(() => {
        dispatch(getProductDetails(productId));
    }, [dispatch, productId]);

    const product = useSelector((state) => state.products.productDetails);
    const {
        name,
        description,
        price,
        brand,
        sku,
        image,
    } = product;

    return (
        <motion.div className='mb-48'
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            <PageHero title={name} product />
            <div className='mt-16 space-y-16 w-full px-4 md:px-8 lg:px-0 mx-auto max-w-screen-xl'>
                <Link to='/products' className='uppercase bg-purple-500 px-4 py-2 rounded text-white font-semibold shadow-lg'>
                    back to products
                </Link>
                {loading ? <TheSpinner /> :
                    <div className='flex'>
                        <div className='w-1/2 pr-8'>
                            <img
                                src={image}
                                alt=""
                                className="w-full rounded-lg md:max-w-md lg:max-w-lg"
                            />
                        </div>

                        <div className='w-1/2'>
                            <h2 className='font-bold text-5xl tracking-wide mb-5'>{name}</h2>
                            <h4 className='text-xl font-extrabold text-purple-500 tracking-widest italic my-4'>${price}</h4>
                            <p className='max-w-3xl tracking-wider leading-8 text-gray-500 mb-6'>{description}</p>
                            <div className='flex flex-col w-full sm:w-3/4 lg:w-1/2 space-y-5'>
                                <div className='flex justify-between'>
                                    <p className='text-lg font-semibold tracking-wider text-gray-600'>Disponible :</p>
                                    <p>En stock</p>
                                </div>
                                </div>
                            <hr className='my-6' />
                            <AddToCart product={product} />
                        </div>
                    </div>
                }
            </div>
        </motion.div>
    );
};

export default ProductDetail;
