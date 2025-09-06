import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase'; // Your Firebase config
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    collegeName: '',
    email: '',
    branch: '',
    year: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fields = [
    { label: 'Name', name: 'name', type: 'text', placeholder: 'Enter your name', required: true },
    { label: 'College Name', name: 'collegeName', type: 'text', placeholder: 'Enter your college name' },
    { label: 'Email', name: 'email', type: 'email', placeholder: 'Enter your email', required: true },
    { label: 'Branch', name: 'branch', type: 'text', placeholder: 'Enter your branch' },
    { label: 'Year', name: 'year', type: 'text', placeholder: 'Enter your year' },
    { label: 'Password', name: 'password', type: 'password', placeholder: 'Enter your password', required: true },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        collegeName: formData.collegeName,
        email: formData.email,
        branch: formData.branch,
        year: formData.year,
      });

      navigate('/dashboard', { state: { user: formData } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Register</h2>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
        <div className="space-y-4">
          {fields.map(({ label, name, type, placeholder, required }) => (
            <div key={name}>
              <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
              <input
                type={type}
                name={name}
                id={name}
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>
        <p className="mt-4 text-center text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
};

export default Register;
