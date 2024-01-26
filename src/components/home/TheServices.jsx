import React from "react";
import { GiCompass, GiDiamondHard, GiStabbedNote } from 'react-icons/gi';

const TheServices = () => {
    return (
        <div className="bg-secondary-200 px-8 py-24">
            <div className="xl:w-[85%] mx-auto">
                <div className="flex justify-between mb-12">
                    <h3 className="text-3xl text-[#453227] capitalize tracking-wide font-semibold w-1/2">Cómo cuidar tu nuevo tattoo</h3>
                    <p className="w-1/2 leading-relaxed text-[#795744]">¡Che! Acá te dejamos unos consejitos piolas para que tu tattoo quede diez puntos y se vea re copado.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 text-center">
                    <div className="flex flex-col items-center bg-[#c5a491] py-12 px-8 rounded">
                        <span className="flex justify-center items-center w-16 h-16 mb-4 rounded-full text-3xl bg-[#eaded7]"><GiCompass /></span>
                        <h4 className="capitalize text-2xl mb-3 font-bold">Primeros pasos</h4>
                        <p className="leading-relaxed text-[#5f4435]">Después de hacerte el tattoo, mantenelo cubierto con un film plástico durante unas horas y seguí las instrucciones de Fauno para lavarlo y aplicarle la crema. ¡No te preocupes, es fácil!</p>
                    </div>

                    <div className="flex flex-col items-center bg-[#c5a491] py-12 px-8 rounded">
                        <span className="flex justify-center items-center w-16 h-16 mb-4 rounded-full text-3xl bg-[#eaded7]"><GiDiamondHard /></span>
                        <h4 className="capitalize text-2xl mb-3 font-bold">Cuidado durante la cicatrización</h4>
                        <p className="leading-relaxed text-[#5f4435]">Es importante mantener el tattoo limpio y humectado durante toda la etapa de cicatrización, evitando rascar o exponerlo al sol directo. ¡Cuidá ese arte en tu piel como oro!</p>
                    </div>

                    <div className="flex flex-col items-center bg-[#c5a491] py-12 px-8 rounded">
                        <span className="flex justify-center items-center w-16 h-16 mb-4 rounded-full text-3xl bg-[#eaded7]"><GiStabbedNote /></span>
                        <h4 className="capitalize text-2xl mb-3 font-bold">Mantenimiento a largo plazo</h4>
                        <p className="leading-relaxed text-[#5f4435]">Una vez que tu tattoo esté completamente cicatrizado, recordá protegerlo del sol con protector solar y mantenerlo bien hidratado con crema. ¡Así va a lucir genial por mucho tiempo!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TheServices;
