const mongoose = require('mongoose');

const threatIntelligenceSchema = new mongoose.Schema({
  indicator: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['hash', 'url', 'domain', 'ip', 'email'],
    required: true
  },
  threatType: {
    type: String,
    enum: ['malware', 'phishing', 'spam', 'botnet', 'c2', 'exploit'],
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  sources: [{
    name: String,
    lastSeen: Date,
    tags: [String]
  }],
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

threatIntelligenceSchema.index({ indicator: 1, type: 1 });
threatIntelligenceSchema.index({ threatType: 1, confidence: -1 });

module.exports = mongoose.model('ThreatIntelligence', threatIntelligenceSchema);