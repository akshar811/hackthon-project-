import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FileScanner from './pages/FileScanner';
import URLChecker from './pages/URLChecker';
import EmailAnalyzer from './pages/EmailAnalyzer';
import APKAnalyzer from './pages/APKAnalyzer';
import PasswordChecker from './pages/PasswordChecker';
import PasswordGenerator from './pages/PasswordGenerator';
import Profile from './pages/Profile';
import Quiz from './pages/Quiz';
import Learn from './pages/Learn';

function App() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div className={theme}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Navbar />
          
          <main className="pt-16">
            <Routes>
            <Route 
              path="/login" 
              element={!user ? <Login /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/register" 
              element={!user ? <Register /> : <Navigate to="/dashboard" />} 
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scan/file" element={
              <ProtectedRoute>
                <FileScanner />
              </ProtectedRoute>
            } />
            <Route path="/scan/url" element={
              <ProtectedRoute>
                <URLChecker />
              </ProtectedRoute>
            } />
            <Route path="/analyze/email" element={
              <ProtectedRoute>
                <EmailAnalyzer />
              </ProtectedRoute>
            } />
            <Route path="/analyze/apk" element={
              <ProtectedRoute>
                <APKAnalyzer />
              </ProtectedRoute>
            } />
            <Route path="/analyze/password" element={
              <ProtectedRoute>
                <PasswordChecker />
              </ProtectedRoute>
            } />
            <Route path="/generate/password" element={
              <ProtectedRoute>
                <PasswordGenerator />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/quiz" element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            } />
            <Route path="/learn" element={
              <ProtectedRoute>
                <Learn />
              </ProtectedRoute>
            } />
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" />} 
            />
            <Route 
              path="*" 
              element={<Navigate to="/dashboard" />} 
            />
            </Routes>
          </main>
        </div>
      </div>
    </LanguageProvider>
  );
}

export default App;