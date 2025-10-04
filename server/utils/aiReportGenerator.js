class AIReportGenerator {
  constructor() {
    // Initialize OpenAI only if API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      try {
        const OpenAI = require('openai');
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
      } catch (error) {
        console.warn('OpenAI module not found, using fallback mode');
        this.openai = null;
      }
    } else {
      this.openai = null;
    }
  }

  async generateSecurityReport(scanData) {
    try {
      if (!this.openai) {
        console.log('OpenAI not available, using fallback report generation');
        return this.generateFallbackReport(scanData);
      }

      const prompt = this.buildPrompt(scanData);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a cybersecurity expert. Generate comprehensive security analysis reports in structured format with paragraphs, tables, and symbols. Focus on threat analysis, risk assessment, and actionable recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      const aiAnalysis = completion.choices[0].message.content;
      return this.formatReport(scanData, aiAnalysis);
    } catch (error) {
      console.error('AI Report Generation Error:', error);
      return this.generateFallbackReport(scanData);
    }
  }

  buildPrompt(scanData) {
    const { scanType, results, fileName, url } = scanData;
    
    // Extract actual scan data from results
    const actualResults = results.details || results;
    const positives = actualResults.positives || actualResults.virusTotal?.positives || 0;
    const total = actualResults.total || actualResults.virusTotal?.total || 0;
    const engines = actualResults.engines || actualResults.virusTotal?.engines || [];
    const categories = actualResults.categories || [];
    
    let prompt = `Analyze this cybersecurity scan data and provide a comprehensive report:

**Scan Type:** ${scanType}
**Target:** ${fileName || url || 'Unknown'}
**Risk Level:** ${results.riskLevel}
**Detection Score:** ${results.score}%

**Detection Details:**
- Positive Detections: ${positives}
- Total Engines: ${total}
- Categories: ${categories.join(', ') || 'None'}

**Engine Results:**
${this.formatEngineResults(engines)}

Please provide:
1. Executive Summary (2-3 sentences)
2. Threat Analysis (detailed paragraph)
3. Risk Assessment Table
4. Technical Details
5. Recommendations (actionable steps)
6. Symbols for risk indicators (🔴 High, 🟡 Medium, 🟢 Low)

Format the response with clear sections and use appropriate symbols.`;

    return prompt;
  }

  formatEngineResults(engines) {
    if (!engines || engines.length === 0) return 'No engine data available';
    
    return engines.slice(0, 10).map(engine => 
      `- ${engine.name}: ${engine.detected ? '❌ DETECTED' : '✅ CLEAN'} (${engine.result})`
    ).join('\n');
  }

  formatReport(scanData, aiAnalysis) {
    const timestamp = new Date().toISOString();
    const { scanType, results, fileName, url } = scanData;
    
    // Extract actual scan data from results
    const actualResults = results.details || results;
    const positives = actualResults.positives || actualResults.virusTotal?.positives || 0;
    const total = actualResults.total || actualResults.virusTotal?.total || 0;
    const engines = actualResults.engines || actualResults.virusTotal?.engines || [];
    const categories = actualResults.categories || [];

    return {
      reportId: `RPT-${Date.now()}`,
      timestamp,
      scanType,
      target: fileName || url,
      riskLevel: results.riskLevel,
      score: results.score,
      
      // AI Generated Content
      aiAnalysis,
      
      // Structured Data
      summary: {
        totalDetections: positives,
        totalEngines: total,
        riskScore: results.score,
        threatCategories: categories,
        scanDate: timestamp
      },
      
      // Detection Table
      detectionTable: this.generateDetectionTable(engines),
      
      // Risk Indicators
      riskIndicators: this.generateRiskIndicators(results),
      
      // Recommendations
      recommendations: this.generateRecommendations(results.riskLevel),
      
      // Technical Details
      technicalDetails: {
        hashes: scanData.hashes || {},
        fileInfo: actualResults.fileInfo || {},
        urlInfo: actualResults.urlInfo || {},
        engines: engines
      }
    };
  }

  generateDetectionTable(engines) {
    return engines.map(engine => ({
      engine: engine.name,
      status: engine.detected ? '🔴 DETECTED' : '✅ CLEAN',
      result: engine.result || 'Clean',
      category: engine.category || 'clean',
      confidence: engine.detected ? 'High' : 'Low'
    }));
  }

  generateRiskIndicators(results) {
    const score = results.score || 0;
    const positives = results.details?.positives || 0;
    
    return {
      overallRisk: score > 70 ? '🔴 HIGH RISK' : score > 30 ? '🟡 MEDIUM RISK' : '🟢 LOW RISK',
      detectionRate: `${positives} detections`,
      riskSymbol: score > 70 ? '🔴' : score > 30 ? '🟡' : '🟢',
      confidenceLevel: score > 80 ? 'Very High' : score > 50 ? 'High' : score > 20 ? 'Medium' : 'Low',
      threatLevel: results.riskLevel?.toUpperCase() || 'UNKNOWN'
    };
  }

  generateRecommendations(riskLevel) {
    const baseRecommendations = [
      '🔍 Regular security scans recommended',
      '🛡️ Keep antivirus software updated',
      '📧 Be cautious with email attachments',
      '🔒 Use strong, unique passwords'
    ];

    switch (riskLevel) {
      case 'malicious':
        return [
          '🚨 IMMEDIATE ACTION REQUIRED',
          '❌ Do not execute or open this file/URL',
          '🔥 Quarantine or delete immediately',
          '🔍 Scan entire system for infections',
          '📞 Contact IT security team',
          ...baseRecommendations
        ];
      
      case 'suspicious':
        return [
          '⚠️ Exercise extreme caution',
          '🔍 Additional verification recommended',
          '🛡️ Scan with multiple engines',
          '📋 Monitor system behavior',
          ...baseRecommendations
        ];
      
      default:
        return [
          '✅ File/URL appears safe',
          '🔍 Continue regular monitoring',
          ...baseRecommendations
        ];
    }
  }

  generateFallbackReport(scanData) {
    const { scanType, results, fileName, url } = scanData;
    
    // Extract actual scan data from results
    const actualResults = results.details || results;
    const positives = actualResults.positives || actualResults.virusTotal?.positives || 0;
    const total = actualResults.total || actualResults.virusTotal?.total || 0;
    const engines = actualResults.engines || actualResults.virusTotal?.engines || [];
    const categories = actualResults.categories || [];
    
    return {
      reportId: `RPT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      scanType,
      target: fileName || url,
      riskLevel: results.riskLevel,
      score: results.score,
      
      aiAnalysis: `## Security Analysis Report

### Executive Summary
The ${scanType} scan of "${fileName || url}" has been completed with a risk score of ${results.score}%. The analysis indicates a ${results.riskLevel} threat level.

### Threat Analysis
Based on the scan results, ${positives} out of ${total} security engines detected potential threats. This ${results.riskLevel} classification suggests ${this.getThreatDescription(results.riskLevel)}.

### Risk Assessment
| Metric | Value | Status |
|--------|-------|--------|
| Risk Score | ${results.score}% | ${results.score > 70 ? '🔴 High' : results.score > 30 ? '🟡 Medium' : '🟢 Low'} |
| Detections | ${positives}/${total} | ${positives > 5 ? '🔴 Critical' : positives > 0 ? '🟡 Warning' : '🟢 Safe'} |
| Threat Level | ${results.riskLevel?.toUpperCase()} | ${this.getRiskSymbol(results.riskLevel)} |

### Recommendations
${this.generateRecommendations(results.riskLevel).map(rec => `- ${rec}`).join('\n')}`,
      
      summary: {
        totalDetections: positives,
        totalEngines: total,
        riskScore: results.score,
        threatCategories: categories,
        scanDate: new Date().toISOString()
      },
      
      detectionTable: this.generateDetectionTable(engines),
      riskIndicators: this.generateRiskIndicators(results),
      recommendations: this.generateRecommendations(results.riskLevel),
      
      technicalDetails: {
        hashes: scanData.hashes || {},
        fileInfo: actualResults.fileInfo || {},
        urlInfo: actualResults.urlInfo || {},
        engines: engines
      }
    };
  }

  getThreatDescription(riskLevel) {
    switch (riskLevel) {
      case 'malicious':
        return 'immediate action is required to prevent potential system compromise';
      case 'suspicious':
        return 'caution should be exercised and additional verification is recommended';
      case 'phishing':
        return 'this appears to be a phishing attempt designed to steal credentials';
      default:
        return 'the file/URL appears to be safe for normal use';
    }
  }

  getRiskSymbol(riskLevel) {
    switch (riskLevel) {
      case 'malicious':
        return '🔴 Critical';
      case 'suspicious':
        return '🟡 Warning';
      case 'phishing':
        return '🔴 Phishing';
      default:
        return '🟢 Safe';
    }
  }
}

module.exports = AIReportGenerator;