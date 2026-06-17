import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Fetch role from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (!userDoc.exists()) {
                setError("Account not found in database.");
                return;
            }

            const role = userDoc.data().role;

            setEmail('');
            setPassword('');

            // Route based on role
            if (role === 'org') {
                navigate('/orghome');
            } else if (role === 'user') {
                navigate('/userhome');
            } else {
                setError("Unknown role. Please contact support.");
            }

        } catch (err) {
            if (err.code === 'auth/invalid-credential') {
                setError("Invalid email or password.");
            } else {
                setError("An error occurred. Please try again.");
            }
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

                <button type="submit" style={{ padding: '10px', cursor: 'pointer', background: '#007bff', color: '#fff', border: 'none' }}>
                    Login
                </button>

                <div style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '14px' }}>or</span>
                    <div>
                        <Link to="/signup" style={{ fontSize: '14px', textDecoration: 'none', color: '#007bff' }}>
                            Register as Organization
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Login;
