import { useState, useRef } from 'react'
import { api } from '../api'

export default function PrescriptionScanner() {
    const [selectedFile, setSelectedFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setError(null)

            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file)
            setError(null)

            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedFile) return
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const data = await api.scanPrescription(selectedFile)
            setResult(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const clearFile = () => {
        setSelectedFile(null)
        setPreview(null)
        setResult(null)
        setError(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Prescription Scanner</h1>
                <p className="page-description">
                    Upload a prescription image to extract medication information using AI-powered OCR
                </p>
            </div>

            <div className="grid grid-2" style={{ gap: '2rem' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Upload Prescription</h3>

                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="file-upload-zone"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {preview ? (
                            <img
                                src={preview}
                                alt="Prescription preview"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '400px',
                                    borderRadius: '16px'
                                }}
                            />
                        ) : (
                            <>
                                <span className="icon">📄</span>
                                <p style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    Drag and drop an image here
                                </p>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                    or click to browse from system
                                </p>
                            </>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />

                    {selectedFile && (
                        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)' }}>
                            <button
                                onClick={handleSubmit}
                                className="btn-primary"
                                disabled={loading}
                                style={{ flex: 1 }}
                            >
                                {loading ? 'Scanning...' : '🔍 Scan Prescription'}
                            </button>

                            <button
                                onClick={clearFile}
                                className="tab-button"
                                style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)' }}
                                disabled={loading}
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </div>

                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Extracted Information</h3>

                    {result ? (
                        <div className="fade-in">
                            {result.medications && result.medications.length > 0 ? (
                                <div>
                                    {result.medications.map((med, index) => (
                                        <div key={index} className="result-item">
                                            <h4 style={{ color: 'var(--primary-500)', marginBottom: 'var(--space-sm)' }}>
                                                {med.name}
                                            </h4>
                                            {med.dosage && (
                                                <p style={{ marginBottom: 'var(--space-xs)' }}>
                                                    <strong>Dosage:</strong> {med.dosage}
                                                </p>
                                            )}
                                            {med.frequency && (
                                                <p style={{ marginBottom: 'var(--space-xs)' }}>
                                                    <strong>Frequency:</strong> {med.frequency}
                                                </p>
                                            )}
                                            {med.duration && (
                                                <p style={{ marginBottom: 'var(--space-xs)' }}>
                                                    <strong>Duration:</strong> {med.duration}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="result-section">
                                    <p style={{ color: 'var(--text-muted)' }}>
                                        No medications detected in the image. Please try a clearer image.
                                    </p>
                                </div>
                            )}

                            {result.raw_text && (
                                <div style={{ marginTop: 'var(--space-lg)' }}>
                                    <h4>Raw OCR Text</h4>
                                    <div className="result-section">
                                        <pre style={{
                                            whiteSpace: 'pre-wrap',
                                            fontSize: '0.875rem',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {result.raw_text}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="result-section">
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                                Upload and scan a prescription to see extracted information
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
