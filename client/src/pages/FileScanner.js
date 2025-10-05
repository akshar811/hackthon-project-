import React, { useState, useCallback } from 'react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

import useReportGenerator from '../hooks/useReportGenerator';
import AIReportViewer from '../components/AIReportViewer';
import { 
  Upload, 
  File, 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  FileText,
  Scan,
  Bot,
  Sparkles
} from 'lucide-react';

const FileScanner = () => {
  const { t } = useLanguage();
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
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/scan/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      
      if (response.data.results.riskLevel === 'malicious') {
        toast.error('⚠️ MALWARE DETECTED! This file is dangerous.');
      } else if (response.data.results.riskLevel === 'suspicious') {
        toast.error('⚠️ SUSPICIOUS FILE! Exercise caution.');
      } else {
        toast.success('✅ File is SAFE! No threats detected.');
      }
      
      toast.success('📊 Scan count updated in your profile!');
      window.dispatchEvent(new CustomEvent('scanCompleted'));
    } catch (error) {
      console.error('File scan error:', error);
      toast.error(error.response?.data?.error || 'Upload failed');
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
      default: return File;
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
          <Scan className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('fileScannerTitle')}</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t('fileScannerDesc')}
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
          onClick={() => !uploading && document.getElementById('fileInput').click()}
        >
          <input
            id="fileInput"
            type="file"
            className="hidden"
            onChange={handleFileInput}
            accept="*/*"
            disabled={uploading}
          />
          
          <Upload className="mx-auto h-16 w-16 text-gray-400 mb-6" />
          
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
                {dragActive ? 'Drop the file here' : t('dragDropFile')}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                or click to browse files
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {t('supportedFormats')} • {t('maxFileSize')}
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
                  <span>{t('scanningFile')}</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>{t('scan')}</span>
                </>
              )}
            </button>
          </div>
        )}
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
                    {t('scanComplete')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {result.fileName}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {result.results?.score || 0}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Risk {t('score')}</p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {result.results?.details?.virusTotal?.positives || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('threatDetected')}</p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {result.results?.details?.virusTotal?.total || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Engines</p>
              </div>
            </div>

            {/* Risk Alert */}
            {result.results?.riskLevel === 'malicious' && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Shield className="h-6 w-6 text-red-600" />
                  <span className="font-bold text-red-800 dark:text-red-200 text-lg">⚠️ {t('malwareDetected')}!</span>
                </div>
                <p className="text-red-700 dark:text-red-300">
                  This file contains malicious code. Do not open or execute this file.
                </p>
              </div>
            )}
            
            {result.results?.riskLevel === 'suspicious' && (
              <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  <span className="font-bold text-yellow-800 dark:text-yellow-200 text-lg">⚠️ {t('suspicious')} FILE!</span>
                </div>
                <p className="text-yellow-700 dark:text-yellow-300">
                  This file shows suspicious characteristics. Exercise caution.
                </p>
              </div>
            )}
            
            {result.results?.riskLevel === 'safe' && (
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="font-bold text-green-800 dark:text-green-200 text-lg">✅ {t('fileSafe')}!</span>
                </div>
                <p className="text-green-700 dark:text-green-300">
                  No threats detected. This file appears to be clean.
                </p>
              </div>
            )}
            
            {/* AI Report Button */}
            <div className="mt-6 text-center">
              <button
                onClick={async () => {
                  try {
                    const scanData = {
                      scanType: 'file',
                      fileName: result.fileName,
                      hashes: result.hashes,
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
                    <span>{t('loading')}...</span>
                  </>
                ) : (
                  <>
                    <Bot className="h-5 w-5" />
                    <Sparkles className="h-4 w-4" />
                    <span>{t('generate')} AI Report</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* File Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              File Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">File Name</p>
                <p className="text-gray-900 dark:text-white font-medium">{result.fileName}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">File Size</p>
                <p className="text-gray-900 dark:text-white font-medium">{formatFileSize(result.fileSize)}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">File Type</p>
                <p className="text-gray-900 dark:text-white font-medium">{result.fileType}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">SHA256</p>
                <p className="text-gray-900 dark:text-white font-mono text-sm break-all">
                  {result.hashes?.sha256}
                </p>
              </div>
            </div>
          </div>

          {/* Engine Results */}
          {result.results?.engines?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Antivirus Engine Results
              </h4>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {result.results.engines.slice(0, 10).map((engine, index) => (
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
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
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

export default FileScanner;