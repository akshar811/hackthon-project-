const express = require('express');
const { auth } = require('../middleware/auth');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

// Store used question hashes to avoid duplicates
const usedQuestions = new Set();

// Clear used questions cache every hour to allow fresh questions
setInterval(() => {
  usedQuestions.clear();
  console.log('Cleared used questions cache for fresh generation');
}, 60 * 60 * 1000); // 1 hour

// Generate quiz questions using Google Gemini API
router.get('/generate', async (req, res) => {
  try {
    const sessionId = req.sessionId || 'anonymous';
    const language = req.query.language || 'en';
    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 1000000);
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const requestId = req.query.uniqueId || timestamp;
    
    console.log(`Generating NEW quiz - Session: ${sessionId}, Seed: ${randomSeed}, Request: ${requestId}`);
    
    // Clear cache periodically to ensure fresh questions
    if (usedQuestions.size > 50) {
      usedQuestions.clear();
      console.log('Cleared question cache for fresh generation');
    }
    
    const topics = [
      'Network firewalls and intrusion detection',
      'Ransomware and malware analysis', 
      'Public key cryptography and SSL/TLS',
      'Phishing and social engineering tactics',
      'Digital forensics and incident response',
      'Multi-factor authentication systems',
      'Vulnerability scanning and penetration testing',
      'GDPR compliance and data protection',
      'Cloud security in AWS and Azure',
      'Mobile device management and APK security',
      'Cross-site scripting and SQL injection',
      'Risk assessment and threat modeling',
      'SIEM tools and security monitoring',
      'IoT security and emerging threats',
      'Business continuity and disaster recovery'
    ];
    
    const uniquePrompts = [
      'network intrusion detection and prevention systems',
      'advanced persistent threats and zero-day exploits', 
      'blockchain security and cryptocurrency attacks',
      'spear phishing and business email compromise',
      'memory forensics and malware persistence',
      'OAuth 2.0 and SAML authentication vulnerabilities',
      'container security and Kubernetes threats',
      'NIST cybersecurity framework implementation',
      'serverless computing security risks',
      'mobile application reverse engineering',
      'web application security testing methodologies',
      'threat hunting and behavioral analytics',
      'security orchestration and automated response',
      'artificial intelligence in cybersecurity',
      'supply chain security and software composition analysis'
    ];
    
    // Use session and timestamp to create unique seed for randomization
    const uniqueSeed = `${sessionId}-${timestamp}-${randomSeed}`;
    const seedHash = crypto.createHash('md5').update(uniqueSeed).digest('hex');
    const seedNumber = parseInt(seedHash.substring(0, 8), 16);
    
    // Shuffle topics based on unique seed
    const shuffledTopics = [...uniquePrompts];
    for (let i = shuffledTopics.length - 1; i > 0; i--) {
      const j = Math.floor(((seedNumber + i) % 1000) / 1000 * (i + 1));
      [shuffledTopics[i], shuffledTopics[j]] = [shuffledTopics[j], shuffledTopics[i]];
    }
    
    const selectedTopics = shuffledTopics.slice(0, 15);
    
    const languageInstructions = {
      en: 'Generate questions in English',
      hi: 'Generate questions in Hindi (हिंदी में प्रश्न बनाएं)',
      gu: 'Generate questions in Gujarati (ગુજરાતીમાં પ્રશ્નો બનાવો)'
    };
    
    const prompt = `CRITICAL: Generate 15 COMPLETELY DIFFERENT cybersecurity questions. NEVER repeat previous questions.

LANGUAGE: ${languageInstructions[language] || languageInstructions.en}
UNIQUE SESSION: ${uniqueSeed}
SEED HASH: ${seedHash}
RANDOM TOPICS: ${selectedTopics.join(', ')}

Create unique questions covering these specific areas:
${selectedTopics.map((topic, i) => `${i+1}. ${topic}`).join('\n')}

MANDATORY REQUIREMENTS:
- Each question MUST be completely unique and different from any previous generation
- ${languageInstructions[language] || languageInstructions.en}
- Use current cybersecurity trends and real scenarios from 2024
- Vary difficulty: 5 beginner, 5 intermediate, 5 advanced
- Include specific technical details and current threats
- NO generic questions about "what is phishing" etc.
- Focus on practical, scenario-based problems
- Use the unique seed ${seedHash} to ensure different questions each time

Return ONLY valid JSON (no markdown):
[
  {
    "question": "During a red team exercise, you discover that a company's SIEM is not detecting lateral movement via WMI. What technique are attackers likely using?",
    "options": ["A) Living off the land techniques", "B) Custom malware deployment", "C) Network protocol tunneling", "D) Social engineering attacks"],
    "correct": "A",
    "explanation": "Living off the land techniques use legitimate system tools like WMI, making detection difficult for traditional SIEM systems."
  }
]

Generate 15 unique questions using seed ${seedHash}:`;

    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 1.0,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 8000,
        candidateCount: 1
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    });

    let questions = [];
    try {
      if (!response.data.candidates || !response.data.candidates[0]) {
        throw new Error('No candidates in Gemini response');
      }
      
      const content = response.data.candidates[0].content.parts[0].text.trim();
      console.log('Raw Gemini response:', content.substring(0, 200) + '...');
      
      // Extract JSON from markdown code blocks
      let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      let cleanContent;
      
      if (jsonMatch) {
        cleanContent = jsonMatch[1].trim();
      } else {
        // If no markdown, try to find JSON array
        let startIndex = content.indexOf('[');
        let endIndex = content.lastIndexOf(']');
        if (startIndex !== -1 && endIndex !== -1) {
          cleanContent = content.substring(startIndex, endIndex + 1);
        } else {
          cleanContent = content;
        }
      }
      
      questions = JSON.parse(cleanContent);
      
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }
      
      // Validate questions
      const validQuestions = questions.filter(q => {
        return q && q.question && q.options && q.correct && q.explanation &&
               Array.isArray(q.options) && q.options.length === 4 &&
               ['A', 'B', 'C', 'D'].includes(q.correct);
      }).slice(0, 15);
      
      console.log(`Gemini generated ${validQuestions.length} valid questions`);
      
      if (validQuestions.length >= 10) {
        questions = validQuestions;
      } else {
        throw new Error(`Only ${validQuestions.length} valid questions generated`);
      }
      
    } catch (parseError) {
      console.error('Gemini parsing error:', parseError.message);
      console.log('Full response:', JSON.stringify(response.data, null, 2));
      questions = getFallbackQuestions(sessionId, seedHash, language);
    }

    // Ensure we have exactly 15 questions
    if (questions.length < 15) {
      const fallback = getFallbackQuestions(sessionId, seedHash, language);
      const needed = 15 - questions.length;
      questions.push(...fallback.slice(0, needed));
    }
    
    questions = questions.slice(0, 15);
    
    res.json({ 
      questions, 
      generated: questions.length > 0 && questions[0].question !== getFallbackQuestions()[0].question,
      timestamp, 
      source: 'gemini',
      seed: seedHash,
      sessionId: sessionId,
      uniqueId: requestId
    });
    
  } catch (error) {
    console.error('Gemini API error:', error.response?.data || error.message);
    const sessionId = req.sessionId || 'anonymous';
    const timestamp = Date.now();
    const seedHash = crypto.createHash('md5').update(`${sessionId}-${timestamp}`).digest('hex');
    
    const language = req.query.language || 'en';
    res.json({ 
      questions: getFallbackQuestions(sessionId, seedHash, language), 
      generated: false, 
      source: 'fallback',
      sessionId: sessionId,
      seed: seedHash,
      error: error.message
    });
  }
});

