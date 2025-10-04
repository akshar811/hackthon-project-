const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scanType: {
    type: String,
    enum: ['file', 'url', 'email', 'apk', 'password'],
    required: true
  },
  target: {
    type: String,
    required: true
  },
  fileName: String,
  fileSize: Number,
  fileType: String,
  hashes: {
    md5: String,
    sha1: String,
    sha256: String
  },
  results: {
    riskLevel: {
      type: String,
      enum: ['safe', 'suspicious', 'malicious', 'unknown'],
      default: 'unknown'
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    engines: [{
      name: String,
      result: String,
      detected: Boolean,
      version: String,
      update: Date
    }],
    details: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    country: String
  },
  status: {
    type: String,
    enum: ['pending', 'scanning', 'completed', 'failed'],
    default: 'pending'
  },
  processingTime: Number,
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours
  }
}, {
  timestamps: true
});

scanSchema.index({ userId: 1, createdAt: -1 });
scanSchema.index({ 'hashes.sha256': 1 });
scanSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Scan', scanSchema);