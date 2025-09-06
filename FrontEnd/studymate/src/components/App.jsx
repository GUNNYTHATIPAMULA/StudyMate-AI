import React, { useEffect, useState } from 'react';
import { Routes, BrowserRouter, Route, Navigate } from "react-router-dom";
import DashBoard from '../pages/DashBoard';
import Register from '../pages/Register';
import ChatBot from '../pages/ChatBot';
import LoginPage from '../pages/LoginPage';
import { auth } from '../firebase/firebase';
import ImportantQuestions from '../pages/ImportantQuestions';
import Quiz from '../pages/Quiz';
// import Chat from '../pages/Chat';

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null; // Optional: Render a spinner

  return user ? children : <Navigate to="/Login" replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/chatbot" element={<ChatBot />} />
        <Route path="/Quiz" element={<Quiz />} />

        <Route path="/Login" element={<LoginPage />} />
        <Route path="/IMP-Q" element={<ImportantQuestions />} />

        {/* <Route path='/ch' element={<Chat />} /> */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashBoard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
