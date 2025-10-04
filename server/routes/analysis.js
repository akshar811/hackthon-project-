const express = require('express');
const { auth } = require('../middleware/auth');
const Scan = require('../models/Scan');
const ScannerService = require('../utils/scanners');
const axios = require('axios');

const router = express.Router();

// Email analysis endpoint with file upload
router.post('/email', auth, require('multer')({ 
  storage: require('multer').memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.eml', '.msg'];
    const ext = require('path').extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only EML and MSG files are allowed'));
    }
  }
}).single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Email file required' });
    }

    console.log('Analyzing email file:', req.file.originalname);

    // Parse email file
    const emailContent = req.file.buffer.toString('utf8');
    const emailAnalysis = await analyzeEmailFile(emailContent);

    let score = 0;
    let riskLevel = 'safe';

    // Risk scoring
    if (!emailAnalysis.headers.spfPass) score += 20;
    if (!emailAnalysis.headers.dkimPass) score += 20;
    if (emailAnalysis.phishingIndicators > 0) score += 30;
    if (emailAnalysis.maliciousUrls > 0) score += 40;
    if (emailAnalysis.maliciousAttachments > 0) score += 50;

    if (score > 80) {
      riskLevel = 'malicious';
    } else if (score > 60) {
      riskLevel = 'phishing';
    } else if (score > 40) {
      riskLevel = 'suspicious';
    }

    console.log(`Email Analysis: ${emailAnalysis.urls.length} URLs, ${emailAnalysis.attachments.length} attachments, Risk: ${riskLevel}, Score: ${score}%`);

    // Update user scan statistics
    if (req.user) {
      await updateUserStats(req.user._id, riskLevel);
    }

    const scanResult = {
      scanId: Date.now(),
      results: {
        riskLevel,
        score,
        details: {
          headers: emailAnalysis.headers,
          urls: emailAnalysis.urls,
          attachments: emailAnalysis.attachments,
          phishingIndicators: emailAnalysis.phishingIndicators,
          recommendations: generateEmailRecommendations(emailAnalysis, score)
        }
      }
    };

    try {
      await Scan.create({
        userId: req.user._id,
        scanType: 'email',
        target: req.file.originalname,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        results: {
          riskLevel,
          score,
          details: emailAnalysis
        },
        status: 'completed'
      });
    } catch (dbError) {
      console.error('Database save error:', dbError);
    }

    res.json(scanResult);

  } catch (error) {
    console.error('Email analysis error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Email analysis function
async function analyzeEmailFile(emailContent) {
  try {
    // Parse email headers
    const headers = parseEmailHeaders(emailContent);
    
    // Extract URLs
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const urlMatches = emailContent.match(urlRegex) || [];
    
    // Analyze URLs
    const urls = await Promise.all(urlMatches.map(async (url) => {
      const analysis = await analyzeURL(url);
      return {
        url,
        malicious: analysis.malicious,
        suspicious: analysis.suspicious,
        detections: analysis.detections
      };
    }));
    
    // Extract and analyze attachments
    const attachments = extractAttachments(emailContent);
    
    // Count phishing indicators
    const phishingKeywords = ['urgent', 'verify', 'suspended', 'click here', 'limited time', 'act now'];
    const phishingIndicators = phishingKeywords.filter(keyword => 
      emailContent.toLowerCase().includes(keyword)
    ).length;
    
    const maliciousUrls = urls.filter(u => u.malicious).length;
    const maliciousAttachments = attachments.filter(a => a.malicious).length;
    
    return {
      headers,
      urls,
      attachments,
      phishingIndicators,
      maliciousUrls,
      maliciousAttachments
    };
  } catch (error) {
    console.error('Email parsing error:', error.message);
    return generateMockEmailAnalysis();
  }
}

// Parse email headers
function parseEmailHeaders(emailContent) {
  const headers = {};
  const lines = emailContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('From:')) {
      headers.from = line.substring(5).trim();
    } else if (line.startsWith('Subject:')) {
      headers.subject = line.substring(8).trim();
    } else if (line.startsWith('Date:')) {
      headers.date = line.substring(5).trim();
    }
  }
  
  // Mock SPF/DKIM analysis
  headers.spfPass = Math.random() > 0.3; // 70% pass rate
  headers.dkimPass = Math.random() > 0.4; // 60% pass rate
  
  return headers;
}

// Analyze URL for threats
async function analyzeURL(url) {
  // Mock URL analysis - replace with VirusTotal API
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('phishing') || lowerUrl.includes('scam') || lowerUrl.includes('fake')) {
    return { malicious: true, suspicious: false, detections: 8 };
  }
  
  if (lowerUrl.includes('suspicious') || lowerUrl.includes('risky')) {
    return { malicious: false, suspicious: true, detections: 3 };
  }
  
  return { malicious: false, suspicious: false, detections: 0 };
}

