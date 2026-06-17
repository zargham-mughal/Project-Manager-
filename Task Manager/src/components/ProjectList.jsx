import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
    collection, addDoc, getDocs, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import LogoutButton from './logout';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');
    const orgUser = auth.currentUser;

    const projectsRef = collection(db, 'organizations', orgUser.uid, 'projects');

    const fetchProjects = async () => {
        const q = query(projectsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setError('');

        if (!name || !budget || !startDate || !endDate) {
            setError('Please fill in all required fields.');
            return;
        }

        try {
            await addDoc(projectsRef, {
                name,
                description,
                budget: parseFloat(budget),
                spent: 0,
                startDate,
                endDate,
                createdAt: serverTimestamp(),
            });

            setName('');
            setDescription('');
            setBudget('');
            setStartDate('');
            setEndDate('');
            setShowForm(false);
            fetchProjects();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Projects</h2>
                <LogoutButton />
            </div>

            <Link to="/orghome" style={{ fontSize: '14px', textDecoration: 'none', color: '#007bff' }}>
                ← Back to Dashboard
            </Link>

            <hr />

            <button
                onClick={() => setShowForm(!showForm)}
                style={{ padding: '10px 20px', cursor: 'pointer', background: '#007bff', color: '#fff', border: 'none', marginBottom: '20px' }}
            >
                {showForm ? 'Cancel' : '+ New Project'}
            </button>

            {showForm && (
                <form onSubmit={handleCreateProject} style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Project Name:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Description:</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Budget ($):</label>
                        <input
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label>Start Date:</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>End Date:</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

                    <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', background: '#28a745', color: '#fff', border: 'none' }}>
                        Create Project
                    </button>
                </form>
            )}

            {projects.length === 0 ? (
                <p style={{ color: '#888' }}>No projects yet.</p>
            ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                    {projects.map(p => (
                        <Link
                            key={p.id}
                            to={`/projects/${p.id}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px' }}>
                                <h3 style={{ margin: '0 0 5px 0' }}>{p.name}</h3>
                                <p style={{ margin: '0 0 5px 0', color: '#555' }}>{p.description}</p>
                                <p style={{ margin: 0, fontSize: '14px' }}>
                                    Budget: ${p.budget?.toLocaleString()} | Spent: ${p.spent?.toLocaleString() || 0}
                                </p>
                                <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
                                    {p.startDate} → {p.endDate}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectList;
