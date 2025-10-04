import { useState } from 'react';
import axios from 'axios';

const useReportGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const generateReport = async (scanData) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/reports/generate', 
        { scanData },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setReport(response.data.report);
        return response.data;
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate report';
      setError(errorMessage);
      console.error('Report generation error:', err);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async (reportData) => {
    try {
      const token = localStorage.getItem('token');
      
      // Ensure we have complete report data
      const completeReportData = {
        ...reportData,
        timestamp: reportData.timestamp || new Date().toISOString(),
        reportId: reportData.reportId || `RPT-${Date.now()}`,
        summary: reportData.summary || {
          totalDetections: 0,
          totalEngines: 0,
          riskScore: 0,
          threatCategories: [],
          scanDate: new Date().toISOString()
        },
        detectionTable: reportData.detectionTable || [],
        riskIndicators: reportData.riskIndicators || {
          overallRisk: 'Unknown',
          detectionRate: '0 detections',
          riskSymbol: '⚪',
          confidenceLevel: 'Unknown',
          threatLevel: 'UNKNOWN'
        },
        recommendations: reportData.recommendations || [],
        technicalDetails: reportData.technicalDetails || {
          hashes: {},
          fileInfo: {},
          urlInfo: {},
          engines: []
        }
      };
      
      const response = await axios.post('/api/reports/pdf',
        { reportData: completeReportData },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `security-report-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      throw new Error('Failed to download PDF');
    }
  };

  const clearReport = () => {
    setReport(null);
    setError(null);
  };

  return {
    isGenerating,
    report,
    error,
    generateReport,
    downloadPDF,
    clearReport
  };
};

export default useReportGenerator;