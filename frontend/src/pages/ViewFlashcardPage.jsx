import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useParams, useNavigate } from 'react-router-dom';
import { HiUser, HiExclamationCircle, HiClipboardCheck, HiArrowLeft, HiClock, HiX } from "react-icons/hi";

const ViewFlashcardPage = () => {
    const { userId, flashcardId } = useParams();  
    const navigate = useNavigate();
    const [flashcard, setFlashcard] = useState(null);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();
    const user = auth.currentUser;

    // 🔥 สร้าง state สำหรับ Modal รายงาน
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    useEffect(() => {
        fetchFlashcard();
    }, [userId, flashcardId]);

    const fetchFlashcard = async () => {
        try {
            const docRef = doc(db, `users/${userId}/flashcards/${flashcardId}`);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setFlashcard(docSnap.data());
            } else {
                console.error('Flashcard not found');
                navigate('/community');
            }
        } catch (error) {
            console.error('Error fetching flashcard:', error);
        } finally {
            setLoading(false);
        }
    };

    // 📌 เปิด Modal รายงาน
    const handleReportClick = () => {
        if (!user) {
            alert("กรุณาล็อกอินเพื่อรายงาน Flashcard");
            return;
        }
        setShowReportModal(true);
    };

    // ✅ ยืนยันการรายงานและส่งไปยัง Firestore
    const handleReportSubmit = async () => {
        if (!user) {
            alert("กรุณาล็อกอินเพื่อรายงาน Flashcard");
            return;
        }

        const finalReason = reportReason === "อื่นๆ" ? customReason : reportReason;
        if (!finalReason.trim()) {
            alert("กรุณาเลือกหรือกรอกเหตุผลในการรายงาน");
            return;
        }

        try {
            const reportsRef = collection(db, 'reports');
            await addDoc(reportsRef, {
                flashcardId,
                userId,
                reportedBy: user.uid,
                reason: finalReason,
                createdAt: new Date(),
            });

            alert("📢 รายงาน Flashcard สำเร็จ!");
            setShowReportModal(false);
            setReportReason("");
            setCustomReason("");
        } catch (error) {
            console.error("Error reporting flashcard:", error);
            alert("❌ ไม่สามารถรายงาน Flashcard ได้");
        }
    };

    // ✅ คัดลอก Flashcard
    const handleClone = async () => {
        if (!user) {
            alert("กรุณาล็อกอินเพื่อคัดลอก Flashcard");
            return;
        }

        try {
            const userFlashcardRef = collection(db, `users/${user.uid}/flashcards`);
            await addDoc(userFlashcardRef, {
                ...flashcard,
                isPublic: false,
                clonedFrom: flashcardId,
                createdAt: new Date(),
            });

            alert("📥 คัดลอก Flashcard สำเร็จ!");
            navigate('/homepro');
        } catch (error) {
            console.error("Error cloning flashcard:", error);
            alert("❌ ไม่สามารถคัดลอก Flashcard ได้");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#2D1B69]">
                <p className="text-white text-lg">กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    if (!flashcard) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#2D1B69]">
                <p className="text-white text-lg">ไม่พบ Flashcard นี้</p>
            </div>
        );
    }

    const formattedDate = flashcard.createdAt
        ? new Date(flashcard.createdAt.seconds * 1000).toLocaleString('th-TH', {
            dateStyle: 'long',
            timeStyle: 'short',
        })
        : "ไม่ระบุวันที่";

    return (
        <div className="min-h-screen bg-[#2D1B69] py-12 px-4 flex justify-center">
            <div className="max-w-3xl w-full bg-white rounded-[20px] shadow-xl p-8 transition-all hover:shadow-2xl">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 transition mb-4">
                    <HiArrowLeft className="w-6 h-6 mr-2" />
                    กลับไปหน้าก่อนหน้า
                </button>

                <h1 className="text-3xl font-bold text-center text-[#2D1B69] mb-4">{flashcard.title}</h1>
                <p className="text-gray-600 text-center mb-4">{flashcard.description}</p>

                <div className="flex items-center justify-between text-gray-700 mb-6">
                    <div className="flex items-center">
                        <HiUser className="w-5 h-5 mr-2 text-[#2D1B69]" />
                        <span className="text-lg font-semibold">
                            สร้างโดย: {flashcard.creatorName || "ไม่ระบุ"}
                        </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                        <HiClock className="w-5 h-5 mr-1" />
                        <span>{formattedDate}</span>
                    </div>
                </div>  

                {/* รายชื่อคำศัพท์ */}
                <div className="bg-gray-50 p-6 rounded-xl shadow-md mb-6">
                    <h3 className="text-lg font-semibold text-[#2D1B69] mb-4">📚 รายชื่อคำศัพท์</h3>
                    <div className="grid grid-cols-4 gap-4 font-semibold text-gray-700 text-center bg-gray-200 p-2 rounded-md">
                        <span>#</span>
                        <span>คำศัพท์</span>
                        <span>ประเภทคำ</span>
                        <span>ความหมาย</span>
                    </div>
                    {flashcard.words.map((word, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 text-gray-600 text-center bg-white shadow-sm p-3 rounded-md mt-2">
                            <span className="font-semibold">{index + 1}</span>  {/* 🔥 ลำดับคำศัพท์ */}
                            <span>{word.word}</span>
                            <span>{word.partOfSpeech || "-"}</span>
                            <span>{word.meaning}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={handleReportClick} className="bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition transform hover:scale-105 flex items-center justify-center">
                        <HiExclamationCircle className="w-6 h-6 mr-2" />
                        รายงาน
                    </button>
                    <button onClick={handleClone} className="bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition transform hover:scale-105 flex items-center justify-center">
                        <HiClipboardCheck className="w-6 h-6 mr-2" />
                        คัดลอก
                    </button>
                </div>



                {showReportModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                            <h2 className="text-lg font-semibold mb-4">เหตุผลในการรายงาน</h2>
                            <select className="w-full mb-4 p-2 border rounded" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                                <option value="">-- เลือกเหตุผล --</option>
                                <option value="ข้อมูลไม่ถูกต้อง">ข้อมูลไม่ถูกต้อง</option>
                                <option value="มีคำผิด">มีคำผิด</option>
                                <option value="เนื้อหาไม่เหมาะสม">เนื้อหาไม่เหมาะสม</option>
                                <option value="อื่นๆ">อื่นๆ</option>
                            </select>
                            {reportReason === "อื่นๆ" && (
                                <input type="text" className="w-full p-2 border rounded mb-4" placeholder="กรุณาระบุเหตุผล" value={customReason} onChange={(e) => setCustomReason(e.target.value)} />
                            )}
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowReportModal(false)} className="text-gray-500 hover:text-gray-700">ยกเลิก</button>
                                <button onClick={handleReportSubmit} className="bg-red-500 text-white px-4 py-2 rounded">ส่ง</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewFlashcardPage;
