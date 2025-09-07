import React, { useState } from "react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../firebase/firebase";
const API_BASE = process.env.REACT_APP_API_URL;

const Quiz = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Initialize Firestore
  const db = getFirestore(app);
  const auth = getAuth(app);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setQuiz([]);
      setAnswers({});
      setSubmitted(false);
      setScore(0);
      setCurrentIndex(0);
      setProgress(0);
    }
  };

  const fetchQuiz = async () => {
  if (!file) {
    alert("Please upload a PDF first!");
    return;
  }

  setLoading(true);
  setProgress(30);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/quiz`, {
      method: "POST",
      body: formData,
    });

    setProgress(70);

    if (!res.ok) throw new Error("Failed to fetch quiz");

    const data = await res.json();

    // ✅ Ensure it's an array
    const quizData = Array.isArray(data.quiz) ? data.quiz : [];

    setQuiz(quizData);
    setCurrentIndex(0);
    setProgress(100);

    // Reset progress after a short delay
    setTimeout(() => setProgress(0), 1000);
  } catch (err) {
    alert(err.message || "Error generating quiz!");
    setProgress(0);
  } finally {
    setLoading(false);
  }
};

  const handleOptionChange = (qIndex, option) => {
    setAnswers({ ...answers, [qIndex]: option });
  };

  // Function to store score in Firebase
  const storeScoreInFirebase = async (score, totalQuestions) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No user logged in");
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // Update existing user document with quiz score
        const userData = userDoc.data();
        const quizResults = userData.quizResults || [];

        quizResults.push({
          score: score,
          total: totalQuestions,
          percentage: Math.round((score / totalQuestions) * 100),
          date: new Date().toISOString()
        });

        await setDoc(userDocRef, {
          ...userData,
          quizResults: quizResults
        }, { merge: true });

        console.log("Score stored successfully!");
      } else {
        console.error("User document doesn't exist");
      }
    } catch (error) {
      console.error("Error storing score: ", error);
    }
  };

  const handleSubmit = async () => {
    let correctCount = 0;
    quiz.forEach((q, index) => {
      if (answers[index] === q.answer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setSubmitted(true);

    // Store score in Firebase
    await storeScoreInFirebase(correctCount, quiz.length);
  };

  const handleNext = () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const restartQuiz = () => {
    setQuiz([]);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setCurrentIndex(0);
    setFile(null);
    setFileName("");
  };

  // Calculate score percentage
  const scorePercentage = quiz.length > 0 ? Math.round((score / quiz.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center text-indigo-700 mb-2">PDF Quiz Generator</h1>
          <p className="text-center text-gray-600 mb-8">Upload a PDF and test your knowledge with AI-generated questions</p>
          
          {/* File Upload Section */}
          <div className="mb-8">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-gray-300 hover:border-indigo-400 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    {fileName ? <span className="font-semibold">{fileName}</span> : <>
                      <span className="font-semibold">Click to upload PDF</span> or drag and drop
                    </>}
                  </p>
                  <p className="text-xs text-gray-500">PDF (MAX. 10MB)</p>
                </div>
                <input 
                  id="dropzone-file" 
                  type="file" 
                  accept="application/pdf" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </label>
            </div>
            
            <div className="mt-4 flex justify-center">
              <button
                onClick={fetchQuiz}
                disabled={loading || !file}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Quiz...
                  </>
                ) : "Generate Quiz"}
              </button>
            </div>
            
            {/* Progress Bar */}
            {progress > 0 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-right text-xs text-gray-500 mt-1">{progress}% Complete</p>
              </div>
            )}
          </div>

          {/* Quiz Section */}
          {quiz.length > 0 && !submitted && !loading && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              {/* Question Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-indigo-600">Question {currentIndex + 1} of {quiz.length}</span>
                  <span className="text-sm font-medium text-gray-500">
                    {Math.round(((currentIndex + 1) / quiz.length) * 100)}% Complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${((currentIndex + 1) / quiz.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Current Question */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  {currentIndex + 1}. {quiz[currentIndex].question}
                </h3>
                
                <div className="space-y-3">
                  {quiz[currentIndex].options.map((opt, i) => {
                    const optionLetter = opt.charAt(0);
                    const isSelected = answers[currentIndex] === optionLetter;
                    
                    return (
                      <div 
                        key={i} 
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                        onClick={() => handleOptionChange(currentIndex, optionLetter)}
                      >
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-5 w-5 rounded-full border flex items-center justify-center mr-3 ${
                            isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-400'
                          }`}>
                            {isSelected && (
                              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                                <path d="M10.28 2.28L4 8.56l-2.28-2.28a.75.75 0 00-1.06 1.06l2.78 2.78a.75.75 0 001.06 0l6.78-6.78a.75.75 0 00-1.06-1.06z" />
                              </svg>
                            )}
                          </div>
                          <span className="text-gray-800">{opt}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className={`px-5 py-2.5 rounded-lg font-medium flex items-center ${
                    currentIndex === 0
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                  Previous
                </button>
                
                {currentIndex < quiz.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center"
                  >
                    Next
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center"
                  >
                    Submit Quiz
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Results Section */}
          {submitted && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-4">
                  <div className="text-3xl font-bold text-indigo-700">{scorePercentage}%</div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
                <p className="text-gray-600">
                  You scored {score} out of {quiz.length} questions correctly.
                </p>
                
                {/* Performance Message */}
                <div className="mt-4 p-4 rounded-lg bg-indigo-50 border border-indigo-100 max-w-md mx-auto">
                  {scorePercentage >= 80 ? (
                    <p className="text-indigo-700 font-medium">🎉 Excellent job! You've mastered this material!</p>
                  ) : scorePercentage >= 60 ? (
                    <p className="text-indigo-700 font-medium">👍 Good effort! With a little more study, you'll ace it!</p>
                  ) : (
                    <p className="text-indigo-700 font-medium">📚 Keep learning! Review the material and try again.</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-center gap-4 mb-8">
                <button
                  onClick={restartQuiz}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Start New Quiz
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
                >
                  Review Answers
                </button>
              </div>
              
              {/* Answers Review */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Question Review</h3>
                
                {quiz.map((q, index) => {
                  const isCorrect = answers[index] === q.answer;
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border ${
                        isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mr-3 mt-1 ${
                          isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {isCorrect ? (
                            <svg className="h-4 w-4" viewBox="0 0 12 12" fill="currentColor">
                              <path d="M10.28 2.28L4 8.56l-2.28-2.28a.75.75 0 00-1.06 1.06l2.78 2.78a.75.75 0 001.06 0l6.78-6.78a.75.75 0 00-1.06-1.06z" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" viewBox="0 0 12 12" fill="currentColor">
                              <path d="M3.72 3.72a.75.75 0 011.06 0L6 4.94l1.22-1.22a.75.75 0 111.06 1.06L7.06 6l1.22 1.22a.75.75 0 11-1.06 1.06L6 7.06l-1.22 1.22a.75.75 0 11-1.06-1.06L4.94 6 3.72 4.78a.75.75 0 010-1.06z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-grow">
                          <p className="font-medium text-gray-800">{index + 1}. {q.question}</p>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className={`p-2 rounded ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                              <span className="font-medium">Your answer:</span> {answers[index] || "Not answered"}
                            </div>
                            <div className="p-2 rounded bg-green-100">
                              <span className="font-medium">Correct answer:</span> {q.answer}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;