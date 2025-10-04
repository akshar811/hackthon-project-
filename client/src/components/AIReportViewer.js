import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  BarChart3,
  Clock,
  Hash,
  Globe,
  Cpu
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const AIReportViewer = ({ reportData, scanResults }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef(null);

  if (!reportData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Report Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Generate a security report to view detailed analysis
          </p>
        </div>
      </div>
    );
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'malicious':
        return 'text-red-600 bg-red-100 border-red-300';
      case 'phishing':
        return 'text-red-600 bg-red-100 border-red-300';
      case 'suspicious':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      default:
        return 'text-green-600 bg-green-100 border-green-300';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'malicious':
      case 'phishing':
        return <XCircle className="h-6 w-6" />;
      case 'suspicious':
        return <AlertTriangle className="h-6 w-6" />;
      default:
        return <CheckCircle className="h-6 w-6" />;
    }
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Use server-side PDF generation with complete data
      const { downloadPDF } = require('../hooks/useReportGenerator');
      await downloadPDF();
      
      // Fallback to client-side generation if server fails
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`security-report-${reportData.reportId}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      // Try server-side PDF generation as fallback
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/reports/pdf', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reportData })
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `security-report-${reportData.reportId}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        }
      } catch (serverError) {
        console.error('Server PDF generation also failed:', serverError);
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'analysis', label: 'AI Analysis', icon: Cpu },
    { id: 'detections', label: 'Detections', icon: Shield },
    { id: 'technical', label: 'Technical', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl border-2 ${getRiskColor(reportData.riskLevel)}`}>
              {getRiskIcon(reportData.riskLevel)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Security Analysis Report
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {reportData.target} • Generated {new Date(reportData.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          
          <button
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {isGeneratingPDF ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <Download className="h-5 w-5" />
            )}
            <span>{isGeneratingPDF ? 'Generating...' : 'Download PDF'}</span>
          </button>
        </div>

        {/* Risk Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900 dark:text-white">Risk Score</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {reportData.score}%
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-gray-900 dark:text-white">Detections</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {reportData.summary?.totalDetections || 0}/{reportData.summary?.totalEngines || 0}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-5 w-5 text-green-600" />
              <span className="font-medium text-gray-900 dark:text-white">Status</span>
            </div>
            <div className={`text-lg font-bold ${getRiskColor(reportData.riskLevel).split(' ')[0]}`}>
              {reportData.riskLevel?.toUpperCase()}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-gray-900 dark:text-white">Confidence</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {reportData.riskIndicators?.confidenceLevel || 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div ref={reportRef} className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Executive Summary
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    Security analysis of <strong>{reportData.target}</strong> completed with a risk score of{' '}
                    <strong>{reportData.score}%</strong>. The scan detected{' '}
                    <strong>{reportData.summary?.totalDetections || 0}</strong> potential threats across{' '}
                    <strong>{reportData.summary?.totalEngines || 0}</strong> security engines.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Risk Indicators
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <div className="text-3xl mb-2">{reportData.riskIndicators?.riskSymbol}</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {reportData.riskIndicators?.overallRisk}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {reportData.riskIndicators?.detectionRate}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Detection Rate
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Recommendations
                </h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                  <ul className="space-y-2">
                    {reportData.recommendations?.slice(0, 5).map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-yellow-600 mt-1">•</span>
                        <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  🤖 AI-Powered Analysis
                </h3>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <div className="prose prose-blue dark:prose-invert max-w-none">
                    <ReactMarkdown>{reportData.aiAnalysis}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detections Tab */}
          {activeTab === 'detections' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Security Engine Results
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Engine
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Result
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Category
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {reportData.detectionTable?.slice(0, 15).map((detection, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {detection.engine}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {detection.status}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {detection.result}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              detection.category === 'malicious' ? 'bg-red-100 text-red-800' :
                              detection.category === 'suspicious' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {detection.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Technical Tab */}
          {activeTab === 'technical' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Technical Details
                </h3>
                
                {/* File Hashes */}
                {reportData.technicalDetails?.hashes && Object.keys(reportData.technicalDetails.hashes).length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Hash className="h-5 w-5 mr-2" />
                      File Hashes
                    </h4>
                    <div className="space-y-2 font-mono text-sm">
                      {Object.entries(reportData.technicalDetails.hashes).map(([type, hash]) => (
                        <div key={type} className="flex">
                          <span className="w-16 text-gray-600 dark:text-gray-400 uppercase">{type}:</span>
                          <span className="text-gray-900 dark:text-white break-all">{hash}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* URL Info */}
                {reportData.technicalDetails?.urlInfo?.domain && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Globe className="h-5 w-5 mr-2" />
                      URL Information
                    </h4>
                    <div className="space-y-2">
                      <div><strong>Domain:</strong> {reportData.technicalDetails.urlInfo.domain}</div>
                      <div><strong>Protocol:</strong> {reportData.technicalDetails.urlInfo.protocol}</div>
                      <div><strong>Path:</strong> {reportData.technicalDetails.urlInfo.path}</div>
                    </div>
                  </div>
                )}

                {/* File Info */}
                {reportData.technicalDetails?.fileInfo?.size && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      File Information
                    </h4>
                    <div className="space-y-2">
                      <div><strong>Size:</strong> {formatFileSize(reportData.technicalDetails.fileInfo.size)}</div>
                      <div><strong>Type:</strong> {reportData.technicalDetails.fileInfo.type}</div>
                      <div><strong>Name:</strong> {reportData.technicalDetails.fileInfo.name}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default AIReportViewer;