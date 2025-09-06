import React, { useState } from 'react'
import { doSignInWithEmailAndPassword } from '../firebase/auth';
import { auth } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';


// const LoginPage = () => {
    const LoginPage = () => {
      const navi=useNavigate();
      const [formData, setFormData] = useState({
        email: '',
        password: ''
      });
      const [error, setError] = useState('');
      const [loading, setLoading] = useState(false);

      const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.email || !formData.password) {
          setError('Email and password are required');
          setLoading(false);
          return;
        }

        try {
          await doSignInWithEmailAndPassword(formData.email, formData.password);
          console.log('Login successful');
          navi("/DashBoard")
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h2>
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
                {error}
              </div>
            )}
           <form onSubmit={handleSubmit}>
             <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
           </form>
            <p className="mt-4 text-center text-gray-600">
              Don't have an account?{' '}
             <button onClick={()=>{navi("/")}} >SignUp</button>
            </p>
          </div>
        </div>
  )
}

export default LoginPage