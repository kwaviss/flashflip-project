import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [statistics, setStatistics] = useState({
        totalUsers: 0,
        totalFlashcards: 0,
        reportedFlashcards: 0,
        clonedFlashcards: 0,
        mostClonedFlashcard: null
    });
    const [todayUsers, setTodayUsers] = useState(0);
    const [todayFlashcards, setTodayFlashcards] = useState(0);
    const [todayClones, setTodayClones] = useState(0);
    
    const navigate = useNavigate();
    const auth = getAuth();


        // เพิ่มต่อจาก states ที่มีอยู่
    const [topCreators, setTopCreators] = useState([]);
    const [setMostClonedCreators] = useState([]);
    const [publicFlashcards, setPublicFlashcards] = useState(0);
    const [privateFlashcards, setPrivateFlashcards] = useState(0);
    const [mostStudiedFlashcards, setMostStudiedFlashcards] = useState([]);

    // StatCard Component
    const StatCard = ({ title, value, icon, bgColor }) => (
        <div className={`${bgColor} rounded-xl p-6 shadow-lg transform transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h3 className="text-white text-sm font-medium mb-2 opacity-90">{title}</h3>
                    <p className="text-white text-2xl font-bold">{value}</p>
                </div>
                <div className="text-white/80">
                    {icon}
                </div>
            </div>
        </div>
    );

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                if (user.email === "phirunnahid@gmail.com") {
                    setIsAdmin(true);
                    fetchAllData();
                    fetchUserBehaviorStats();
                } else {
                    alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
                    navigate("/");
                }
            } else {
                navigate("/");
            }
        });

        return () => unsubscribe();
    }, [auth, navigate]);

    const fetchAllData = async () => {
        try {
            await Promise.all([
                fetchStatistics(),
                fetchReports(),
                fetchTodayStatistics()
            ]);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            // ดึงข้อมูลผู้ใช้ทั้งหมด
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const totalUsers = usersSnapshot.size;
    
            let totalFlashcards = 0;
            let clonedCount = 0;
            let flashcardCloneCounts = {};
    
            // วนลูปผ่านผู้ใช้แต่ละคน
            for (const userDoc of usersSnapshot.docs) { // แก้จาก usersSnapshotAll เป็น usersSnapshot
                const userId = userDoc.id;
                const flashcardsSnapshot = await getDocs(collection(db, `users/${userId}/flashcards`));
                totalFlashcards += flashcardsSnapshot.size;
    
                // นับจำนวน Flashcards ที่ถูก Clone
                flashcardsSnapshot.docs.forEach((flashcard) => {
                    if (flashcard.data().clonedFrom) {
                        clonedCount++;
                        const clonedFromId = flashcard.data().clonedFrom;
                        flashcardCloneCounts[clonedFromId] = (flashcardCloneCounts[clonedFromId] || 0) + 1;
                    }
                });
            }
    
            // หา Flashcard ที่ถูก Clone มากที่สุด
            let mostClonedFlashcard = null;
            const mostClonedEntry = Object.entries(flashcardCloneCounts)
                .sort(([, a], [, b]) => b - a)[0];
    
            if (mostClonedEntry) {
                const [flashcardId, cloneCount] = mostClonedEntry;
                const [userId, fcId] = flashcardId.split('/');
                const flashcardDoc = await getDoc(doc(db, `users/${userId}/flashcards/${fcId}`));
                if (flashcardDoc.exists()) {
                    mostClonedFlashcard = {
                        title: flashcardDoc.data().title,
                        count: cloneCount
                    };
                }
            }
    
            // อัพเดท statistics โดยคงค่า reportedFlashcards เดิมไว้
            setStatistics(prev => ({
                ...prev,
                totalUsers,
                totalFlashcards,
                clonedFlashcards: clonedCount,
                mostClonedFlashcard
            }));
    
            // เพิ่ม log เพื่อตรวจสอบค่า
            console.log('Statistics:', {
                totalUsers,
                totalFlashcards,
                clonedFlashcards: clonedCount,
                mostClonedFlashcard
            });
    
        } catch (error) {
            console.error("Error fetching statistics:", error);
        }
    };

    const fetchUserBehaviorStats = async () => {
        try {
            let creatorCounts = {};    // เปลี่ยนเป็นเก็บตาม email
            let cloneCounts = {};      // เปลี่ยนเป็นเก็บตาม email
            let publicCount = 0;
            let privateCount = 0;
            let studiedFlashcards = [];
    
            const usersSnapshot = await getDocs(collection(db, 'users'));
            
            // สร้าง map ของ userId -> email เพื่อใช้อ้างอิง
            const userEmails = {};
            usersSnapshot.docs.forEach(doc => {
                userEmails[doc.id] = doc.data().email;
            });
    
            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                const userEmail = userDoc.data().email;  // ดึง email ของผู้ใช้
                const flashcardsSnapshot = await getDocs(collection(db, `users/${userId}/flashcards`));
                const flashcards = flashcardsSnapshot.docs;
    
                // นับจำนวน Flashcards ที่สร้าง
                if (flashcards.length > 0) {
                    creatorCounts[userEmail] = (creatorCounts[userEmail] || 0) + flashcards.length;
                }
    
                flashcards.forEach((flashcard) => {
                    const data = flashcard.data();
    
                    // นับการ Clone
                    if (data.clonedFrom) {
                        const originalCreatorId = data.clonedFrom.split('/')[0];
                        const originalCreatorEmail = userEmails[originalCreatorId];
                        if (originalCreatorEmail) {
                            cloneCounts[originalCreatorEmail] = (cloneCounts[originalCreatorEmail] || 0) + 1;
                        }
                    }
    
                    // นับ Public/Private
                    if (data.isPublic) {
                        publicCount++;
                    } else {
                        privateCount++;
                    }
    
                    // เก็บข้อมูลการเรียน
                    if (data.studyCount) {
                        studiedFlashcards.push({
                            id: flashcard.id,
                            title: data.title,
                            studyCount: data.studyCount,
                            creatorEmail: userEmail
                        });
                    }
                });
            }
    
            // จัดเรียงข้อมูล Top Creators
            const sortedCreators = Object.entries(creatorCounts)
                .map(([email, count]) => ({ email, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
    
            // จัดเรียงข้อมูล Most Cloned
            const sortedCloners = Object.entries(cloneCounts)
                .map(([email, count]) => ({ email, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
    
            // จัดเรียงข้อมูล Most Studied
            const sortedStudied = studiedFlashcards
                .sort((a, b) => b.studyCount - a.studyCount)
                .slice(0, 5);
    
            setTopCreators(sortedCreators);
            setMostClonedCreators(sortedCloners);
            setPublicFlashcards(publicCount);
            setPrivateFlashcards(privateCount);
            setMostStudiedFlashcards(sortedStudied);
    
        } catch (error) {
            console.error("Error fetching user behavior stats:", error);
        }
    };

    const fetchTodayStatistics = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // ดึงจำนวนผู้ใช้ใหม่วันนี้
            const usersQuery = query(
                collection(db, 'users'),
                where('createdAt', '>=', today)
            );
            const usersSnapshot = await getDocs(usersQuery);
            setTodayUsers(usersSnapshot.size);

            // ดึงจำนวน Flashcards ที่ถูกสร้างวันนี้
            let flashcardCount = 0;
            let cloneCount = 0;
            const usersSnapshotAll = await getDocs(collection(db, 'users'));

            for (const userDoc of usersSnapshotAll.docs) {
                const userId = userDoc.id;
                const flashcardsQuery = query(
                    collection(db, `users/${userId}/flashcards`),
                    where('createdAt', '>=', today)
                );
                const flashcardsSnapshot = await getDocs(flashcardsQuery);
                flashcardCount += flashcardsSnapshot.size;

                // ดึงจำนวน Clone วันนี้
                flashcardsSnapshot.docs.forEach((doc) => {
                    const data = doc.data();
                    if (data.clonedFrom) cloneCount++;
                });
            }

            setTodayFlashcards(flashcardCount);
            setTodayClones(cloneCount);
        } catch (error) {
            console.error("Error fetching today's statistics:", error);
        }
    };

    const fetchReports = async () => {
        try {
            const reportsRef = collection(db, 'reports');
            const reportsSnapshot = await getDocs(reportsRef);
            const reportList = reportsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setReports(reportList);
            setStatistics(prev => ({
                ...prev,
                reportedFlashcards: reportList.length
            }));
        } catch (error) {
            console.error("Error fetching reports:", error);
        }
    };

    const handleDeleteFlashcard = async (flashcardId, userId, reportId) => {
        try {
            await deleteDoc(doc(db, `users/${userId}/flashcards/${flashcardId}`));
            await deleteDoc(doc(db, "reports", reportId));

            setReports((prevReports) => prevReports.filter(report => report.id !== reportId));
            alert("🗑️ ลบ Flashcard และ Report สำเร็จ!");
        } catch (error) {
            console.error("Error deleting flashcard:", error);
            alert("❌ ไม่สามารถลบ Flashcard ได้");
        }
    };

    const handleDismissReport = async (reportId) => {
        try {
            await deleteDoc(doc(db, "reports", reportId));
            setReports((prevReports) => prevReports.filter(report => report.id !== reportId));
            alert("✅ รายงานถูกลบแล้ว");
        } catch (error) {
            console.error("Error dismissing report:", error);
            alert("❌ ไม่สามารถลบรายงานได้");
        }
    };

    const handleEditFlashcard = (flashcardId, userId) => {
        navigate(`/edit-flashcard/${userId}/${flashcardId}`);
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-600">❌ คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-600">กำลังโหลด...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Statistics Section */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="bg-white rounded-2xl shadow-md p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">
                            สถิติพื้นฐานของระบบ
                        </h2>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                            อัพเดทล่าสุด: {new Date().toLocaleString('th-TH')}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {/* Total Users Card */}
                        <StatCard
                            title="ผู้ใช้ทั้งหมด"
                            value={statistics.totalUsers}
                            bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
                            icon={
                                <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            }
                        />

                        {/* Total Flashcards Card */}
                        <StatCard
                            title="Flashcards ทั้งหมด"
                            value={statistics.totalFlashcards}
                            bgColor="bg-gradient-to-br from-emerald-500 to-emerald-600"
                            icon={
                                <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            }
                        />

                        {/* Reported Flashcards Card */}
                        <StatCard
                            title="Flashcards ที่ถูกรายงาน"
                            value={statistics.reportedFlashcards}
                            bgColor="bg-gradient-to-br from-red-500 to-red-600"
                            icon={
                                <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            }
                        />

                        {/* Cloned Flashcards Card */}
                        <StatCard
                            title="Flashcards ที่ถูก Clone"
                            value={statistics.clonedFlashcards}
                            bgColor="bg-gradient-to-br from-amber-500 to-amber-600"
                            icon={
                                <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            }
                        />

                        {/* Most Cloned Flashcard Card */}
                        {statistics.mostClonedFlashcard && (
                            <StatCard
                                title="Flashcard ที่ถูก Clone มากที่สุด"
                                value={`${statistics.mostClonedFlashcard.count} ครั้ง`}
                                bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
                                icon={
                                    <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                }
                            />
                        )}
                    </div>

                    {/* Today's Activity Summary */}
                    <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-800">สรุปกิจกรรมวันนี้</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-4 bg-white p-4 rounded-lg">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <svg className="w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">ผู้ใช้ใหม่</p>
                                    <p className="text-xl font-bold text-gray-800">+{todayUsers}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white p-4 rounded-lg">
                                <div className="bg-green-100 p-3 rounded-full">
                                    <svg className="w-6 h-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Flashcards สร้างใหม่</p>
                                    <p className="text-xl font-bold text-gray-800">+{todayFlashcards}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white p-4 rounded-lg">
                                <div className="bg-amber-100 p-3 rounded-full">
                                    <svg className="w-6 h-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">การ Clone วันนี้</p>
                                    <p className="text-xl font-bold text-gray-800">+{todayClones}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reports Section */}
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">รายการ Flashcards ที่ถูกรายงาน</h1>

                {reports.length === 0 ? (
                    <p className="text-gray-600 text-center">ไม่มี Flashcard ที่ถูกรายงาน</p>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-200 text-gray-700">
                                <th className="py-3 px-4 text-left">Flashcard ID</th>
                                <th className="py-3 px-4 text-left">เหตุผล</th>
                                <th className="py-3 px-4 text-left">ผู้รายงาน</th>
                                <th className="py-3 px-4 text-left">วันที่</th>
                                <th className="py-3 px-4 text-center">การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr key={report.id} className="border-t hover:bg-gray-50">
                                    <td className="py-3 px-4">{report.flashcardId}</td>
                                    <td className="py-3 px-4">{report.reason}</td>
                                    <td className="py-3 px-4">{report.reportedByEmail || "ไม่ทราบ"}</td>
                                    <td className="py-3 px-4">{new Date(report.createdAt.seconds * 1000).toLocaleString()}</td>
                                    <td className="py-3 px-4 flex justify-center gap-2">
                                        {/* 📝 ปุ่มแก้ไข */}
                                        <button
                                            onClick={() => handleEditFlashcard(report.flashcardId, report.userId)}
                                            className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 20h9" />
                                                <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19H3v-4L16.5 3.5z" />
                                            </svg>
                                            แก้ไข
                                        </button>

                                        {/* 🗑️ ปุ่มลบ Flashcard */}
                                        <button
                                            onClick={() => handleDeleteFlashcard(report.flashcardId, report.userId, report.id)}
                                            className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 6h18" />
                                                <path d="M8 6V4h8v2" />
                                                <path d="M19 6l-1 14H6L5 6" />
                                                <path d="M10 11v6" />
                                                <path d="M14 11v6" />
                                            </svg>
                                            ลบ
                                        </button>

                                        {/* ✅ ปุ่มลบเฉพาะ Report */}
                                        <button
                                            onClick={() => handleDismissReport(report.id)}
                                            className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* User Behavior Statistics Section */}
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6 mt-8">
                <h2 className="text-xl font-semibold mb-6">สถิติพฤติกรรมการใช้งานของผู้ใช้</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Creators */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">
                            ผู้ใช้ที่สร้าง Flashcards มากที่สุด
                        </h3>
                        <div className="space-y-2">
                            {topCreators.map((user, index) => (
                                <div key={user.userId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <span className="text-blue-700">#{index + 1} {user.email}</span>
                                    <span className="font-semibold">{user.count} Flashcards</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;