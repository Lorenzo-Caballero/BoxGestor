import React from "react";
import { Link } from "react-router-dom";


const Overview = () => {
    return (
        <div className="w-full bg-[#f1f5f8] py-32 text-center">
            <div className="px-3 lg:px-0 lg:w-[55%] mx-auto">
                <h2 className="font-extrabold text-5xl text-[#242833] capitalize mb-10 tracking-widest leading-10">Fauno Tattoo</h2>
                <p className="text-lg text-[#555] tracking-widest font-normal mb-5 leading-7">¡Hola, soy Fauno!
                    Desde la encantadora Costa de Mar Chiquita, te invito a descubrir Fauno Tattoo, mi rincón de arte y tatuajes únicos. Con más de cinco años de experiencia, transformo tus ideas en historias contadas en la piel.
                    En cada tatuaje fusiono la tradición con el toque fresco de nuestro arte argentino. ¡Explorá, reserva fácil y deja que tu historia cobre vida con Fauno Tattoo! ¡Te espero para crear juntos algo auténtico y especial!</p>
{/*                <p className="text-lg text-[#555] tracking-widest font-normal mb-5 leading-7">Lorem, ipsum dolor.</p>
*/}                <Link className="inline-block px-6 py-3 font-semibold tracking-wider text-white bg-primary uppercase mt-8 text-lg hover:bg-secondary-200 transition-all duration-300" to='/about'>
                    Más sobre mi
                </Link>
            </div>
        </div>
    );
};


export default Overview;