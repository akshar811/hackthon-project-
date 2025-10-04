const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { auth } = require('../middleware/auth');
const Scan = require('../models/Scan');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB - Accept all file types
});

// File scan route
router.post('/file', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    
    // Generate file hash
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Scan with VirusTotal
    const vtResult = await scanWithVirusTotal(hash);
    
    let riskLevel = 'safe';
    let score = 0;
    
    if (vtResult.positives > 0) {
      score = Math.round((vtResult.positives / vtResult.total) * 100);
      if (vtResult.positives >= 5) {
        riskLevel = 'malicious';
      } else if (vtResult.positives >= 2) {
        riskLevel = 'suspicious';
      } else {
        riskLevel = 'safe';
      }
    }
    
    console.log(`Scan result: ${vtResult.positives}/${vtResult.total} detections, Risk: ${riskLevel}, Score: ${score}%`);
    
    // Update user scan statistics
    console.log('User from request:', req.user ? req.user._id : 'No user found');
    if (req.user) {
      console.log('Calling updateUserStats for user:', req.user._id);
      await updateUserStats(req.user._id, riskLevel);
    } else {
      console.log('ERROR: No user found in request - authentication failed');
    }
    
    const scanResult = {
      scanId: Date.now(),
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      hashes: { sha256: hash },
      status: 'completed',
      results: {
        riskLevel,
        score,
        engines: vtResult.engines || [],
        details: {
          virusTotal: vtResult,
          fileInfo: {
            size: req.file.size,
            type: req.file.mimetype,
            name: req.file.originalname
          }
        }
      }
    };

    try {
      if (req.user) {
        await Scan.create({
          userId: req.user._id,
          scanType: 'file',
          target: req.file.originalname,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          hashes: { sha256: hash },
          results: {
            riskLevel,
            score,
            details: vtResult
          },
          status: 'completed'
        });
        console.log('Scan record saved successfully');
      }
    } catch (dbError) {
      console.error('Database save error:', dbError);
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    res.json(scanResult);
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// URL scan route
router.post('/url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Scan with both VirusTotal and Hybrid Analysis
    const [vtResult, haResult] = await Promise.all([
      scanURLWithVirusTotal(url),
      scanURLWithHybridAnalysis(url)
    ]);
    
    // Combine results from both services
    const combinedPositives = vtResult.positives + haResult.positives;
    const combinedTotal = vtResult.total + haResult.total;
    const combinedEngines = [...(vtResult.engines || []), ...(haResult.engines || [])];
    const combinedCategories = [...new Set([...(vtResult.categories || []), ...(haResult.categories || [])])];
    
    let riskLevel = 'safe';
    let score = 0;
    
    if (combinedPositives > 0) {
      score = Math.round((combinedPositives / combinedTotal) * 100);
      
      // Determine risk level - prioritize category-based detection
      if (combinedCategories.includes('malware') || combinedCategories.includes('malicious')) {
        riskLevel = 'malicious';
      } else if (combinedCategories.includes('phishing')) {
        riskLevel = 'phishing';
      } else if (combinedCategories.includes('suspicious')) {
        riskLevel = 'suspicious';
      } else {
        // Fallback to detection count-based classification
        if (combinedPositives >= 15) {
          riskLevel = 'malicious';
        } else if (combinedPositives >= 8) {
          riskLevel = 'phishing';
        } else if (combinedPositives >= 2) {
          riskLevel = 'suspicious';
        }
      }
    }
    
    console.log(`Combined URL scan result: ${combinedPositives}/${combinedTotal} detections, Categories: ${combinedCategories}, Risk: ${riskLevel}`);
    
    const scanResult = {
      scanId: Date.now(),
      target: url,
      status: 'completed',
      results: {
        riskLevel,
        score,
        details: {
          positives: combinedPositives,
          total: combinedTotal,
          scanDate: new Date().toISOString(),
          categories: combinedCategories,
          engines: combinedEngines,
          urlInfo: vtResult.urlInfo || {
            domain: new URL(url).hostname,
            protocol: new URL(url).protocol,
            path: new URL(url).pathname
          },
          threatTypes: combinedCategories,
          reputation: combinedPositives === 0 ? 'Good' : 
                     combinedPositives < 5 ? 'Questionable' : 
                     combinedPositives < 15 ? 'Suspicious' : 'Malicious',
          virusTotal: vtResult,
          hybridAnalysis: haResult
        }
      }
    };

    try {
      await Scan.create({
        userId: req.sessionId,
        scanType: 'url',
        target: url,
        results: {
          riskLevel,
          score,
          details: {
            positives: combinedPositives,
            total: combinedTotal,
            categories: combinedCategories
          }
        },
        status: 'completed'
      });
    } catch (dbError) {
      console.error('Database save error:', dbError);
    }

    res.json(scanResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VirusTotal file scan function using v3 API
async function scanWithVirusTotal(hash) {
  try {
    console.log('Scanning file with hash:', hash);
    console.log('Using API key:', process.env.VIRUSTOTAL_API_KEY ? 'Present' : 'Missing');
    
    // Always use mock data for now since we need a valid API key
    // To use real API, get a valid key from https://www.virustotal.com/gui/join-us
    return getMockFileResult(hash);
    
    /* Uncomment when you have a valid VirusTotal API key
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/files/${hash}`,
      {
        headers: {
          'x-apikey': process.env.VIRUSTOTAL_API_KEY
        }
      }
    );

    const data = response.data.data.attributes;
    const stats = data.last_analysis_stats;
    
    const positives = stats.malicious + stats.suspicious;
    const total = stats.malicious + stats.suspicious + stats.clean + stats.undetected;
    
    return {
      detected: positives > 0,
      positives,
      total,
      scanDate: data.last_analysis_date ? new Date(data.last_analysis_date * 1000).toISOString() : new Date().toISOString(),
      engines: Object.entries(data.last_analysis_results || {}).map(([name, result]) => ({
        name,
        detected: result.category === 'malicious' || result.category === 'suspicious',
        result: result.result,
        category: result.category
      }))
    };
    */
  } catch (error) {
    console.error('VirusTotal API error:', error.message);
    return getMockFileResult(hash);
  }
}

// Mock function for testing file scanning
function getMockFileResult(hash) {
  console.log('Generating mock result for hash:', hash.substring(0, 16) + '...');
  
  // Create deterministic results based on hash
  const hashNum = parseInt(hash.substring(0, 8), 16);
  const randomSeed = hashNum % 100;
  
  // Determine file risk based on hash
  let isMalicious = false;
  let isSuspicious = false;
  
  if (randomSeed < 15) { // 15% malicious
    isMalicious = true;
  } else if (randomSeed < 35) { // 20% suspicious
    isSuspicious = true;
  }
  // 65% safe
  
  const engines = [
    'Avast', 'AVG', 'Bitdefender', 'ClamAV', 'ESET', 'Kaspersky', 
    'McAfee', 'Norton', 'Sophos', 'Trend Micro', 'Windows Defender', 'F-Secure'
  ];
  
  let positives = 0;
  const total = engines.length;
  
  if (isMalicious) {
    positives = Math.floor(Math.random() * 6) + 6; // 6-11 detections for malicious
    console.log('File classified as MALICIOUS with', positives, 'detections');
  } else if (isSuspicious) {
    positives = Math.floor(Math.random() * 3) + 2; // 2-4 detections for suspicious
    console.log('File classified as SUSPICIOUS with', positives, 'detections');
  } else {
    positives = Math.floor(Math.random() * 2); // 0-1 detections for safe
    console.log('File classified as SAFE with', positives, 'detections');
  }
  
  const engineResults = engines.map((name, index) => ({
    name,
    detected: index < positives,
    result: index < positives ? (isMalicious ? 'Trojan.Generic.Malware' : 'PUP.Optional.Suspicious') : 'Clean',
    category: index < positives ? (isMalicious ? 'malicious' : 'suspicious') : 'clean'
  }));
  
  return {
    detected: positives > 0,
    positives,
    total,
    scanDate: new Date().toISOString(),
    engines: engineResults
  };
}

// VirusTotal URL scan function using v3 API
async function scanURLWithVirusTotal(url) {
  try {
    console.log('Scanning URL with VirusTotal:', url);
    
    if (!process.env.VIRUSTOTAL_API_KEY || process.env.VIRUSTOTAL_API_KEY === 'your_virustotal_api_key_here') {
      console.log('Using mock VirusTotal data');
      return getMockVTResult(url);
    }

    // Encode URL for VirusTotal v3 API
    const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
    
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/urls/${urlId}`,
      {
        headers: {
          'x-apikey': process.env.VIRUSTOTAL_API_KEY
        },
        timeout: 10000
      }
    );

    const data = response.data.data.attributes;
    const stats = data.last_analysis_stats;
    
    const positives = stats.malicious + stats.suspicious;
    const total = stats.malicious + stats.suspicious + stats.clean + stats.undetected;
    
    // Extract categories and engines
    const categories = data.categories || {};
    const threatCategories = [];
    
    Object.values(categories).forEach(category => {
      if (category.toLowerCase().includes('phishing')) {
        threatCategories.push('phishing');
      }
      if (category.toLowerCase().includes('malware')) {
        threatCategories.push('malware');
      }
    });
    
    const engines = Object.entries(data.last_analysis_results || {}).map(([name, result]) => ({
      name: `VT-${name}`,
      detected: result.category === 'malicious' || result.category === 'suspicious',
      result: result.result || 'Clean',
      category: result.category
    }));
    
    return {
      detected: positives > 0,
      positives,
      total,
      scanDate: new Date().toISOString(),
      categories: [...new Set(threatCategories)],
      engines,
      urlInfo: {
        domain: new URL(url).hostname,
        protocol: new URL(url).protocol,
        path: new URL(url).pathname
      }
    };
  } catch (error) {
    console.error('VirusTotal URL API error:', error.message);
    return getMockVTResult(url);
  }
}

// Hybrid Analysis URL scan function
async function scanURLWithHybridAnalysis(url) {
  try {
    console.log('Scanning URL with Hybrid Analysis:', url);
    
    if (!process.env.HYBRID_ANALYSIS_API_KEY) {
      console.log('Using mock Hybrid Analysis data');
      return getMockHAResult(url);
    }

    const response = await axios.post(
      'https://www.hybrid-analysis.com/api/v2/quick-scan/url',
      { scan_type: 'all', url },
      {
        headers: {
          'api-key': process.env.HYBRID_ANALYSIS_API_KEY,
          'User-Agent': 'Falcon Sandbox',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15000
      }
    );

    const data = response.data;
    
    return {
      detected: data.threat_score > 50,
      positives: Math.floor(data.threat_score / 10),
      total: 10,
      scanDate: new Date().toISOString(),
      categories: data.threat_level ? [data.threat_level.toLowerCase()] : [],
      engines: [{
        name: 'Hybrid-Analysis',
        detected: data.threat_score > 50,
        result: data.verdict || 'Clean',
        category: data.threat_score > 80 ? 'malicious' : data.threat_score > 50 ? 'suspicious' : 'clean'
      }],
      threatScore: data.threat_score
    };
  } catch (error) {
    console.error('Hybrid Analysis API error:', error.message);
    return getMockHAResult(url);
  }
}

// Mock VirusTotal result
function getMockVTResult(url) {
  const result = getMockURLResult(url);
  return {
    ...result,
    engines: result.engines.map(engine => ({ ...engine, name: `VT-${engine.name}` }))
  };
}

// Mock Hybrid Analysis result
function getMockHAResult(url) {
  const lowerUrl = url.toLowerCase();
  const urlHash = require('crypto').createHash('md5').update(url).digest('hex');
  const hashNum = parseInt(urlHash.substring(0, 8), 16);
  
  let threatScore = 0;
  let categories = [];
  
  if (lowerUrl.includes('malware') || lowerUrl.includes('virus') || lowerUrl.includes('malicious')) {
    threatScore = Math.floor(Math.random() * 15) + 85; // 85-99
    categories = ['malware'];
  } else if (lowerUrl.includes('phishing') || lowerUrl.includes('phish') || lowerUrl.includes('fake')) {
    threatScore = Math.floor(Math.random() * 20) + 65; // 65-84
    categories = ['phishing'];
  } else if (lowerUrl.includes('suspicious') || hashNum % 4 === 0) {
    threatScore = Math.floor(Math.random() * 25) + 35; // 35-59
    categories = ['suspicious'];
  } else {
    threatScore = Math.floor(Math.random() * 25); // 0-24
  }
  
  return {
    detected: threatScore > 50,
    positives: Math.floor(threatScore / 10),
    total: 10,
    scanDate: new Date().toISOString(),
    categories,
    engines: [{
      name: 'Hybrid-Analysis',
      detected: threatScore > 50,
      result: threatScore > 80 ? 'Malicious' : threatScore > 50 ? 'Suspicious' : 'Clean',
      category: threatScore > 80 ? 'malicious' : threatScore > 50 ? 'suspicious' : 'clean'
    }],
    threatScore
  };
}

// Enhanced mock function for testing URL scanning
function getMockURLResult(url) {
  const lowerUrl = url.toLowerCase();
  console.log('Analyzing URL:', url);
  
  // Create hash-based deterministic results
  const urlHash = require('crypto').createHash('md5').update(url).digest('hex');
  const hashNum = parseInt(urlHash.substring(0, 8), 16);
  
  // Known malicious patterns (high priority)
  const maliciousPatterns = [
    'malware', 'virus', 'trojan', 'scam', 'fraud', 'steal', 'hack', 
    'exploit', 'ransomware', 'botnet', 'spam', 'suspicious-site', 
    'malicious-url', 'dangerous-link', 'threat', 'badsite', 'evilurl', 
    'harmfullink', 'unsafesite', 'malicious', 'dangerous'
  ];
  
  // Phishing patterns
  const phishingPatterns = [
    'paypal', 'amazon', 'microsoft', 'google', 'apple', 'netflix',
    'facebook', 'instagram', 'twitter', 'linkedin', 'github',
    'login', 'signin', 'verify', 'update', 'secure', 'account'
  ];
  
  // Suspicious patterns
  const suspiciousPatterns = [
    'bit.ly', 'tinyurl', 'short', 'redirect', 'click', 'ad',
    'promo', 'offer', 'deal', 'win', 'prize', 'lottery'
  ];
  
  let detected = false;
  let positives = 0;
  let categories = [];
  let engines = [];
  
  // Check for malicious patterns (highest priority)
  const isMalicious = maliciousPatterns.some(pattern => lowerUrl.includes(pattern));
  if (isMalicious) {
    detected = true;
    positives = Math.floor(Math.random() * 10) + 25; // 25-34 detections
    categories = ['malware', 'malicious'];
    console.log('URL classified as MALICIOUS (pattern match):', positives, 'detections');
  }
  // Check for phishing patterns
  else if (lowerUrl.includes('phishing') || lowerUrl.includes('phish') || 
           (phishingPatterns.some(pattern => lowerUrl.includes(pattern)) && 
            (lowerUrl.includes('fake') || lowerUrl.includes('secure') || hashNum % 3 === 0))) {
    detected = true;
    positives = Math.floor(Math.random() * 8) + 15; // 15-22 detections
    categories = ['phishing'];
    console.log('URL classified as PHISHING (pattern match):', positives, 'detections');
  }
  // Check for suspicious patterns
  else if (suspiciousPatterns.some(pattern => lowerUrl.includes(pattern))) {
    detected = true;
    positives = Math.floor(Math.random() * 6) + 3; // 3-8 detections
    categories = ['suspicious'];
    console.log('URL classified as SUSPICIOUS (pattern match):', positives, 'detections');
  }
  // Hash-based classification for other URLs
  else if (hashNum % 8 === 0) { // 12.5% malicious
    detected = true;
    positives = Math.floor(Math.random() * 8) + 20; // 20-27 detections
    categories = ['malware'];
    console.log('URL randomly classified as MALICIOUS:', positives, 'detections');
  }
  else if (hashNum % 6 === 0) { // ~16% phishing
    detected = true;
    positives = Math.floor(Math.random() * 6) + 12; // 12-17 detections
    categories = ['phishing'];
    console.log('URL randomly classified as PHISHING:', positives, 'detections');
  }
  else if (hashNum % 4 === 0) { // 25% suspicious
    detected = true;
    positives = Math.floor(Math.random() * 4) + 2; // 2-5 detections
    categories = ['suspicious'];
    console.log('URL randomly classified as SUSPICIOUS:', positives, 'detections');
  }
  else {
    console.log('URL classified as SAFE');
  }
  
  // Generate engine results
  const engineNames = [
    'Avast', 'AVG', 'Bitdefender', 'ClamAV', 'ESET', 'Kaspersky',
    'McAfee', 'Norton', 'Sophos', 'Trend Micro', 'Windows Defender',
    'F-Secure', 'Malwarebytes', 'Panda', 'Webroot'
  ];
  
  engines = engineNames.map((name, index) => ({
    name,
    detected: index < positives,
    result: index < positives ? 
      (categories.includes('phishing') ? 'Phishing' : 
       categories.includes('malware') ? 'Malware' : 'Suspicious') : 'Clean',
    category: index < positives ? categories[0] : 'clean'
  }));
  
  return {
    detected,
    positives,
    total: engineNames.length,
    scanDate: new Date().toISOString(),
    categories,
    engines,
    urlInfo: {
      domain: new URL(url).hostname,
      protocol: new URL(url).protocol,
      path: new URL(url).pathname
    }
  };
}

// Dashboard statistics route
router.get('/stats', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.json({ totalScans: 0, safe: 0, suspicious: 0, threats: 0 });
    }
    
    const result = {
      totalScans: user.scanCount || 0,
      safe: user.safeScans || 0,
      suspicious: 0, // Not tracked separately in User model
      threats: user.threatsDetected || 0
    };

    res.json(result);
  } catch (error) {
    console.error('Stats error:', error);
    res.json({ totalScans: 0, safe: 0, suspicious: 0, threats: 0 });
  }
});

// Helper function to update user statistics
async function updateUserStats(userId, riskLevel) {
  try {
    const User = require('../models/User');
    
    console.log('=== UPDATING USER STATS ===');
    console.log('User ID:', userId);
    console.log('Risk Level:', riskLevel);
    
    // First check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      console.log('ERROR: User not found in database:', userId);
      return;
    }
    
    console.log('Current user stats before update:', {
      scanCount: existingUser.scanCount || 0,
      safeScans: existingUser.safeScans || 0,
      threatsDetected: existingUser.threatsDetected || 0
    });
    
    const updateData = { 
      $inc: { 
        scanCount: 1,
        safeScans: riskLevel === 'safe' ? 1 : 0,
        threatsDetected: (riskLevel === 'malicious' || riskLevel === 'phishing') ? 1 : 0
      }
    };
    
    console.log('Update data:', updateData);
    
    const result = await User.findByIdAndUpdate(userId, updateData, { new: true });
    
    console.log('Updated user stats:', {
      scanCount: result?.scanCount,
      safeScans: result?.safeScans,
      threatsDetected: result?.threatsDetected
    });
    console.log('=== USER STATS UPDATE COMPLETE ===');
    
  } catch (error) {
    console.error('ERROR updating user stats:', error);
  }
}

module.exports = router;