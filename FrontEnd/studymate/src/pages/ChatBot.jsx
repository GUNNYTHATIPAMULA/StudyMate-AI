import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Bot } from 'lucide-react';
const API_BASE = process.env.REACT_APP_API_URL;

const ChatBot = () => {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file');
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setError('');
  };

  const handleClear = () => {
    setPrompt('');
    setFile(null);
    setError('');
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  // Validation
  if (!prompt && !file) {
    setError("Please enter a prompt or upload a PDF");
    return;
  }

  setError("");
  setLoading(true);

  try {
    let response;

    if (file) {
      // ---- 📂 If PDF uploaded ----
      const formData = new FormData();
      formData.append("file", file);

      response = await axios.post(`${API_BASE}/process_pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      // ---- ✍️ If just prompt ----
      response = await axios.post(`${API_BASE}/generate`, { prompt });
    }

    // ---- ✅ Extract result ----
    const result = response.data?.result || "No response received";

    // ---- 🕒 Append to chat history ----
    setHistory((prev) => [
      ...prev,
      {
        prompt: prompt || `📄 PDF: ${file?.name || "Uploaded file"}`,
        response: result,
      },
    ]);

    // ---- 🧹 Clear input after submission ----
    setPrompt("");
    setFile(null);
  } catch (err) {
    console.error("Submission error:", err);
    setError(`Error: ${err.response?.data?.detail || err.message}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex w-full flex-col items-center p-4">
      <div className="w-full ">
        <h1 className="text-3xl flex flex-col items-center justify-center  dark:text-gray-100 text-center font-semibold text-indigo-600 tracking-wide mb-0">
          StudyHub ChatBot
          <p> <Bot className='w-20 h-20 mt-3 text-white' /></p>
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg h-full shadow-lg p-6">
          {/* Chat History */}
          <div className="h-full overflow-y-auto mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            {history.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Start chatting by entering a prompt or uploading a PDF!
              </p>
            )}
            {history.map((entry, index) => (
              <div key={index} className="mb-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="flex items-start gap-2 max-w-md">
                    <div className="bg-blue-100 dark:bg-blue-600 text-blue-800 dark:text-blue-100 p-3 rounded-lg shadow-sm">
                      <p className="font-semibold">You:</p>
                      <p>{entry.prompt}</p>
                    </div>
                  </div>
                </div>
                {/* Bot Response */}
                <div className="flex justify-start mt-2">
                  <div className="flex items-start gap-2 max-w-md">
                    <div className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 p-3 rounded-lg shadow-sm">
                      <p className="font-semibold flex"><Bot className=" h-6 w-6 mr-1" />Bot :</p>
                      <div className="prose dark:prose-invert">
                        <ReactMarkdown>{entry.response}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            {error && (
              <div className="bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-100 p-3 rounded-md shadow-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your prompt"
                  disabled={loading}
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 disabled:bg-gray-200 dark:disabled:bg-gray-600"
                  aria-label="Prompt input"
                />
                <div className="relative w-full">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="p-1 border w-full border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 disabled:bg-gray-200 dark:disabled:bg-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white file:hover:bg-blue-700"
                    aria-label="PDF upload"
                  />
                  {file && (
                    <div className="absolute top-2 right-2 flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Clear file"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white mt-2 py-4 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 dark:disabled:bg-blue-500 shadow-sm"
                >
                  {loading ? 'Processing...' : 'Send'}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading || (!prompt && !file)}
                  className="px-4 py-2 bg-gray-300 mt-2 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition disabled:bg-gray-200 dark:disabled:bg-gray-500 shadow-sm"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
