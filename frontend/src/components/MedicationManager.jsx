import { useState, useEffect } from 'react'
import { fetchWithRetry } from '../utils/api'

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

    const PATIENT_URL = import.meta.env.VITE_PATIENT_SERVICE_URL || 'http://localhost:8080'

    // Load medications on mount
    useEffect(() => {
        fetchMedications()
    }, [])

    const fetchMedications = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetchWithRetry(`${PATIENT_URL}/medications`, {
                headers: {
                    'Authorization': 'Bearer valid_token'
                }
            })
            const data = await response.json()
            setMedications(data)
        } catch (err) {
            console.error('Failed to fetch medications:', err)
            setError('Failed to load medications: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAddMedication = async (e) => {
        e.preventDefault()
        setError(null)

        try {
            const response = await fetch(`${PATIENT_URL}/medications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer valid_token'
                },
                body: JSON.stringify(newMed)
            })

            if (!response.ok) throw new Error('Failed to add medication')

            fetchMedications() // Refresh list
            setNewMed({ name: '', dosage: '', frequency: '' })
            setShowAddForm(false)
        } catch (err) {
            setError(err.message)
        }
    }

    const logAdherence = async (medId, status) => {
        try {
            const response = await fetch(`${PATIENT_URL}/adherence`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer valid_token'
                },
                body: JSON.stringify({
                    medication_id: medId,
                    status: status,
                    timestamp: new Date().toISOString()
                })
            })

            if (response.ok) {
                alert(`Adherence logged: ${status}`)
            } else {
                throw new Error('Failed to log adherence')
            }
        } catch (err) {
            console.error('Failed to log adherence:', err)
            setError('Failed to log adherence: ' + err.message)
        }
    }

    const deleteMedication = (medId) => {
        setMedications(medications.filter(med => med.id !== medId))
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Medication Management</h1>
                <p className="page-description">
                    Track patient medications and log adherence events
                </p>
            </div>

            <div className="grid grid-2">
                {/* Medication List */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <h3 style={{ margin: 0 }}>Current Medications</h3>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="btn btn-primary"
                        >
                            {showAddForm ? '✕ Cancel' : '➕ Add Medication'}
                        </button>
                    </div>

                    {showAddForm && (
                        <form onSubmit={handleAddMedication} className="fade-in" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-lg)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                            <div className="form-group">
                                <label htmlFor="medName">Medication Name *</label>
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
                                <label htmlFor="dosage">Dosage *</label>
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
                                <label htmlFor="frequency">Frequency *</label>
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
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Adding...
                                    </>
                                ) : (
                                    'Add Medication'
                                )}
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

                                            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => logAdherence(med.id, 'taken')}
                                                    className="btn btn-primary"
                                                    style={{ fontSize: '0.75rem', padding: 'var(--space-xs) var(--space-sm)' }}
                                                >
                                                    ✓ Taken
                                                </button>
                                                <button
                                                    onClick={() => logAdherence(med.id, 'skipped')}
                                                    className="btn btn-secondary"
                                                    style={{ fontSize: '0.75rem', padding: 'var(--space-xs) var(--space-sm)' }}
                                                >
                                                    ⊘ Skipped
                                                </button>
                                                <button
                                                    onClick={() => deleteMedication(med.id)}
                                                    className="btn btn-secondary"
                                                    style={{ fontSize: '0.75rem', padding: 'var(--space-xs) var(--space-sm)', marginLeft: 'auto' }}
                                                >
                                                    🗑️ Delete
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
                <div className="card">
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
