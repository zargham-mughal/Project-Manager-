import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Avatar } from './ui';

const ORG_NAV = [
    { to: '/orghome', icon: '▦', label: 'Dashboard' },
    { to: '/projects', icon: '📁', label: 'Projects' },
    { to: '/create-user', icon: '👥', label: 'Team' },
    { to: '/reports/budget', icon: '💰', label: 'Budget Report' },
    { to: '/reports/users', icon: '📊', label: 'User Report' },
];

const USER_NAV = [
    { to: '/userhome', icon: '▦', label: 'My Dashboard' },
];

const Layout = ({ role = 'org', crumbs = [], children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = auth.currentUser;
    const nav = role === 'org' ? ORG_NAV : USER_NAV;

    const isActive = (to) =>
        location.pathname === to ||
        (to !== '/orghome' && to !== '/userhome' && location.pathname.startsWith(to));

    const handleLogout = async () => {
        try {
            await signOut(getAuth());
            localStorage.removeItem('userEmail');
            navigate('/');
        } catch (err) {
            console.error('Error signing out:', err.message);
        }
    };

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <span className="logo-mark">✓</span>
                    <span>TaskFlow</span>
                </div>

                <nav className="nav">
                    <div className="nav-section">{role === 'org' ? 'Workspace' : 'Menu'}</div>
                    {nav.map(item => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`nav-item ${isActive(item.to) ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <Avatar email={user?.email} name={user?.displayName} />
                        <div className="meta">
                            <div className="name">{user?.email}</div>
                            <div className="role">{role === 'org' ? 'Organization' : 'Team Member'}</div>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-block btn-sm" onClick={handleLogout}>
                        ↪ Sign out
                    </button>
                </div>
            </aside>

            <div className="main">
                <header className="topbar">
                    <div className="crumbs">
                        {crumbs.length === 0 ? (
                            <span>TaskFlow</span>
                        ) : (
                            crumbs.map((c, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && <span className="sep">/</span>}
                                    {c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
                                </React.Fragment>
                            ))
                        )}
                    </div>
                </header>

                <main className="content">{children}</main>
            </div>
        </div>
    );
};

export default Layout;
