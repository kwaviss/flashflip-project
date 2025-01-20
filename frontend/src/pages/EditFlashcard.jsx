import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';

const EditFlashcardPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [flashcard, setFlashcard] = useState(null);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        const fetchFlashcard = async () => {
            try {
                const docRef = doc(db, 'users', user.uid, 'flashcards', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setFlashcard(docSnap.data());
                } else {
                    console.error('Flashcard not found');
                }
            } catch (error) {
                console.error('Error fetching flashcard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFlashcard();
    }, [id, user, navigate]);

    const handleChange = (field, value) => {
        setFlashcard({ ...flashcard, [field]: value });
    };

    const handleWordChange = (index, field, value) => {
        const updatedWords = flashcard.words.map((word, i) =>
            i === index ? { ...word, [field]: value } : word
        );
        setFlashcard({ ...flashcard, words: updatedWords });
    };

    const handleAddWord = () => {
        const newWord = { word: '', phonetics: '', partOfSpeech: '', meaning: '', example: '' };
        setFlashcard({ ...flashcard, words: [...flashcard.words, newWord] });
    };

    const handleDeleteWord = (index) => {
        const updatedWords = flashcard.words.filter((_, i) => i !== index);
        setFlashcard({ ...flashcard, words: updatedWords });
    };

    const handleDeleteFlashcard = async () => {
        try {
            const docRef = doc(db, 'users', user.uid, 'flashcards', id);
            await deleteDoc(docRef);
            alert('ลบ Flashcard สำเร็จ!');
            navigate('/homepro');
        } catch (error) {
            console.error('Error deleting flashcard:', error);
            alert('เกิดข้อผิดพลาดในการลบ Flashcard');
        }
    };

    const handleSubmit = async () => {
        try {
            const docRef = doc(db, 'users', user.uid, 'flashcards', id);
            await updateDoc(docRef, flashcard);
            alert('แก้ไข Flashcard สำเร็จ!');
            navigate('/homepro');
        } catch (error) {
            console.error('Error updating flashcard:', error);
            alert('เกิดข้อผิดพลาดในการแก้ไข Flashcard');
        }
    };

    if (loading) return <div className="text-white text-center py-10">กำลังโหลดข้อมูล...</div>;

    return (
        <div className="min-h-screen bg-[#2D1B69] py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/homepro" className="bg-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-white text-2xl font-bold">แก้ไข Flashcard</h1>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
                    {/* แก้ไขชื่อ Flashcard */}
                    <div className="mb-6">
                        <label className="block text-gray-500 font-semibold mb-2">ชื่อ Flashcard</label>
                        <input
                            type="text"
                            value={flashcard.title || ''}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* แก้ไขคำอธิบาย */}
                    <div className="mb-6">
                        <label className="block text-gray-500 font-semibold mb-2">คำอธิบาย</label>
                        <textarea
                            value={flashcard.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500"
                            rows="3"
                        />
                    </div>

                    {/* แก้ไข Public / Private */}
                    <div className="mb-6 flex items-center gap-3">
                        <span className="text-gray-700 font-semibold">สถานะ:</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={flashcard.isPublic}
                                onChange={(e) => handleChange('isPublic', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500"></div>
                            <span className="ml-3 text-sm text-gray-700">{flashcard.isPublic ? "Public" : "Private"}</span>
                        </label>
                    </div>

                    {/* แก้ไขคำศัพท์ทั้งหมด */}
                    <div className="grid gap-4 mb-6">
                        {flashcard.words.map((word, index) => (
                            <div key={index} className="bg-gray-100 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-semibold text-[#2D1B69]">คำที่ {index + 1}</h3>
                                    <button onClick={() => handleDeleteWord(index)} className="text-red-500 hover:text-red-600">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                {['word', 'phonetics', 'partOfSpeech', 'meaning', 'example'].map((field, i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        placeholder={field}
                                        value={word[field] || ''}
                                        onChange={(e) => handleWordChange(index, field, e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border mt-2"
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* ปุ่มเพิ่มคำศัพท์ */}
                    <button onClick={handleAddWord} className="w-full bg-blue-400 text-white py-4 rounded-full font-semibold hover:bg-blue-500 mb-4">
                        เพิ่มคำศัพท์ <Plus className="inline-block ml-2 w-5 h-5" />
                    </button>

                    {/* ปุ่มบันทึก */}
                    <button onClick={handleSubmit} className="w-full bg-yellow-400 text-black py-4 rounded-full font-semibold hover:bg-yellow-500 mb-4">
                        บันทึกการแก้ไข
                    </button>

                    {/* ปุ่มลบ Flashcard */}
                    <button onClick={handleDeleteFlashcard} className="w-full bg-red-400 text-white py-4 rounded-full font-semibold hover:bg-red-500">
                        ลบ Flashcard <Trash2 className="inline-block ml-2 w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditFlashcardPage;