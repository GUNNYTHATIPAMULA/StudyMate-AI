import React from 'react'
import {  signOut } from 'firebase/auth';

// import React from 'react'
import { auth } from '../firebase/firebase';


export const userSignOut = async ()=>{
    try{
        await signOut(auth);
        alert("signed out")
    }catch(error){
        alert(error.message);
    }
};
const SignOut = () => {

    const userSignOut = async ()=>{
        try{
            await signOut(auth);
            alert("signed out")
        }catch(error){
            alert(error.message);
        }
    };


  return (
    <div>
        <button onClick={userSignOut}>signout</button>
    </div>
  )
}

export default SignOut;