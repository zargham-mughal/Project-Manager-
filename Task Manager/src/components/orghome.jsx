import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import Layout from './Layout';

const NAV_CARDS = [
    { to: '/projects', icon: '📁', title: 'Projects', description: 'Manage projects, timelines, budgets, sprints and tasks.' },
    { to: '/create-user', icon: '👥', title: 'Team', description: 'Create team members and view your roster.' },
    { to: '/reports/budget', icon: '💰', title: 'Budget Report', description: 'Track budget vs. spending across all projects.' },
    { to: '/reports/users', icon: '📊', title: 'User Report', description: 'Review task completion and logged hours by user.' },
];

const OrgHome = () => {
    const orgUser = auth.currentUser;

    return (
        <Layout role="org" crumbs={[{ label: 'Dashboard' }]}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Organization Dashboard</h1>
                    <p className="page-subtitle">Signed in as {orgUser?.email}</p>
                </div>
            </div>

            <div className="grid grid-2">
                {NAV_CARDS.map(card => (
                    <Link key={card.to} to={card.to} className="tile">
                        <div className="tile-icon">{card.icon}</div>
                        <h3>{card.title}</h3>
                        <p>{card.description}</p>
                    </Link>
                ))}
            </div>
        </Layout>
    );
};

export default OrgHome;
