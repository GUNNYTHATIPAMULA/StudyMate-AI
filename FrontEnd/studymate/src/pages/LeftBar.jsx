import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import SignOut from '../components/SignOut';
// import { FaUserCircle, FaSchool, FaCalendar } from 'react-icons/fa';/

const LeftBar = () => {
  const [authUser, setAuthUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingUserData, setLoadingUserData] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthUser(user);
      if (user) {
        fetchUserData(user.uid);
      } else {
        setUserData(null);
        setLoadingUserData(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        console.log('No such document!');
        setUserData(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(null);
    } finally {
      setLoadingUserData(false);
    }
  };

  if (loadingUserData) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="text-lg font-medium text-gray-600 dark:text-gray-300 animate-pulse">
          Loading user data...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-lg rounded-lg max-w-xs transition-all duration-300">
      <div className="flex flex-col items-center mb-8">
        {/* <FaUserCircle className="text-6xl text-blue-500 dark:text-blue-300 mb-4 transform hover:scale-110 transition-transform duration-200" /> */}
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
          {userData?.name || 'User not found'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
          {userData?.collegeName || 'College unknown'}
        </p>
      </div>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200">
          {/* <FaSchool className="text-blue-400 text-lg" /> */}
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
            {userData?.branch?.toUpperCase() || 'Branch unknown'}
          </span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200">
          {/* <FaCalendar className="text-blue-400 text-lg" /> */}
          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
            {userData?.year ? `${userData.year} year` : 'Year unknown'}
          </span>
        </div>
      </div>
      <div className="mt-auto w-full">
        <SignOut />
      </div>
    </div>
  );
};

export default LeftBar;