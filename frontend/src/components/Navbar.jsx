import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Dialog, Transition } from '@headlessui/react';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { db } from "../firebaseConfig";

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false); // ใช้สำหรับ Modal แจ้งเตือน
    const navigate = useNavigate();

    useEffect(() => {
        const auth = getAuth();
        setPersistence(auth, browserLocalPersistence) 
            .then(() => {
                onAuthStateChanged(auth, async (currentUser) => {
                    if (currentUser) {
                        setUser(currentUser);

                        const userRef = doc(db, "users", currentUser.uid);
                        const userSnap = await getDoc(userRef);

                        if (userSnap.exists()) {
                            setRole(userSnap.data().role);
                        } else {
                            const defaultRole = currentUser.email === "admin@example.com" ? "admin" : "user";
                            await setDoc(userRef, { email: currentUser.email, role: defaultRole, createdAt: new Date() });
                            setRole(defaultRole);
                        }
                    } else {
                        setUser(null);
                        setRole(null);
                    }
                    setLoading(false);
                });
            })
            .catch((error) => {
                console.error("Error setting persistence:", error);
                setLoading(false);
            });
    }, []);

    const handleCommunityClick = () => {
        if (!user) {
            setIsModalOpen(true);
            return;
        }
        navigate("/community");
    };

    const handleLogin = async () => {
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        setLoading(true);

        try {
            const result = await signInWithPopup(auth, provider);
            setUser(result.user);

            const userRef = doc(db, "users", result.user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                const defaultRole = result.user.email === "phirunnahid@gmail.com" ? "admin" : "user";
                await setDoc(userRef, { email: result.user.email, role: defaultRole, createdAt: new Date() });
                setRole(defaultRole);
                if (defaultRole === "admin") navigate("/admin-dashboard");
            }
        } catch (error) {
            console.error("Login Failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        const auth = getAuth();
        setLoading(true);
        try {
            await signOut(auth);
            setUser(null);
            setRole(null);
            navigate("/");
        } catch (error) {
            console.error("Logout Failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const goToProfile = () => {
        navigate(role === "admin" ? "/admin-dashboard" : "/homepro");
    };

    return (
        <>
            <nav className="w-full bg-white px-6 py-4 shadow-md">
                <div className="container mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex-1">
                        <a href="/" className="flex items-center">
                            <img src="/assets/logo.png" alt="Flashflip Logo" className="h-12" />
                        </a>
                    </div>

                    {/* Menu and User Info */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 font-medium">
                            <button
                                onClick={handleCommunityClick}
                                className="text-indigo-700 hover:text-indigo-900 transition"
                            >
                                ชุมชน
                            </button>
                            <span className="text-gray-300">|</span>
                        </div>

                        {loading ? (
                            <div className="text-gray-500">กำลังโหลด...</div>
                        ) : user ? (
                            <div className="flex items-center gap-4">
                                <div onClick={goToProfile} className="cursor-pointer flex items-center gap-2">
                                    <img
                                        src="/assets/home-icon.png"
                                        alt="Profile Icon"
                                        className="w-10 h-10"
                                    />
                                    <div>
                                        <p className="text-gray-700 font-medium">{user.displayName}</p>
                                        <p className="text-sm text-gray-500">{role === "admin" ? "Admin" : "User"}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors"
                                >
                                    ออกจากระบบ
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="bg-yellow-400 text-black px-8 py-2.5 rounded-full hover:bg-yellow-500 transition-colors font-medium shadow-lg"
                            >
                                ลงชื่อเข้าใช้
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Modal แจ้งเตือนเมื่อล็อกอินไม่สำเร็จ */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
                    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center">
                        <Dialog.Panel className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-auto">
                            <div className="flex items-center justify-center">
                                <HiOutlineExclamationCircle className="text-red-500 w-10 h-10" />
                            </div>
                            <Dialog.Title className="text-xl font-semibold text-center mt-2">
                                กรุณาล็อกอินก่อนเข้าใช้งานชุมชน!
                            </Dialog.Title>
                            <div className="mt-4 flex justify-center gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                                >
                                    ปิด
                                </button>
                                <button
                                    onClick={handleLogin}
                                    className="bg-yellow-400 px-4 py-2 rounded-lg hover:bg-yellow-500 transition"
                                >
                                    ลงชื่อเข้าใช้
                                </button>
                            </div>
                        </Dialog.Panel>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
};

export default Navbar;
