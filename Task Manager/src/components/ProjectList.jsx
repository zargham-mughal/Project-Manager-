import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import { EmptyState, Loader } from './ui';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
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
        setLoading(false);
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
        <Layout role="org" crumbs={[{ label: 'Dashboard', to: '/orghome' }, { label: 'Projects' }]}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Projects</h1>
                    <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ New Project'}
                </button>
            </div>

            {showForm && (
                <div className="card card-body mb-24">
                    <h3 className="card-title mb-16">Create a new project</h3>
                    <form onSubmit={handleCreateProject}>
                        <div className="form-group">
                            <label className="label">Project name *</label>
                            <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="label">Description</label>
                            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="label">Budget ($) *</label>
                            <input className="input" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} min="0" step="0.01" required />
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
                        <button type="submit" className="btn btn-success">Create Project</button>
                    </form>
                </div>
            )}

            {loading ? (
                <Loader />
            ) : projects.length === 0 ? (
                <EmptyState icon="📁" title="No projects yet">Create your first project to get started.</EmptyState>
            ) : (
                <div className="grid grid-2">
                    {projects.map(p => {
                        const pct = p.budget > 0 ? Math.min(100, ((p.spent || 0) / p.budget) * 100) : 0;
                        return (
                            <Link key={p.id} to={`/projects/${p.id}`} className="tile">
                                <div className="row-between mb-16">
                                    <h3>{p.name}</h3>
                                    <span className="text-sm text-muted">{p.startDate} → {p.endDate}</span>
                                </div>
                                <p className="text-muted text-sm" style={{ marginBottom: 14, minHeight: 18 }}>
                                    {p.description || 'No description'}
                                </p>
                                <div className="row-between text-sm" style={{ marginBottom: 6 }}>
                                    <span className="text-muted">Budget used</span>
                                    <span style={{ fontWeight: 600 }}>
                                        ${(p.spent || 0).toLocaleString()} / ${p.budget?.toLocaleString()}
                                    </span>
                                </div>
                                <div className="progress">
                                    <div className={`progress-bar ${pct > 90 ? 'danger' : pct > 70 ? 'warning' : ''}`} style={{ width: `${pct}%` }} />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
};

export default ProjectList;
