import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Shield, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  User, 
  LogOut,
  Home,
  Brain,
  BookOpen,
  Globe
} from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currentLanguage, changeLanguage, t, languages } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      if (!event.target.closest('.language-menu-container')) {
        setShowLanguageMenu(false);
      }
      if (!event.target.closest('.mobile-menu-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  };

  const handleLogout = () => {
    logout(true); // Show success message for user-initiated logout
    navigate('/login');
    setShowUserMenu(false);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Shield className="h-7 w-7 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              CYsafe
            </span>
          </Link>

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            {/* Navigation links for desktop */}
            <Link
              to="/dashboard"
              className={`hidden md:flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>{t('dashboard')}</span>
            </Link>
            
            <Link
              to="/quiz"
              className={`hidden md:flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/quiz'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Brain className="h-4 w-4" />
              <span>{t('quiz')}</span>
            </Link>
            
            <Link
              to="/learn"
              className={`hidden md:flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/learn'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>{t('learn')}</span>
            </Link>

            {/* Language dropdown */}
            <div className="relative language-menu-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLanguageMenu(!showLanguageMenu);
                }}
                className="flex items-center space-x-1 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Globe className="h-5 w-5" />
                <span className="hidden sm:block text-sm">{getCurrentLanguage().flag}</span>
              </button>

              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeLanguage(language.code);
                        setShowLanguageMenu(false);
                      }}
                      className={`flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                        currentLanguage === language.code
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="mr-2">{language.flag}</span>
                      <span>{language.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* User menu or Login */}
            {user ? (
              <div className="relative user-menu-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(!showUserMenu);
                  }}
                  className="flex items-center space-x-2 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:block text-sm font-medium">{user.username}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <Link
                      to="/profile"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUserMenu(false);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      {t('profile')}
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mobile-menu-container"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 mobile-menu-container">
          <div className="px-4 py-3 bg-white dark:bg-gray-800 space-y-1">
            <Link
              to="/dashboard"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            >
              <Home className="h-5 w-5" />
              <span>{t('dashboard')}</span>
            </Link>
            
            <Link
              to="/quiz"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                location.pathname === '/quiz'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            >
              <Brain className="h-5 w-5" />
              <span>{t('quiz')}</span>
            </Link>
            
            <Link
              to="/learn"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                location.pathname === '/learn'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            >
              <BookOpen className="h-5 w-5" />
              <span>{t('learn')}</span>
            </Link>
            
            {/* Mobile Language Selection */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('language')}
              </div>
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={(e) => {
                    e.stopPropagation();
                    changeLanguage(language.code);
                    setIsOpen(false);
                  }}
                  className={`flex items-center w-full px-3 py-2 text-base font-medium transition-colors ${
                    currentLanguage === language.code
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-2">{language.flag}</span>
                  <span>{language.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;