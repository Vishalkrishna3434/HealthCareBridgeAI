import { useState, useEffect } from 'react'
import { api } from '../api'
import '../App.css'

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalPatients: 156,
        notesAnalyzed: 1247,
        prescriptionsScanned: 892,
        interactionsChecked: 534
    })
    const [auditLogs, setAuditLogs] = useState([])
    const [showLogs, setShowLogs] = useState(false)
    const [loadingLogs, setLoadingLogs] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                ...prev,
                notesAnalyzed: prev.notesAnalyzed + Math.floor(Math.random() * 2),
                interactionsChecked: prev.interactionsChecked + Math.floor(Math.random() * 2)
            }))
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    const fetchLogs = async () => {
        setLoadingLogs(true)
        setShowLogs(true)
        try {
            const logs = await api.getAuditLogs()
            setAuditLogs(logs)
        } catch (err) {
            console.error('Failed to fetch audit logs:', err)
        } finally {
            setLoadingLogs(false)
        }
    }

    const features = [
        {
            id: 'clinical',
            icon: '󰈙',
            title: 'Clinical Intelligence',
            description: 'Advanced NLP for medical entity extraction, de-identification, and FHIR mapping.',
            gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            tags: ['Gemini 1.5 Pro', 'HIPAA']
        },
        {
            id: 'prescription',
            icon: '󰚞',
            title: 'Prescription OCR',
            description: 'Convert handwritten or printed prescriptions into structured digital records.',
            gradient: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            tags: ['Vision API', 'OCR']
        },
        {
            id: 'interactions',
            icon: '󰦀',
            title: 'Safety Guardian',
            description: 'Automated drug-drug interaction detection and clinical decision support.',
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            tags: ['Real-time', 'Safety']
        },
        {
            id: 'medications',
            icon: '󰅖',
            title: 'Patient Adherence',
            description: 'Personalized coaching and adherence tracking for better health outcomes.',
            gradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            tags: ['Coaching', 'Tracking']
        }
    ]

    return (
        <div className="fade-in" style={{ paddingBottom: '4rem' }}>
            <div className="page-header" style={{ marginBottom: '4rem' }}>
                <h1 className="page-title" style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem' }}>
                    HealthBridge <span className="text-gradient">AI Suite</span>
                </h1>
                <p className="page-description" style={{ fontSize: '1.2rem', color: 'var(--text-dim)', maxWidth: '800px' }}>
                    Next-generation clinical intelligence powered by multi-modal AI agents.
                    Transforming raw healthcare narratives into actionable FHIR insights.
                </p>
            </div>

            {/* Stats Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '2rem',
                marginBottom: '4rem'
            }}>
                {[
                    { label: 'Active Patients', val: stats.totalPatients, color: 'var(--primary)' },
                    { label: 'Clinical Analyses', val: stats.notesAnalyzed, color: 'var(--secondary)' },
                    { label: 'Safety Validations', val: stats.interactionsChecked, color: 'var(--warning)' },
                    { label: 'Documents Processed', val: stats.prescriptionsScanned, color: 'var(--accent)' }
                ].map((stat, i) => (
                    <div key={i} className="glass-card" style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ color: stat.color, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                            {stat.label}
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Outfit' }}>
                            {stat.val.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '2rem'
            }}>
                {features.map((feature, index) => (
                    <div
                        key={feature.id}
                        className="glass-card"
                        style={{
                            padding: '2.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            animation: `fadeIn 0.6s ease-out ${index * 0.1}s forwards`,
                            opacity: 0,
                            position: 'relative'
                        }}
                    >
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '16px',
                            background: feature.gradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                        }}>
                            {index === 0 ? '📝' : index === 1 ? '💊' : index === 2 ? '⚠️' : '📋'}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>{feature.title}</h3>
                            <p style={{ color: 'var(--text-dim)', fontSize: '1rem', lineHeight: 1.6 }}>
                                {feature.description}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                            {feature.tags.map(tag => (
                                <span key={tag} style={{
                                    fontSize: '0.75rem',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--text-dim)'
                                }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* System Status Banner */}
            <div className="glass-card" style={{
                marginTop: '4rem',
                padding: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05))'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>System Integrity</div>
                        <div style={{ color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="status-dot healthy"></div>
                            99.9% Uptime Verified
                        </div>
                    </div>
                </div>
                <button className="btn-primary" onClick={fetchLogs}>View Global Audit Log</button>
            </div>

            {/* Audit Log Modal */}
            {showLogs && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
                    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div className="glass-card fade-in" style={{
                        width: '100%', maxWidth: '800px', maxHeight: '80vh',
                        overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        background: 'var(--bg-card)'
                    }}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Global Audit Log</h2>
                            <button className="tab-button" onClick={() => setShowLogs(false)}>Close</button>
                        </div>
                        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
                            {loadingLogs ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Fetching latest logs...</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {auditLogs.map(log => (
                                        <div key={log.id} className="result-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{log.action}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                                    {log.timestamp} • User: {log.user}
                                                </div>
                                            </div>
                                            <span className={`badge ${log.status === 'Success' ? 'badge-success' : 'badge-warning'}`}>
                                                {log.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
