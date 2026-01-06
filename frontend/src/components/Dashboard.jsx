import { useState, useEffect } from 'react'

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalPatients: 156,
        notesAnalyzed: 1247,
        prescriptionsScanned: 892,
        interactionsChecked: 534
    })

    // Simulate "Live" updates
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

    const features = [
        {
            id: 'clinical',
            icon: '📝',
            title: 'Clinical Intelligence',
            description: 'Advanced NLP for medical entity extraction, de-identification, and FHIR mapping.',
            color: 'var(--primary-500)',
            tags: ['Gemini 1.5 Pro', 'HIPAA']
        },
        {
            id: 'prescription',
            icon: '💊',
            title: 'Prescription OCR',
            description: 'Convert handwritten or printed prescriptions into structured digital records.',
            color: 'var(--success-500)',
            tags: ['Vision API', 'OCR']
        },
        {
            id: 'interactions',
            icon: '⚠️',
            title: 'Safety Guardian',
            description: 'Automated drug-drug interaction detection and clinical decision support.',
            color: 'var(--warning-500)',
            tags: ['Real-time', 'Safety']
        },
        {
            id: 'medications',
            icon: '📋',
            title: 'Patient Adherence',
            description: 'Personalized coaching and adherence tracking for better health outcomes.',
            color: 'var(--danger-500)',
            tags: ['Coaching', 'Tracking']
        }
    ]

    return (
        <div className="fade-in">
            <div className="page-header" style={{ position: 'relative' }}>
                <h1 className="page-title">HealthBridge Executive Suite</h1>
                <p className="page-description">
                    Enterprise-grade clinical intelligence for modern healthcare systems
                </p>
                <div style={{ position: 'absolute', top: 0, right: 0 }}>
                    <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="status-dot healthy" style={{ width: '8px', height: '8px' }}></div>
                        Network Online
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-4" style={{ marginBottom: 'var(--space-2xl)' }}>
                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--primary-500)' }}>
                    <h3 style={{ fontSize: '2rem', margin: 0 }}>{stats.totalPatients}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Total Patients</p>
                </div>

                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--success-500)' }}>
                    <h3 style={{ fontSize: '2rem', margin: 0 }}>{stats.notesAnalyzed}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Notes Analyzed</p>
                </div>

                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--warning-500)' }}>
                    <h3 style={{ fontSize: '2rem', margin: 0 }}>{stats.interactionsChecked}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Safety Checks</p>
                </div>

                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--danger-500)' }}>
                    <h3 style={{ fontSize: '2rem', margin: 0 }}>{stats.prescriptionsScanned}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Docs Digitiized</p>
                </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-2">
                {features.map((feature, index) => (
                    <div
                        key={feature.id}
                        className="card fade-in"
                        style={{
                            animationDelay: `${index * 100}ms`,
                            display: 'flex',
                            gap: 'var(--space-lg)'
                        }}
                    >
                        <div style={{ fontSize: '2.5rem' }}>{feature.icon}</div>
                        <div>
                            <h3 style={{ marginBottom: 'var(--space-xs)' }}>{feature.title}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>
                                {feature.description}
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                {feature.tags.map(tag => (
                                    <span key={tag} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--primary-500)' }}>
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* System Monitor */}
            <div className="card" style={{ marginTop: 'var(--space-2xl)', background: 'linear-gradient(rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))' }}>
                <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    System Health Monitor
                    <span style={{ fontSize: '0.8rem', color: 'var(--success-500)' }}>99.9% Uptime</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-xl)', marginTop: 'var(--space-lg)' }}>
                    <div style={{ borderLeft: '2px solid var(--glass-border)', paddingLeft: 'var(--space-md)' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>Patient Cluster</p>
                        <div className="badge badge-success">Nominal</div>
                    </div>
                    <div style={{ borderLeft: '2px solid var(--glass-border)', paddingLeft: 'var(--space-md)' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>AI Core</p>
                        <div className="badge badge-success">Optimized</div>
                    </div>
                    <div style={{ borderLeft: '2px solid var(--glass-border)', paddingLeft: 'var(--space-md)' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>Security Layer</p>
                        <div className="badge badge-success">Encrypted</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
