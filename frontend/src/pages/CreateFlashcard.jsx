import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { getAuth } from 'firebase/auth'; 

const CreateFlashcard = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [words, setWords] = useState([
        { word: '', phonetics: '', partOfSpeech: '', meaning: '', example: '' }
    ]);
    const [isPublic, setIsPublic] = useState(false);
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;

    const handleAddWord = () => {
        setWords([...words, { word: '', phonetics: '', partOfSpeech: '', meaning: '', example: '' }]);
    };

    const handleRemoveWord = (index) => {
        const updatedWords = words.filter((_, i) => i !== index);
        setWords(updatedWords);
    };

    const handleWordChange = (index, field, value) => {
        const updatedWords = words.map((word, i) =>
            i === index ? { ...word, [field]: value } : word
        );
        setWords(updatedWords);
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            alert('กรุณาใส่ชื่อ Flashcard');
            return;
        }
    
        if (words.length < 5) {
            alert('กรุณาเพิ่มคำศัพท์อย่างน้อย 5 คำ');
            return;
        }
    
        if (!user) {
            alert('กรุณาล็อกอินก่อนสร้าง Flashcard');
            return;
        }
    
        try {
            console.log('📤 กำลังสร้าง Flashcard...');
            const flashcardsRef = collection(db, `users/${user.uid}/flashcards`);
    
            // ✅ เพิ่ม `creatorName` และ `userEmail`
            await addDoc(flashcardsRef, {
                title,
                description,
                words,
                isPublic,
                createdAt: new Date(),
                creatorName: user.displayName || "ไม่ระบุ",  // 🔥 ใช้ Display Name
                userEmail: user.email
            });
    
            console.log('✅ Flashcard ถูกสร้างเรียบร้อย!');
            alert('🎉 สร้าง Flashcard สำเร็จ!');
            navigate('/homepro');
        } catch (error) {
            console.error('🚨 เกิดข้อผิดพลาดในการสร้าง Flashcard:', error);
            alert('❌ เกิดข้อผิดพลาดในการสร้าง Flashcard');
        }
    };

    return (
        <div className="min-h-screen bg-[#2D1B69] py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/homepro" className="bg-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-white text-2xl font-bold">สร้าง Flashcard ใหม่</h1>
                </div>

                <div>
                    <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
                        <div className="mb-6">
                            <label className="block text-gray-500 font-semibold mb-2">
                                ชื่อ Flashcard
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-500 font-semibold mb-2">
                                คำอธิบาย
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                rows="3"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-gray-500 font-semibold">
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                    className="rounded text-purple-500 focus:ring-purple-500"
                                />
                                เผยแพร่สาธารณะ
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-6">
                        {words.map((word, index) => (
                            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold text-[#2D1B69]">
                                        คำศัพท์ที่ {index + 1}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveWord(index)}
                                        className="bg-red-100 p-2 rounded-full hover:bg-red-200"
                                    >
                                        <Trash2 className="w-5 h-5 text-red-600" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="คำศัพท์ (word)"
                                        value={word.word}
                                        onChange={(e) => handleWordChange(index, 'word', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="การออกเสียง (phonetics)"
                                        value={word.phonetics}
                                        onChange={(e) => handleWordChange(index, 'phonetics', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                    <input
                                        type="text"
                                        placeholder="ประเภทคำ (partOfSpeech)"
                                        value={word.partOfSpeech}
                                        onChange={(e) => handleWordChange(index, 'partOfSpeech', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                    <input
                                        type="text"
                                        placeholder="ความหมาย (meaning)"
                                        value={word.meaning}
                                        onChange={(e) => handleWordChange(index, 'meaning', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="ตัวอย่างประโยค (example)"
                                        value={word.example}
                                        onChange={(e) => handleWordChange(index, 'example', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center mb-8">
                        <button
                            type="button"
                            onClick={handleAddWord}
                            className="bg-white text-[#2D1B69] px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-100"
                        >
                            <Plus className="w-5 h-5" />
                            เพิ่มคำศัพท์
                        </button>
                    </div>

                    <button
                        onClick={handleSubmit}
                        type="button"
                        className="w-full bg-yellow-400 text-black py-4 rounded-full font-semibold hover:bg-yellow-500 transition-colors"
                    >
                        บันทึก Flashcard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateFlashcard;