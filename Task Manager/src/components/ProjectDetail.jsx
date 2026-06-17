import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
    doc, getDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom';
import LogoutButton from './logout';

const ProjectDetail = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [sprints, setSprints] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');
    const orgUser = auth.currentUser;

    const projectRef = doc(db, 'organizations', orgUser.uid, 'projects', projectId);
    const sprintsRef = collection(projectRef, 'sprints');

    const fetchProject = async () => {
        const snap = await getDoc(projectRef);
        if (snap.exists()) setProject({ id: snap.id, ...snap.data() });
    };

    const fetchSprints = async () => {
        const q = query(sprintsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setSprints(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    useEffect(() => {
        fetchProject();
        fetchSprints();
    }, []);

    const handleCreateSprint = async (e) => {
        e.preventDefault();
        setError('');

        if (!name || !startDate || !endDate) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            await addDoc(sprintsRef, {
                name,
                startDate,
                endDate,
                status: 'planned',
                createdAt: serverTimestamp(),
            });

            setName('');
            setStartDate('');
            setEndDate('');
            setShowForm(false);
            fetchSprints();
        } catch (err) {
            setError(err.message);
        }
    };

    if (!project) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>;

    const budgetPercent = project.budget > 0
        ? Math.min(100, ((project.spent || 0) / project.budget) * 100)
        : 0;

    return (
        <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>{project.name}</h2>
                <LogoutButton />
            </div>

            <Link to="/projects" style={{ fontSize: '14px', textDecoration: 'none', color: '#007bff' }}>
                ← Back to Projects
            </Link>

            <hr />

            <p>{project.description}</p>
            <p style={{ fontSize: '14px', color: '#888' }}>{project.startDate} → {project.endDate}</p>

            <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 5px 0' }}>
                    Budget: ${project.budget?.toLocaleString()} | Spent: ${(project.spent || 0).toLocaleString()}
                </p>
                <div style={{ background: '#eee', borderRadius: '4px', height: '20px', width: '100%' }}>
                    <div style={{
                        background: budgetPercent > 90 ? '#dc3545' : '#28a745',
                        width: `${budgetPercent}%`,
                        height: '100%',
                        borderRadius: '4px',
                        transition: 'width 0.3s'
                    }} />
                </div>
                <p style={{ fontSize: '12px', color: '#888', margin: '5px 0 0 0' }}>{budgetPercent.toFixed(1)}% used</p>
            </div>

            <hr />

            <h3>Sprints</h3>
            <button
                onClick={() => setShowForm(!showForm)}
                style={{ padding: '10px 20px', cursor: 'pointer', background: '#007bff', color: '#fff', border: 'none', marginBottom: '20px' }}
            >
                {showForm ? 'Cancel' : '+ New Sprint'}
            </button>

            {showForm && (
                <form onSubmit={handleCreateSprint} style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Sprint Name:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
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
                        Create Sprint
                    </button>
                </form>
            )}

            {sprints.length === 0 ? (
                <p style={{ color: '#888' }}>No sprints yet.</p>
            ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                    {sprints.map(s => (
                        <Link
                            key={s.id}
                            to={`/projects/${projectId}/sprints/${s.id}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px' }}>
                                <h4 style={{ margin: '0 0 5px 0' }}>{s.name}</h4>
                                <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
                                    {s.startDate} → {s.endDate} | Status: {s.status}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectDetail;
