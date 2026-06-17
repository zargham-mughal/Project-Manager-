import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Layout from './Layout';
import { Avatar, EmptyState } from './ui';

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
        const q = query(collection(db, 'users'), where('createdBy', '==', orgUser.uid));
        const snapshot = await getDocs(q);
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
                name,
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
                setError('This email is already registered.');
            } else {
                setError(err.message);
            }
        }
    };

    return (
        <Layout role="org" crumbs={[{ label: 'Dashboard', to: '/orghome' }, { label: 'Team' }]}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Team</h1>
                    <p className="page-subtitle">{users.length} member{users.length !== 1 ? 's' : ''} in your organization</p>
                </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'minmax(280px, 360px) 1fr', alignItems: 'start' }}>
                <div className="card card-body">
                    <h3 className="card-title mb-16">Add a team member</h3>
                    <form onSubmit={handleCreateUser}>
                        <div className="form-group">
                            <label className="label">Full name *</label>
                            <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="label">Email *</label>
                            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="label">Temporary password *</label>
                            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        {message && <div className="alert alert-success">{message}</div>}
                        {error && <div className="alert alert-error">{error}</div>}
                        <button type="submit" className="btn btn-success btn-block">Create User</button>
                    </form>
                </div>

                <div>
                    <h3 className="section-title">Your team</h3>
                    {users.length === 0 ? (
                        <EmptyState icon="👥" title="No team members yet">Add your first user with the form.</EmptyState>
                    ) : (
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Member</th>
                                        <th>Email</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <span className="assignee">
                                                    <Avatar name={u.name} email={u.email} />
                                                    <span className="name" style={{ fontWeight: 600 }}>{u.name || 'N/A'}</span>
                                                </span>
                                            </td>
                                            <td className="text-muted">{u.email}</td>
                                            <td className="text-muted">
                                                {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default CreateUser;
