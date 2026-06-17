import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import LogoutButton from './logout';
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

    const chartData = projects.map(p => ({
        name: p.name,
        Budget: p.budget || 0,
        Spent: p.spent || 0,
    }));

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0);

    return (
        <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Budget Report</h2>
                <LogoutButton />
            </div>

            <Link to="/orghome" style={{ fontSize: '14px', textDecoration: 'none', color: '#007bff' }}>
                ← Back to Dashboard
            </Link>

            <hr />

            {loading ? (
                <p>Loading...</p>
            ) : projects.length === 0 ? (
                <p style={{ color: '#888' }}>No projects yet.</p>
            ) : (
                <>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ flex: 1, border: '1px solid #ddd', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
                            <p style={{ margin: 0, color: '#888' }}>Total Budget</p>
                            <h3 style={{ margin: '5px 0 0 0' }}>${totalBudget.toLocaleString()}</h3>
                        </div>
                        <div style={{ flex: 1, border: '1px solid #ddd', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
                            <p style={{ margin: 0, color: '#888' }}>Total Spent</p>
                            <h3 style={{ margin: '5px 0 0 0' }}>${totalSpent.toLocaleString()}</h3>
                        </div>
                        <div style={{ flex: 1, border: '1px solid #ddd', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
                            <p style={{ margin: 0, color: '#888' }}>Remaining</p>
                            <h3 style={{ margin: '5px 0 0 0' }}>${(totalBudget - totalSpent).toLocaleString()}</h3>
                        </div>
                    </div>

                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Budget" fill="#007bff" />
                                <Bar dataKey="Spent" fill="#dc3545" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                        <thead>
                            <tr style={{ background: '#f0f0f0' }}>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Project</th>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Budget</th>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Spent</th>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Remaining</th>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>% Used</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(p => {
                                const remaining = (p.budget || 0) - (p.spent || 0);
                                const pct = p.budget > 0 ? ((p.spent || 0) / p.budget) * 100 : 0;
                                return (
                                    <tr key={p.id}>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.name}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>${(p.budget || 0).toLocaleString()}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>${(p.spent || 0).toLocaleString()}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>${remaining.toLocaleString()}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{pct.toFixed(1)}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default BudgetReport;
