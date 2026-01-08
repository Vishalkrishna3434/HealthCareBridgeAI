import React, { useState, useEffect } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './App.css';

const Layout = () => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const [serviceStatus, setServiceStatus] = useState({
        patient: 'checking',
        clinical: 'checking',
        ai: 'checking'
    });

    useEffect(() => {
        const checkServices = async () => {
            const services = ['patient', 'clinical', 'ai'];
            const results = {};
            for (const service of services) {
                try {
                    const status = await api.checkHealth(service);
                    results[service] = status.status === 'healthy' ? 'healthy' : 'error';
                } catch (e) {
                    results[service] = 'error';
                }
            }
            setServiceStatus(results);
        };
        checkServices();
    }, []);

    const tabs = [
        { path: '/', label: 'Executive Overview' },
        { path: '/clinical', label: 'Clinical Intelligence' },
        { path: '/prescription', label: 'Smart Scanner' },
        { path: '/interactions', label: 'Safety Guard' },
        { path: '/medications', label: 'Patient Care' }
    ];

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-content">
                    <h1 className="app-title">HealthBridge AI</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div className="service-status">
                            {Object.entries(serviceStatus).map(([service, status]) => (
                                <div key={service} className="status-indicator">
                                    <div className={`status-dot ${status}`}></div>
                                    <span style={{ textTransform: 'capitalize' }}>{service}</span>
                                </div>
                            ))}
                        </div>
                        {user && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: 'white' }}>Welcome, {user.full_name}</span>
                                <button onClick={logout} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <nav className="nav-tabs">
                <div className="tabs-container">
                    {tabs.map(tab => (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={`tab-button ${location.pathname === tab.path ? 'active' : ''}`}
                            style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </nav>

            <main className="main-content">
                <div className="container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
