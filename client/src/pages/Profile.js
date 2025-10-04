import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Activity, 
  LogOut,
  Settings,
  Sun,
  Moon
} from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    scanCount: 0,
    safeScans: 0,
    threatsDetected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchUserProfile, 30000);
    
    // Listen for scan completion events
    const handleScanCompleted = () => {
      setTimeout(fetchUserProfile, 1000); // Delay to ensure backend update is complete
    };
    
    window.addEventListener('scanCompleted', handleScanCompleted);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('scanCompleted', handleScanCompleted);
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/user/profile');
      console.log('Profile API response:', response.data);
      setUserStats({
        scanCount: response.data.user.scanCount || 0,
        safeScans: response.data.user.safeScans || 0,
        threatsDetected: response.data.user.threatsDetected || 0
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout(true); // Show success message for user-initiated logout
    navigate('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account information and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* User Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Account Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your personal details and account status
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {user?.username || 'Not available'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {user?.email || 'Not available'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Type
                </label>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white capitalize">
                    {user?.role || 'User'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Member Since
                </label>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {user?.createdAt ? formatDate(user.createdAt) : 'Not available'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Stats Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Activity Statistics
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your security scanning activity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {loading ? '...' : userStats.scanCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Scans</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {loading ? '...' : userStats.safeScans}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Safe Files</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {loading ? '...' : userStats.threatsDetected}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Threats Detected</div>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Preferences
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Customize your experience
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-gray-400" />
                ) : (
                  <Sun className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Account Actions
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your session and account access
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;