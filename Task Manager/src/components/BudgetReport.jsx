import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import Layout from './Layout';
import { EmptyState, Loader } from './ui';
import { fetchAllProjects } from './reportData';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const BudgetReport = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const orgUser = auth.currentUser;

    useEffect(() => {
        const load = async () => {
            const data = await fetchAllProjects(orgUser.uid);
            setProjects(data);
            setLoading(false);
        };
        load();
    }, []);

    const chartData = projects.map(p => ({ name: p.name, Budget: p.budget || 0, Spent: p.spent || 0 }));
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0);

    return (
        <Layout role="org" crumbs={[{ label: 'Dashboard', to: '/orghome' }, { label: 'Budget Report' }]}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Budget Report</h1>
                    <p className="page-subtitle">Budget vs. spending across all projects</p>
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : projects.length === 0 ? (
                <EmptyState icon="💰" title="No projects yet">Create projects to see budget analytics.</EmptyState>
            ) : (
                <>
                    <div className="stat-grid">
                        <div className="stat-card">
                            <div className="stat-label">Total Budget</div>
                            <div className="stat-value">${totalBudget.toLocaleString()}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Total Spent</div>
                            <div className="stat-value danger">${totalSpent.toLocaleString()}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Remaining</div>
                            <div className="stat-value success">${(totalBudget - totalSpent).toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="chart-card mb-24">
                        <h3 className="card-title mb-16">Budget vs. Spent</h3>
                        <div style={{ width: '100%', height: 340 }}>
                            <ResponsiveContainer>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ebecf0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5e6c84' }} />
                                    <YAxis tick={{ fontSize: 12, fill: '#5e6c84' }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Budget" fill="#0052cc" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Spent" fill="#de350b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Project</th>
                                    <th>Budget</th>
                                    <th>Spent</th>
                                    <th>Remaining</th>
                                    <th>% Used</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map(p => {
                                    const remaining = (p.budget || 0) - (p.spent || 0);
                                    const pct = p.budget > 0 ? ((p.spent || 0) / p.budget) * 100 : 0;
                                    return (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                                            <td>${(p.budget || 0).toLocaleString()}</td>
                                            <td>${(p.spent || 0).toLocaleString()}</td>
                                            <td>${remaining.toLocaleString()}</td>
                                            <td>
                                                <div className="flex items-center gap-8">
                                                    <div className="progress" style={{ width: 80 }}>
                                                        <div className={`progress-bar ${pct > 90 ? 'danger' : pct > 70 ? 'warning' : ''}`} style={{ width: `${Math.min(100, pct)}%` }} />
                                                    </div>
                                                    <span className="text-sm">{pct.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </Layout>
    );
};

export default BudgetReport;
