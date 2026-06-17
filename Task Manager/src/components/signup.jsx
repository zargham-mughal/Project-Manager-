import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const saveOrgToFirestore = async (user) => {
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            role: 'org',
            createdAt: new Date(),
        });
    };

    // Email/Password Signup (always registers as org)
    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await saveOrgToFirestore(userCredential.user);
            navigate('/orghome');
        } catch (err) {
            setError(err.message);
        }
    };

    // Google Signup (as org)
    const handleGoogleSignup = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const userCredential = await signInWithPopup(auth, provider);
            await saveOrgToFirestore(userCredential.user);
            navigate('/orghome');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px', textAlign: 'center' }}>
            <h2>Organization Sign Up</h2>
            <form onSubmit={handleSignup} style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>

                {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

                <button type="submit" style={{ width: '100%', padding: '10px', cursor: 'pointer', background: '#28a745', color: '#fff', border: 'none', marginBottom: '10px' }}>
                    Register Organization
                </button>
            </form>

            <div style={{ margin: '15px 0', color: '#666' }}>OR</div>

            <button onClick={handleGoogleSignup} style={{ width: '100%', padding: '10px', cursor: 'pointer', background: '#db4437', color: '#fff', border: 'none', marginBottom: '10px' }}>
                Sign Up with Google
            </button>

            <div style={{ marginTop: '20px' }}>
                <Link to="/" style={{ fontSize: '14px', textDecoration: 'none', color: '#007bff' }}>
                    Already have an account? Login
                </Link>
            </div>
        </div>
    );
};

export default Signup;
