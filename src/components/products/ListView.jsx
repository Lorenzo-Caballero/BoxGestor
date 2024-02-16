import React from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/helpers";
import { HiChevronDoubleRight } from 'react-icons/hi';

const ListView = ({ products }) => {
  return (
    <div>
      {products.map((product) => {
        const { id, name, description, price, image } = product;
        return (
          <div key={id} className="flex mb-8">
            <img
              className="w-[300px] h-[200px] object-contain mb-4 rounded"
              src={image}
              alt={name}
            />
            <div className="flex flex-col flex-grow ml-4"> {/* Agregamos flex-grow para que este div crezca y ocupe el espacio restante */}
              <h3 className="mb-2 text-lg font-bold tracking-widest">{name}</h3>
              <h4 className="mb-2 text-purple-400 italic font-bold">
                {formatPrice(price)}
              </h4>
              {description && ( // Verificar si description existe antes de mostrar su contenido
                <p className="max-w-2xl mb-3 text-gray-500">
                  {description.substring(0, 150)}...
                </p>
              )}
              <div className="flex items-center"> {/* Contenedor para alinear el botón y el texto */}
                <Link
                  to={`/products/${id}`}
                  className="text-sm uppercase bg-purple-500 text-white rounded-md font-bold py-1 px-2 shadow-lg"
                >
                  Detalles
                  <span className="inline-block ml-1"><HiChevronDoubleRight /></span>
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ListView;
