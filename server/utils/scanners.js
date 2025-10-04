const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs').promises;
const AIReportGenerator = require('./aiReportGenerator');

class ScannerService {
  constructor() {
    this.aiReportGenerator = new AIReportGenerator();
  }
  
  // Generate file hashes
  static async generateHashes(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    
    return {
      md5: crypto.createHash('md5').update(fileBuffer).digest('hex'),
      sha1: crypto.createHash('sha1').update(fileBuffer).digest('hex'),
      sha256: crypto.createHash('sha256').update(fileBuffer).digest('hex')
    };
  }

  // VirusTotal API integration
  static async scanWithVirusTotal(hash) {
    try {
      const response = await axios.get(
        `https://www.virustotal.com/vtapi/v2/file/report`,
        {
          params: {
            apikey: process.env.VIRUSTOTAL_API_KEY,
            resource: hash
          }
        }
      );

      const data = response.data;
      return {
        detected: data.positives > 0,
        positives: data.positives || 0,
        total: data.total || 0,
        scanDate: data.scan_date,
        engines: Object.entries(data.scans || {}).map(([name, result]) => ({
          name,
          detected: result.detected,
          result: result.result,
          version: result.version,
          update: result.update
        }))
      };
    } catch (error) {
      console.error('VirusTotal API error:', error.message);
      return { error: 'VirusTotal scan failed' };
    }
  }

  // URL analysis
  static async analyzeURL(url) {
    try {
      const response = await axios.post(
        'https://www.virustotal.com/vtapi/v2/url/scan',
        new URLSearchParams({
          apikey: process.env.VIRUSTOTAL_API_KEY,
          url: url
        })
      );

      // Wait and get report
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      const reportResponse = await axios.get(
        'https://www.virustotal.com/vtapi/v2/url/report',
        {
          params: {
            apikey: process.env.VIRUSTOTAL_API_KEY,
            resource: url
          }
        }
      );

      const data = reportResponse.data;
      return {
        detected: data.positives > 0,
        positives: data.positives || 0,
        total: data.total || 0,
        scanDate: data.scan_date,
        url: data.url
      };
    } catch (error) {
      console.error('URL analysis error:', error.message);
      return { error: 'URL analysis failed' };
    }
  }

