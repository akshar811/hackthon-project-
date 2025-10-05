import React, { useState } from 'react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { Send, X, Bot } from 'lucide-react'; // ✅ only necessary icons used

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content:
        "🛡️ Hi! I'm your Cybersecurity Assistant. Ask me about online safety, threats, or security best practices!",
      timestamp: new Date(),
    },
  ]);
  const [showDefaultQuestions, setShowDefaultQuestions] = useState(true);

  const defaultQuestions = [
    {
      id: 1,
      question: 'What is cyber security?',
      answer: `🛡️ **Cyber Security Explained**

Cyber security is the practice of protecting systems, networks, and programs from digital attacks. It involves:

🔒 **Key Components:**
• Network Security - Protecting computer networks
• Information Security - Safeguarding data integrity
• Application Security - Securing software and devices
• Operational Security - Managing data assets and permissions

🎯 **Main Goals:**
• Confidentiality - Keeping information private
• Integrity - Ensuring data accuracy
• Availability - Maintaining system access

⚠️ **Common Threats:**
• Malware (viruses, ransomware)
• Phishing attacks
• Social engineering
• Data breaches

💡 **Why It Matters:**
• Protects personal and financial information
• Prevents identity theft
• Maintains business continuity
• Ensures privacy and trust

Stay safe by using strong passwords, enabling 2FA, and keeping software updated! 🔐`,
    },
    {
      id: 2,
      question: 'How to complain about cyber fraud?',
      answer: `🚨 **How to Report Cyber Fraud in India**

📞 **Immediate Steps:**
1. **Call Cyber Crime Helpline: 1930** (24/7 support)
2. **Visit cybercrime.gov.in** - National Cyber Crime Portal
3. **Contact your bank** if financial fraud occurred

🌐 **Online Reporting:**
• Go to **cybercrime.gov.in**
• Click "File a Complaint"
• Fill out the detailed form
• Upload supporting documents
• Note your complaint number

🏛️ **Offline Reporting:**
• Visit nearest **Cyber Crime Police Station**
• File FIR with local police
• Contact **Consumer Forum** for financial disputes

📋 **Required Information:**
• Transaction details and screenshots
• Communication records (emails, SMS)
• Bank statements
• Identity proof
• Timeline of events

⏰ **Important:**
• Report within **24-48 hours** for best results
• Keep all evidence safe
• Follow up regularly on your complaint
• Don't share OTP or passwords with anyone

🔗 **Useful Contacts:**
• Cyber Crime: 1930
• Banking Fraud: Contact your bank immediately
• Consumer Helpline: 1915`,
    },
    {
      id: 3,
      question: 'How to secure yourself on the internet?',
      answer: `🔐 **Internet Security Best Practices**

🔑 **Password Security:**
• Use **strong, unique passwords** (12+ characters)
• Enable **Two-Factor Authentication (2FA)**
• Use a **password manager**
• Never reuse passwords across sites

🌐 **Safe Browsing:**
• Look for **HTTPS** (lock icon) on websites
• Avoid clicking **suspicious links**
• Download software from **official sources only**
• Use **updated browsers** with security features

📧 **Email Safety:**
• **Verify sender** before clicking links
• Don't download **unexpected attachments**
• Be wary of **urgent/threatening** messages
• Use **email filters** and spam protection

📱 **Device Security:**
• Keep **software updated** (OS, apps, antivirus)
• Use **screen locks** and device encryption**
• Install apps from **official stores only**
• Regular **security scans**

🏦 **Financial Safety:**
• **Never share OTP, PIN, or passwords**
• Use **official banking apps/websites**
• Check **bank statements** regularly
• Set up **transaction alerts**

📶 **Wi-Fi Security:**
• Avoid **public Wi-Fi** for sensitive activities
• Use **VPN** when necessary
• Turn off **auto-connect** to Wi-Fi
• Use **WPA3 encryption** at home

🚨 **Red Flags to Avoid:**
• Offers that seem "too good to be true"
• Requests for immediate action or payment
• Unsolicited calls asking for personal info
• Fake tech support calls

💡 **Remember:** Stay vigilant, think before you click, and when in doubt, verify independently! 🛡️`,
    },
  ];

  const handleDefaultQuestion = (questionData) => {
    const userMessage = {
      type: 'user',
      content: questionData.question,
      timestamp: new Date(),
    };
    const botMessage = {
      type: 'bot',
      content: questionData.answer,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage, botMessage]);
    setShowDefaultQuestions(false);
  };

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    const currentMessage = inputMessage;
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowDefaultQuestions(false);

    try {
      const response = await api.post('/chatbot/chat', {
        message: currentMessage,
      });

      let botContent = response.data.response;

      if (response.data.success && response.data.source === 'gemini') {
        console.log('✅ Using Gemini API response');
      } else if (response.data.fallback) {
        if (response.data.reason === 'rate_limit') {
          botContent = '🕰️ Please wait a moment between messages.\n\n' + botContent;
        } else if (response.data.reason === 'quota_exceeded') {
          botContent = '📊 API quota reached. Using offline knowledge.\n\n' + botContent;
        }
        console.log('⚠️ Using fallback response:', response.data.reason);
      }

      const botMessage = {
        type: 'bot',
        content: botContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          content:
            '⚠️ Sorry, I encountered an error. Please try asking your cybersecurity question again in a moment.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600 text-white p-3 rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 flex items-center justify-center group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Bot className="h-5 w-5 transition-all duration-300 group-hover:rotate-12 relative z-10" />
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
          </button>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-purple-200 dark:border-purple-800 w-96 h-[32rem] flex flex-col transform transition-all duration-500 ease-out animate-in slide-in-from-bottom-8 fade-in backdrop-blur-sm">
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 text-white p-4 rounded-t-3xl flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="flex items-center space-x-3 relative z-10">
              <div className="relative">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border border-white flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <span className="font-semibold text-lg bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  {t('chatbotTitle')}
                </span>
                <div className="text-xs text-purple-100 font-medium">
                  🛡️ {t('securityAssistant')}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-lg transition-all duration-300 transform hover:scale-105 relative z-10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-purple-50/50 via-blue-50/30 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.1),transparent_50%)] pointer-events-none"></div>

            {showDefaultQuestions && messages.length === 1 && (
              <div className="space-y-3 animate-in slide-in-from-bottom-3 fade-in">
                <div className="text-center text-sm text-purple-600 dark:text-purple-400 font-medium mb-4">
                  💡 {t('quickQuestions')}
                </div>
                {defaultQuestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleDefaultQuestion(item)}
                    className="w-full p-4 text-left bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 hover:from-purple-200 hover:to-blue-200 dark:hover:from-purple-800/40 dark:hover:to-blue-800/40 rounded-2xl border border-purple-200 dark:border-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:rotate-12 transition-transform duration-300">
                        {item.id}
                      </div>
                      <span className="text-gray-800 dark:text-gray-200 font-medium group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-300">
                        {item.question}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-sm p-4 rounded-2xl transform transition-all duration-500 ease-out animate-in slide-in-from-bottom-3 fade-in relative ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-md shadow-lg shadow-purple-500/25'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xl border border-purple-100 dark:border-purple-800 rounded-bl-md backdrop-blur-sm'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-in slide-in-from-bottom-3 fade-in">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xl border border-purple-100 dark:border-purple-800 rounded-bl-md backdrop-blur-sm relative">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white animate-pulse" />
                    </div>
                    <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                      {t('aiThinking')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!showDefaultQuestions && messages.length > 1 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowDefaultQuestions(true)}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors duration-300"
                >
                  💡 {t('showQuestions')}
                </button>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-6 border-t border-purple-100 dark:border-purple-800 bg-gradient-to-r from-white via-purple-50/30 to-white dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 rounded-b-3xl">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`${t('askCybersecurity')} 🛡️`}
                  className="w-full px-6 py-4 border-2 border-purple-200 dark:border-purple-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white text-sm transition-all duration-300 shadow-lg backdrop-blur-sm bg-white/80 placeholder-purple-400"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600 text-white p-4 rounded-2xl transition-all duration-300 disabled:opacity-50 transform hover:scale-105 hover:rotate-3 shadow-xl hover:shadow-purple-500/25 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Send className="h-5 w-5 relative z-10" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
