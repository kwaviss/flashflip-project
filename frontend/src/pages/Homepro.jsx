import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Folder, Heart, Plus, Eye, Edit } from 'lucide-react'; // ลบ Trash2 ออก
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

const HomePro = () => {
    const [userFlashcards, setUserFlashcards] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;

    // ถ้าไม่มีผู้ใช้ล็อกอินให้ redirect ไปหน้า login
    useEffect(() => {
        if (!user) {
            navigate('/'); // ทำการ redirect ไปหน้า login
        } else {
            const fetchUserFlashcards = async () => {
                try {
                    // ดึงข้อมูล flashcards ของผู้ใช้จาก subcollection "flashcards"
                    const flashcardsSnapshot = await getDocs(collection(db, 'users', user.uid, 'flashcards'));
                    const flashcardsData = flashcardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setUserFlashcards(flashcardsData);
                    setLoading(false);
                } catch (error) {
                    console.error('Error fetching flashcards:', error);
                    setLoading(false);
                }
            };

            fetchUserFlashcards();
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-[#2D1B69] py-8 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-[32px] p-8">
                {/* Flashcard ของฉัน */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 bg-violet-400 text-white py-3 px-6 rounded-full mb-6 w-fit">
                        <Folder className="w-5 h-5" />
                        <span className="font-medium">Flashcard</span>
                    </div>

                    <div className="flex gap-6">
                        {/* ปุ่มสร้าง Flashcard ใหม่ */}
                        <Link
                            to="/create-flashcard"
                            className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center group hover:bg-gray-200 transition-colors"
                        >
                            <Plus className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
                        </Link>

                        <div className="flex flex-col gap-3 flex-1">
                            {/* คำที่ชอบทั้งหมด */}
                            <Link
                                to="/favorites"
                                className="flex items-center gap-2 bg-red-100 text-red-600 py-3 px-6 rounded-full w-fit hover:bg-red-200 transition-colors"
                            >
                                <Heart className="w-5 h-5" />
                                <span className="font-medium">คำที่ชอบทั้งหมด</span>
                            </Link>

                            {/* 1,000 คำศัพท์พื้นฐาน */}
                            <Link
                                to="/flashcards"
                                className="flex items-center gap-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-full w-fit hover:bg-gray-200 transition-colors"
                            >
                                <span className="font-medium">1,000 คำศัพท์พื้นฐาน</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Flashcards ของผู้ใช้ */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 bg-violet-400 text-white py-3 px-6 rounded-full mb-6 w-fit">
                        <Folder className="w-5 h-5" />
                        <span className="font-medium">Flashcard ทั้งหมด</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {loading ? (
                            <div>กำลังโหลดข้อมูล...</div>
                        ) : userFlashcards.length === 0 ? (
                            <div>ยังไม่มี Flashcard ที่คุณสร้าง</div>
                        ) : (
                            userFlashcards.map((card) => (
                                <div
                                    key={card.id}
                                    className="bg-gray-100 p-6 rounded-xl shadow-md relative"
                                >
                                    <h3 className="font-medium">{card.title}</h3>
                                    <p className="text-sm">{card.description}</p>
                                    
                                    {/* ไอคอนชิดขวา */}
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <Link to={`/flashcards/${card.id}`} className="text-blue-500 hover:underline">
                                            <Eye className="w-5 h-5" />
                                        </Link>
                                        <Link to={`/edit-flashcard/${card.id}`} className="text-purple-500 hover:underline">
                                            <Edit className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default HomePro;