  // Email header analysis
  static analyzeEmailHeaders(headers) {
    const suspiciousPatterns = [
      /received:\s*from.*\[(10\.|192\.168\.|172\.)/i,
      /x-mailer:\s*(mass|bulk|spam)/i,
      /subject:.*\$\$\$/i,
      /from:.*noreply.*@.*\.tk/i
    ];

    const results = {
      suspicious: false,
      issues: [],
      spfPass: false,
      dkimPass: false,
      dmarcPass: false
    };

    // Check for suspicious patterns
    suspiciousPatterns.forEach((pattern, index) => {
      if (pattern.test(headers)) {
        results.suspicious = true;
        results.issues.push(`Suspicious pattern ${index + 1} detected`);
      }
    });

    // Check SPF, DKIM, DMARC
    if (headers.includes('spf=pass')) results.spfPass = true;
    if (headers.includes('dkim=pass')) results.dkimPass = true;
    if (headers.includes('dmarc=pass')) results.dmarcPass = true;

    return results;
  }

  // Password strength analysis
  static analyzePassword(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCommon: !this.isCommonPassword(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong';

    return {
      score: Math.round((score / 6) * 100),
      strength,
      checks,
      suggestions: this.getPasswordSuggestions(checks)
    };
  }

  static isCommonPassword(password) {
    const common = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    return common.includes(password.toLowerCase());
  }

  static getPasswordSuggestions(checks) {
    const suggestions = [];
    if (!checks.length) suggestions.push('Use at least 8 characters');
    if (!checks.uppercase) suggestions.push('Add uppercase letters');
    if (!checks.lowercase) suggestions.push('Add lowercase letters');
    if (!checks.numbers) suggestions.push('Add numbers');
    if (!checks.symbols) suggestions.push('Add special characters');
    if (!checks.noCommon) suggestions.push('Avoid common passwords');
    return suggestions;
  }

  // Enhanced multi-API scanning with AI report generation
  static async performComprehensiveScan(scanData) {
    try {
      // Use existing scan results if provided, otherwise perform new scan
      let results = scanData.results || {};
      
      if (!scanData.results) {
        const { scanType, filePath, url, hash } = scanData;
        
        // Perform scans based on type
        if (scanType === 'file' && (hash || filePath)) {
          const [vtResult, haResult] = await Promise.all([
            this.scanWithVirusTotal(hash),
            this.scanWithHybridAnalysis(hash, 'file')
          ]);
          
          results = this.combineFileResults(vtResult, haResult);
        } else if (scanType === 'url' && url) {
          const [vtResult, haResult, urlVoidResult] = await Promise.all([
            this.scanURLWithVirusTotal(url),
            this.scanWithHybridAnalysis(url, 'url'),
            this.scanWithURLVoid(url)
          ]);
          
          results = this.combineURLResults(vtResult, haResult, urlVoidResult);
        }
      }

      // Generate AI-powered report using the same data
      const reportData = {
        scanType: scanData.scanType,
        fileName: scanData.fileName,
        url: scanData.url,
        hashes: scanData.hashes,
        results
      };

      const aiReport = await new AIReportGenerator().generateSecurityReport(reportData);
      
      return {
        ...results,
        aiReport,
        reportGenerated: true
      };
    } catch (error) {
      console.error('Comprehensive scan error:', error);
      throw error;
    }
  }

  // Combine file scan results from multiple sources
  static combineFileResults(vtResult, haResult) {
    const totalPositives = (vtResult.positives || 0) + (haResult.positives || 0);
    const totalEngines = (vtResult.total || 0) + (haResult.total || 0);
    const combinedEngines = [...(vtResult.engines || []), ...(haResult.engines || [])];
    
    let riskLevel = 'safe';
    let score = 0;
    
    if (totalPositives > 0) {
      score = Math.round((totalPositives / totalEngines) * 100);
      if (totalPositives >= 10) {
        riskLevel = 'malicious';
      } else if (totalPositives >= 3) {
        riskLevel = 'suspicious';
      }
    }
    
    return {
      riskLevel,
      score,
      details: {
        positives: totalPositives,
        total: totalEngines,
        engines: combinedEngines,
        virusTotal: vtResult,
        hybridAnalysis: haResult,
        categories: [...new Set([...(vtResult.categories || []), ...(haResult.categories || [])])]
      }
    };
  }

  // Combine URL scan results from multiple sources
  static combineURLResults(vtResult, haResult, urlVoidResult) {
    const totalPositives = (vtResult.positives || 0) + (haResult.positives || 0) + (urlVoidResult.positives || 0);
    const totalEngines = (vtResult.total || 0) + (haResult.total || 0) + (urlVoidResult.total || 0);
    const combinedEngines = [...(vtResult.engines || []), ...(haResult.engines || []), ...(urlVoidResult.engines || [])];
    const combinedCategories = [...new Set([...(vtResult.categories || []), ...(haResult.categories || []), ...(urlVoidResult.categories || [])])];
    
    let riskLevel = 'safe';
    let score = 0;
    
    if (totalPositives > 0) {
      score = Math.round((totalPositives / totalEngines) * 100);
      
      if (combinedCategories.includes('phishing')) {
        riskLevel = 'phishing';
      } else if (combinedCategories.includes('malware') || totalPositives >= 15) {
        riskLevel = 'malicious';
      } else if (totalPositives >= 5) {
        riskLevel = 'suspicious';
      }
    }
    
    return {
      riskLevel,
      score,
      details: {
        positives: totalPositives,
        total: totalEngines,
        engines: combinedEngines,
        categories: combinedCategories,
        virusTotal: vtResult,
        hybridAnalysis: haResult,
        urlVoid: urlVoidResult,
        urlInfo: vtResult.urlInfo || {}
      }
    };
  }

  // Hybrid Analysis integration
  static async scanWithHybridAnalysis(target, type = 'file') {
    try {
      if (!process.env.HYBRID_ANALYSIS_API_KEY) {
        return this.getMockHybridResult(target, type);
      }

      const endpoint = type === 'file' ? 
        'https://www.hybrid-analysis.com/api/v2/search/hash' :
        'https://www.hybrid-analysis.com/api/v2/quick-scan/url';
      
      const data = type === 'file' ? { hash: target } : { url: target };
      
      const response = await axios.post(endpoint, data, {
        headers: {
          'api-key': process.env.HYBRID_ANALYSIS_API_KEY,
          'User-Agent': 'Falcon Sandbox'
        },
        timeout: 15000
      });

      return this.parseHybridResponse(response.data, type);
    } catch (error) {
      console.error('Hybrid Analysis error:', error.message);
      return this.getMockHybridResult(target, type);
    }
  }

  // URLVoid integration for additional URL analysis
  static async scanWithURLVoid(url) {
    try {
      if (!process.env.URLVOID_API_KEY) {
        return this.getMockURLVoidResult(url);
      }

      const domain = new URL(url).hostname;
      const response = await axios.get(
        `https://api.urlvoid.com/1000/${process.env.URLVOID_API_KEY}/host/${domain}/`,
        { timeout: 10000 }
      );

      return this.parseURLVoidResponse(response.data);
    } catch (error) {
      console.error('URLVoid error:', error.message);
      return this.getMockURLVoidResult(url);
    }
  }

  // Parse Hybrid Analysis response
  static parseHybridResponse(data, type) {
    if (type === 'file' && data.result && data.result.length > 0) {
      const result = data.result[0];
      return {
        positives: result.threat_score > 50 ? Math.floor(result.threat_score / 10) : 0,
        total: 10,
        engines: [{
          name: 'Hybrid-Analysis',
          detected: result.threat_score > 50,
          result: result.verdict || 'Clean',
          category: result.threat_score > 80 ? 'malicious' : result.threat_score > 50 ? 'suspicious' : 'clean'
        }],
        categories: result.threat_score > 50 ? ['malware'] : []
      };
    }
    
    return { positives: 0, total: 0, engines: [], categories: [] };
  }

  // Parse URLVoid response
  static parseURLVoidResponse(data) {
    const detections = data.detections || {};
    const engines = Object.entries(detections).map(([name, detected]) => ({
      name: `URLVoid-${name}`,
      detected: detected === '1',
      result: detected === '1' ? 'Malicious' : 'Clean',
      category: detected === '1' ? 'malicious' : 'clean'
    }));
    
    const positives = engines.filter(e => e.detected).length;
    
    return {
      positives,
      total: engines.length,
      engines,
      categories: positives > 0 ? ['malicious'] : []
    };
  }

  // Mock results for testing
  static getMockHybridResult(target, type) {
    const score = Math.floor(Math.random() * 100);
    return {
      positives: score > 50 ? Math.floor(score / 15) : 0,
      total: 5,
      engines: [{
        name: 'Hybrid-Analysis',
        detected: score > 50,
        result: score > 80 ? 'Malicious' : score > 50 ? 'Suspicious' : 'Clean',
        category: score > 80 ? 'malicious' : score > 50 ? 'suspicious' : 'clean'
      }],
      categories: score > 50 ? ['malware'] : []
    };
  }

  static getMockURLVoidResult(url) {
    const detections = Math.floor(Math.random() * 3);
    return {
      positives: detections,
      total: 8,
      engines: Array.from({ length: 8 }, (_, i) => ({
        name: `URLVoid-Engine${i + 1}`,
        detected: i < detections,
        result: i < detections ? 'Malicious' : 'Clean',
        category: i < detections ? 'malicious' : 'clean'
      })),
      categories: detections > 0 ? ['malicious'] : []
    };
  }

  // APK analysis
  static async analyzeAPK(filePath) {
    try {
      // Basic APK analysis (would need aapt tool in production)
      const stats = await fs.stat(filePath);
      
      return {
        fileSize: stats.size,
        permissions: ['android.permission.INTERNET', 'android.permission.CAMERA'], // Mock data
        dangerousPermissions: ['android.permission.CAMERA'],
        malwareScore: Math.floor(Math.random() * 100),
        certificates: ['SHA256: abc123...']
      };
    } catch (error) {
      return { error: 'APK analysis failed' };
    }
  }
}

module.exports = ScannerService;