import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Link as LinkIcon, Search, AlertTriangle, CheckCircle, Shield, Globe, Bot, Sparkles } from 'lucide-react';

import useReportGenerator from '../hooks/useReportGenerator';
import AIReportViewer from '../components/AIReportViewer';

const URLChecker = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  const [showAIReport, setShowAIReport] = useState(false);
  
  const { isGenerating, report, generateReport, clearReport } = useReportGenerator();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setScanning(true);
    const startTime = new Date();
    
    try {
      const response = await api.post('/scan/url', { url: url.trim() });
      setResult({
        ...response.data,
        scanStartTime: startTime.toISOString()
      });
      
      const riskLevel = response.data.results?.riskLevel;
      if (riskLevel === 'malicious') {
        toast.error('🚨 MALICIOUS URL! This URL is dangerous.');
      } else if (riskLevel === 'phishing') {
        toast.error('🎣 PHISHING DETECTED! This URL is trying to steal information.');
      } else if (riskLevel === 'suspicious') {
        toast.error('⚠️ SUSPICIOUS URL! Exercise caution.');
      } else {
        toast.success('✅ URL is SAFE! No threats detected.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Scan failed');
    } finally {
      setScanning(false);
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
      default: return LinkIcon;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
          <Globe className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">URL Security Checker</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Analyze URLs for phishing, malware, and other security threats using advanced detection engines.
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="url" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Enter URL to Analyze
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors text-lg"
                placeholder="https://example.com"
                disabled={scanning}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={scanning || !url.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {scanning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Analyzing URL...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>Analyze URL Security</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 p-8 ${getRiskBg(result.results?.riskLevel)}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {(() => {
                  const RiskIcon = getRiskIcon(result.results?.riskLevel);
                  return <RiskIcon className={`h-10 w-10 ${getRiskColor(result.results?.riskLevel)}`} />;
                })()}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Analysis Complete
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 break-all">
                    {result.target}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="text-center p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {result.results?.score || 0}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Risk Score</p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl">
                <p className={`text-3xl font-bold ${getRiskColor(result.results?.riskLevel)}`}>
                  {result.results?.riskLevel?.toUpperCase() || 'UNKNOWN'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Risk Level</p>
              </div>
            </div>

            {/* Risk Alerts */}
            {result.results?.riskLevel === 'malicious' && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Shield className="h-6 w-6 text-red-600" />
                  <span className="font-bold text-red-800 dark:text-red-200 text-lg">🚨 MALICIOUS URL!</span>
                </div>
                <p className="text-red-700 dark:text-red-300">
                  This URL contains malware or is used for malicious activities. Do not visit this site.
                </p>
              </div>
            )}
            
            {result.results?.riskLevel === 'phishing' && (
              <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                  <span className="font-bold text-orange-800 dark:text-orange-200 text-lg">🎣 PHISHING DETECTED!</span>
                </div>
                <p className="text-orange-700 dark:text-orange-300">
                  This URL is attempting to steal your personal information. Do not enter any credentials.
                </p>
              </div>
            )}
            
            {result.results?.riskLevel === 'suspicious' && (
              <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  <span className="font-bold text-yellow-800 dark:text-yellow-200 text-lg">⚠️ SUSPICIOUS URL!</span>
                </div>
                <p className="text-yellow-700 dark:text-yellow-300">
                  This URL shows suspicious characteristics. Exercise caution when visiting.
                </p>
              </div>
            )}
            
            {result.results?.riskLevel === 'safe' && (
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="font-bold text-green-800 dark:text-green-200 text-lg">✅ URL IS SAFE!</span>
                </div>
                <p className="text-green-700 dark:text-green-300">
                  No threats detected. This URL appears to be safe to visit.
                </p>
              </div>
            )}
          </div>

          {/* Details Card */}
          {result.results?.details && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Analysis Details
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Detections</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.results.details.positives || 0} / {result.results.details.total || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Scan Time</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {result.scanStartTime 
                      ? new Date(result.scanStartTime).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: '2-digit', 
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })
                      : 'Just now'
                    }
                  </p>
                </div>
              </div>

              {/* URL Information */}
              {result.results.details.urlInfo && (
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    URL Information
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Domain</p>
                      <p className="text-gray-900 dark:text-white font-mono text-sm">
                        {result.results.details.urlInfo.domain}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Protocol</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {result.results.details.urlInfo.protocol}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Reputation</p>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        result.results.details.reputation === 'Good' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        result.results.details.reputation === 'Questionable' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        result.results.details.reputation === 'Suspicious' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {result.results.details.reputation}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Recommendations */}
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <h5 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
                  Security Recommendations
                </h5>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  {result.results.riskLevel === 'malicious' && (
                    <>
                      <li>• Do not visit this URL</li>
                      <li>• Do not download any files from this site</li>
                      <li>• Report this URL to your security team</li>
                    </>
                  )}
                  {result.results.riskLevel === 'phishing' && (
                    <>
                      <li>• Do not enter any personal information</li>
                      <li>• Do not enter login credentials</li>
                      <li>• Report this phishing attempt</li>
                    </>
                  )}
                  {result.results.riskLevel === 'suspicious' && (
                    <>
                      <li>• Exercise caution when visiting this URL</li>
                      <li>• Avoid entering sensitive information</li>
                      <li>• Use additional security measures</li>
                    </>
                  )}
                  {result.results.riskLevel === 'safe' && (
                    <>
                      <li>• This URL appears safe to visit</li>
                      <li>• Always verify SSL certificates</li>
                      <li>• Keep your browser updated</li>
                    </>
                  )}
                </ul>
              </div>
              
              {/* AI Report Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={async () => {
                    try {
                      const scanData = {
                        scanType: 'url',
                        url: result.target,
                        results: result.results
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

          {/* Engine Results */}
          {result.results?.details?.engines && result.results.details.engines.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Security Engine Results ({result.results.details.positives} detections out of {result.results.details.total} engines)
              </h4>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {result.results.details.engines.slice(0, 20).map((engine, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center space-x-3">
                      {engine.detected ? (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {engine.name}
                      </span>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      engine.detected 
                        ? engine.category === 'phishing' 
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {engine.detected ? engine.result : 'Clean'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* AI Report Viewer */}
          {showAIReport && report && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                  <Bot className="h-8 w-8 text-purple-600" />
                  <span>AI-Powered Security Analysis</span>
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
              <AIReportViewer reportData={report} scanResults={result.results} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default URLChecker;