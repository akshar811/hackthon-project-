const express = require('express');
const { auth } = require('../middleware/auth');
const ScannerService = require('../utils/scanners');
const AIReportGenerator = require('../utils/aiReportGenerator');
// Optional PDF generation
let htmlPdf = null;
try {
  htmlPdf = require('html-pdf-node');
} catch (error) {
  console.warn('html-pdf-node not available, PDF generation disabled');
}

const router = express.Router();

// Generate AI-powered security report
router.post('/generate', auth, async (req, res) => {
  try {
    const { scanData } = req.body;
    
    if (!scanData) {
      return res.status(400).json({ error: 'Scan data required' });
    }

    // Generate comprehensive report using AI
    const report = await ScannerService.performComprehensiveScan(scanData);
    
    res.json({
      success: true,
      report: report.aiReport,
      scanResults: {
        riskLevel: report.riskLevel,
        score: report.score,
        details: report.details
      }
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Generate PDF report
router.post('/pdf', auth, async (req, res) => {
  try {
    const { reportData } = req.body;
    
    if (!reportData) {
      return res.status(400).json({ error: 'Report data required' });
    }

    if (!htmlPdf) {
      return res.status(503).json({ error: 'PDF generation not available. Please install html-pdf-node dependency.' });
    }

    const htmlContent = generateReportHTML(reportData);
    
    const options = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    };

    const file = { content: htmlContent };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="security-report-${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Get report by ID
router.get('/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    // In a real implementation, you'd fetch from database
    // For now, return a mock response
    res.json({
      reportId,
      status: 'completed',
      message: 'Report retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve report' });
  }
});

// Generate HTML content for PDF
function generateReportHTML(reportData) {
  const {
    reportId,
    timestamp,
    target,
    riskLevel,
    score,
    aiAnalysis,
    summary,
    detectionTable,
    riskIndicators,
    recommendations,
    technicalDetails
  } = reportData;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CYsafe Security Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .report-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .risk-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .risk-safe { background: #dcfce7; color: #166534; }
        .risk-suspicious { background: #fef3c7; color: #92400e; }
        .risk-malicious { background: #fecaca; color: #991b1b; }
        .risk-phishing { background: #fecaca; color: #991b1b; }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .detection-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .detection-table th,
        .detection-table td {
            border: 1px solid #d1d5db;
            padding: 12px;
            text-align: left;
        }
        .detection-table th {
            background: #f3f4f6;
            font-weight: bold;
        }
        .detection-table tr:nth-child(even) {
            background: #f9fafb;
        }
        .recommendations {
            background: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 20px 0;
        }
        .recommendations ul {
            margin: 0;
            padding-left: 20px;
        }
        .recommendations li {
            margin-bottom: 8px;
        }
        .technical-details {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
        }
        .ai-analysis {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .summary-item {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
        }
        .summary-label {
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🛡️ CYsafe Security Report</div>
        <p>Advanced Cybersecurity Analysis Platform</p>
    </div>

    <div class="report-info">
        <h3>Report Information</h3>
        <p><strong>Report ID:</strong> ${reportId}</p>
        <p><strong>Generated:</strong> ${new Date(timestamp).toLocaleString()}</p>
        <p><strong>Target:</strong> ${target}</p>
        <p><strong>Risk Level:</strong> <span class="risk-badge risk-${riskLevel}">${riskIndicators?.threatLevel || riskLevel?.toUpperCase()}</span></p>
        <p><strong>Risk Score:</strong> ${score}% ${riskIndicators?.riskSymbol || ''}</p>
    </div>

    <div class="summary-grid">
        <div class="summary-item">
            <div class="summary-value">${summary?.totalDetections || 0}</div>
            <div class="summary-label">Total Detections</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">${summary?.totalEngines || 0}</div>
            <div class="summary-label">Engines Scanned</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">${riskIndicators?.confidenceLevel || 'Unknown'}</div>
            <div class="summary-label">Confidence Level</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">${summary?.threatCategories?.length || 0}</div>
            <div class="summary-label">Threat Categories</div>
        </div>
    </div>

    <div class="section">
        <h2>🤖 AI Analysis</h2>
        <div class="ai-analysis">
            ${formatAIAnalysis(aiAnalysis)}
        </div>
    </div>

    <div class="section">
        <h2>🔍 Detection Results</h2>
        <table class="detection-table">
            <thead>
                <tr>
                    <th>Security Engine</th>
                    <th>Status</th>
                    <th>Result</th>
                    <th>Category</th>
                    <th>Confidence</th>
                </tr>
            </thead>
            <tbody>
                ${detectionTable?.slice(0, 15).map(row => `
                    <tr>
                        <td>${row.engine}</td>
                        <td>${row.status}</td>
                        <td>${row.result}</td>
                        <td>${row.category}</td>
                        <td>${row.confidence}</td>
                    </tr>
                `).join('') || '<tr><td colspan="5">No detection data available</td></tr>'}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>⚠️ Risk Assessment</h2>
        <p><strong>Overall Risk:</strong> ${riskIndicators?.overallRisk || 'Unknown'}</p>
        <p><strong>Detection Rate:</strong> ${riskIndicators?.detectionRate || '0 detections'}</p>
        <p><strong>Threat Categories:</strong> ${summary?.threatCategories?.join(', ') || 'None detected'}</p>
    </div>

    <div class="recommendations">
        <h2>📋 Security Recommendations</h2>
        <ul>
            ${recommendations?.map(rec => `<li>${rec}</li>`).join('') || '<li>No specific recommendations available</li>'}
        </ul>
    </div>

    <div class="section">
        <h2>🔧 Technical Details</h2>
        <div class="technical-details">
            <p><strong>File Hashes:</strong></p>
            ${Object.entries(technicalDetails?.hashes || {}).map(([type, hash]) => 
                `<p>${type.toUpperCase()}: ${hash}</p>`
            ).join('')}
            
            ${technicalDetails?.fileInfo?.size ? `<p><strong>File Size:</strong> ${formatFileSize(technicalDetails.fileInfo.size)}</p>` : ''}
            ${technicalDetails?.fileInfo?.type ? `<p><strong>File Type:</strong> ${technicalDetails.fileInfo.type}</p>` : ''}
            ${technicalDetails?.urlInfo?.domain ? `<p><strong>Domain:</strong> ${technicalDetails.urlInfo.domain}</p>` : ''}
        </div>
    </div>

    <div class="footer">
        <p>Generated by CYsafe Advanced Cybersecurity Analysis Platform</p>
        <p>This report is confidential and intended for authorized personnel only.</p>
        <p>Report generated on ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>`;
}

function formatAIAnalysis(aiAnalysis) {
  if (!aiAnalysis) return '<p>AI analysis not available</p>';
  
  // Convert markdown-like formatting to HTML
  return aiAnalysis
    .replace(/### (.*)/g, '<h3>$1</h3>')
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;