import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
    doc, getDoc, collection, addDoc, getDocs, updateDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom';
import LogoutButton from './logout';
import UserSelect from './UserSelect';

const STATUS_OPTIONS = ['todo', 'in-progress', 'done'];

const SprintDetail = () => {
    const { projectId, sprintId } = useParams();
    const [sprint, setSprint] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [showForm, setShowForm] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState(null);
    const [estimatedHours, setEstimatedHours] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [error, setError] = useState('');

    const orgUser = auth.currentUser;
    const sprintRef = doc(db, 'organizations', orgUser.uid, 'projects', projectId, 'sprints', sprintId);
    const tasksRef = collection(sprintRef, 'tasks');

    const fetchSprint = async () => {
        const snap = await getDoc(sprintRef);
        if (snap.exists()) setSprint({ id: snap.id, ...snap.data() });
    };

    const fetchTasks = async () => {
        const q = query(tasksRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    useEffect(() => {
        fetchSprint();
        fetchTasks();
    }, []);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setError('');

        if (!title || !estimatedHours || !dueDate) {
            setError('Please fill in all required fields.');
            return;
        }

        try {
            await addDoc(tasksRef, {
                title,
                description,
                assignedTo: assignedTo || null,
                status: 'todo',
                estimatedHours: parseFloat(estimatedHours),
                actualHours: 0,
                dueDate,
                createdAt: serverTimestamp(),
            });

            setTitle('');
            setDescription('');
            setAssignedTo(null);
            setEstimatedHours('');
            setDueDate('');
            setShowForm(false);
            fetchTasks();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        const taskRef = doc(tasksRef, taskId);
        await updateDoc(taskRef, { status: newStatus });
        fetchTasks();
    };

    if (!sprint) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>;

    return (
        <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>{sprint.name}</h2>
                <LogoutButton />
            </div>

            <Link to={`/projects/${projectId}`} style={{ fontSize: '14px', textDecoration: 'none', color: '#007bff' }}>
                ← Back to Project
            </Link>

            <hr />

            <p style={{ fontSize: '14px', color: '#888' }}>
                {sprint.startDate} → {sprint.endDate} | Status: {sprint.status}
            </p>

            <hr />

            <h3>Tasks</h3>
            <button
                onClick={() => setShowForm(!showForm)}
                style={{ padding: '10px 20px', cursor: 'pointer', background: '#007bff', color: '#fff', border: 'none', marginBottom: '20px' }}
            >
                {showForm ? 'Cancel' : '+ New Task'}
            </button>

            {showForm && (
                <form onSubmit={handleCreateTask} style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Title:</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
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
                        <label>Assign To:</label>
                        <UserSelect value={assignedTo} onChange={setAssignedTo} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label>Estimated Hours:</label>
                            <input
                                type="number"
                                value={estimatedHours}
                                onChange={(e) => setEstimatedHours(e.target.value)}
                                required
                                min="0"
                                step="0.5"
                                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>Due Date:</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

                    <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', background: '#28a745', color: '#fff', border: 'none' }}>
                        Create Task
                    </button>
                </form>
            )}

            {tasks.length === 0 ? (
                <p style={{ color: '#888' }}>No tasks yet.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f0f0f0' }}>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Title</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Assigned To</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Est. Hours</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Actual Hours</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Due Date</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(t => (
                            <tr key={t.id}>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{t.title}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                    {t.assignedTo ? `${t.assignedTo.name} (${t.assignedTo.email})` : 'Unassigned'}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{t.estimatedHours}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{t.actualHours}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{t.dueDate}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                    <select
                                        value={t.status}
                                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                                        style={{ padding: '4px' }}
                                    >
                                        {STATUS_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default SprintDetail;
