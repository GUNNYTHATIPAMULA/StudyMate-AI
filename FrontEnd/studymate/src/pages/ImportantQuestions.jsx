import React, { useState } from "react";
const API_BASE = process.env.REACT_APP_API_URL;
const ImportantQuestions = () => {
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setQuestions([]);
    setError("");
  };

  // Send file to backend & fetch questions
  const fetchImportantQuestions = async () => {
  if (!file) {
    setError("Please upload a PDF first!");
    return;
  }

  try {
    setLoading(true);
    setError("");
    setQuestions([]);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/important_questions`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Failed to fetch questions");

    const data = await res.json();

    // ✅ Backend already sends an array → just set it
    const parsedQuestions = Array.isArray(data.questions)
      ? data.questions.slice(0, 20)
      : [];

    setQuestions(parsedQuestions);
  } catch (err) {
    setError(err.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};

  return (
  <div className="w-full p-6 bg-white rounded-xl shadow-lg">
         <div className="max-w-7xl mx-auto">
           <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Generate Important Questions
          </h2>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload PDF Document
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div className="mb-4 flex items-center justify-center">
              <svg
                className="animate-spin h-6 w-6 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                ></path>
              </svg>
              <span className="ml-2 text-gray-600">Generating questions...</span>
            </div>
          )}

          {/* Questions Display */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Generated Questions
            </h3>
            <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
              {questions.length > 0 ? (
                <ul className="list-decimal list-inside space-y-2 text-gray-600">
                  {questions.map((q, i) => (
                    <li key={i} className="leading-relaxed">
                      {q}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">
                  Upload a PDF and click Generate to see questions.
                </p>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={fetchImportantQuestions}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md text-white font-semibold transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Generating..." : "Generate Questions"}
          </button>
         </div>
        </div>
  );
};

export default ImportantQuestions;
