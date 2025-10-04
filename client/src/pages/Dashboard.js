import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Chatbot from '../components/Chatbot';
import { 
  FileText, 
  Link as LinkIcon, 
  Mail, 
  Smartphone, 
  Key, 
  Shield, 
  Activity,
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalScans: 0,
    safe: 0,
    suspicious: 0,
    threats: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/scan/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };
  const scannerCards = [
    {
      title: t('fileScanner'),
      description: t('fileScannerDesc'),
      icon: FileText,
      href: '/scan/file',
      color: 'bg-blue-500'
    },
    {
      title: t('urlChecker'),
      description: t('urlCheckerDesc'),
      icon: LinkIcon,
      href: '/scan/url',
      color: 'bg-green-500'
    },
    {
      title: t('emailAnalyzer'),
      description: t('emailAnalyzerDesc'),
      icon: Mail,
      href: '/analyze/email',
      color: 'bg-purple-500'
    },
    {
      title: t('apkAnalyzer'),
      description: t('apkAnalyzerDesc'),
      icon: Smartphone,
      href: '/analyze/apk',
      color: 'bg-orange-500'
    },
    {
      title: t('passwordChecker'),
      description: t('passwordCheckerDesc'),
      icon: Key,
      href: '/analyze/password',
      color: 'bg-red-500'
    },
    {
      title: t('passwordGenerator'),
      description: t('passwordGeneratorDesc'),
      icon: RefreshCw,
      href: '/generate/password',
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {user ? `${t('welcome')} ${user.username}!` : 'Welcome to CYsafe!'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {user 
              ? 'Monitor your security scans and analyze threats from your dashboard.'
              : 'Your comprehensive cybersecurity analysis platform. Login to access all security tools and track your scans.'
            }
          </p>
          {!user && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>Note:</strong> Please login to access File Scanner, URL Checker, Email Analyzer, APK Analyzer, Password Checker, and Password Generator.
              </p>
            </div>
          )}
        </div>
      </div>

      {user && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('recentScans')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.totalScans}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('safe')} Files</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.safe}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('malicious')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.threats}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('securityTools')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scannerCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.href}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200 group cursor-pointer block"
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 ${card.color} rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {card.title}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Cybersecurity Chatbot */}
      {user && <Chatbot />}
    </div>
  );
};

export default Dashboard;