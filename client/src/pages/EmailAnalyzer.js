import React, { useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import useReportGenerator from '../hooks/useReportGenerator';
import AIReportViewer from '../components/AIReportViewer';
import { 
  Mail, 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  FileText,
  Link as LinkIcon,
  Paperclip,
  ExternalLink,
  Bot,
  Sparkles
} from 'lucide-react';

const EmailAnalyzer = () => {
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
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['.eml', '.msg'];
    const fileExt = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));

    if (!allowedTypes.includes(fileExt)) {
      toast.error('Please upload an EML or MSG file');
      return;
    }

    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 10MB');
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
      toast.error('Please select an email file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/analysis/email', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data.results);
      
      if (response.data.results.riskLevel === 'malicious') {
        toast.error('⚠️ MALICIOUS EMAIL DETECTED! This email contains threats.');
      } else if (response.data.results.riskLevel === 'phishing') {
        toast.error('⚠️ PHISHING EMAIL DETECTED! This is a scam email.');
      } else if (response.data.results.riskLevel === 'suspicious') {
        toast.error('⚠️ SUSPICIOUS EMAIL! Exercise caution.');
      } else {
        toast.success('✅ Email is SAFE! No threats detected.');
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
      case 'phishing': return 'text-orange-600';
      case 'malicious': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBg = (riskLevel) => {
    switch (riskLevel) {
      case 'safe': return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'suspicious': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'phishing': return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      case 'malicious': return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'safe': return CheckCircle;
      case 'suspicious': return AlertTriangle;
      case 'phishing': return AlertTriangle;
      case 'malicious': return Shield;
      default: return Mail;
    }
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
          <Mail className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Email Security Analyzer</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Upload and analyze email files for phishing, malware, suspicious URLs, and malicious attachments.
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
          onClick={() => !uploading && document.getElementById('emailInput').click()}
        >
          <input
            id="emailInput"
            type="file"
            className="hidden"
            onChange={handleFileInput}
            accept=".eml,.msg"
            disabled={uploading}
          />
          
          <Mail className="mx-auto h-16 w-16 text-gray-400 mb-6" />
          
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
                {dragActive ? 'Drop the email file here' : 'Drag & drop an email file here'}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                or click to browse files
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Supports EML, MSG files • Maximum size: 10MB
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
                  <span>Analyzing Email...</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Analyze Email Security</span>
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
                    Email Analysis Complete
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
                  <span className="font-bold text-red-800 dark:text-red-200 text-lg">⚠️ MALICIOUS EMAIL!</span>
                </div>
                <p className="text-red-700 dark:text-red-300">
                  This email contains malicious content. Do not open attachments or click links.
                </p>
              </div>
            )}
            
            {result.riskLevel === 'phishing' && (
              <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                  <span className="font-bold text-orange-800 dark:text-orange-200 text-lg">🎣 PHISHING EMAIL!</span>
                </div>
                <p className="text-orange-700 dark:text-orange-300">
                  This email is attempting to steal your personal information. Do not respond or click links.
                </p>
              </div>
            )}
            
            {result.riskLevel === 'suspicious' && (
              <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  <span className="font-bold text-yellow-800 dark:text-yellow-200 text-lg">⚠️ SUSPICIOUS EMAIL!</span>
                </div>
                <p className="text-yellow-700 dark:text-yellow-300">
                  This email shows suspicious characteristics. Exercise caution.
                </p>
              </div>
            )}
            
            {result.riskLevel === 'safe' && (
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="font-bold text-green-800 dark:text-green-200 text-lg">✅ EMAIL IS SAFE!</span>
                </div>
                <p className="text-green-700 dark:text-green-300">
                  No threats detected. This email appears to be legitimate.
                </p>
              </div>
            )}
          </div>

          {/* Email Headers Card */}
          {result.details.headers && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Email Headers Analysis
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">From</p>
                  <p className="text-gray-900 dark:text-white font-mono text-sm break-all">
                    {result.details.headers.from || 'Not available'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Subject</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {result.details.headers.subject || 'No subject'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">SPF Status</p>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    result.details.headers.spfPass 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {result.details.headers.spfPass ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">DKIM Status</p>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    result.details.headers.dkimPass 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {result.details.headers.dkimPass ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* URLs Found Card */}
          {result.details.urls && result.details.urls.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                URLs Found ({result.details.urls.length})
              </h4>
              <div className="space-y-3">
                {result.details.urls.map((urlData, index) => (
                  <div key={index} className={`p-4 rounded-xl border ${
                    urlData.malicious 
                      ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                      : urlData.suspicious
                      ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <LinkIcon className={`h-5 w-5 ${
                          urlData.malicious ? 'text-red-500' : 
                          urlData.suspicious ? 'text-yellow-500' : 'text-gray-500'
                        }`} />
                        <span className="text-gray-900 dark:text-white font-mono text-sm break-all">
                          {urlData.url}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {urlData.malicious && (
                          <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                            Malicious
                          </span>
                        )}
                        {urlData.suspicious && (
                          <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                            Suspicious
                          </span>
                        )}
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments Card */}
          {result.details.attachments && result.details.attachments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Attachments Analysis ({result.details.attachments.length})
              </h4>
              <div className="space-y-3">
                {result.details.attachments.map((attachment, index) => (
                  <div key={index} className={`p-4 rounded-xl border ${
                    attachment.malicious 
                      ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                      : attachment.suspicious
                      ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Paperclip className={`h-5 w-5 ${
                          attachment.malicious ? 'text-red-500' : 
                          attachment.suspicious ? 'text-yellow-500' : 'text-gray-500'
                        }`} />
                        <div>
                          <p className="text-gray-900 dark:text-white font-semibold">
                            {attachment.filename}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {attachment.type} • {formatFileSize(attachment.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {attachment.malicious && (
                          <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                            Malicious
                          </span>
                        )}
                        {attachment.suspicious && (
                          <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                            Suspicious
                          </span>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {attachment.detections || 0} detections
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Recommendations Card */}
          {result.details.recommendations && result.details.recommendations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Security Recommendations
              </h4>
              <div className="space-y-3">
                {result.details.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{recommendation}</span>
                  </div>
                ))}
              </div>
              
              {/* AI Report Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={async () => {
                    try {
                      const scanData = {
                        scanType: 'email',
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
          )}
          
          {/* AI Report Viewer */}
          {showAIReport && report && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                  <Bot className="h-8 w-8 text-purple-600" />
                  <span>AI-Powered Email Analysis</span>
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

export default EmailAnalyzer;