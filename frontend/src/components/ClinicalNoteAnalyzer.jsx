import { useState } from 'react'

export default function ClinicalNoteAnalyzer() {
    const [formData, setFormData] = useState({
        patientId: '',
        noteText: '',
        noteDate: ''
    })
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setResult(null)

        const AI_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8082'

        try {
            const response = await fetch(`${AI_URL}/analyze-note`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: formData.patientId,
                    note_text: formData.noteText,
                    note_date: formData.noteDate || null
                })
            })

            if (!response.ok) throw new Error('Analysis failed')

            const data = await response.json()
            setResult(data)

            // Simultaneously fetch coaching
            if (data.extracted_entities?.medications?.length > 0) {
                fetchCoaching(data)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchCoaching = async (analysisData) => {
        const AI_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8082'
        try {
            const coachingResponse = await fetch(`${AI_URL}/generate-coaching`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    age: 45, // Mock patient context
                    medications: analysisData.extracted_entities.medications,
                    barriers: analysisData.adherence_insights?.barriers_identified || []
                })
            })
            if (coachingResponse.ok) {
                const coachingData = await coachingResponse.json()
                setResult(prev => ({ ...prev, coaching: coachingData.coaching_messages }))
            }
        } catch (err) {
            console.error('Coaching fetch failed:', err)
        }
    }

    const handleDeIdentify = async () => {
        setLoading(true)
        setError(null)
        const AI_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8082'
        try {
            const response = await fetch(`${AI_URL}/de-identify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: formData.patientId,
                    note_text: formData.noteText
                })
            })
            if (!response.ok) throw new Error('De-identification failed')
            const data = await response.json()
            setResult(prev => ({ ...prev, deIdentifiedText: data.de_identified_text }))
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Clinical Note Analyzer</h1>
                <p className="page-description">
                    Extract medical entities, conditions, medications, and generate FHIR resources from clinical notes
                </p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="patientId">Patient ID *</label>
                            <input
                                id="patientId"
                                type="text"
                                required
                                placeholder="e.g., PT-12345"
                                value={formData.patientId}
                                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="noteDate">Note Date</label>
                            <input
                                id="noteDate"
                                type="date"
                                value={formData.noteDate}
                                onChange={(e) => setFormData({ ...formData, noteDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="noteText">Clinical Note *</label>
                        <textarea
                            id="noteText"
                            required
                            placeholder="Enter clinical note text here... 

Example:
Patient presents with chest pain and shortness of breath. History of hypertension. 
Prescribed Lisinopril 10mg daily and Aspirin 81mg daily."
                            value={formData.noteText}
                            onChange={(e) => setFormData({ ...formData, noteText: e.target.value })}
                            style={{ minHeight: '200px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    🔍 Analyze Clinical Note
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleDeIdentify}
                            className="btn btn-secondary"
                            disabled={loading || !formData.noteText}
                        >
                            🛡️ De-identify (HIPAA)
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="error-message">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {result && (
                    <div className="result-section fade-in">
                        <h3 style={{ marginBottom: 'var(--space-lg)' }}>Analysis Results</h3>

                        {/* Extracted Entities */}
                        {result.extracted_entities && (
                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <h4>Medical Intelligence extracted</h4>

                                {/* Conditions */}
                                {result.extracted_entities.conditions?.length > 0 && (
                                    <div style={{ marginBottom: 'var(--space-md)' }}>
                                        <h5 style={{ color: 'var(--text-secondary)' }}>Conditions</h5>
                                        <div className="grid grid-2">
                                            {result.extracted_entities.conditions.map((cond, i) => (
                                                <div key={i} className="result-item">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <strong>{cond.clinical_text}</strong>
                                                        <span className="badge badge-success">{cond.confidence}%</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {cond.icd_10} | {cond.severity}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Medications */}
                                {result.extracted_entities.medications?.length > 0 && (
                                    <div style={{ marginBottom: 'var(--space-md)' }}>
                                        <h5 style={{ color: 'var(--text-secondary)' }}>Medications</h5>
                                        <div className="grid grid-2">
                                            {result.extracted_entities.medications.map((med, i) => (
                                                <div key={i} className="result-item">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <strong>{med.drug_name}</strong>
                                                        <span className="badge badge-success">{med.confidence}%</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {med.dosage} {med.frequency}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Clinical Validations */}
                        {result.clinical_validations && (
                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <h4>Clinical Validations & Safety</h4>
                                {result.clinical_validations.safety_flags?.yellow_flags?.length > 0 && (
                                    <div className="warning-message" style={{ marginBottom: 'var(--space-md)' }}>
                                        <strong>Warnings:</strong>
                                        <ul>
                                            {result.clinical_validations.safety_flags.yellow_flags.map((f, i) => <li key={i}>{f}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Adherence Insights */}
                        {result.adherence_insights && (
                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <h4>Adherence Insights</h4>
                                <div className="result-item" style={{ borderLeft: '4px solid var(--primary-500)' }}>
                                    <p><strong>Complexity Score:</strong> {result.adherence_insights.complexity_score}/5</p>
                                    {result.adherence_insights.barriers_identified?.length > 0 && (
                                        <p><strong>Barriers:</strong> {result.adherence_insights.barriers_identified.join(', ')}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* FHIR Bundle */}
                        {result.fhir_resources && (
                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <h4>FHIR R4 Bundle (Interoperability)</h4>
                                <div className="result-item">
                                    <pre style={{
                                        overflowX: 'auto',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)',
                                        maxHeight: '200px',
                                        background: 'var(--bg-secondary)',
                                        padding: 'var(--space-md)'
                                    }}>
                                        {JSON.stringify(result.fhir_resources, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* De-identified Text */}
                        {result.deIdentifiedText && (
                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <h4>De-identified Note (HIPAA Safe Harbor)</h4>
                                <div className="result-section" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--success-500)' }}>
                                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                                        {result.deIdentifiedText}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Adherence Coaching */}
                        {result.coaching && (
                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <h4>Personalized Patient Coaching</h4>
                                <div className="grid grid-2">
                                    {result.coaching.map((card, i) => (
                                        <div key={i} className="card" style={{ borderLeft: `4px solid ${card.importance === 'high' ? 'var(--danger-500)' : 'var(--primary-500)'}` }}>
                                            <p style={{ fontWeight: 600, color: 'var(--primary-500)', marginBottom: 'var(--space-xs)' }}>
                                                {card.medication}
                                            </p>
                                            <p style={{ fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>{card.message}</p>
                                            <span className="badge badge-success">{card.timing}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
