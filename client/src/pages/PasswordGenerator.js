import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, Copy, Key, Eye, EyeOff, CheckCircle, X, Settings } from 'lucide-react';

const PasswordGenerator = () => {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [options, setOptions] = useState({
    length: 12,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });

  const generatePassword = () => {
    let charset = '';
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.numbers) charset += '0123456789';
    if (options.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (!charset) {
      toast.error('Please select at least one character type');
      return;
    }
    
    let password = '';
    for (let i = 0; i < options.length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    setGeneratedPassword(password);
    toast.success('Password generated successfully!');
  };

  const copyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      toast.success('Password copied to clipboard!');
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 'none', score: 0 };
    
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
    };
    
    Object.values(checks).forEach(check => check && score++);
    
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    
    const percentage = Math.round((score / 7) * 100);
    let strength = 'weak';
    if (percentage >= 80) strength = 'strong';
    else if (percentage >= 60) strength = 'medium';
    
    return { strength, score: percentage, checks };
  };

  const passwordAnalysis = getPasswordStrength(generatedPassword);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
          <Settings className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Password Generator</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Generate secure, random passwords with customizable options to protect your accounts.
        </p>
      </div>

      {/* Generator Options Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Generator Options</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Length Slider */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Password Length: <span className="text-blue-600 font-bold">{options.length}</span>
            </label>
            <input
              type="range"
              min="8"
              max="32"
              value={options.length}
              onChange={(e) => setOptions({...options, length: parseInt(e.target.value)})}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>8 chars</span>
              <span>32 chars</span>
            </div>
          </div>
          
          {/* Character Types */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Character Types
            </label>
            <div className="space-y-4">
              {[
                { key: 'uppercase', label: 'Uppercase Letters', example: '(A-Z)' },
                { key: 'lowercase', label: 'Lowercase Letters', example: '(a-z)' },
                { key: 'numbers', label: 'Numbers', example: '(0-9)' },
                { key: 'symbols', label: 'Symbols', example: '(!@#$...)' }
              ].map(({ key, label, example }) => (
                <label key={key} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={(e) => setOptions({...options, [key]: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{example}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <button
          onClick={generatePassword}
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Generate Secure Password</span>
        </button>
      </div>

      {/* Generated Password Display */}
      {generatedPassword && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Generated Password</h3>
          
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Key className="h-6 w-6 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={generatedPassword}
              readOnly
              className="w-full pl-14 pr-24 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-4">
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              <button
                onClick={copyPassword}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Password Strength Analysis */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Strength: <span className={`${
                  passwordAnalysis.strength === 'strong' ? 'text-green-600' :
                  passwordAnalysis.strength === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {passwordAnalysis.strength.toUpperCase()}
                </span>
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {passwordAnalysis.score}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-4">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ${
                  passwordAnalysis.strength === 'strong' ? 'bg-green-500' :
                  passwordAnalysis.strength === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${passwordAnalysis.score}%` }}
              ></div>
            </div>

            {/* Security Checks */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(passwordAnalysis.checks || {}).map(([check, passed]) => (
                <div key={check} className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-600 rounded-lg">
                  {passed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${passed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {check === 'length' ? '8+ chars' :
                     check === 'uppercase' ? 'A-Z' :
                     check === 'lowercase' ? 'a-z' :
                     check === 'numbers' ? '0-9' : 'Symbols'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Tips Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Password Security Best Practices
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white">Use Long Passwords</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aim for at least 12 characters for better security</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white">Mix Character Types</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Include uppercase, lowercase, numbers, and symbols</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white">Unique Passwords</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Never reuse passwords across multiple accounts</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">4</div>
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white">Use Password Manager</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Store passwords securely and generate strong ones</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">5</div>
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white">Enable 2FA</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add two-factor authentication for extra security</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">6</div>
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white">Regular Updates</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Change passwords regularly, especially after breaches</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;