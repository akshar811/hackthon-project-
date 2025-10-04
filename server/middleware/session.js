// Simple session middleware for tracking user scans without authentication
const sessions = new Map();

const sessionMiddleware = (req, res, next) => {
  let sessionId = req.headers['x-session-id'];
  
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    res.setHeader('x-session-id', sessionId);
  }
  
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      createdAt: new Date(),
      lastActivity: new Date()
    });
  } else {
    sessions.get(sessionId).lastActivity = new Date();
  }
  
  req.sessionId = sessionId;
  next();
};

module.exports = { sessionMiddleware, sessions };