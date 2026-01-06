import { useState } from 'react'
import { api } from '../api'

export default function DrugInteractionChecker() {
    const [medications, setMedications] = useState([''])
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const addMedication = () => {
        setMedications([...medications, ''])
    }

    const removeMedication = (index) => {
        setMedications(medications.filter((_, i) => i !== index))
    }

    const updateMedication = (index, value) => {
        const newMeds = [...medications]
        newMeds[index] = value
        setMedications(newMeds)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const validMeds = medications.filter(med => med.trim())
        if (validMeds.length < 2) {
            setError('Please enter at least 2 medications to check for interactions')
            return
        }
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const data = await api.checkInteractions(validMeds)
            setResult(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const getSeverityBadge = (severity) => {
        const severityMap = {
            'high': 'badge-danger',
            'moderate': 'badge-warning',
            'low': 'badge-success',
            'minor': 'badge-success'
        }
        return severityMap[severity?.toLowerCase()] || 'badge-warning'
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Drug Interaction Checker</h1>
                <p className="page-description">
                    Check for potential drug-drug interactions and contraindications
                </p>
            </div>

            <div className="grid grid-2">
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>Medications</h3>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            {medications.map((med, index) => (
                                <div key={index} style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                    <div style={{ flex: 1 }}>
                                        <label htmlFor={`med-${index}`}>
                                            Medication {index + 1} {index < 2 && '*'}
                                        </label>
                                        <input
                                            id={`med-${index}`}
                                            type="text"
                                            placeholder="e.g., Aspirin, Lisinopril"
                                            value={med}
                                            onChange={(e) => updateMedication(index, e.target.value)}
                                        />
                                    </div>

                                    {medications.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeMedication(index)}
                                            className="btn btn-secondary"
                                            style={{ marginTop: '1.5rem', padding: 'var(--space-sm)' }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                            <button
                                type="button"
                                onClick={addMedication}
                                className="btn btn-secondary"
                            >
                                ➕ Add Medication
                            </button>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                                style={{ flex: 1 }}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Checking...
                                    </>
                                ) : (
                                    <>
                                        🔍 Check Interactions
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="error-message">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>Interaction Results</h3>

                    {result ? (
                        <div className="fade-in">
                            {result.interactions && result.interactions.length > 0 ? (
                                <div>
                                    <div className="success-message" style={{ marginBottom: 'var(--space-lg)' }}>
                                        Found {result.interactions.length} potential interaction(s)
                                    </div>

                                    {result.interactions.map((interaction, index) => (
                                        <div key={index} className="result-item" style={{ marginBottom: 'var(--space-md)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-sm)' }}>
                                                <h4 style={{ margin: 0, color: 'var(--primary-500)' }}>
                                                    {interaction.drug_a} ⚡ {interaction.drug_b}
                                                </h4>
                                                <span className={`badge ${getSeverityBadge(interaction.severity)}`}>
                                                    {interaction.severity || 'Unknown'}
                                                </span>
                                            </div>

                                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                {interaction.mechanism || 'Interaction detected'}
                                            </p>

                                            {interaction.recommendation && (
                                                <div style={{
                                                    marginTop: 'var(--space-sm)',
                                                    padding: 'var(--space-sm)',
                                                    background: 'var(--bg-primary)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    <strong>Recommendation:</strong> {interaction.recommendation}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="success-message">
                                    <strong>✓ No interactions found</strong>
                                    <p style={{ margin: 0, marginTop: 'var(--space-xs)' }}>
                                        The medications entered do not have any known interactions.
                                    </p>
                                </div>
                            )}

                            {result.warnings && result.warnings.length > 0 && (
                                <div className="error-message" style={{ marginTop: 'var(--space-lg)' }}>
                                    <strong>⚠️ Warnings:</strong>
                                    <ul style={{ margin: 'var(--space-sm) 0 0 var(--space-lg)' }}>
                                        {result.warnings.map((warning, index) => (
                                            <li key={index}>{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="result-section">
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                                Enter at least 2 medications and click "Check Interactions" to see results
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
