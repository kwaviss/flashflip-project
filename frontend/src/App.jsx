import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import FlashcardPage from './pages/FlashcardPage';
import AdminDashboard from './pages/AdminDashboard';
import HomePro from './pages/HomePro';
import ViewFlashcardPage from './pages/ViewFlashcardPage'; // สมมติว่ามีหน้า ViewFlashcard

import FavoriteWords from './pages/FavoriteWords';
import CreateFlashcard from './pages/CreateFlashcard';
import EditFlashcard from './pages/EditFlashcard';
import LearnFlashcardPage from './pages/LearnFlashcardPage';
import CommunityPage from './pages/CommunityPage';

const App = () => {
    return (
        <Router>
            <Navbar />    
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/flashcards" element={<FlashcardPage />} />
                <Route path="/homepro" element={<HomePro />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/edit-flashcard/:id" element={<EditFlashcard />} />
                <Route path="/favorites" element={<FavoriteWords />} />
                <Route path="/community" element={<CommunityPage />} />   
                <Route path="/flashcards/:userId/:flashcardId" element={<ViewFlashcardPage />} />
                <Route path="/create-flashcard" element={<CreateFlashcard />} />
                <Route path="/flashcards/:id" element={<LearnFlashcardPage />} />

            </Routes>
        </Router>
    );
};

export default App;
