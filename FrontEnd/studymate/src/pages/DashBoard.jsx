import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SignOut from '../components/SignOut';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import LeftBar from './LeftBar';
import ChatBot from './ChatBot';
import { TableOfContents, TrendingUp, BookOpen, Users, Award, Calendar, BarChart3, MessageCircle, Bot } from 'lucide-react';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../firebase/firebase';

const DashBoard = () => {
  const navi = useNavigate();
  const [visible, setVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatbotExpanded, setChatbotExpanded] = useState(false);
  
  // Initialize Firestore
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [db, auth]);

  // Calculate overall performance percentage
  const calculateOverallPerformance = () => {
    if (!userData || !userData.quizResults || userData.quizResults.length === 0) {
      return 0;
    }
    
    const totalQuizzes = userData.quizResults.length;
    const totalPercentage = userData.quizResults.reduce(
      (sum, quiz) => sum + quiz.percentage, 0
    );
    
    return Math.round(totalPercentage / totalQuizzes);
  };

  const overallPerformance = calculateOverallPerformance();

  // Get performance trend (improving or declining)
  const getPerformanceTrend = () => {
    if (!userData || !userData.quizResults || userData.quizResults.length < 2) {
      return 'stable';
    }
    
    const recentResults = userData.quizResults.slice(-3);
    if (recentResults.length < 2) return 'stable';
    
    const latest = recentResults[recentResults.length - 1].percentage;
    const previous = recentResults[0].percentage;
    
    if (latest > previous + 5) return 'improving';
    if (latest < previous - 5) return 'declining';
    return 'stable';
  };

  const performanceTrend = getPerformanceTrend();

  // Get performance message based on trend
  const getPerformanceMessage = () => {
    if (performanceTrend === 'improving') {
      return "Great job! Your scores are improving!";
    } else if (performanceTrend === 'declining') {
      return "Let's focus on improving your scores.";
    } else {
      return "Keep up the consistent performance!";
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      <Sidebar
        className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-xl"
        visible={visible}
        onHide={() => setVisible(false)}
        position="left"
      >
        <LeftBar />
      </Sidebar>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="w-full h-20 bg-white shadow-sm flex items-center px-6 md:px-8 sticky top-0 z-10">
          <Button
            icon={<TableOfContents className="h-6 w-6 text-indigo-600" />}
            className="p-button-rounded p-button-text p-button-lg"
            onClick={() => setVisible(true)}
            tooltip="Open Menu"
            tooltipOptions={{ position: 'bottom' }}
          />
          <h1 className="text-2xl font-bold text-indigo-800 ml-4">StudyHub Dashboard</h1>
          <div className="ml-auto flex items-center gap-4">
            <span className="font-semibold text-gray-700 hidden md:inline">Welcome, {userData?.name || 'Student'}!</span>
            <SignOut />
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-4">
          {/* Welcome and Stats Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 mt-6">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome back!</h2>
              <p className="text-gray-600 mb-4">Continue your learning journey with personalized recommendations.</p>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center bg-indigo-50 p-3 rounded-lg">
                  <div className="bg-indigo-100 p-2 rounded-full mr-3">
                    <Award className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quizzes Taken</p>
                    <p className="font-bold text-indigo-700">{userData?.quizResults?.length || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center bg-green-50 p-3 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg. Performance</p>
                    <p className="font-bold text-green-700">{overallPerformance}%</p>
                  </div>
                </div>
                
                <div className="flex items-center bg-blue-50 p-3 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Days Active</p>
                    <p className="font-bold text-blue-700">
                      {userData?.quizResults ? 
                        new Set(userData.quizResults.map(q => new Date(q.date).toDateString())).size 
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Performance Card */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-md text-white">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" /> Your Performance
              </h2>
              
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="h-32 w-32">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${overallPerformance}, 100`}
                      />
                    </svg>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{overallPerformance}%</span>
                  </div>
                </div>
              </div>
              
              <p className="text-center text-indigo-100">{getPerformanceMessage()}</p>
            </div>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Quiz Section */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-indigo-600" /> Take a Quiz
                </h2>
                <p className="text-gray-600 mb-6">Test your knowledge with our AI-powered quiz generator.</p>
                
                <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-indigo-700 font-medium">Upload a PDF and get instant quizzes!</p>
                </div>
                
                <button 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                  onClick={() => navi("/Quiz")}
                >
                  Start New Quiz
                  <BookOpen className="ml-2 h-5 w-5" />
                </button>
              </div>
              
              {/* Recent Quizzes */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Quizzes</h2>
                
                {userData && userData.quizResults && userData.quizResults.length > 0 ? (
                  <div className="space-y-4">
                    {userData.quizResults.slice(-3).reverse().map((quiz, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">
                            {new Date(quiz.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Score: {quiz.score}/{quiz.total}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          quiz.percentage >= 80 ? 'bg-green-100 text-green-800' :
                          quiz.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {quiz.percentage}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No quiz results yet. Take your first quiz!</p>
                )}
                
                {userData?.quizResults?.length > 3 && (
                  <button 
                    className="w-full mt-4 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    onClick={() => navi("/quiz-results")}
                  >
                    View All Results →
                  </button>
                )}
              </div>
            </div>
            
            {/* Middle Column */}
            <div className="space-y-6">
              {/* Important Questions Section */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 h-full">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Important Questions</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="font-medium text-blue-800">What is the primary source of energy?</p>
                    <p className="text-sm text-blue-600 mt-1">From Chapter 3: Energy Systems</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <p className="font-medium text-green-800">Define the law of conservation of mass.</p>
                    <p className="text-sm text-green-600 mt-1">From Chapter 5: Chemical Reactions</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="font-medium text-purple-800">Explain Newton's third law.</p>
                    <p className="text-sm text-purple-600 mt-1">From Chapter 7: Motion and Forces</p>
                  </div>
                </div>
                
                <button 
                  className="w-full bg-white border border-indigo-600 text-indigo-600 py-2 rounded-lg font-medium hover:bg-indigo-50 transition"
                  onClick={() => navi("/IMP-Q")}
                >
                  View All Questions
                </button>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {/* Connect Section */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Users className="mr-2 h-5 w-5 text-indigo-600" /> Connect
                </h2>
                <p className="text-gray-600 mb-6">Join our community for support and resources.</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <a href="#" className="p-3 bg-gray-100 rounded-lg text-center hover:bg-gray-200 transition">
                    <div className="flex justify-center mb-2">
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.22-1.78L9 14v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 3.08-2.16 5.64-5.1 6.29z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Discussions</span>
                  </a>
                  
                  <a href="#" className="p-3 bg-gray-100 rounded-lg text-center hover:bg-gray-200 transition">
                    <div className="flex justify-center mb-2">
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.91 8-4.94 8-9.95z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Community</span>
                  </a>
                  
                  <a href="#" className="p-3 bg-gray-100 rounded-lg text-center hover:bg-gray-200 transition">
                    <div className="flex justify-center mb-2">
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Support</span>
                  </a>
                  
                  <a href="#" className="p-3 bg-gray-100 rounded-lg text-center hover:bg-gray-200 transition">
                    <div className="flex justify-center mb-2">
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.5 15h-3v-6h3v6zm0-8h-3V5h3v4z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Resources</span>
                  </a>
                </div>
              </div>
              
              {/* ChatBot Toggle Button */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-md text-white">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Bot className="mr-2 h-5 w-5" /> Need help studying?
                </h2>
                <p className="text-blue-100 mb-6">Our AI assistant is here to help you with any questions.</p>
                
                <button 
                  className="w-full bg-white text-indigo-600 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                  onClick={() => setChatbotExpanded(true)}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Open AI Assistant
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* ChatBot Sidebar */}
      <Sidebar
        className="p-0 w-full h-full"
        visible={chatbotExpanded}
        showCloseIcon={false}
        position="right"
        onHide={() => setChatbotExpanded(false)}
        style={{ width: '600px' }}
      >
        <div className="h-full flex w-full flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white w-full flex items-center">
            <Bot className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-semibold">StudyHub AI Assistant</h3>
            <Button 
              icon="pi pi-times" 
              className="p-button-text p-button-lg p-button-plain ml-auto" 
              onClick={() => setChatbotExpanded(false)}
            />
          </div>
          <div className="flex-1 w-full h-full overflow-auto">
            <ChatBot />
          </div>
        </div>
      </Sidebar>
    </div>
  );
}

export default DashBoard;