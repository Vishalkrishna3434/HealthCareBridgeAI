import { useState } from 'react'
import './App.css'
import config from './config'
import Dashboard from './components/Dashboard'
import ClinicalNoteAnalyzer from './components/ClinicalNoteAnalyzer'
import PrescriptionScanner from './components/PrescriptionScanner'
import DrugInteractionChecker from './components/DrugInteractionChecker'
import MedicationManager from './components/MedicationManager'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [serviceStatus, setServiceStatus] = useState({
    patient: 'checking',
    clinical: 'checking',
    ai: 'checking'
  })

  // Check service health on mount
  useState(() => {
    const checkServices = async () => {
      try {
        const checks = await Promise.allSettled([
          fetch(`${config.PATIENT_SERVICE_URL}/health`).then(r => r.json()),
          fetch(`${config.CLINICAL_SERVICE_URL}/health`).then(r => r.json()),
          fetch(`${config.AI_SERVICE_URL}/health`).then(r => r.json())
        ])

        setServiceStatus({
          patient: checks[0].status === 'fulfilled' ? 'healthy' : 'error',
          clinical: checks[1].status === 'fulfilled' ? 'healthy' : 'error',
          ai: checks[2].status === 'fulfilled' ? 'healthy' : 'error'
        })
      } catch (error) {
        console.error('Service check failed:', error)
      }
    }

    checkServices()
  }, [])

  const tabs = [
    { id: 'dashboard', label: '🏠 Dashboard', component: Dashboard },
    { id: 'clinical', label: '📝 Clinical Notes', component: ClinicalNoteAnalyzer },
    { id: 'prescription', label: '💊 Prescription Scanner', component: PrescriptionScanner },
    { id: 'interactions', label: '⚠️ Drug Interactions', component: DrugInteractionChecker },
    { id: 'medications', label: '📋 Medications', component: MedicationManager }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Dashboard

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">HealthBridge AI</h1>
          <div className="service-status">
            <div className="status-indicator">
              <div className={`status-dot ${serviceStatus.patient}`}></div>
              <span>Patient</span>
            </div>
            <div className="status-indicator">
              <div className={`status-dot ${serviceStatus.clinical}`}></div>
              <span>Clinical</span>
            </div>
            <div className="status-indicator">
              <div className={`status-dot ${serviceStatus.ai}`}></div>
              <span>AI</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="nav-tabs">
        <div className="tabs-container">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          <ActiveComponent />
        </div>
      </main>
    </div>
  )
}

export default App
