import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, addDoc, getDocs, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import Layout from './Layout';
import UserSelect from './UserSelect';
import { Assignee, EmptyState, Loader, StatusBadge } from './ui';

const STATUS_OPTIONS = ['todo', 'in-progress', 'done'];
const COLUMNS = [
    { key: 'todo', label: 'To Do' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'done', label: 'Done' },
];

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
        await updateDoc(doc(tasksRef, taskId), { status: newStatus });
        fetchTasks();
    };

    if (!sprint) {
        return (
            <Layout role="org" crumbs={[{ label: 'Projects', to: '/projects' }]}>
                <Loader />
            </Layout>
        );
    }

    return (
        <Layout role="org" crumbs={[
            { label: 'Projects', to: '/projects' },
            { label: 'Project', to: `/projects/${projectId}` },
            { label: sprint.name },
        ]}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{sprint.name}</h1>
                    <p className="page-subtitle">
                        {sprint.startDate} → {sprint.endDate} &nbsp;·&nbsp; <StatusBadge status={sprint.status} />
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ New Task'}
                </button>
            </div>

            {showForm && (
                <div className="card card-body mb-24">
                    <h3 className="card-title mb-16">Create a task</h3>
                    <form onSubmit={handleCreateTask}>
                        <div className="form-group">
                            <label className="label">Title *</label>
                            <input className="input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="label">Description</label>
                            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="label">Assign to</label>
                            <UserSelect value={assignedTo} onChange={setAssignedTo} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="label">Estimated hours *</label>
                                <input className="input" type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} min="0" step="0.5" required />
                            </div>
                            <div className="form-group">
                                <label className="label">Due date *</label>
                                <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                            </div>
                        </div>
                        {error && <div className="alert alert-error">{error}</div>}
                        <button type="submit" className="btn btn-success">Create Task</button>
                    </form>
                </div>
            )}

            {tasks.length === 0 ? (
                <EmptyState icon="📝" title="No tasks yet">Create a task to populate the board.</EmptyState>
            ) : (
                <div className="board">
                    {COLUMNS.map(col => {
                        const colTasks = tasks.filter(t => t.status === col.key);
                        return (
                            <div key={col.key} className="board-col">
                                <div className="board-col-header">
                                    <span>{col.label}</span>
                                    <span className="count">{colTasks.length}</span>
                                </div>
                                <div className="board-col-body">
                                    {colTasks.length === 0 ? (
                                        <div className="board-col-empty">No tasks</div>
                                    ) : (
                                        colTasks.map(t => (
                                            <div key={t.id} className="task-card">
                                                <div className="task-title">{t.title}</div>
                                                {t.description && <div className="task-desc">{t.description}</div>}
                                                <div className="task-meta">
                                                    <span className="task-chip">⏱ {t.actualHours || 0}/{t.estimatedHours}h</span>
                                                    <span className="task-chip">📅 {t.dueDate}</span>
                                                </div>
                                                <div className="row-between">
                                                    <Assignee user={t.assignedTo} />
                                                    <select
                                                        className="select-inline"
                                                        value={t.status}
                                                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                                                    >
                                                        {STATUS_OPTIONS.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
};

export default SprintDetail;
