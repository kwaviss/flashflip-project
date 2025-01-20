import { useState, useEffect } from 'react';
import { collection, getDocs, query, limit, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebaseConfig';
import Flashcard from '../components/Flashcard';

const FlashcardPage = () => {
    const [flashcards, setFlashcards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0); // เพิ่ม state สำหรับ currentSlide
    

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setIsLoggedIn(!!currentUser);
            setUser(currentUser);

            if (currentUser) {
                await fetchLastLearnedWord(currentUser.uid);
            }

            await fetchFlashcards();
        });

        return () => unsubscribe();
    }, []);

    const fetchFlashcards = async () => {
        try {
            console.log("🔍 Fetching flashcards...");
    
            const q = query(collection(db, 'flashcards'), limit(1000));
            const querySnapshot = await getDocs(q);
    
            if (querySnapshot.empty) {
                console.warn("⚠️ No flashcards found in Firestore.");
                return;
            }
    
            const data = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
    
            console.log("✅ Flashcards loaded successfully:", data.length);
            setFlashcards(shuffleArray(data));
        } catch (error) {
            console.error('🚨 Error fetching flashcards:', error);
            alert("❌ ไม่สามารถโหลด Flashcards ได้! ตรวจสอบ Firestore Rules และดู Console Log");
        }
    };

    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const nextFlashcard = async () => {
        if (currentIndex < flashcards.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            setCurrentSlide(0);
            await saveLastLearnedWord(newIndex);
        }
    };

    const prevFlashcard = async () => {
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            setCurrentSlide(0);
            await saveLastLearnedWord(newIndex);
        }
    };

    const saveLastLearnedWord = async (index) => {
        if (!user || !flashcards[index]) return;

        try {
            const word = flashcards[index].word;
            const userRef = doc(db, `users/${user.uid}`);
            await setDoc(userRef, { lastLearnedIndex: index, lastLearnedWord: word }, { merge: true });
            console.log('✅ Saved last learned word and index:', { index, word });
        } catch (error) {
            console.error('❌ Error saving last learned word and index:', error);
        }
    };

    const fetchLastLearnedWord = async (uid) => {
        try {
            const userRef = doc(db, `users/${uid}`);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.lastLearnedIndex !== undefined) {
                    setCurrentIndex(data.lastLearnedIndex);
                    console.log('📌 Last learned index:', data.lastLearnedIndex);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching last learned word:', error);
        }
    };

    const handleFavorite = async (word, isLiked) => {
        if (!isLoggedIn) {
            alert('กรุณาล็อกอินก่อนใช้งานฟีเจอร์นี้');
            return;
        }

        try {
            const favoriteRef = doc(db, `users/${user.uid}/favorites`, word);

            if (isLiked) {
                await deleteDoc(favoriteRef);
                console.log('💔 Removed from favorites:', word);
            } else {
                await setDoc(favoriteRef, { word });
                console.log('❤️ Added to favorites:', word);
            }
        } catch (error) {
            console.error('❌ Error updating favorites:', error);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#2D1B69' }}>
            <h1 className="text-2xl text-white font-bold mb-4">1,000 คำศัพท์พื้นฐาน</h1>
            {flashcards.length > 0 ? (
                <Flashcard
                    data={flashcards[currentIndex]}
                    currentIndex={currentIndex}
                    total={flashcards.length}
                    isLoggedIn={isLoggedIn}
                    handleFavorite={handleFavorite}
                    setCurrentIndex={setCurrentIndex}
                    currentSlide={currentSlide}
                    setCurrentSlide={setCurrentSlide}
                />
            ) : (
                <p className="text-white">⏳ กำลังโหลดข้อมูล...</p>
            )}
            <div className="flex gap-4 mt-4">
                <button
                    onClick={prevFlashcard}
                    className="bg-yellow-400 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-500 transition-colors"
                    disabled={currentIndex === 0}
                >   
                    คำก่อนหน้า
                </button>
                <button
                    onClick={nextFlashcard}
                    className="bg-yellow-400 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-500 transition-colors"
                    disabled={currentIndex === flashcards.length - 1}
                >
                    คำต่อไป
                </button>
            </div>
        </div>
    );
};

export default FlashcardPage;