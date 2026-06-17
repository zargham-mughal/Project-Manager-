import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import LogoutButton from './logout';
import { fetchUserTasks, fetchUserSprints } from './reportData';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const STATUS_OPTIONS = ['todo', 'in-progress', 'done'];
const STATUS_COLORS = { done: '#28a745', 'in-progress': '#ffc107', todo: '#6c757d' };

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
        const taskRef = doc(
            db, 'organizations', orgId, 'projects', task.projectId,
            'sprints', task.sprintId, 'tasks', task.id
        );
        await updateDoc(taskRef, { status: newStatus });
        loadData();
    };

    const handleActualHoursChange = async (task, hours) => {
        const taskRef = doc(
            db, 'organizations', orgId, 'projects', task.projectId,
            'sprints', task.sprintId, 'tasks', task.id
        );
        await updateDoc(taskRef, { actualHours: parseFloat(hours) || 0 });
        loadData();
    };

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>;

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

    const hoursData = [
        { name: 'Hours', Estimated: totalEstimated, Actual: totalActual },
    ];

    return (
        <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>My Dashboard</h2>
                <LogoutButton />
            </div>

            <p style={{ color: '#555' }}>Welcome, {user?.email}</p>

            <hr />

            <h3>My Performance</h3>
            {total === 0 ? (
                <p style={{ color: '#888' }}>No tasks assigned yet.</p>
            ) : (
                <>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ width: '300px', height: 250 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={index} fill={STATUS_COLORS[entry.name.toLowerCase().replace(' ', '-')] || '#999'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ width: '300px', height: 250 }}>
                            <ResponsiveContainer>
                                <BarChart data={hoursData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Estimated" fill="#007bff" />
                                    <Bar dataKey="Actual" fill="#dc3545" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <p>
                        Total tasks: {total} | Completed: {done} ({((done / total) * 100).toFixed(1)}%)
                    </p>
                </>
            )}

            <hr />

            <h3>My Sprints</h3>
            {sprints.length === 0 ? (
                <p style={{ color: '#888' }}>You're not part of any sprints yet.</p>
            ) : (
                <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                    {sprints.map(s => (
                        <div key={s.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px' }}>
                            <h4 style={{ margin: '0 0 5px 0' }}>{s.name}</h4>
                            <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
                                Project: {s.projectName} | {s.startDate} → {s.endDate} | Status: {s.status}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <hr />

            <h3>My Tasks</h3>
            {tasks.length === 0 ? (
                <p style={{ color: '#888' }}>No tasks assigned yet.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f0f0f0' }}>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Title</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Project / Sprint</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Due Date</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Est. Hours</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Actual Hours</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(t => (
                            <tr key={t.id}>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{t.title}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{t.projectName} / {t.sprintName}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{t.dueDate}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{t.estimatedHours}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                    <input
                                        type="number"
                                        defaultValue={t.actualHours}
                                        min="0"
                                        step="0.5"
                                        style={{ width: '70px', padding: '4px' }}
                                        onBlur={(e) => handleActualHoursChange(t, e.target.value)}
                                    />
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                    <select
                                        value={t.status}
                                        onChange={(e) => handleStatusChange(t, e.target.value)}
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

export default UserHome;
