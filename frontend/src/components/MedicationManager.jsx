import { useState, useEffect } from 'react'
import { api } from '../api'

export default function MedicationManager() {
    const [medications, setMedications] = useState([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        dosage: '',
        frequency: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [mockUserId] = useState('demo-user-123') // Mock user ID for demo

    // Load medications on mount
    useEffect(() => {
        loadMedications()
    }, [])

    const loadMedications = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await api.getMedications()
            setMedications(data)
        } catch (err) {
            setError(err.message || String(err))
        } finally {
            setLoading(false)
        }
    }

    const handleAddMedication = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            await api.addMedication(formData)
            await loadMedications()
            setFormData({ name: '', dosage: '', frequency: '' })
            setShowAddForm(false)
        } catch (err) {
            setError(err.message || String(err))
        } finally {
            setLoading(false)
        }
    }

    const logAdherence = async (medId, status) => {
        try {
            await api.logAdherence({
                medication_id: medId,
                status: status,
                timestamp: new Date().toISOString()
            })
            // Update local state or just show feedback
            const med = medications.find(m => m.id === medId)
            alert(`${med.name}: Adherence logged as ${status.toUpperCase()}`)
            loadMedications() // Refresh logs if we had a list, but at least refresh stats
        } catch (err) {
            setError(String(err.message || err))
        }
    }

    const deleteMedication = async (medId) => {
        if (!window.confirm('Are you sure you want to remove this medication?')) return

        setLoading(true)
        setError(null)
        try {
            await api.deleteMedication(medId)
            await loadMedications()
        } catch (err) {
            setError(err.message || String(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Medication Management</h1>
                <p className="page-description">
                    Track patient medications and log adherence events
                </p>
            </div>

            <div className="grid grid-2" style={{ gap: '2rem' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <h3 style={{ margin: 0 }}>Current Medications</h3>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="btn-primary"
                        >
                            {showAddForm ? 'Cancel' : 'Add Medication'}
                        </button>
                    </div>

                    {showAddForm && (
                        <form onSubmit={handleAddMedication} className="form-container fade-in" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px solid var(--glass-border)' }}>
                            <div className="form-group">
                                <label htmlFor="medName">Medication Name</label>
                                <input
                                    id="medName"
                                    type="text"
                                    required
                                    placeholder="e.g., Aspirin"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="dosage">Dosage</label>
                                <input
                                    id="dosage"
                                    type="text"
                                    required
                                    placeholder="e.g., 81mg"
                                    value={formData.dosage}
                                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="frequency">Frequency</label>
                                <input
                                    id="frequency"
                                    type="text"
                                    required
                                    placeholder="e.g., Once daily"
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Adding...' : 'Save Medication'}
                            </button>
                        </form>
                    )}

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {medications.length > 0 ? (
                        <div>
                            {medications.map((med) => (
                                <div key={med.id} className="result-item">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ color: 'var(--primary-500)', marginBottom: 'var(--space-xs)' }}>
                                                {med.name}
                                            </h4>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                                                <strong>Dosage:</strong> {med.dosage}
                                            </p>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                                                <strong>Frequency:</strong> {med.frequency}
                                            </p>

                                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => logAdherence(med.id, 'taken')}
                                                    className="tab-button active"
                                                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                                                >
                                                    ✓ Taken
                                                </button>
                                                <button
                                                    onClick={() => logAdherence(med.id, 'skipped')}
                                                    className="tab-button"
                                                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                                                >
                                                    ⊘ Skipped
                                                </button>
                                                <button
                                                    onClick={() => deleteMedication(med.id)}
                                                    className="tab-button"
                                                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', marginLeft: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="result-section">
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                                No medications added yet. Click "Add Medication" to get started.
                            </p>
                        </div>
                    )}
                </div>

                {/* Adherence Tracking */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>Adherence Overview</h3>

                    <div style={{ marginBottom: 'var(--space-xl)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Overall Adherence</span>
                            <span className="badge badge-success">92%</span>
                        </div>

                        <div style={{
                            width: '100%',
                            height: '12px',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-full)',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: '92%',
                                height: '100%',
                                background: 'var(--primary-gradient)',
                                borderRadius: 'var(--radius-full)',
                                transition: 'width var(--transition-base)'
                            }}></div>
                        </div>
                    </div>

                    <div className="result-section">
                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Recent Activity</h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Lisinopril</strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Today, 8:00 AM</span>
                                </div>
                                <span className="badge badge-success">Taken</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Metformin</strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Today, 8:30 AM</span>
                                </div>
                                <span className="badge badge-success">Taken</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Metformin</strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Yesterday, 8:30 PM</span>
                                </div>
                                <span className="badge badge-warning">Skipped</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            💡 <strong>Tip:</strong> Log your medications as you take them to maintain accurate adherence records.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
