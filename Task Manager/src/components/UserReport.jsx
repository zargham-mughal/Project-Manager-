import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Layout from './Layout';
import { Avatar, EmptyState, Loader } from './ui';
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
            const usersQuery = query(collection(db, 'users'), where('createdBy', '==', orgUser.uid));
            const usersSnap = await getDocs(usersQuery);
            const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            const projects = await fetchAllProjects(orgUser.uid);
            const sprints = await fetchAllSprints(orgUser.uid, projects);
            const allTasks = await fetchAllTasks(orgUser.uid, sprints);

            const stats = users.map(u => {
                const userTasks = allTasks.filter(t => t.assignedTo?.uid === u.id);
                const total = userTasks.length;
                const done = userTasks.filter(t => t.status === 'done').length;
                const inProgress = userTasks.filter(t => t.status === 'in-progress').length;
                const todo = userTasks.filter(t => t.status === 'todo').length;
                const estimatedHours = userTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
                const actualHours = userTasks.reduce((s, t) => s + (t.actualHours || 0), 0);
                const completionRate = total > 0 ? (done / total) * 100 : 0;
                return { id: u.id, name: u.name, email: u.email, total, done, inProgress, todo, estimatedHours, actualHours, completionRate };
            });

            setUserStats(stats);
            setLoading(false);
        };
        load();
    }, []);

    const chartData = userStats.map(u => ({ name: u.name, Done: u.done, 'In Progress': u.inProgress, Todo: u.todo }));
    const hoursData = userStats.map(u => ({ name: u.name, Estimated: u.estimatedHours, Actual: u.actualHours }));

    return (
        <Layout role="org" crumbs={[{ label: 'Dashboard', to: '/orghome' }, { label: 'User Report' }]}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">User Performance Report</h1>
                    <p className="page-subtitle">Task completion and logged hours by team member</p>
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : userStats.length === 0 ? (
                <EmptyState icon="📊" title="No users yet">Add team members to generate this report.</EmptyState>
            ) : (
                <>
                    <div className="grid grid-2 mb-24">
                        <div className="chart-card">
                            <h3 className="card-title mb-16">Task Status by User</h3>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ebecf0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5e6c84' }} />
                                        <YAxis tick={{ fontSize: 12, fill: '#5e6c84' }} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Done" stackId="a" fill="#00875a" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="In Progress" stackId="a" fill="#ff991f" />
                                        <Bar dataKey="Todo" stackId="a" fill="#5e6c84" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="chart-card">
                            <h3 className="card-title mb-16">Estimated vs. Actual Hours</h3>
                            <div style={{ width: '100%', height: 300 }}>
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

                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Total Tasks</th>
                                    <th>Completed</th>
                                    <th>Completion</th>
                                    <th>Est. Hours</th>
                                    <th>Actual Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userStats.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <span className="assignee">
                                                <Avatar name={u.name} email={u.email} />
                                                <span>
                                                    <span className="name" style={{ fontWeight: 600 }}>{u.name}</span>
                                                    <div className="email">{u.email}</div>
                                                </span>
                                            </span>
                                        </td>
                                        <td>{u.total}</td>
                                        <td>{u.done}</td>
                                        <td>
                                            <div className="flex items-center gap-8">
                                                <div className="progress" style={{ width: 70 }}>
                                                    <div className="progress-bar" style={{ width: `${u.completionRate}%` }} />
                                                </div>
                                                <span className="text-sm">{u.completionRate.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td>{u.estimatedHours}h</td>
                                        <td>{u.actualHours}h</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </Layout>
    );
};

export default UserReport;
