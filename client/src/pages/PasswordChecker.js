import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Key, Eye, EyeOff, Shield, CheckCircle, X, Lock } from 'lucide-react';

const PasswordChecker = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Please enter a password');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post('/api/analysis/password', { password });
      setResult(response.data.results);
      toast.success('Password analysis completed');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'strong': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'weak': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStrengthBg = (strength) => {
    switch (strength) {
      case 'strong': return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'weak': return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getCheckLabel = (check) => {
    const labels = {
      length: 'At least 8 characters',
      uppercase: 'Contains uppercase letters',
      lowercase: 'Contains lowercase letters',
      numbers: 'Contains numbers',
      symbols: 'Contains special characters'
    };
    return labels[check] || check;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
          <Lock className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Password Security Checker</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Test your password strength and get recommendations to improve your security.
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Enter Password to Analyze
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full pl-12 pr-12 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors text-lg"
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Analyzing Password...</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                <span>Check Password Strength</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Strength Score Card */}
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 p-8 ${getStrengthBg(result.details.strength)}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Shield className={`h-10 w-10 ${getStrengthColor(result.details.strength)}`} />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Password Strength: {result.details.strength.toUpperCase()}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Security Score: {result.score}/100
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <div className={`text-4xl font-bold ${getStrengthColor(result.details.strength)}`}>
                  {result.score}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
              <div
                className={`h-4 rounded-full transition-all duration-1000 ${
                  result.details.strength === 'strong' ? 'bg-green-500' :
                  result.details.strength === 'medium' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${result.score}%` }}
              ></div>
            </div>

            {/* Strength Message */}
            <div className="mt-4">
              {result.details.strength === 'strong' && (
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="font-bold text-green-800 dark:text-green-200 text-lg">✅ STRONG PASSWORD!</span>
                  </div>
                  <p className="text-green-700 dark:text-green-300 mt-1">
                    Your password meets all security requirements and is highly secure.
                  </p>
                </div>
              )}
              
              {result.details.strength === 'medium' && (
                <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-yellow-600" />
                    <span className="font-bold text-yellow-800 dark:text-yellow-200 text-lg">⚠️ MEDIUM STRENGTH</span>
                  </div>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Your password is decent but could be improved for better security.
                  </p>
                </div>
              )}
              
              {result.details.strength === 'weak' && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <X className="h-6 w-6 text-red-600" />
                    <span className="font-bold text-red-800 dark:text-red-200 text-lg">❌ WEAK PASSWORD!</span>
                  </div>
                  <p className="text-red-700 dark:text-red-300 mt-1">
                    Your password is vulnerable. Please follow the suggestions below to improve it.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Security Requirements Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Security Requirements
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result.details.checks).map(([check, passed]) => (
                <div key={check} className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  {passed ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <X className="h-6 w-6 text-red-500" />
                  )}
                  <span className={`font-medium ${passed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {getCheckLabel(check)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions Card */}
          {result.details.suggestions && result.details.suggestions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Improvement Suggestions
              </h4>
              <div className="space-y-3">
                {result.details.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Tips */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Password Security Tips
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Use Unique Passwords</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Never reuse passwords across multiple accounts</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Enable 2FA</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add two-factor authentication for extra security</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Use Password Manager</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Let a password manager generate and store strong passwords</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Regular Updates</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Change passwords regularly, especially after breaches</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordChecker;