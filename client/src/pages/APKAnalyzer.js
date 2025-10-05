import React, { useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import useReportGenerator from '../hooks/useReportGenerator';
import AIReportViewer from '../components/AIReportViewer';
import { 
  Smartphone, 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  Key, 
  FileText,
  Lock,
  Bot,
  Sparkles
} from 'lucide-react';

const APKAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showAIReport, setShowAIReport] = useState(false);
  
  const { isGenerating, report, generateReport, clearReport } = useReportGenerator();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['.apk'];
    const fileExt = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));

    if (!allowedTypes.includes(fileExt)) {
      toast.error('Please upload an APK file');
      return;
    }

    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an APK file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/analysis/apk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data.results);
      
      if (response.data.results.riskLevel === 'malicious') {
        toast.error('⚠️ MALICIOUS APK DETECTED! This app is dangerous.');
      } else if (response.data.results.riskLevel === 'suspicious') {
        toast.error('⚠️ SUSPICIOUS APK! Exercise caution.');
      } else {
        toast.success('✅ APK is SAFE! No threats detected.');
      }
      
      window.dispatchEvent(new CustomEvent('scanCompleted'));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Analysis failed');
    } finally {
      setUploading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'safe': return 'text-green-600';
      case 'suspicious': return 'text-yellow-600';
      case 'malicious': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBg = (riskLevel) => {
    switch (riskLevel) {
      case 'safe': return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'suspicious': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'malicious': return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'safe': return CheckCircle;
      case 'suspicious': return AlertTriangle;
      case 'malicious': return Shield;
      default: return Smartphone;
    }
  };

  const isDangerousPermission = (permission) => {
    const dangerous = [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.READ_CONTACTS',
      'android.permission.WRITE_CONTACTS',
      'android.permission.READ_SMS',
      'android.permission.SEND_SMS',
      'android.permission.CALL_PHONE',
      'android.permission.READ_PHONE_STATE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.WRITE_SETTINGS'
    ];
    return dangerous.includes(permission);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
          <Smartphone className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">APK Security Analyzer</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Upload and analyze Android APK files for malware, permissions, and security risks.
        </p>
      </div>

      {/* Upload Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && document.getElementById('apkInput').click()}
        >
          <input
            id="apkInput"
            type="file"
            className="hidden"
            onChange={handleFileInput}
            accept=".apk"
            disabled={uploading}
          />
          
          <Smartphone className="mx-auto h-16 w-16 text-gray-400 mb-6" />
          
          {file ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {file.name}
                </p>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {dragActive ? 'Drop the APK file here' : 'Drag & drop an APK file here'}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                or click to browse files
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Supports APK files only • Maximum size: 50MB
              </p>
            </div>
          )}
        </div>

        {file && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 flex items-center space-x-3 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Analyzing APK...</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Analyze APK Security</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Risk Assessment Card */}
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 p-8 ${getRiskBg(result.riskLevel)}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {(() => {
                  const RiskIcon = getRiskIcon(result.riskLevel);
                  return <RiskIcon className={`h-10 w-10 ${getRiskColor(result.riskLevel)}`} />;
                })()}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    APK Analysis Complete
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Risk Level: {result.riskLevel.toUpperCase()}
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <div className={`text-4xl font-bold ${getRiskColor(result.riskLevel)}`}>
                  {result.score}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Risk Score</p>
              </div>
            </div>

            {/* Risk Alerts */}
            {result.riskLevel === 'malicious' && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Shield className="h-6 w-6 text-red-600" />
                  <span className="font-bold text-red-800 dark:text-red-200 text-lg">⚠️ MALICIOUS APK!</span>
                </div>
                <p className="text-red-700 dark:text-red-300">
                  This APK contains malicious code. Do not install this application.
                </p>
              </div>
            )}
            
            {result.riskLevel === 'suspicious' && (
              <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  <span className="font-bold text-yellow-800 dark:text-yellow-200 text-lg">⚠️ SUSPICIOUS APK!</span>
                </div>
                <p className="text-yellow-700 dark:text-yellow-300">
                  This APK shows suspicious characteristics. Exercise caution before installing.
                </p>
              </div>
            )}
            
            {result.riskLevel === 'safe' && (
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="font-bold text-green-800 dark:text-green-200 text-lg">✅ APK IS SAFE!</span>
                </div>
                <p className="text-green-700 dark:text-green-300">
                  No threats detected. This APK appears to be safe to install.
                </p>
              </div>
            )}
          </div>

          {/* APK Information Card */}
          {result.details.apkInfo && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                APK Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Package Name</p>
                  <p className="text-gray-900 dark:text-white font-mono text-sm">
                    {result.details.apkInfo.packageName || 'com.example.app'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Version</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {result.details.apkInfo.version || '1.0.0'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Target SDK</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {result.details.apkInfo.targetSdk || 'API 30'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">File Size</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Permissions Analysis Card */}
          {result.details.permissions && result.details.permissions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Permissions Analysis ({result.details.permissions.length} permissions)
              </h4>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {result.details.permissions.map((permission, index) => (
                  <div key={index} className={`flex items-center justify-between p-4 rounded-xl ${
                    isDangerousPermission(permission) 
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                      : 'bg-gray-50 dark:bg-gray-700'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <Key className={`h-5 w-5 ${
                        isDangerousPermission(permission) ? 'text-red-500' : 'text-gray-500'
                      }`} />
                      <span className="text-gray-900 dark:text-white font-mono text-sm">
                        {permission}
                      </span>
                    </div>
                    {isDangerousPermission(permission) && (
                      <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                        Dangerous
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dangerous Permissions Warning Card */}
          {result.details.dangerousPermissions && result.details.dangerousPermissions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <h4 className="text-xl font-bold text-red-800 dark:text-red-200">
                  Dangerous Permissions Detected
                </h4>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <p className="text-red-700 dark:text-red-300 mb-4 font-medium">
                  This APK requests {result.details.dangerousPermissions.length} dangerous permissions that could compromise your privacy and security.
                </p>
                <div className="space-y-3">
                  {result.details.dangerousPermissions.slice(0, 5).map((permission, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-red-100 dark:bg-red-800/30 rounded-lg">
                      <Lock className="h-5 w-5 text-red-500" />
                      <span className="text-red-800 dark:text-red-200 font-mono text-sm">{permission}</span>
                    </div>
                  ))}
                  {result.details.dangerousPermissions.length > 5 && (
                    <p className="text-red-600 dark:text-red-400 text-sm font-medium mt-3">
                      ...and {result.details.dangerousPermissions.length - 5} more dangerous permissions
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security Tips Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              APK Security Best Practices
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">Official Sources Only</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Download apps only from Google Play Store or trusted sources</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">Check Permissions</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Review app permissions before installation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">Keep Updated</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Always use the latest version of apps and Android OS</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">4</div>
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">Enable Security</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Use Google Play Protect and device security features</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">5</div>
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">Scan Before Install</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Always scan APK files with security tools before installation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">6</div>
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">Avoid Sideloading</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Be cautious when installing apps from unknown sources</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* AI Report Button */}
            <div className="mt-6 text-center">
              <button
                onClick={async () => {
                  try {
                    const scanData = {
                      scanType: 'apk',
                      fileName: file?.name,
                      results: { riskLevel: result.riskLevel, score: result.score, details: result.details }
                    };
                    await generateReport(scanData);
                    setShowAIReport(true);
                    toast.success('🤖 AI Report generated successfully!');
                  } catch (error) {
                    toast.error('Failed to generate AI report');
                  }
                }}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center space-x-2 justify-center mx-auto shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Generating AI Report...</span>
                  </>
                ) : (
                  <>
                    <Bot className="h-5 w-5" />
                    <Sparkles className="h-4 w-4" />
                    <span>Generate AI Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* AI Report Viewer */}
          {showAIReport && report && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                  <Bot className="h-8 w-8 text-purple-600" />
                  <span>AI-Powered APK Analysis</span>
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                </h3>
                <button
                  onClick={() => {
                    setShowAIReport(false);
                    clearReport();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <AIReportViewer reportData={report} scanResults={{ riskLevel: result.riskLevel, score: result.score, details: result.details }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default APKAnalyzer;