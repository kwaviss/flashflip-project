import React from "react";
import { Link } from "react-router-dom";

const Landing = () => {
    return (
        <div className="min-h-screen bg-white">

            {/* Main Content */}
            <main className="bg-[#2D1B69] min-h-[calc(100vh-76px)] flex items-center">
                <div className="container mx-auto flex items-center justify-between px-4">
                    {/* Left Side - Flags */}
                    <div className="flex-1 flex justify-center items-center">
                        <div className="relative w-[600px]">
                            <img 
                                src="/assets/flags.png" 
                                alt="UK and Thai flags with icons"
                                className="w-full h-auto"
                            />
                        </div>
                    </div>

                    {/* Right Side - Content Card */}
                    <div className="flex-1 flex justify-center">
                        <div className="bg-white rounded-[32px] p-10 w-[480px] flex flex-col">
                            {/* Title Section */}
                            <div className="mb-10">
                                <h1 className="mb-4">
                                    <span className="text-yellow-400 text-6xl font-bold tracking-tight">1,000</span>
                                    <span className="text-black text-6xl font-bold ml-3 tracking-tight">words</span>
                                </h1>
                                <h2 className="text-3xl font-bold mb-3 tracking-tight">
                                    That will make you better!!
                                </h2>
                                <p className="text-xl text-gray-800">
                                    1,000 คำศัพท์ ที่จะทำให้คุณเก่งขึ้น!
                                </p>
                            </div>

                            {/* Language Section with Speaker Icon */}
                            <div className="w-full mb-8">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="text-2xl font-bold mb-1">English - Thai</h3>
                                        <div className="w-12 h-1 bg-purple-600"></div>
                                    </div>
                                    <img 
                                        src="/assets/speaker-icon.png" 
                                        alt="Speaker with ENG"
                                        className="w-28 h-auto"
                                    />
                                </div>
                                <p className="text-lg text-gray-600">1,000 คำศัพท์พื้นฐาน</p>
                            </div>

                            {/* Start Button */}
                            <Link to="/flashcards" className="w-full">
                                <button className="w-full bg-yellow-400 text-xl font-medium py-4 px-6 rounded-full hover:bg-yellow-500 transition-colors flex items-center justify-center group">
                                    เริ่มเรียนเลย
                                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Landing;
