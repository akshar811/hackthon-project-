import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  en: {
    // Navbar
    dashboard: 'Dashboard',
    quiz: 'Quiz',
    learn: 'Learn',
    profile: 'Profile',
    logout: 'Logout',
    language: 'Language',
    
    // Common
    welcome: 'Welcome',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    upload: 'Upload',
    scan: 'Scan',
    analyze: 'Analyze',
    generate: 'Generate',
    check: 'Check',
    submit: 'Submit',
    reset: 'Reset',
    close: 'Close',
    
    // Dashboard
    fileScanner: 'File Scanner',
    urlChecker: 'URL Checker',
    emailAnalyzer: 'Email Analyzer',
    apkAnalyzer: 'APK Analyzer',
    passwordChecker: 'Password Checker',
    passwordGenerator: 'Password Generator',
    scanHistory: 'Scan History',
    recentScans: 'Recent Scans',
    securityTools: 'Security Tools',
    quickActions: 'Quick Actions',
    
    // File Scanner
    fileScannerTitle: 'File Security Scanner',
    fileScannerDesc: 'Upload and scan files for malware, viruses, and security threats',
    selectFile: 'Select File',
    dragDropFile: 'Drag and drop your file here, or click to select',
    supportedFormats: 'Supported formats: PDF, EXE, APK, DOCX, ZIP, MOD',
    maxFileSize: 'Maximum file size: 100MB',
    scanningFile: 'Scanning file...',
    scanComplete: 'Scan Complete',
    threatDetected: 'Threat Detected',
    fileSafe: 'File is Safe',
    
    // URL Checker
    urlCheckerTitle: 'URL Security Checker',
    urlCheckerDesc: 'Check URLs for phishing, malware, and suspicious activities',
    enterUrl: 'Enter URL to check',
    urlPlaceholder: 'https://example.com',
    checkingUrl: 'Checking URL...',
    urlSafe: 'URL is Safe',
    urlSuspicious: 'URL is Suspicious',
    urlMalicious: 'URL is Malicious',
    
    // Email Analyzer
    emailAnalyzerTitle: 'Email Security Analyzer',
    emailAnalyzerDesc: 'Analyze emails for phishing, spam, and security threats',
    pasteEmail: 'Paste email content or headers',
    emailPlaceholder: 'Paste your email content here...',
    analyzingEmail: 'Analyzing email...',
    emailSafe: 'Email is Safe',
    phishingDetected: 'Phishing Detected',
    spamDetected: 'Spam Detected',
    
    // APK Analyzer
    apkAnalyzerTitle: 'APK Security Analyzer',
    apkAnalyzerDesc: 'Analyze Android APK files for malware and suspicious permissions',
    selectApk: 'Select APK File',
    analyzingApk: 'Analyzing APK...',
    permissionsFound: 'Permissions Found',
    malwareDetected: 'Malware Detected',
    apkSafe: 'APK is Safe',
    
    // Password Tools
    passwordCheckerTitle: 'Password Strength Checker',
    passwordCheckerDesc: 'Check your password strength and security',
    enterPassword: 'Enter password to check',
    passwordStrength: 'Password Strength',
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
    veryStrong: 'Very Strong',
    
    passwordGeneratorTitle: 'Secure Password Generator',
    passwordGeneratorDesc: 'Generate strong, secure passwords',
    passwordLength: 'Password Length',
    includeUppercase: 'Include Uppercase',
    includeLowercase: 'Include Lowercase',
    includeNumbers: 'Include Numbers',
    includeSymbols: 'Include Symbols',
    generatedPassword: 'Generated Password',
    copyPassword: 'Copy Password',
    
    // Quiz
    quizTitle: 'Cybersecurity Quiz',
    quizDesc: 'Test your cybersecurity knowledge',
    startQuiz: 'Start Quiz',
    nextQuestion: 'Next Question',
    previousQuestion: 'Previous Question',
    submitQuiz: 'Submit Quiz',
    quizResults: 'Quiz Results',
    score: 'Score',
    correctAnswers: 'Correct Answers',
    wrongAnswers: 'Wrong Answers',
    retakeQuiz: 'Retake Quiz',
    
    // Learn Page
    learningHub: 'Cybersecurity Learning Hub',
    searchArticles: 'Search articles...',
    noArticlesFound: 'No articles found',
    backToArticles: 'Back to Articles',
    readTime: 'Read Time',
    category: 'Category',
    
    // Chatbot
    chatbotTitle: 'CYsafe AI',
    securityAssistant: 'Security Assistant',
    askCybersecurity: 'Ask me about cybersecurity...',
    aiThinking: 'AI is thinking...',
    quickQuestions: 'Quick questions to get started:',
    showQuestions: 'Show quick questions again',
    
    // Security Status
    safe: 'Safe',
    suspicious: 'Suspicious',
    malicious: 'Malicious',
    clean: 'Clean',
    infected: 'Infected',
    
    // Categories
    basics: 'Basics',
    tips: 'Tips',
    security: 'Security',
    tools: 'Tools',
    education: 'Education',
    technology: 'Technology',
    career: 'Career',
    legal: 'Legal',
    fraud: 'Fraud',
    mobile: 'Mobile'
  },
  
  hi: {
    // Navbar
    dashboard: 'डैशबोर्ड',
    quiz: 'प्रश्नोत्तरी',
    learn: 'सीखें',
    profile: 'प्रोफ़ाइल',
    logout: 'लॉग आउट',
    language: 'भाषा',
    
    // Common
    welcome: 'स्वागत है',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    cancel: 'रद्द करें',
    save: 'सेव करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    upload: 'अपलोड करें',
    scan: 'स्कैन करें',
    analyze: 'विश्लेषण करें',
    generate: 'जेनरेट करें',
    check: 'जांचें',
    submit: 'सबमिट करें',
    reset: 'रीसेट करें',
    close: 'बंद करें',
    
    // Dashboard
    fileScanner: 'फ़ाइल स्कैनर',
    urlChecker: 'URL चेकर',
    emailAnalyzer: 'ईमेल विश्लेषक',
    apkAnalyzer: 'APK विश्लेषक',
    passwordChecker: 'पासवर्ड चेकर',
    passwordGenerator: 'पासवर्ड जेनरेटर',
    scanHistory: 'स्कैन इतिहास',
    recentScans: 'हाल की स्कैन',
    securityTools: 'सुरक्षा उपकरण',
    quickActions: 'त्वरित कार्य',
    
    // File Scanner
    fileScannerTitle: 'फ़ाइल सुरक्षा स्कैनर',
    fileScannerDesc: 'मैलवेयर, वायरस और सुरक्षा खतरों के लिए फ़ाइलें अपलोड और स्कैन करें',
    selectFile: 'फ़ाइल चुनें',
    dragDropFile: 'अपनी फ़ाइल यहाँ खींचें और छोड़ें, या चुनने के लिए क्लिक करें',
    supportedFormats: 'समर्थित प्रारूप: PDF, EXE, APK, DOCX, ZIP, MOD',
    maxFileSize: 'अधिकतम फ़ाइल आकार: 100MB',
    scanningFile: 'फ़ाइल स्कैन कर रहे हैं...',
    scanComplete: 'स्कैन पूर्ण',
    threatDetected: 'खतरा मिला',
    fileSafe: 'फ़ाइल सुरक्षित है',
    
    // URL Checker
    urlCheckerTitle: 'URL सुरक्षा चेकर',
    urlCheckerDesc: 'फ़िशिंग, मैलवेयर और संदिग्ध गतिविधियों के लिए URL जांचें',
    enterUrl: 'जांचने के लिए URL दर्ज करें',
    urlPlaceholder: 'https://example.com',
    checkingUrl: 'URL जांच रहे हैं...',
    urlSafe: 'URL सुरक्षित है',
    urlSuspicious: 'URL संदिग्ध है',
    urlMalicious: 'URL दुर्भावनापूर्ण है',
    
    // Email Analyzer
    emailAnalyzerTitle: 'ईमेल सुरक्षा विश्लेषक',
    emailAnalyzerDesc: 'फ़िशिंग, स्पैम और सुरक्षा खतरों के लिए ईमेल का विश्लेषण करें',
    pasteEmail: 'ईमेल सामग्री या हेडर पेस्ट करें',
    emailPlaceholder: 'अपनी ईमेल सामग्री यहाँ पेस्ट करें...',
    analyzingEmail: 'ईमेल का विश्लेषण कर रहे हैं...',
    emailSafe: 'ईमेल सुरक्षित है',
    phishingDetected: 'फ़िशिंग मिली',
    spamDetected: 'स्पैम मिला',
    
    // APK Analyzer
    apkAnalyzerTitle: 'APK सुरक्षा विश्लेषक',
    apkAnalyzerDesc: 'मैलवेयर और संदिग्ध अनुमतियों के लिए Android APK फ़ाइलों का विश्लेषण करें',
    selectApk: 'APK फ़ाइल चुनें',
    analyzingApk: 'APK का विश्लेषण कर रहे हैं...',
    permissionsFound: 'अनुमतियां मिलीं',
    malwareDetected: 'मैलवेयर मिला',
    apkSafe: 'APK सुरक्षित है',
    
    // Password Tools
    passwordCheckerTitle: 'पासवर्ड मजबूती चेकर',
    passwordCheckerDesc: 'अपने पासवर्ड की मजबूती और सुरक्षा जांचें',
    enterPassword: 'जांचने के लिए पासवर्ड दर्ज करें',
    passwordStrength: 'पासवर्ड मजबूती',
    weak: 'कमजोर',
    medium: 'मध्यम',
    strong: 'मजबूत',
    veryStrong: 'बहुत मजबूत',
    
    passwordGeneratorTitle: 'सुरक्षित पासवर्ड जेनरेटर',
    passwordGeneratorDesc: 'मजबूत, सुरक्षित पासवर्ड जेनरेट करें',
    passwordLength: 'पासवर्ड लंबाई',
    includeUppercase: 'बड़े अक्षर शामिल करें',
    includeLowercase: 'छोटे अक्षर शामिल करें',
    includeNumbers: 'संख्याएं शामिल करें',
    includeSymbols: 'प्रतीक शामिल करें',
    generatedPassword: 'जेनरेट किया गया पासवर्ड',
    copyPassword: 'पासवर्ड कॉपी करें',
    
    // Quiz
    quizTitle: 'साइबर सुरक्षा प्रश्नोत्तरी',
    quizDesc: 'अपने साइबर सुरक्षा ज्ञान का परीक्षण करें',
    startQuiz: 'प्रश्नोत्तरी शुरू करें',
    nextQuestion: 'अगला प्रश्न',
    previousQuestion: 'पिछला प्रश्न',
    submitQuiz: 'प्रश्नोत्तरी सबमिट करें',
    quizResults: 'प्रश्नोत्तरी परिणाम',
    score: 'स्कोर',
    correctAnswers: 'सही उत्तर',
    wrongAnswers: 'गलत उत्तर',
    retakeQuiz: 'प्रश्नोत्तरी फिर से लें',
    
    // Learn Page
    learningHub: 'साइबर सुरक्षा शिक्षा केंद्र',
    searchArticles: 'लेख खोजें...',
    noArticlesFound: 'कोई लेख नहीं मिला',
    backToArticles: 'लेखों पर वापस जाएं',
    readTime: 'पढ़ने का समय',
    category: 'श्रेणी',
    
    // Chatbot
    chatbotTitle: 'CYsafe AI',
    securityAssistant: 'सुरक्षा सहायक',
    askCybersecurity: 'मुझसे साइबर सुरक्षा के बारे में पूछें...',
    aiThinking: 'AI सोच रहा है...',
    quickQuestions: 'शुरू करने के लिए त्वरित प्रश्न:',
    showQuestions: 'त्वरित प्रश्न फिर से दिखाएं',
    
    // Security Status
    safe: 'सुरक्षित',
    suspicious: 'संदिग्ध',
    malicious: 'दुर्भावनापूर्ण',
    clean: 'साफ',
    infected: 'संक्रमित',
    
    // Categories
    basics: 'मूल बातें',
    tips: 'सुझाव',
    security: 'सुरक्षा',
    tools: 'उपकरण',
    education: 'शिक्षा',
    technology: 'तकनीक',
    career: 'करियर',
    legal: 'कानूनी',
    fraud: 'धोखाधड़ी',
    mobile: 'मोबाइल'
  },
  
  gu: {
    // Navbar
    dashboard: 'ડેશબોર્ડ',
    quiz: 'ક્વિઝ',
    learn: 'શીખો',
    profile: 'પ્રોફાઇલ',
    logout: 'લૉગ આઉટ',
    language: 'ભાષા',
    
    // Common
    welcome: 'સ્વાગત છે',
    loading: 'લોડ થઈ રહ્યું છે...',
    error: 'ભૂલ',
    success: 'સફળતા',
    cancel: 'રદ કરો',
    save: 'સેવ કરો',
    delete: 'ડિલીટ કરો',
    edit: 'સંપાદિત કરો',
    upload: 'અપલોડ કરો',
    scan: 'સ્કેન કરો',
    analyze: 'વિશ્લેષણ કરો',
    generate: 'જનરેટ કરો',
    check: 'જાંચો',
    submit: 'સબમિટ કરો',
    reset: 'રીસેટ કરો',
    close: 'બંધ કરો',
    
    // Dashboard
    fileScanner: 'ફાઇલ સ્કેનર',
    urlChecker: 'URL ચેકર',
    emailAnalyzer: 'ઇમેઇલ વિશ્લેષક',
    apkAnalyzer: 'APK વિશ્લેષક',
    passwordChecker: 'પાસવર્ડ ચેકર',
    passwordGenerator: 'પાસવર્ડ જનરેટર',
    scanHistory: 'સ્કેન ઇતિહાસ',
    recentScans: 'હાલના સ્કેન',
    securityTools: 'સુરક્ષા ઉપકરણો',
    quickActions: 'ઝડપી ક્રિયાઓ',
    
    // File Scanner
    fileScannerTitle: 'ફાઇલ સુરક્ષા સ્કેનર',
    fileScannerDesc: 'મેલવેયર, વાયરસ અને સુરક્ષા ખતરાઓ માટે ફાઇલો અપલોડ અને સ્કેન કરો',
    selectFile: 'ફાઇલ પસંદ કરો',
    dragDropFile: 'તમારી ફાઇલ અહીં ખીંચો અને છોડો, અથવા પસંદ કરવા માટે ક્લિક કરો',
    supportedFormats: 'સમર્થિત પ્રારૂપો: PDF, EXE, APK, DOCX, ZIP, MOD',
    maxFileSize: 'વધુમાં વધુ ફાઇલ સાઇઝ: 100MB',
    scanningFile: 'ફાઇલ સ્કેન કરી રહ્યા છે...',
    scanComplete: 'સ્કેન પૂરું',
    threatDetected: 'ખતરો મળ્યો',
    fileSafe: 'ફાઇલ સુરક્ષિત છે',
    
    // URL Checker
    urlCheckerTitle: 'URL સુરક્ષા ચેકર',
    urlCheckerDesc: 'ફિશિંગ, મેલવેયર અને શંકાસ્પદ ગતિવિધિઓ માટે URL જાંચો',
    enterUrl: 'જાંચવા માટે URL દાખલ કરો',
    urlPlaceholder: 'https://example.com',
    checkingUrl: 'URL જાંચી રહ્યા છે...',
    urlSafe: 'URL સુરક્ષિત છે',
    urlSuspicious: 'URL શંકાસ્પદ છે',
    urlMalicious: 'URL હાનિકારક છે',
    
    // Email Analyzer
    emailAnalyzerTitle: 'ઇમેઇલ સુરક્ષા વિશ્લેષક',
    emailAnalyzerDesc: 'ફિશિંગ, સ્પેમ અને સુરક્ષા ખતરાઓ માટે ઇમેઇલનું વિશ્લેષણ કરો',
    pasteEmail: 'ઇમેઇલ સામગ્રી અથવા હેડર પેસ્ટ કરો',
    emailPlaceholder: 'તમારી ઇમેઇલ સામગ્રી અહીં પેસ્ટ કરો...',
    analyzingEmail: 'ઇમેઇલનું વિશ્લેષણ કરી રહ્યા છે...',
    emailSafe: 'ઇમેઇલ સુરક્ષિત છે',
    phishingDetected: 'ફિશિંગ મળ્યું',
    spamDetected: 'સ્પેમ મળ્યું',
    
    // APK Analyzer
    apkAnalyzerTitle: 'APK સુરક્ષા વિશ્લેષક',
    apkAnalyzerDesc: 'મેલવેયર અને શંકાસ્પદ અનુમતિઓ માટે Android APK ફાઇલોનું વિશ્લેષણ કરો',
    selectApk: 'APK ફાઇલ પસંદ કરો',
    analyzingApk: 'APKનું વિશ્લેષણ કરી રહ્યા છે...',
    permissionsFound: 'અનુમતિઓ મળી',
    malwareDetected: 'મેલવેયર મળ્યું',
    apkSafe: 'APK સુરક્ષિત છે',
    
    // Password Tools
    passwordCheckerTitle: 'પાસવર્ડ મજબૂતી ચેકર',
    passwordCheckerDesc: 'તમારા પાસવર્ડની મજબૂતી અને સુરક્ષા જાંચો',
    enterPassword: 'જાંચવા માટે પાસવર્ડ દાખલ કરો',
    passwordStrength: 'પાસવર્ડ મજબૂતી',
    weak: 'કમજોર',
    medium: 'મધ્યમ',
    strong: 'મજબૂત',
    veryStrong: 'ખૂબ મજબૂત',
    
    passwordGeneratorTitle: 'સુરક્ષિત પાસવર્ડ જનરેટર',
    passwordGeneratorDesc: 'મજબૂત, સુરક્ષિત પાસવર્ડ જનરેટ કરો',
    passwordLength: 'પાસવર્ડ લંબાઈ',
    includeUppercase: 'મોટા અક્ષરો સામેલ કરો',
    includeLowercase: 'નાના અક્ષરો સામેલ કરો',
    includeNumbers: 'સંખ્યાઓ સામેલ કરો',
    includeSymbols: 'પ્રતીકો સામેલ કરો',
    generatedPassword: 'જનરેટ કરેલ પાસવર્ડ',
    copyPassword: 'પાસવર્ડ કોપી કરો',
    
    // Quiz
    quizTitle: 'સાયબર સુરક્ષા ક્વિઝ',
    quizDesc: 'તમારા સાયબર સુરક્ષા જ્ઞાનનો પરીક્ષણ કરો',
    startQuiz: 'ક્વિઝ શરૂ કરો',
    nextQuestion: 'અગલો પ્રશ્ન',
    previousQuestion: 'પાછલો પ્રશ્ન',
    submitQuiz: 'ક્વિઝ સબમિટ કરો',
    quizResults: 'ક્વિઝ પરિણામ',
    score: 'સ્કોર',
    correctAnswers: 'સાચા ઉત્તરો',
    wrongAnswers: 'ગલત ઉત્તરો',
    retakeQuiz: 'ક્વિઝ ફરીથી લો',
    
    // Learn Page
    learningHub: 'સાયબર સુરક્ષા શિક્ષણ કેન્દ્ર',
    searchArticles: 'લેખો શોધો...',
    noArticlesFound: 'કોઈ લેખ મળ્યો નથી',
    backToArticles: 'લેખો પર પાછા જાઓ',
    readTime: 'વાંચવાનો સમય',
    category: 'શ્રેણી',
    
    // Chatbot
    chatbotTitle: 'CYsafe AI',
    securityAssistant: 'સુરક્ષા સહાયક',
    askCybersecurity: 'મને સાયબર સુરક્ષા વિશે પૂછો...',
    aiThinking: 'AI વિચારી રહ્યું છે...',
    quickQuestions: 'શરૂ કરવા માટે ઝડપી પ્રશ્નો:',
    showQuestions: 'ઝડપી પ્રશ્નો ફરીથી બતાવો',
    
    // Security Status
    safe: 'સુરક્ષિત',
    suspicious: 'શંકાસ્પદ',
    malicious: 'હાનિકારક',
    clean: 'સાફ',
    infected: 'સંક્રમિત',
    
    // Categories
    basics: 'મૂળભૂત બાબતો',
    tips: 'સુઝાવો',
    security: 'સુરક્ષા',
    tools: 'ઉપકરણો',
    education: 'શિક્ષણ',
    technology: 'ટેક્નોલોજી',
    career: 'કરિયર',
    legal: 'કાનૂની',
    fraud: 'ધોખાધડી',
    mobile: 'મોબાઇલ'
  }
};

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' }
];

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (languageCode) => {
    if (translations[languageCode]) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('selectedLanguage', languageCode);
    }
  };

  const t = (key) => {
    return translations[currentLanguage][key] || translations.en[key] || key;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    languages,
    translations
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};