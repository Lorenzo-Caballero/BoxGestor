import React from "react";
import { GiCompass, GiDiamondHard, GiStabbedNote } from 'react-icons/gi';

const TheServices = () => {
    return (
        <div className="bg-purple-400 px-8 py-16 lg:py-24">
            <div className="container mx-auto">
                <h2 className="text-3xl lg:text-4xl text-white font-semibold mb-8">Cómo cuidar tu nuevo tatuaje</h2>
                <p className="text-lg text-white mb-12">¡Hola! Aquí tienes algunos consejos útiles para que tu tatuaje luzca increíble y se mantenga en óptimas condiciones.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <ServiceCard
                        icon={<GiCompass className="text-white text-4xl" />}
                        title="Primeros pasos"
                        description="Después de hacerte el tatuaje, manténlo cubierto con un vendaje durante unas horas y sigue las instrucciones de tu tatuador para lavarlo y aplicar crema. ¡Es fácil!"
                    />
                    <ServiceCard
                        icon={<GiDiamondHard className="text-white text-4xl" />}
                        title="Cuidado durante la cicatrización"
                        description="Es crucial mantener el tatuaje limpio e hidratado durante la fase de cicatrización, evitando rascar o exponerlo al sol directamente. ¡Trata tu tatuaje como oro!"
                    />
                    <ServiceCard
                        icon={<GiStabbedNote className="text-white text-4xl" />}
                        title="Mantenimiento a largo plazo"
                        description="Una vez que tu tatuaje esté completamente cicatrizado, recuerda protegerlo del sol con protector solar y mantenerlo bien hidratado con crema. ¡Así lucirá increíble durante mucho tiempo!"
                    />
                </div>
            </div>
        </div>
    );
};

const ServiceCard = ({ icon, title, description }) => {
    return (
        <div className="bg-purple-600 px-8 py-12 rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:scale-105">
            <div className="flex items-center justify-center mb-6">
                {icon}
            </div>
            <h3 className="text-xl lg:text-2xl text-white font-bold mb-3">{title}</h3>
            <p className="text-gray-300">{description}</p>
        </div>
    );
};

export default TheServices;
