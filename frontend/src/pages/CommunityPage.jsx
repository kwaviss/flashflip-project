import React, { useState, useEffect, Fragment } from 'react';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';
import { HiFolder, HiClipboardCheck, HiSearch, HiSortDescending, HiTrendingUp, HiUser } from "react-icons/hi";
import { Menu, Transition } from '@headlessui/react';

const CommunityPage = () => {
    const [publicFlashcards, setPublicFlashcards] = useState([]); // ข้อมูลดิบจาก Firestore
    const [displayedFlashcards, setDisplayedFlashcards] = useState([]); // ข้อมูลที่ผ่านการกรองแล้ว
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('latest');
    const [limit, setLimit] = useState(10);

    const auth = getAuth();
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // ตรวจสอบการเข้าสู่ระบบ
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                navigate('/login');
            } else {
                setUser(currentUser);
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // ดึงข้อมูล Flashcards
    useEffect(() => {
        if (user) {
            fetchPublicFlashcards();
        }
    }, [user, limit]);

    // จัดการค้นหาและเรียงลำดับ
    useEffect(() => {
        filterAndSortFlashcards();
    }, [searchTerm, sortOption, publicFlashcards]);

    const fetchPublicFlashcards = async () => {
        setLoading(true);
        try {
            const usersQuery = collection(db, 'users');
            const usersSnapshot = await getDocs(usersQuery);

            let allPublicFlashcards = [];

            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                const flashcardsQuery = query(
                    collection(db, `users/${userId}/flashcards`),
                    where('isPublic', '==', true)
                );
                const flashcardsSnapshot = await getDocs(flashcardsQuery);

                const userFlashcards = flashcardsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    userId: userId,
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    ...doc.data()
                }));

                allPublicFlashcards = [...allPublicFlashcards, ...userFlashcards];
            }

            setPublicFlashcards(allPublicFlashcards);
            filterAndSortFlashcards(allPublicFlashcards);
        } catch (error) {
            console.error('Error fetching public flashcards:', error);
        }
        setLoading(false);
    };

    const filterAndSortFlashcards = (cards = publicFlashcards) => {
        let filtered = [...cards];

        // กรองตามคำค้นหา
        if (searchTerm) {
            filtered = filtered.filter(card => 
                card.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                card.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                card.creatorName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // จัดเรียงข้อมูล
        filtered.sort((a, b) => {
            if (sortOption === 'latest') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else if (sortOption === 'popular') {
                // เรียงตามจำนวนการดู หรือ likes (ถ้ามี)
                return (b.views || 0) - (a.views || 0);
            }
            return 0;
        });

        // จำกัดจำนวนตาม limit
        filtered = filtered.slice(0, limit);

        setDisplayedFlashcards(filtered);
    };

    // ฟังก์ชันจัดการการเปลี่ยนแปลงการค้นหา
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // ฟังก์ชันจัดการการเปลี่ยนการเรียงลำดับ
    const handleSortChange = (option) => {
        setSortOption(option);
    };

    return (
        <div className="min-h-screen bg-[#2D1B69] py-8 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-[32px] p-8">
                <h1 className="text-3xl font-bold mb-8 text-center">Community Flashcards</h1>

                {/* Search Bar + Filter Dropdown */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <HiSearch className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="ค้นหา Flashcard..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full px-10 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Filter Dropdown */}
                    <Menu as="div" className="relative">
                        <Menu.Button className="flex items-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl border border-gray-300 hover:bg-gray-200 transition">
                            {sortOption === 'latest' ? <HiSortDescending className="w-5 h-5" /> : <HiTrendingUp className="w-5 h-5" />}
                            {sortOption === 'latest' ? "เรียงตามล่าสุด" : "เรียงตามยอดนิยม"}
                        </Menu.Button>

                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md p-2 border border-gray-200 z-50">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={() => handleSortChange('latest')}
                                            className={`flex items-center gap-2 w-full px-4 py-2 text-sm rounded-md ${
                                                active ? "bg-gray-100" : ""
                                            }`}
                                        >
                                            <HiSortDescending className="w-5 h-5 text-blue-500" />
                                            เรียงตามล่าสุด
                                        </button>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={() => handleSortChange('popular')}
                                            className={`flex items-center gap-2 w-full px-4 py-2 text-sm rounded-md ${
                                                active ? "bg-gray-100" : ""
                                            }`}
                                        >
                                            <HiTrendingUp className="w-5 h-5 text-red-500" />
                                            เรียงตามยอดนิยม
                                        </button>
                                    )}
                                </Menu.Item>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>

                {/* Flashcards List */}
                <div className="relative">
                    {loading ? (
                        <div>กำลังโหลดข้อมูล...</div>
                    ) : displayedFlashcards.length === 0 ? (
                        <div>ไม่พบ Flashcard ที่ค้นหา</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {displayedFlashcards.map((card) => (
                                <div key={card.id} className="bg-gray-100 p-6 rounded-xl shadow-md flex flex-col gap-2">
                                    <h3 className="font-medium">{card.title}</h3>
                                    <p className="text-sm text-gray-600">{card.description}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                        <HiUser className="w-4 h-4" /> {card.creatorName || "ไม่ระบุ"}
                                    </p>
                                    <div className="flex justify-end mt-3">
                                        <Link
                                            to={`/flashcards/${card.userId}/${card.id}`}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
                                        >
                                            <HiFolder className="w-5 h-5" />
                                            ดูแฟลชการ์ด
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Load More */}
                {displayedFlashcards.length > 0 && displayedFlashcards.length % 10 === 0 && (
                    <div className="flex justify-center mt-6">
                        <button 
                            onClick={() => setLimit(limit + 10)}
                            className="bg-gray-300 px-6 py-2 rounded-xl hover:bg-gray-400 transition"
                        >
                            Load More
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityPage;