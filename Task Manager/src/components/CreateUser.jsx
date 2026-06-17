import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import LogoutButton from './logout';

const CreateUser = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]);
    const orgUser = auth.currentUser;

    const fetchUsers = async () => {
        if (!orgUser) return;
        const q = query(
            collection(db, 'users'),
            where('createdBy', '==', orgUser.uid)
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(list);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;

            await setDoc(doc(db, 'users', newUser.uid), {
                name: name,
                email: newUser.email,
                role: 'user',
                createdBy: orgUser.uid,
                createdAt: new Date(),
            });

            setMessage(`User ${email} created successfully!`);
            setName('');
            setEmail('');
            setPassword('');
            fetchUsers();
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError("This email is already registered.");
            } else {
                setError(err.message);
            }
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Create User</h2>
                <LogoutButton />
            </div>

            <Link to="/orghome" style={{ fontSize: '14px', textDecoration: 'none', color: '#007bff' }}>
                ← Back to Dashboard
            </Link>

            <hr />

            <h3>Create a New User</h3>
            <form onSubmit={handleCreateUser}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Name:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>User Email:</label>
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

                {message && <p style={{ color: 'green', fontSize: '14px' }}>{message}</p>}
                {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

                <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', background: '#28a745', color: '#fff', border: 'none' }}>
                    Create User
                </button>
            </form>

            <hr style={{ marginTop: '30px' }} />

            <h3>Your Users</h3>
            {users.length === 0 ? (
                <p style={{ color: '#888' }}>No users created yet.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f0f0f0' }}>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>User ID</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.name || 'N/A'}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.email}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px', color: '#666' }}>{u.id}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                    {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default CreateUser;
