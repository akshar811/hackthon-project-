// Session management utility
export const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

export const setSessionId = (sessionId) => {
  localStorage.setItem('sessionId', sessionId);
};

export const clearSession = () => {
  localStorage.removeItem('sessionId');
};