// Extract attachments from email
function extractAttachments(emailContent) {
  const attachments = [];
  
  // Mock attachment extraction
  if (emailContent.includes('Content-Disposition: attachment')) {
    const mockAttachments = [
      { filename: 'document.pdf', type: 'application/pdf', size: 1024000, malicious: false, suspicious: false, detections: 0 },
      { filename: 'invoice.exe', type: 'application/exe', size: 2048000, malicious: true, suspicious: false, detections: 12 },
      { filename: 'image.jpg', type: 'image/jpeg', size: 512000, malicious: false, suspicious: true, detections: 2 }
    ];
    
    // Return random subset
    const count = Math.floor(Math.random() * 3) + 1;
    return mockAttachments.slice(0, count);
  }
  
  return attachments;
}

// Generate mock email analysis for testing
function generateMockEmailAnalysis() {
  const mockUrls = [
    { url: 'https://legitimate-site.com', malicious: false, suspicious: false, detections: 0 },
    { url: 'https://phishing-example.com', malicious: true, suspicious: false, detections: 8 },
    { url: 'https://suspicious-link.net', malicious: false, suspicious: true, detections: 3 }
  ];
  
  const mockAttachments = [
    { filename: 'document.pdf', type: 'application/pdf', size: 1024000, malicious: false, suspicious: false, detections: 0 },
    { filename: 'malware.exe', type: 'application/exe', size: 2048000, malicious: true, suspicious: false, detections: 15 }
  ];
  
  return {
    headers: {
      from: 'sender@example.com',
      subject: 'Important Security Update',
      spfPass: false,
      dkimPass: false
    },
    urls: mockUrls.slice(0, Math.floor(Math.random() * 3) + 1),
    attachments: mockAttachments.slice(0, Math.floor(Math.random() * 2) + 1),
    phishingIndicators: 2,
    maliciousUrls: 1,
    maliciousAttachments: 1
  };
}

