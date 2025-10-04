const express = require('express');
const { auth } = require('../middleware/auth');
const Scan = require('../models/Scan');
const User = require('../models/User');

const router = express.Router();

// Get user profile with statistics
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        scanCount: user.scanCount || 0,
        safeScans: user.safeScans || 0,
        threatsDetected: user.threatsDetected || 0
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Get scan statistics
    const totalScans = await Scan.countDocuments({ userId: user._id });
    const recentScans = await Scan.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('scanType results.riskLevel results.score createdAt target');

    // Get risk level distribution
    const riskDistribution = await Scan.aggregate([
      { $match: { userId: user._id, status: 'completed' } },
      {
        $group: {
          _id: '$results.riskLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get scan type distribution
    const scanTypeDistribution = await Scan.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$scanType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly scan trends
    const monthlyTrends = await Scan.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      user: {
        username: user.username,
        email: user.email,
        scanCount: user.scanCount,
        memberSince: user.createdAt
      },
      statistics: {
        totalScans,
        riskDistribution,
        scanTypeDistribution,
        monthlyTrends
      },
      recentScans
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export scan data
router.get('/export', auth, async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;
    
    let query = { userId: req.user._id };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const scans = await Scan.find(query)
      .sort({ createdAt: -1 })
      .select('-metadata -userId');

    if (format === 'csv') {
      const csv = convertToCSV(scans);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=scan-history.csv');
      res.send(csv);
    } else {
      res.json({ scans, exportedAt: new Date() });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete scan
router.delete('/scan/:scanId', auth, async (req, res) => {
  try {
    const scan = await Scan.findOneAndDelete({
      _id: req.params.scanId,
      userId: req.user._id
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json({ message: 'Scan deleted successfully' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user._id);

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function convertToCSV(scans) {
  const headers = ['Date', 'Type', 'Target', 'Risk Level', 'Score', 'Status'];
  const rows = scans.map(scan => [
    scan.createdAt.toISOString(),
    scan.scanType,
    scan.target,
    scan.results?.riskLevel || 'unknown',
    scan.results?.score || 0,
    scan.status
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

module.exports = router;