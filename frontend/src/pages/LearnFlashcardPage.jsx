import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LearnFlashcardPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [flashcard, setFlashcard] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [user, setUser] = useState(null);
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                navigate('/');
                return;
            }
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (user) {
            fetchFlashcard(user);
            checkFavoriteStatus(user);
        }
    }, [user, id]);

    const fetchFlashcard = async (currentUser) => {
        try {
            const docRef = doc(db, `users/${currentUser.uid}/flashcards/${id}`);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setFlashcard(docSnap.data());
            } else {
                console.error('❌ Flashcard not found');
            }
        } catch (error) {
            console.error('🚨 Error fetching flashcard:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkFavoriteStatus = async (currentUser) => {
        try {
            const favoriteRef = doc(db, `users/${currentUser.uid}/favorites`, id);
            const favoriteSnap = await getDoc(favoriteRef);
            setIsLiked(favoriteSnap.exists());
        } catch (error) {
            console.error("Error checking favorite status:", error);
        }
    };

    const toggleFavorite = async () => {
        if (!user) {
            setShowLoginPopup(true);
            return;
        }

        try {
            const favoriteRef = doc(db, `users/${user.uid}/favorites`, id);
            
            if (isLiked) {
                await deleteDoc(favoriteRef);
            } else {
                await setDoc(favoriteRef, {
                    flashcardId: id,
                    word: currentWord.word,
                    phonetics: currentWord.phonetics,
                    partOfSpeech: currentWord.partOfSpeech,
                    meaning: currentWord.meaning,
                    example: currentWord.example,
                    createdAt: new Date()
                });
            }

            setIsLiked(!isLiked);
        } catch (error) {
            console.error('Error updating favorites:', error);
        }
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % 3);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + 3) % 3);
    };

    const nextWord = () => {
        if (flashcard && flashcard.words.length > 0) {
            setCurrentIndex((prev) => (prev + 1) % flashcard.words.length);
            setCurrentSlide(0);
        }
    };

    const prevWord = () => {
        if (flashcard && flashcard.words.length > 0) {
            setCurrentIndex((prev) => 
                prev === 0 ? flashcard.words.length - 1 : prev - 1
            );
            setCurrentSlide(0);
        }
    };

    const handleOptionSelect = (option) => {
        setIsModalOpen(false);
        if (option === 'reset') {
            setCurrentIndex(0);
            setCurrentSlide(0);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#2D1B69] flex items-center justify-center">
                <p className="text-white">กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    if (!flashcard || !flashcard.words || flashcard.words.length === 0) {
        return (
            <div className="min-h-screen bg-[#2D1B69] flex items-center justify-center">
                <p className="text-white">ไม่พบ Flashcard หรือไม่มีคำศัพท์ในเซ็ตนี้</p>
            </div>
        );
    }

    const currentWord = flashcard.words[currentIndex];
    const progressPercentage = ((currentIndex + 1) / flashcard.words.length) * 100;

    return (
        <div className="min-h-screen bg-[#2D1B69] py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        to="/homepro"
                        className="bg-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-white text-2xl font-bold">{flashcard.title}</h1>
                </div>

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
                            <h2 className="text-xl font-bold">{flashcard.title}</h2>
                        </div>

                        {/* Counters */}
                        <div className="flex justify-around mb-2">
                            <div className="flex items-center gap-1">
                                <img
                                    src="/assets/hearts.png"
                                    alt="Favorite"
                                    className="h-6 w-6 cursor-pointer"
                                    onClick={toggleFavorite}
                                />
                                <span>{isLiked ? 1 : 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <img src="/assets/down-arrow.png" alt="Learned" className="h-6 w-6" />
                                <span>{currentIndex + 1}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <img src="/assets/layer.png" alt="Remaining" className="h-6 w-6" />
                                <span>{flashcard.words.length - (currentIndex + 1)}</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex items-center justify-center">
                            {currentSlide === 0 && (
                                <div>
                                    <h1 className="text-4xl font-bold mb-2">{currentWord.word}</h1>
                                    <p className="text-gray-500 text-xl">{currentWord.phonetics}</p>
                                    <p className="text-yellow-600 text-lg font-medium">
                                        {currentWord.partOfSpeech}
                                    </p>
                                </div>
                            )}
                            {currentSlide === 1 && (
                                <div>
                                    <h2 className="text-xl font-bold">ความหมาย:</h2>
                                    <p className="text-gray-700 mt-4">{currentWord.meaning}</p>
                                </div>
                            )}
                            {currentSlide === 2 && (
                                <div>
                                    <h2 className="text-xl font-bold">ตัวอย่างประโยค:</h2>
                                    <p className="italic text-gray-500 mt-2">
                                        "{currentWord.example}"
                                    </p>
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
                                onClick={toggleFavorite}
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

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={prevWord}
                            className="bg-yellow-400 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-500 transition-colors"
                        >
                            คำก่อนหน้า
                        </button>
                        <button
                            onClick={nextWord}
                            className="bg-yellow-400 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-500 transition-colors"
                        >
                            คำต่อไป
                        </button>
                    </div>
                </div>

                {/* Settings Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm p-4">
                        <div className="bg-white rounded-[20px] w-full max-w-sm overflow-hidden">
                            <div className="p-4 space-y-1">
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
                                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-full font-medium transition-colors text-sm">
                                    ตกลง
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LearnFlashcardPage;