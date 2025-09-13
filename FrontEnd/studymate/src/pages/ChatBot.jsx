import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Bot, Upload } from 'lucide-react';
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
  <div className="  h-full w-full bg-gradient-to-b from-gray-900 to-gray-950 text-white shadow-xl flex flex-col">


  {/* Chat Messages */}
  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {history.length === 0 && (
      <p className="text-gray-400 text-center mt-10">
        
        Start chatting by entering a prompt or uploading a PDF 📄
      </p>
    )}

    {history.map((entry, index) => (
      <div key={index} className="space-y-2">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-br-sm max-w-xs shadow">
            {entry.prompt}
          </div>
        </div>

        {/* Bot Response */}
        <div className="flex justify-start">
          <div className="bg-gray-800 text-gray-100 text-xs p-3 rounded-2xl rounded-bl-sm max-w-xs shadow">
            <p className="flex items-center font-semibold mb-1 text-indigo-400">
              <Bot className="h-4 w-4 mr-1" /> Bot
            </p>
           <div className="prose">
  <ReactMarkdown>
    {entry.response}
  </ReactMarkdown>
</div>
          </div>
        </div>
      </div>
    ))}
  </div>

  {/* Input Area */}
  <form
    onSubmit={handleSubmit}
    className="border-t border-gray-700 p-3 flex items-center gap-3 bg-gray-900"
  >
    {/* Text Input */}
    <input
      type="text"
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      placeholder="Type your message..."
      disabled={loading}
      className="flex-1 p-2 rounded-lg border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
    />

    {/* File Upload */}
    <label className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-gray-700 bg-gray-800 cursor-pointer hover:border-indigo-500 transition">
      <Upload className="w-5 h-5 text-gray-400" />
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        disabled={loading}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      {file && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-gray-900"></div>
      )}
    </label>

    {/* Send Button */}
    <button
      type="submit"
      disabled={loading}
      className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow disabled:bg-indigo-400"
    >
      {loading ? (
        <div className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></div>
      ) : (
        "➤"
      )}
    </button>
  </form>
</div>


  );
};

export default ChatBot;
