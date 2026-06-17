import React from 'react';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import LogoutButton from './logout';

const NavCard = ({ to, title, description }) => (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px', height: '100%' }}>
            <h3 style={{ margin: '0 0 5px 0' }}>{title}</h3>
            <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>{description}</p>
        </div>
    </Link>
);

const OrgHome = () => {
    const orgUser = auth.currentUser;

    return (
        <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Organization Dashboard</h2>
                <LogoutButton />
            </div>

            <p style={{ color: '#555' }}>Logged in as: {orgUser?.email}</p>

            <hr />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <NavCard to="/projects" title="Projects" description="Manage projects, timelines, budgets, sprints and tasks." />
                <NavCard to="/create-user" title="Manage Users" description="Create and view users." />
                <NavCard to="/reports/budget" title="Budget Report" description="View budget vs spending across projects." />
                <NavCard to="/reports/users" title="User Report" description="View task completion and hours by user." />
            </div>
        </div>
    );
};

export default OrgHome;
