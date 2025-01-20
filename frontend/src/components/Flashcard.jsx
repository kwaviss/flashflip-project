import React, { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';

Modal.setAppElement('#root');

const Flashcard = ({ 
    data, 
    currentIndex, 
    total, 
    isLoggedIn,
    setCurrentIndex,  // เพิ่ม prop นี้
    currentSlide,
    setCurrentSlide
}) => {
    const [isLiked, setIsLiked] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFavoriteStatus = async () => {
            try {
                const auth = getAuth();
                const user = auth.currentUser;
                if (!user) return;

                const favoriteRef = doc(db, `users/${user.uid}/favorites`, data.word);
                const favoriteSnap = await getDoc(favoriteRef);
                setIsLiked(favoriteSnap.exists());
            } catch (error) {
                console.error('Error fetching favorite status:', error);
            }
        };

        fetchFavoriteStatus();
    }, [data.word]);

    const nextSlide = () => {
        setCurrentSlide((prevSlide) => (prevSlide + 1) % 3);
    };

    const prevSlide = () => {
        setCurrentSlide((prevSlide) => (prevSlide - 1 + 3) % 3);
    };
    
    const progressPercentage = ((currentIndex + 1) / total) * 100;

    const getTextContent = (field) => {
        if (!field) return "ไม่มีข้อมูล";
        
        if (Array.isArray(field)) {
            return field.map((item, index) => 
                typeof item === "object" && item.text 
                    ? `${item.text} (${item.hyperlink || ''})` 
                    : item
            ).join(', ');
        }
        
        if (typeof field === "object" && field.text) {
            return `${field.text} ${field.hyperlink ? `(${field.hyperlink})` : ""}`;
        }
        
        return field;
    };

    const handleOptionSelect = (option) => {
        setIsModalOpen(false);
        if (option === 'reset') {
            setCurrentIndex(0);
            setCurrentSlide(0);
        }
    };

    const handleChangeMode = () => {
        if (!isLoggedIn) {
            setShowLoginPopup(true);
            return;
        }
        navigate("/homepro");
    };

    const toggleLike = async () => {
        if (!isLoggedIn) {
            setShowLoginPopup(true);
            return;
        }

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) return;

            const favoriteRef = doc(db, `users/${user.uid}/favorites`, data.word);

            if (isLiked) {
                await deleteDoc(favoriteRef);
                console.log(`Removed from favorites: ${data.word}`);
            } else {
                await setDoc(favoriteRef, {
                    word: data.word,
                    meaning: data.meaning,
                    partOfSpeech: data.partOfSpeech,
                    example: data.example,
                    createdAt: new Date(),
                });
                console.log(`Added to favorites: ${data.word}`);
            }

            setIsLiked((prev) => !prev);
        } catch (error) {
            console.error('Error updating favorites:', error);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md text-center relative"
                style={{
                    width: '490px',
                    height: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <img src="/assets/2flags.png" alt="Flags" className="h-8 w-auto" />
                    <h2 className="text-xl font-bold">1,000 คำศัพท์พื้นฐาน</h2>
                </div>

                {/* Counters */}
                <div className="flex justify-around mb-2">
                    <div className="flex items-center gap-1">
                        <img
                            src="/assets/hearts.png"
                            alt="Favorite"
                            className="h-6 w-6 cursor-pointer"
                            onClick={toggleLike}
                        />
                        <span>{isLiked ? 1 : 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <img src="/assets/down-arrow.png" alt="Learned" className="h-6 w-6" />
                        <span>{currentIndex + 1}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <img src="/assets/layer.png" alt="Remaining" className="h-6 w-6" />
                        <span>{total - (currentIndex + 1)}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-center">
                    {currentSlide === 0 && (
                        <div>
                            <h1 className="text-4xl font-bold mb-2">{data.word}</h1>
                            <p className="text-gray-500 text-xl">{data.phonetics}</p>
                            <p className="text-yellow-600 text-lg font-medium">{data.partOfSpeech}</p>
                        </div>
                    )}
                    {currentSlide === 1 && (
                        <div>
                            <h2 className="text-xl font-bold">ความหมาย:</h2>
                            <p className="text-gray-700 mt-4">{getTextContent(data.meaning)}</p>
                        </div>
                    )}
                    {currentSlide === 2 && (
                        <div>
                            <h2 className="text-xl font-bold">ตัวอย่างประโยค:</h2>
                            <p className="italic text-gray-500 mt-2">"{getTextContent(data.example)}"</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="relative flex items-center justify-between mt-4 w-full">
                    <img
                        src="/assets/settings.png"
                        alt="Settings"
                        className="h-8 w-8 cursor-pointer"
                        style={{ position: 'absolute', left: 0 }}
                        onClick={() => setIsModalOpen(true)}
                    />

                    <div className="flex items-center gap-4 mx-auto">
                        {currentSlide !== 0 && (
                            <button
                                onClick={prevSlide}
                                className="bg-purple-500 text-white px-4 py-2 rounded-full hover:bg-purple-600 transition-colors"
                            >
                                ←
                            </button>
                        )}
                        <div className="flex gap-2">
                            {[0, 1, 2].map((index) => (
                                <span
                                    key={index}
                                    className={`w-3 h-3 rounded-full ${
                                        currentSlide === index ? 'bg-purple-500' : 'bg-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        {currentSlide !== 2 && (
                            <button
                                onClick={nextSlide}
                                className="bg-purple-500 text-white px-4 py-2 rounded-full hover:bg-purple-600 transition-colors"
                            >
                                →
                            </button>
                        )}
                    </div>

                    <img
                        src="/assets/heart.png"
                        alt="Like"
                        className={`h-8 w-8 cursor-pointer ${isLiked ? 'opacity-100' : 'opacity-100'}`}
                        onClick={toggleLike}
                    />
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full bg-gray-300 rounded-full h-6 mt-4 max-w-md overflow-hidden">
                <div
                    className="absolute top-0 left-0 bg-gradient-to-r from-green-400 to-green-600 h-full transition-all duration-500 ease-in-out"
                    style={{ width: `${progressPercentage}%` }}
                />
                <span className="absolute left-1/2 transform -translate-x-1/2 text-white font-bold text-sm">
                    {Math.round(progressPercentage)}%
                </span>
            </div>

            {/* Settings Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[20px] w-full max-w-sm overflow-hidden">
                        <div className="p-4 space-y-1">
                            <button
                                onClick={() => handleChangeMode('changeFlashcard')}
                                className="w-full bg-[#85A7FF] hover:bg-blue-500 text-white py-2.5 px-4 rounded-full flex items-center gap-2 transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H8M8 20V4M8 20H16M16 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H16M16 20V4M16 4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                <span className="text-base font-medium">เปลี่ยนโหมดการเรียน</span>
                            </button>

                            <button
                                onClick={() => handleOptionSelect('reset')}
                                className="w-full bg-[#FF9A9A] hover:bg-red-400 text-white py-2.5 px-4 rounded-full flex items-center gap-2 transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M16 12H8M8 12L10.5 9.5M8 12L10.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="text-base font-medium">เริ่มเรียนใหม่ตั้งแต่แรก</span>
                            </button>
                        </div>

                        <div className="p-2 bg-gray-50">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-full font-medium transition-colors text-sm"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Popup */}
            {showLoginPopup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[20px] w-full max-w-sm overflow-hidden">
                        <div className="p-4 text-center">
                            <p className="text-gray-800 font-medium mb-4">
                                กรุณาล็อกอินก่อนใช้งานฟีเจอร์นี้
                            </p>
                            <button
                                onClick={() => setShowLoginPopup(false)}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-full font-medium transition-colors text-sm"
                            >
                                ตกลง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Flashcard;