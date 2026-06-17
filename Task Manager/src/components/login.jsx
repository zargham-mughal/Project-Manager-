import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (!userDoc.exists()) {
                setError('Account not found in database.');
                setLoading(false);
                return;
            }

            const role = userDoc.data().role;
            setEmail('');
            setPassword('');

            if (role === 'org') {
                navigate('/orghome');
            } else if (role === 'user') {
                navigate('/userhome');
            } else {
                setError('Unknown role. Please contact support.');
                setLoading(false);
            }
        } catch (err) {
            if (err.code === 'auth/invalid-credential') {
                setError('Invalid email or password.');
            } else {
                setError('An error occurred. Please try again.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <span className="logo-mark">✓</span>
                    <span>TaskFlow</span>
                </div>
                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Sign in to manage your projects and tasks.</p>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="label">Email</label>
                        <input
                            className="input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">Password</label>
                        <input
                            className="input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>

                <div className="auth-footer">
                    New organization? <Link to="/signup">Create an account</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
