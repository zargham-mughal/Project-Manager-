import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Layout from './Layout';
import { EmptyState, Loader, StatusBadge } from './ui';
import { fetchUserTasks, fetchUserSprints } from './reportData';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const STATUS_OPTIONS = ['todo', 'in-progress', 'done'];
const STATUS_COLORS = { Done: '#00875a', 'In Progress': '#ff991f', Todo: '#5e6c84' };

const UserHome = () => {
    const [tasks, setTasks] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [orgId, setOrgId] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = auth.currentUser;

    const loadData = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            setLoading(false);
            return;
        }
        const createdBy = userDoc.data().createdBy;
        setOrgId(createdBy);

        const [userTasks, userSprints] = await Promise.all([
            fetchUserTasks(createdBy, user.uid),
            fetchUserSprints(createdBy, user.uid),
        ]);
        setTasks(userTasks);
        setSprints(userSprints);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleStatusChange = async (task, newStatus) => {
        const taskRef = doc(db, 'organizations', orgId, 'projects', task.projectId, 'sprints', task.sprintId, 'tasks', task.id);
        await updateDoc(taskRef, { status: newStatus });
        loadData();
    };

    const handleActualHoursChange = async (task, hours) => {
        const taskRef = doc(db, 'organizations', orgId, 'projects', task.projectId, 'sprints', task.sprintId, 'tasks', task.id);
        await updateDoc(taskRef, { actualHours: parseFloat(hours) || 0 });
        loadData();
    };

    if (loading) {
        return <Layout role="user"><Loader /></Layout>;
    }

    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const totalEstimated = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
    const totalActual = tasks.reduce((s, t) => s + (t.actualHours || 0), 0);

    const pieData = [
        { name: 'Done', value: done },
        { name: 'In Progress', value: inProgress },
        { name: 'Todo', value: todo },
    ].filter(d => d.value > 0);

    const hoursData = [{ name: 'Hours', Estimated: totalEstimated, Actual: totalActual }];

    return (
        <Layout role="user" crumbs={[{ label: 'My Dashboard' }]}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Dashboard</h1>
                    <p className="page-subtitle">Welcome back, {user?.email}</p>
                </div>
            </div>

            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Tasks</div>
                    <div className="stat-value">{total}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Completed</div>
                    <div className="stat-value success">{done}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">In Progress</div>
                    <div className="stat-value primary">{inProgress}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Completion Rate</div>
                    <div className="stat-value">{total > 0 ? ((done / total) * 100).toFixed(0) : 0}%</div>
                </div>
            </div>

            {total > 0 && (
                <div className="grid grid-2 mb-24">
                    <div className="chart-card">
                        <h3 className="card-title mb-16">Task Status</h3>
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                                        {pieData.map((entry, index) => (
                                            <Cell key={index} fill={STATUS_COLORS[entry.name] || '#999'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="chart-card">
                        <h3 className="card-title mb-16">Estimated vs. Actual Hours</h3>
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer>
                                <BarChart data={hoursData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ebecf0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5e6c84' }} />
                                    <YAxis tick={{ fontSize: 12, fill: '#5e6c84' }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Estimated" fill="#0052cc" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Actual" fill="#de350b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            <h3 className="section-title">My Sprints</h3>
            {sprints.length === 0 ? (
                <EmptyState icon="🏃" title="No sprints yet">You're not part of any sprints yet.</EmptyState>
            ) : (
                <div className="grid grid-3 mb-24">
                    {sprints.map(s => (
                        <div key={s.id} className="card card-body">
                            <div className="row-between">
                                <h4 style={{ fontSize: 15 }}>{s.name}</h4>
                                <StatusBadge status={s.status} />
                            </div>
                            <p className="text-muted text-sm" style={{ marginTop: 6 }}>{s.projectName}</p>
                            <p className="text-muted text-sm">{s.startDate} → {s.endDate}</p>
                        </div>
                    ))}
                </div>
            )}

            <h3 className="section-title">My Tasks</h3>
            {tasks.length === 0 ? (
                <EmptyState icon="📝" title="No tasks assigned">Tasks assigned to you will appear here.</EmptyState>
            ) : (
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Project / Sprint</th>
                                <th>Due Date</th>
                                <th>Est.</th>
                                <th>Actual</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600 }}>{t.title}</td>
                                    <td className="text-muted">{t.projectName} / {t.sprintName}</td>
                                    <td className="text-muted">{t.dueDate}</td>
                                    <td>{t.estimatedHours}h</td>
                                    <td>
                                        <input
                                            className="input-inline"
                                            type="number"
                                            defaultValue={t.actualHours}
                                            min="0"
                                            step="0.5"
                                            onBlur={(e) => handleActualHoursChange(t, e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <select
                                            className="select-inline"
                                            value={t.status}
                                            onChange={(e) => handleStatusChange(t, e.target.value)}
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
                </div>
            )}
        </Layout>
    );
};

export default UserHome;