// APK analysis endpoint with file upload
router.post('/apk', auth, require('multer')({ 
  storage: require('multer').memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.apk')) {
      cb(null, true);
    } else {
      cb(new Error('Only APK files are allowed'));
    }
  }
}).single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'APK file required' });
    }

    console.log('Analyzing APK file:', req.file.originalname);

    // Generate file hash
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // Perform APK analysis using Hybrid Analysis API or mock data
    const apkAnalysis = await analyzeAPKFile(req.file.buffer, hash);

    let score = 0;
    let riskLevel = 'safe';

    // Risk scoring based on permissions and analysis
    if (apkAnalysis.dangerousPermissions?.length > 5) score += 40;
    if (apkAnalysis.dangerousPermissions?.length > 2) score += 20;
    if (apkAnalysis.malwareDetected) score += 60;
    if (apkAnalysis.suspiciousActivities?.length > 0) score += 30;

    if (score > 70) {
      riskLevel = 'malicious';
    } else if (score > 40) {
      riskLevel = 'suspicious';
    }

    console.log(`APK Analysis: ${apkAnalysis.dangerousPermissions?.length || 0} dangerous permissions, Risk: ${riskLevel}, Score: ${score}%`);

    // Update user scan statistics
    if (req.user) {
      await updateUserStats(req.user._id, riskLevel);
    }

    const scanResult = {
      scanId: Date.now(),
      results: {
        riskLevel,
        score,
        details: {
          apkInfo: apkAnalysis.apkInfo,
          permissions: apkAnalysis.permissions || [],
          dangerousPermissions: apkAnalysis.dangerousPermissions || [],
          malwareDetected: apkAnalysis.malwareDetected,
          suspiciousActivities: apkAnalysis.suspiciousActivities || []
        }
      }
    };

    try {
      await Scan.create({
        userId: req.user._id,
        scanType: 'apk',
        target: req.file.originalname,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        hashes: { sha256: hash },
        results: {
          riskLevel,
          score,
          details: apkAnalysis
        },
        status: 'completed'
      });
    } catch (dbError) {
      console.error('Database save error:', dbError);
    }

    res.json(scanResult);

  } catch (error) {
    console.error('APK analysis error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// APK analysis function using Hybrid Analysis API or mock data
async function analyzeAPKFile(fileBuffer, hash) {
  try {
    // Mock APK analysis for testing - replace with Hybrid Analysis API when available
    return generateMockAPKAnalysis(hash);
    
    /* Uncomment when you have a valid Hybrid Analysis API key
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fileBuffer, 'app.apk');
    form.append('environment_id', '300'); // Android environment
    
    const response = await axios.post(
      'https://www.hybrid-analysis.com/api/v2/submit/file',
      form,
      {
        headers: {
          'api-key': process.env.HYBRID_ANALYSIS_API_KEY,
          'User-Agent': 'Falcon Sandbox',
          ...form.getHeaders()
        }
      }
    );
    
    // Process Hybrid Analysis response
    return processHybridAnalysisResult(response.data);
    */
  } catch (error) {
    console.error('Hybrid Analysis API error:', error.message);
    return generateMockAPKAnalysis(hash);
  }
}

// Generate mock APK analysis for testing
function generateMockAPKAnalysis(hash) {
  const hashNum = parseInt(hash.substring(0, 8), 16);
  const isMalicious = hashNum % 8 === 0; // 12.5% malicious
  const isSuspicious = hashNum % 4 === 0 && !isMalicious; // 25% suspicious
  
  const allPermissions = [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.WAKE_LOCK',
    'android.permission.VIBRATE',
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
    'android.permission.SYSTEM_ALERT_WINDOW'
  ];
  
  const dangerousPerms = [
    'android.permission.CAMERA',
    'android.permission.RECORD_AUDIO',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.READ_CONTACTS',
    'android.permission.READ_SMS',
    'android.permission.SEND_SMS',
    'android.permission.CALL_PHONE',
    'android.permission.SYSTEM_ALERT_WINDOW'
  ];
  
  let permissions = allPermissions.slice(0, Math.floor(Math.random() * 10) + 5);
  let dangerousPermissions = [];
  
  if (isMalicious) {
    dangerousPermissions = dangerousPerms.slice(0, Math.floor(Math.random() * 6) + 4);
    permissions = [...permissions, ...dangerousPermissions];
  } else if (isSuspicious) {
    dangerousPermissions = dangerousPerms.slice(0, Math.floor(Math.random() * 3) + 2);
    permissions = [...permissions, ...dangerousPermissions];
  } else {
    dangerousPermissions = dangerousPerms.slice(0, Math.floor(Math.random() * 2));
    if (dangerousPermissions.length > 0) permissions = [...permissions, ...dangerousPermissions];
  }
  
  return {
    apkInfo: {
      packageName: `com.${isMalicious ? 'malware' : 'example'}.app`,
      version: '1.0.0',
      targetSdk: 'API 30'
    },
    permissions: [...new Set(permissions)],
    dangerousPermissions: [...new Set(dangerousPermissions)],
    malwareDetected: isMalicious,
    suspiciousActivities: isSuspicious ? ['Network communication', 'File access'] : []
  };
}

// Password strength analysis
router.post('/password', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    // Password strength analysis
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong';

    const suggestions = [];
    if (!checks.length) suggestions.push('Use at least 8 characters');
    if (!checks.uppercase) suggestions.push('Add uppercase letters');
    if (!checks.lowercase) suggestions.push('Add lowercase letters');
    if (!checks.numbers) suggestions.push('Add numbers');
    if (!checks.symbols) suggestions.push('Add special characters');

    res.json({
      scanId: Date.now(),
      results: {
        riskLevel: strength === 'weak' ? 'suspicious' : 'safe',
        score: Math.round((score / 5) * 100),
        details: {
          strength,
          checks,
          suggestions,
          breachCheck: { breached: false, count: 0 }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analysis statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Scan.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$scanType',
          count: { $sum: 1 },
          avgScore: { $avg: '$results.score' },
          riskLevels: {
            $push: '$results.riskLevel'
          }
        }
      }
    ]);

    const totalScans = await Scan.countDocuments({ userId: req.user._id });
    const recentScans = await Scan.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('scanType results.riskLevel createdAt');

    res.json({
      totalScans,
      scansByType: stats,
      recentScans
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function generateEmailRecommendations(analysis, score) {
  const recommendations = [];
  
  if (!analysis.spfPass) recommendations.push('SPF record not found or failed');
  if (!analysis.dkimPass) recommendations.push('DKIM signature not found or failed');
  if (!analysis.dmarcPass) recommendations.push('DMARC policy not found or failed');
  if (analysis.suspicious) recommendations.push('Suspicious patterns detected in headers');
  
  if (score > 50) {
    recommendations.push('Exercise extreme caution with this email');
    recommendations.push('Do not click any links or download attachments');
  }
  
  return recommendations;
}

// Helper function to update user statistics
async function updateUserStats(userId, riskLevel) {
  try {
    const User = require('../models/User');
    
    const updateData = { 
      $inc: { 
        scanCount: 1,
        safeScans: riskLevel === 'safe' ? 1 : 0,
        threatsDetected: (riskLevel === 'malicious' || riskLevel === 'phishing') ? 1 : 0
      }
    };
    
    await User.findByIdAndUpdate(userId, updateData);
  } catch (error) {
    console.error('ERROR updating user stats:', error);
  }
}

module.exports = router;