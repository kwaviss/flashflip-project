import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { Heart, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

// ฟังก์ชันช่วยในการจัดการข้อมูล
const getTextContent = (field) => {
    if (!field) return "ไม่มีข้อมูล"; // หากไม่มีข้อมูล
    if (typeof field === "string") return field; // หากเป็นข้อความ
    if (typeof field === "object" && field.text) return field.text; // หากเป็นวัตถุที่มี key ชื่อ text
    return JSON.stringify(field); // หากเป็นวัตถุอื่นๆ
};

const FavoriteWords = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const auth = getAuth();
                const user = auth.currentUser;
                if (!user) {
                    setLoading(false);
                    return;
                }

                const q = query(collection(db, `users/${user.uid}/favorites`));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setFavorites(data);
            } catch (error) {
                console.error('Error fetching favorites:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, []);

    const handleDelete = async (id) => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
                alert("กรุณาเข้าสู่ระบบ");
                return;
            }

            // ลบเอกสารจาก Firestore
            await deleteDoc(doc(db, `users/${user.uid}/favorites`, id));
            setFavorites(favorites.filter((item) => item.id !== id)); // อัปเดต UI
        } catch (error) {
            console.error("Error deleting favorite:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#2D1B69] flex items-center justify-center">
                <div className="text-white text-xl">กำลังโหลด...</div>
            </div>
        );
    }

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
                    <h1 className="text-white text-2xl font-bold">คำที่ชอบทั้งหมด</h1>
                </div>

                {/* Words Grid */}
                {favorites.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {favorites.map((favorite) => (
                            <div
                                key={favorite.id}
                                className="bg-white rounded-2xl p-6 shadow-lg"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#2D1B69] mb-1">
                                            {favorite.word}
                                        </h2>
                                        <p className="text-gray-600 italic">{favorite.phonetics}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(favorite.id)}
                                        className="bg-red-100 p-2 rounded-full hover:bg-red-200"
                                    >
                                        <Trash2 className="w-5 h-5 text-red-600" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-gray-500 mb-1 font-semibold">ความหมาย:</p>
                                        <p className="text-lg font-medium text-gray-700">
                                            {getTextContent(favorite.meaning)}
                                        </p>
                                    </div>
                                    {favorite.example && (
                                        <div>
                                            <p className="text-gray-500 mb-1 font-semibold">ตัวอย่างประโยค:</p>
                                            <p className="text-lg text-gray-700 italic">
                                                "{getTextContent(favorite.example)}"
                                            </p>
                                            {favorite.translation && (
                                                <p className="text-purple-600 mt-1">
                                                    {getTextContent(favorite.translation)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-xl font-bold">ยังไม่มีคำที่คุณชอบ</p>
                        <p className="text-gray-500 mt-2">
                            เริ่มเพิ่มคำที่คุณชอบเพื่อเก็บไว้ทบทวน
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FavoriteWords;