import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkRole = async () => {
            const user = auth.currentUser;

            if (!user) {
                setAuthorized(false);
                setLoading(false);
                return;
            }

            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (userDoc.exists() && userDoc.data().role === allowedRole) {
                setAuthorized(true);
            } else {
                setAuthorized(false);
            }

            setLoading(false);
        };

        checkRole();
    }, [allowedRole]);

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>;

    if (!authorized) return <Navigate to="/" replace />;

    return children;
};

export default ProtectedRoute;
