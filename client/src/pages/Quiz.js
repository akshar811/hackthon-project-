import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  Trophy,
  RotateCcw
} from 'lucide-react';

const Quiz = () => {
  const { t, currentLanguage } = useLanguage();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  // Always load fresh quiz when component mounts
  useEffect(() => {
    console.log('Quiz component mounted - loading fresh quiz');
    loadQuiz();
  }, []);

  // Only load quiz on mount, not on visibility changes
  // This prevents multiple requests

  const loadQuiz = async () => {
    // Prevent multiple simultaneous requests
    if (isLoadingQuiz) {
      console.log('Quiz already loading, skipping request');
      return;
    }
    
    setIsLoadingQuiz(true);
    setLoading(true);
    
    // Reset all state
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers([]);
    setQuizCompleted(false);
    setShowResult(false);
    setSelectedAnswer('');
    
    try {
      // Force completely fresh request with unique identifiers
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36);
      
      console.log(`Loading fresh quiz - Timestamp: ${timestamp}, Random: ${randomId}`);
      
      const response = await api.get(`/quiz/generate`, {
        params: {
          timestamp: timestamp,
          randomId: randomId,
          sessionId: sessionId,
          uniqueId: `${timestamp}-${randomId}`,
          forceNew: 'true',
          language: currentLanguage
        },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        timeout: 30000
      });
      
      console.log('Quiz API Response:', {
        generated: response.data.generated,
        source: response.data.source,
        questionCount: response.data.questions?.length,
        seed: response.data.seed,
        firstQuestion: response.data.questions?.[0]?.question?.substring(0, 80)
      });
      
      if (!response.data.questions || response.data.questions.length === 0) {
        throw new Error('No questions received from API');
      }
      
      setQuestions(response.data.questions);
      
      // Always show "Fresh quiz generated!" for any successful quiz load
      toast.success('🎯 Fresh quiz generated!');
      
    } catch (error) {
      console.error('Quiz loading error:', error);
      toast.error(`Failed to load quiz: ${error.message}`);
      
      // Set fallback questions on error
      setQuestions([
        {
          question: "What is phishing?",
          options: ["A) A type of malware", "B) A social engineering attack", "C) A firewall technique", "D) A password manager"],
          correct: "B",
          explanation: "Phishing is a social engineering attack where attackers impersonate legitimate entities to steal sensitive information."
        }
      ]);
    } finally {
      setLoading(false);
      setIsLoadingQuiz(false);
    }
  };

  const handleAnswerSelect = (option) => {
    setSelectedAnswer(option);
  };

  const handleNextQuestion = () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer');
      return;
    }

    const isCorrect = selectedAnswer === questions[currentQuestion].correct;
    const newAnswer = {
      question: questions[currentQuestion].question,
      selected: selectedAnswer,
      correct: questions[currentQuestion].correct,
      isCorrect
    };

    setAnswers([...answers, newAnswer]);
    setShowResult(true);

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer('');
        setShowResult(false);
      } else {
        setQuizCompleted(true);
      }
    }, 1500);
  };

  const calculateResults = () => {
    const correct = answers.filter(answer => answer.isCorrect).length;
    const wrong = answers.length - correct;
    const percentage = Math.round((correct / answers.length) * 100);
    return { correct, wrong, total: answers.length, percentage };
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const results = calculateResults();
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <Trophy className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('quizResults')}</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">{results.correct}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('correctAnswers')}</div>
            </div>
            <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
              <div className="text-2xl font-bold text-red-600">{results.wrong}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('wrongAnswers')}</div>
            </div>
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Trophy className="mx-auto h-8 w-8 text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600">{results.percentage}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('score')}</div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={loadQuiz}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2 mx-auto"
            >
              <RotateCcw className="h-5 w-5" />
              <span>{t('retakeQuiz')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  if (!question) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('quizTitle')}</h1>
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
              {currentQuestion + 1} / {questions.length}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {question.question}
        </h2>

        <div className="space-y-3 mb-8">
          {question.options.map((option, index) => {
            const optionLetter = option.charAt(0);
            let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ";
            
            if (showResult) {
              if (optionLetter === question.correct) {
                buttonClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200";
              } else if (optionLetter === selectedAnswer && selectedAnswer !== question.correct) {
                buttonClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200";
              } else {
                buttonClass += "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400";
              }
            } else {
              if (selectedAnswer === optionLetter) {
                buttonClass += "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200";
              } else {
                buttonClass += "border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-gray-900 dark:text-white";
              }
            }

            return (
              <button
                key={index}
                onClick={() => !showResult && handleAnswerSelect(optionLetter)}
                disabled={showResult}
                className={buttonClass}
              >
                <div className="flex items-center space-x-3">
                  {showResult && optionLetter === question.correct && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {showResult && optionLetter === selectedAnswer && selectedAnswer !== question.correct && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className={`p-4 rounded-lg mb-6 ${
            selectedAnswer === question.correct 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {selectedAnswer === question.correct ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">{t('correctAnswers')}!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800 dark:text-red-200">
                      {t('wrongAnswers')}! Correct answer is {question.correct}
                    </span>
                  </>
                )}
              </div>
              {question.explanation && (
                <div className={`text-sm ${
                  selectedAnswer === question.correct
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              )}
            </div>
          </div>
        )}

        {!showResult && (
          <div className="text-center">
            <button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestion === questions.length - 1 ? t('submitQuiz') : t('nextQuestion')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;