// Generate unique fallback questions based on session
function getFallbackQuestions(sessionId = 'default', seed = 0, language = 'en') {
  const questionSets = {
    en: [
      {
        question: "What is phishing?",
        options: ["A) A type of malware", "B) A social engineering attack", "C) A firewall technique", "D) A password manager"],
        correct: "B",
        explanation: "Phishing is a social engineering attack where attackers impersonate legitimate entities to steal sensitive information like passwords or credit card details."
      },
    {
      question: "What does HTTPS stand for?",
      options: ["A) HyperText Transfer Protocol Secure", "B) High Transfer Protocol System", "C) HyperText Transport Protocol Safe", "D) High Text Transfer Protocol Secure"],
      correct: "A",
      explanation: "HTTPS stands for HyperText Transfer Protocol Secure, which encrypts data transmission between web browsers and servers."
    },
    {
      question: "What is two-factor authentication?",
      options: ["A) Using two passwords", "B) Two security methods for verification", "C) Two different browsers", "D) Two antivirus programs"],
      correct: "B",
      explanation: "Two-factor authentication uses two different security methods (like password + SMS code) to verify user identity, providing stronger security."
    },
    {
      question: "What is malware?",
      options: ["A) Good software", "B) Malicious software", "C) Mail software", "D) Mobile software"],
      correct: "B",
      explanation: "Malware is malicious software designed to damage, disrupt, or gain unauthorized access to computer systems."
    },
    {
      question: "What is a firewall?",
      options: ["A) A physical wall", "B) Network security system", "C) A type of virus", "D) A password tool"],
      correct: "B",
      explanation: "A firewall is a network security system that monitors and controls incoming and outgoing network traffic based on security rules."
    },
    {
      question: "What is encryption?",
      options: ["A) Deleting data", "B) Copying data", "C) Converting data to secure format", "D) Backing up data"],
      correct: "C",
      explanation: "Encryption converts readable data into a coded format that can only be decoded with the correct key, protecting data confidentiality."
    },
    {
      question: "What is a VPN?",
      options: ["A) Very Private Network", "B) Virtual Private Network", "C) Verified Public Network", "D) Visual Private Network"],
      correct: "B",
      explanation: "A Virtual Private Network (VPN) creates a secure, encrypted connection over the internet to protect data transmission and privacy."
    },
    {
      question: "What is social engineering?",
      options: ["A) Building social networks", "B) Manipulating people for information", "C) Engineering software", "D) Social media management"],
      correct: "B",
      explanation: "Social engineering is the practice of manipulating people psychologically to divulge confidential information or perform actions that compromise security."
    },
    {
      question: "What is ransomware?",
      options: ["A) Free software", "B) Malware that encrypts files for ransom", "C) Antivirus software", "D) System backup tool"],
      correct: "B",
      explanation: "Ransomware is malicious software that encrypts victim's files and demands payment (ransom) for the decryption key."
    },
    {
      question: "What is a strong password?",
      options: ["A) 123456", "B) password", "C) Complex mix of characters, numbers, symbols", "D) Your name"],
      correct: "C",
      explanation: "A strong password contains a complex mix of uppercase, lowercase letters, numbers, and symbols, making it difficult to guess or crack."
    },
    {
      question: "What is SQL injection?",
      options: ["A) Database attack technique", "B) Medical procedure", "C) Software installation", "D) Network protocol"],
      correct: "A",
      explanation: "SQL injection is a code injection technique that exploits vulnerabilities in database-driven applications to access or manipulate data."
    },
    {
      question: "What is a DDoS attack?",
      options: ["A) Data theft", "B) Distributed Denial of Service", "C) Direct Database Operation System", "D) Digital Data Override System"],
      correct: "B",
      explanation: "A Distributed Denial of Service (DDoS) attack overwhelms a target system with traffic from multiple sources to make it unavailable."
    },
    {
      question: "What is antivirus software?",
      options: ["A) Software that creates viruses", "B) Software that detects and removes malware", "C) Software for video editing", "D) Software for data backup"],
      correct: "B",
      explanation: "Antivirus software is designed to detect, prevent, and remove malicious software from computer systems."
    },
    {
      question: "What is a security patch?",
      options: ["A) Physical security device", "B) Software update to fix vulnerabilities", "C) Network cable", "D) Password manager"],
      correct: "B",
      explanation: "A security patch is a software update released to fix security vulnerabilities and protect systems from potential exploits."
    },
    {
      question: "What is identity theft?",
      options: ["A) Stealing physical items", "B) Unauthorized use of someone's personal information", "C) Copying software", "D) Network hacking"],
      correct: "B",
      explanation: "Identity theft involves unauthorized use of someone's personal information to commit fraud or other crimes in their name."
    },
    {
      question: "What is a zero-day vulnerability?",
      options: ["A) A bug found on day zero", "B) A vulnerability unknown to security vendors", "C) A daily security scan", "D) A new software release"],
      correct: "B",
      explanation: "A zero-day vulnerability is a security flaw unknown to security vendors, making it particularly dangerous as no patches exist."
    },
    {
      question: "What is penetration testing?",
      options: ["A) Testing network speed", "B) Authorized simulated cyberattack", "C) Installing software", "D) Database backup testing"],
      correct: "B",
      explanation: "Penetration testing is an authorized simulated cyberattack to evaluate system security and find vulnerabilities."
    },
    {
      question: "What is a honeypot in cybersecurity?",
      options: ["A) Sweet security software", "B) Decoy system to attract attackers", "C) Password storage", "D) Network router"],
      correct: "B",
      explanation: "A honeypot is a decoy system designed to attract and detect unauthorized access attempts and study attack methods."
    },
    {
      question: "What is endpoint detection and response (EDR)?",
      options: ["A) Email security tool", "B) Network firewall", "C) Advanced threat detection for endpoints", "D) Password manager"],
      correct: "C",
      explanation: "EDR is a cybersecurity solution that monitors endpoint devices for suspicious activities and provides response capabilities."
    },
      {
        question: "What is the principle of least privilege?",
        options: ["A) Giving maximum access to all users", "B) Providing minimum access necessary for job functions", "C) Removing all user privileges", "D) Creating complex passwords"],
        correct: "B",
        explanation: "The principle of least privilege means providing users with the minimum access rights necessary to perform their job functions."
      },
      {
        question: "What is a man-in-the-middle attack?",
        options: ["A) Physical theft of devices", "B) Intercepting communication between two parties", "C) Installing malware", "D) Password cracking"],
        correct: "B",
        explanation: "A man-in-the-middle attack occurs when an attacker secretly intercepts and potentially alters communication between two parties."
      },
      {
        question: "What is multi-factor authentication (MFA)?",
        options: ["A) Using multiple passwords", "B) Authentication using multiple verification methods", "C) Multiple user accounts", "D) Multiple security software"],
        correct: "B",
        explanation: "Multi-factor authentication uses multiple verification methods (something you know, have, or are) to verify identity."
      },
      {
        question: "What is a security incident?",
        options: ["A) Software update", "B) Unauthorized access or security breach", "C) Network maintenance", "D) User training session"],
        correct: "B",
        explanation: "A security incident is any unauthorized access, use, disclosure, or breach of security policies and procedures."
      },
      {
        question: "What is data loss prevention (DLP)?",
        options: ["A) Data backup system", "B) Technology to prevent unauthorized data transmission", "C) Database management", "D) Data recovery tool"],
        correct: "B",
        explanation: "Data Loss Prevention (DLP) is technology designed to detect and prevent unauthorized transmission of sensitive data."
      },
      {
        question: "What is a security audit?",
        options: ["A) Financial review", "B) Systematic evaluation of security measures", "C) Software installation", "D) Network speed test"],
        correct: "B",
        explanation: "A security audit is a systematic evaluation of an organization's security policies, procedures, and controls."
      }
    ],
    hi: [
      {
        question: "फ़िशिंग क्या है?",
        options: ["A) एक प्रकार का मैलवेयर", "B) एक सोशल इंजीनियरिंग हमला", "C) एक फ़ायरवॉल तकनीक", "D) एक पासवर्ड मैनेजर"],
        correct: "B",
        explanation: "फ़िशिंग एक सोशल इंजीनियरिंग हमला है जहां हमलावर वैध संस्थाओं का रूप धारण करके पासवर्ड या क्रेडिट कार्ड विवरण जैसी संवेदनशील जानकारी चुराते हैं।"
      },
      {
        question: "HTTPS का मतलब क्या है?",
        options: ["A) HyperText Transfer Protocol Secure", "B) High Transfer Protocol System", "C) HyperText Transport Protocol Safe", "D) High Text Transfer Protocol Secure"],
        correct: "A",
        explanation: "HTTPS का मतलब HyperText Transfer Protocol Secure है, जो वेब ब्राउज़र और सर्वर के बीच डेटा ट्रांसमिशन को एन्क्रिप्ट करता है।"
      },
      {
        question: "दो-कारक प्रमाणीकरण क्या है?",
        options: ["A) दो पासवर्ड का उपयोग", "B) सत्यापन के लिए दो अलग सुरक्षा विधियां", "C) दो अलग ब्राउज़र", "D) दो एंटीवायरस प्रोग्राम"],
        correct: "B",
        explanation: "दो-कारक प्रमाणीकरण उपयोगकर्ता की पहचान सत्यापित करने के लिए दो अलग सुरक्षा विधियों (जैसे पासवर्ड + SMS कोड) का उपयोग करता है, जो मजबूत सुरक्षा प्रदान करता है।"
      },
      {
        question: "मैलवेयर क्या है?",
        options: ["A) अच्छा सॉफ़्टवेयर", "B) दुर्भावनापूर्ण सॉफ़्टवेयर", "C) मेल सॉफ़्टवेयर", "D) मोबाइल सॉफ़्टवेयर"],
        correct: "B",
        explanation: "मैलवेयर दुर्भावनापूर्ण सॉफ़्टवेयर है जो कंप्यूटर सिस्टम को नुकसान पहुंचाने के लिए डिज़ाइन किया गया है।"
      },
      {
        question: "फ़ायरवॉल क्या है?",
        options: ["A) एक भौतिक दीवार", "B) नेटवर्क सुरक्षा प्रणाली", "C) एक प्रकार का वायरस", "D) एक पासवर्ड उपकरण"],
        correct: "B",
        explanation: "फ़ायरवॉल एक नेटवर्क सुरक्षा प्रणाली है जो नेटवर्क ट्रैफ़िक की निगरानी करती है।"
      },
      {
        question: "एन्क्रिप्शन क्या है?",
        options: ["A) डेटा हटाना", "B) डेटा कॉपी करना", "C) डेटा को सुरक्षित प्रारूप में बदलना", "D) डेटा का बैकअप लेना"],
        correct: "C",
        explanation: "एन्क्रिप्शन डेटा को सुरक्षित कोडित प्रारूप में परिवर्तित करता है।"
      },
      {
        question: "VPN क्या है?",
        options: ["A) Very Private Network", "B) Virtual Private Network", "C) Verified Public Network", "D) Visual Private Network"],
        correct: "B",
        explanation: "Virtual Private Network (VPN) इंटरनेट पर एक सुरक्षित कनेक्शन बनाता है।"
      },
      {
        question: "सोशल इंजीनियरिंग क्या है?",
        options: ["A) सामाजिक नेटवर्क बनाना", "B) जानकारी के लिए लोगों में हेरफेर करना", "C) इंजीनियरिंग सॉफ़्टवेयर", "D) सोशल मीडिया प्रबंधन"],
        correct: "B",
        explanation: "सोशल इंजीनियरिंग गोपनीय जानकारी प्राप्त करने के लिए लोगों को हेरफेर करने की प्रथा है।"
      },
      {
        question: "रैंसमवेयर क्या है?",
        options: ["A) मुफ़्त सॉफ़्टवेयर", "B) मैलवेयर जो फिरौती मांगता है", "C) एंटीवायरस सॉफ़्टवेयर", "D) सिस्टम बैकअप उपकरण"],
        correct: "B",
        explanation: "रैंसमवेयर फ़ाइलों को एन्क्रिप्ट करके फिरौती की मांग करता है।"
      },
      {
        question: "मजबूत पासवर्ड क्या है?",
        options: ["A) 123456", "B) password", "C) वर्ण, संख्या, प्रतीकों का मिश्रण", "D) आपका नाम"],
        correct: "C",
        explanation: "मजबूत पासवर्ड में विभिन्न प्रकार के वर्णों का जटिल मिश्रण होता है।"
      },
      {
        question: "SQL इंजेक्शन क्या है?",
        options: ["A) डेटाबेस हमला तकनीक", "B) चिकित्सा प्रक्रिया", "C) सॉफ़्टवेयर इंस्टॉलेशन", "D) नेटवर्क प्रोटोकॉल"],
        correct: "A",
        explanation: "SQL इंजेक्शन डेटाबेस पर हमला करने की तकनीक है।"
      },
      {
        question: "DDoS हमला क्या है?",
        options: ["A) डेटा चोरी", "B) Distributed Denial of Service", "C) Direct Database Operation", "D) Digital Data Override"],
        correct: "B",
        explanation: "DDoS हमला सिस्टम को अनुपलब्ध बनाने के लिए ट्रैफ़िक से भर देता है।"
      },
      {
        question: "एंटीवायरस सॉफ़्टवेयर क्या है?",
        options: ["A) वायरस बनाने वाला सॉफ़्टवेयर", "B) मैलवेयर हटाने वाला सॉफ़्टवेयर", "C) वीडियो संपादन सॉफ़्टवेयर", "D) डेटा बैकअप सॉफ़्टवेयर"],
        correct: "B",
        explanation: "एंटीवायरस सॉफ़्टवेयर मैलवेयर का पता लगाकर हटाता है।"
      },
      {
        question: "सिक्यूरिटी पैच क्या है?",
        options: ["A) भौतिक सुरक्षा उपकरण", "B) कमजोरियों को ठीक करने वाला अपडेट", "C) नेटवर्क केबल", "D) पासवर्ड मैनेजर"],
        correct: "B",
        explanation: "सिक्यूरिटी पैच सुरक्षा कमजोरियों को ठीक करने के लिए जारी किया जाता है।"
      }
    ],
    gu: [
      {
        question: "ફિશિંગ શું છે?",
        options: ["A) એક પ્રકારનું મેલવેર", "B) એક સોશિયલ ઇન્જિનિયરિંગ હુમલો", "C) એક ફાયરવોલ તકનીક", "D) એક પાસવર્ડ મેનેજર"],
        correct: "B",
        explanation: "ફિશિંગ એક સોશિયલ ઇન્જિનિયરિંગ હુમલો છે જ્યાં હુમલાવરો વૈધ સંસ્થાઓનો છેક કરીને પાસવર્ડ અથવા ક્રેડિટ કાર્ડ વિગતો જેવી સંવેદનશીલ માહિતી ચોરે છે।"
      },
      {
        question: "HTTPSનો અર્થ શું છે?",
        options: ["A) HyperText Transfer Protocol Secure", "B) High Transfer Protocol System", "C) HyperText Transport Protocol Safe", "D) High Text Transfer Protocol Secure"],
        correct: "A",
        explanation: "HTTPSનો અર્થ HyperText Transfer Protocol Secure છે, જે વેબ બ્રાઉઝર અને સર્વર વચ્ચે ડેટા ટ્રાન્સમિશનને એન્ક્રિપ્ટ કરે છે।"
      },
      {
        question: "બે-કારક ઓથેન્ટિકેશન શું છે?",
        options: ["A) બે પાસવર્ડનો ઉપયોગ", "B) સત્યાપન માટે બે અલગ સુરક્ષા પદ્ધતિઓ", "C) બે અલગ બ્રાઉઝર", "D) બે એન્ટિવાયરસ પ્રોગ્રામ"],
        correct: "B",
        explanation: "બે-કારક ઓથેન્ટિકેશન યુઝરની ઓળખ સત્યાપિત કરવા માટે બે અલગ સુરક્ષા પદ્ધતિઓ (જેમ કે પાસવર્ડ + SMS કોડ) નો ઉપયોગ કરે છે, જે મજબૂત સુરક્ષા પ્રદાન કરે છે।"
      },
      {
        question: "મેલવેર શું છે?",
        options: ["A) સારું સોફ્ટવેર", "B) દુર્ભાવનાપૂર્ણ સોફ્ટવેર", "C) મેલ સોફ્ટવેર", "D) મોબાઇલ સોફ્ટવેર"],
        correct: "B",
        explanation: "મેલવેર દુર્ભાવનાપૂર્ણ સોફ્ટવેર છે જે કોમ્પ્યુટર સિસ્ટમને નુકસાન પહોંચાડવા માટે ડિઝાઇન કરાયેલું છે।"
      },
      {
        question: "ફાયરવોલ શું છે?",
        options: ["A) ભૌતિક દીવાલ", "B) નેટવર્ક સુરક્ષા સિસ્ટમ", "C) વાયરસનો પ્રકાર", "D) પાસવર્ડ ટૂલ"],
        correct: "B",
        explanation: "ફાયરવોલ એક નેટવર્ક સુરક્ષા સિસ્ટમ છે જે નેટવર્ક ટ્રાફિકની નિગરાની કરે છે।"
      },
      {
        question: "એન્ક્રિપ્શન શું છે?",
        options: ["A) ડેટા ડિલીટ કરવું", "B) ડેટા કોપી કરવું", "C) ડેટાને સુરક્ષિત ફોર્મેટમાં બદલવું", "D) ડેટાનો બેકઅપ લેવો"],
        correct: "C",
        explanation: "એન્ક્રિપ્શન ડેટાને સુરક્ષિત કોડિત ફોર્મેટમાં પરિવર્તિત કરે છે।"
      },
      {
        question: "VPN શું છે?",
        options: ["A) Very Private Network", "B) Virtual Private Network", "C) Verified Public Network", "D) Visual Private Network"],
        correct: "B",
        explanation: "Virtual Private Network (VPN) ઇન્ટરનેટ પર સુરક્ષિત કનેક્શન બનાવે છે।"
      },
      {
        question: "સોશિયલ ઇન્જિનિયરિંગ શું છે?",
        options: ["A) સામાજિક નેટવર્ક બનાવવું", "B) માહિતી માટે લોકોમાં હેરફેર કરવું", "C) ઇન્જિનિયરિંગ સોફ્ટવેર", "D) સોશિયલ મીડિયા મેનેજમેન્ટ"],
        correct: "B",
        explanation: "સોશિયલ ઇન્જિનિયરિંગ ગોપનીય માહિતી મેળવવા માટે લોકોને હેરફેર કરવાની પ્રથા છે।"
      },
      {
        question: "રેન્સમવેર શું છે?",
        options: ["A) મુફત સોફ્ટવેર", "B) મેલવેર જે ફિરોતી માંગે છે", "C) એન્ટિવાયરસ સોફ્ટવેર", "D) સિસ્ટમ બેકઅપ ટૂલ"],
        correct: "B",
        explanation: "રેન્સમવેર ફાઇલોને એન્ક્રિપ્ટ કરીને ફિરોતીની માંગ કરે છે।"
      },
      {
        question: "મજબૂત પાસવર્ડ શું છે?",
        options: ["A) 123456", "B) password", "C) અક્ષરો, નંબરો, પ્રતીકોનો મિશ્રણ", "D) તમારું નામ"],
        correct: "C",
        explanation: "મજબૂત પાસવર્ડમાં વિવિધ પ્રકારના અક્ષરોનો જટિલ મિશ્રણ હોય છે।"
      },
      {
        question: "SQL ઇન્જેક્શન શું છે?",
        options: ["A) ડેટાબેસ હમલાની તકનીક", "B) વૈદ્યકીય પ્રક્રિયા", "C) સોફ્ટવેર ઇન્સ્ટોલેશન", "D) નેટવર્ક પ્રોટોકોલ"],
        correct: "A",
        explanation: "SQL ઇન્જેક્શન ડેટાબેસ પર હમલો કરવાની તકનીક છે।"
      },
      {
        question: "DDoS હમલો શું છે?",
        options: ["A) ડેટા ચોરી", "B) Distributed Denial of Service", "C) Direct Database Operation", "D) Digital Data Override"],
        correct: "B",
        explanation: "DDoS હમલો સિસ્ટમને અનુપલબ્ધ બનાવવા માટે ટ્રાફિકથી ભરી દે છે।"
      },
      {
        question: "એન્ટિવાયરસ સોફ્ટવેર શું છે?",
        options: ["A) વાયરસ બનાવનારું સોફ્ટવેર", "B) મેલવેર શોધનારું સોફ્ટવેર", "C) વીડિયો એડિટિંગ સોફ્ટવેર", "D) ડેટા બેકઅપ સોફ્ટવેર"],
        correct: "B",
        explanation: "એન્ટિવાયરસ સોફ્ટવેર મેલવેરને શોધીને હટાવે છે।"
      },
      {
        question: "સિક્યુરિટી પેચ શું છે?",
        options: ["A) ભૌતિક સુરક્ષા ઉપકરણ", "B) કમજોરીઓ જે અપડેટ કરે છે", "C) નેટવર્ક કેબલ", "D) પાસવર્ડ મેનેજર"],
        correct: "B",
        explanation: "સિક્યુરિટી પેચ સુરક્ષા કમજોરીઓને જે અપડેટ કરે છે।"
      }
    ]
  };
  
  const allQuestions = questionSets[language] || questionSets.en;
  
  // Shuffle questions based on session and seed for uniqueness
  const shuffled = [...allQuestions];
  const seedNum = typeof seed === 'string' ? parseInt(seed.substring(0, 8), 16) : seed;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(((seedNum + i) % 1000) / 1000 * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, 15);
}

module.exports = router;