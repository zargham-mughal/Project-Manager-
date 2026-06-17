import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom';
import Layout from './Layout';
import { EmptyState, Loader, StatusBadge } from './ui';

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
            await addDoc(sprintsRef, { name, startDate, endDate, status: 'planned', createdAt: serverTimestamp() });
            setName('');
            setStartDate('');
            setEndDate('');
            setShowForm(false);
            fetchSprints();
        } catch (err) {
            setError(err.message);
        }
    };

    if (!project) {
        return (
            <Layout role="org" crumbs={[{ label: 'Projects', to: '/projects' }]}>
                <Loader />
            </Layout>
        );
    }

    const budgetPercent = project.budget > 0 ? Math.min(100, ((project.spent || 0) / project.budget) * 100) : 0;
    const remaining = (project.budget || 0) - (project.spent || 0);

    return (
        <Layout role="org" crumbs={[{ label: 'Projects', to: '/projects' }, { label: project.name }]}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{project.name}</h1>
                    <p className="page-subtitle">{project.startDate} → {project.endDate}</p>
                </div>
            </div>

            {project.description && <p className="text-muted mb-24">{project.description}</p>}

            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-label">Budget</div>
                    <div className="stat-value">${project.budget?.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Spent</div>
                    <div className="stat-value danger">${(project.spent || 0).toLocaleString()}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Remaining</div>
                    <div className="stat-value success">${remaining.toLocaleString()}</div>
                </div>
            </div>

            <div className="card card-body mb-24">
                <div className="row-between text-sm" style={{ marginBottom: 8 }}>
                    <span className="text-muted">Budget utilization</span>
                    <span style={{ fontWeight: 600 }}>{budgetPercent.toFixed(1)}%</span>
                </div>
                <div className="progress">
                    <div className={`progress-bar ${budgetPercent > 90 ? 'danger' : budgetPercent > 70 ? 'warning' : ''}`} style={{ width: `${budgetPercent}%` }} />
                </div>
            </div>

            <div className="row-between mb-16">
                <h2 className="section-title" style={{ margin: 0 }}>Sprints</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ New Sprint'}
                </button>
            </div>

            {showForm && (
                <div className="card card-body mb-24">
                    <form onSubmit={handleCreateSprint}>
                        <div className="form-group">
                            <label className="label">Sprint name *</label>
                            <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="label">Start date *</label>
                                <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="label">End date *</label>
                                <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                            </div>
                        </div>
                        {error && <div className="alert alert-error">{error}</div>}
                        <button type="submit" className="btn btn-success">Create Sprint</button>
                    </form>
                </div>
            )}

            {sprints.length === 0 ? (
                <EmptyState icon="🏃" title="No sprints yet">Add a sprint to start planning tasks.</EmptyState>
            ) : (
                <div className="grid">
                    {sprints.map(s => (
                        <Link key={s.id} to={`/projects/${projectId}/sprints/${s.id}`} className="tile">
                            <div className="row-between">
                                <h3 style={{ fontSize: 15 }}>{s.name}</h3>
                                <StatusBadge status={s.status} />
                            </div>
                            <p className="text-muted text-sm" style={{ marginTop: 6 }}>{s.startDate} → {s.endDate}</p>
                        </Link>
                    ))}
                </div>
            )}
        </Layout>
    );
};

export default ProjectDetail;
