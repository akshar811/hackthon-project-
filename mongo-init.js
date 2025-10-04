// MongoDB initialization script
db = db.getSiblingDB('cyberguard');

// Create collections with indexes
db.createCollection('users');
db.createCollection('scans');
db.createCollection('threatintelligences');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });

db.scans.createIndex({ "userId": 1, "createdAt": -1 });
db.scans.createIndex({ "hashes.sha256": 1 });
db.scans.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

db.threatintelligences.createIndex({ "indicator": 1, "type": 1 });
db.threatintelligences.createIndex({ "threatType": 1, "confidence": -1 });

print('Database initialized successfully');