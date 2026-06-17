import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import LogoutButton from './logout';
import { fetchAllProjects, fetchAllSprints, fetchAllTasks } from './reportData';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const UserReport = () => {
    const [userStats, setUserStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const orgUser = auth.currentUser;

    useEffect(() => {
        const load = async () => {
            // Get all users created by this org
            const usersQuery = query(
                collection(db, 'users'),
                where('createdBy', '==', orgUser.uid)
            );
            const usersSnap = await getDocs(usersQuery);
            const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Get all tasks
            const projects = await fetchAllProjects(orgUser.uid);
            const sprints = await fetchAllSprints(orgUser.uid, projects);
            const allTasks = await fetchAllTasks(orgUser.uid, sprints);

            // Aggregate per user
            const stats = users.map(u => {
                const userTasks = allTasks.filter(t => t.assignedTo?.uid === u.id);
                const total = userTasks.length;
                const done = userTasks.filter(t => t.status === 'done').length;
                const inProgress = userTasks.filter(t => t.status === 'in-progress').length;
                const todo = userTasks.filter(t => t.status === 'todo').length;
                const estimatedHours = userTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
                const actualHours = userTasks.reduce((s, t) => s + (t.actualHours || 0), 0);
                const completionRate = total > 0 ? (done / total) * 100 : 0;

                return {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    total,
                    done,
                    inProgress,
                    todo,
                    estimatedHours,
                    actualHours,
                    completionRate,
                };
            });

            setUserStats(stats);
            setLoading(false);
        };
        load();
    }, []);

    const chartData = userStats.map(u => ({
        name: u.name,
        Done: u.done,
        'In Progress': u.inProgress,
        Todo: u.todo,
    }));

    const hoursData = userStats.map(u => ({
        name: u.name,
        Estimated: u.estimatedHours,
        Actual: u.actualHours,
    }));

    return (
        <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>User Performance Report</h2>
                <LogoutButton />
            </div>

            <Link to="/orghome" style={{ fontSize: '14px', textDecoration: 'none', color: '#007bff' }}>
                ← Back to Dashboard
            </Link>

            <hr />

            {loading ? (
                <p>Loading...</p>
            ) : userStats.length === 0 ? (
                <p style={{ color: '#888' }}>No users yet.</p>
            ) : (
                <>
                    <h3>Task Status by User</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Done" stackId="a" fill="#28a745" />
                                <Bar dataKey="In Progress" stackId="a" fill="#ffc107" />
                                <Bar dataKey="Todo" stackId="a" fill="#6c757d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <h3 style={{ marginTop: '30px' }}>Estimated vs Actual Hours</h3>
                    <div style={{ width: '100%', height: 300 }}>
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

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '30px' }}>
                        <thead>
                            <tr style={{ background: '#f0f0f0' }}>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Total Tasks</th>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Completed</th>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Completion %</th>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Est. Hours</th>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Actual Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userStats.map(u => (
                                <tr key={u.id}>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.name}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.email}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.total}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.done}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.completionRate.toFixed(1)}%</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.estimatedHours}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.actualHours}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default UserReport;
