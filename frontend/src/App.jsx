import { useState } from 'react'
import Dashboard from './components/Dashboard'
import ClinicalNoteAnalyzer from './components/ClinicalNoteAnalyzer'
import PrescriptionScanner from './components/PrescriptionScanner'
import DrugInteractionChecker from './components/DrugInteractionChecker'
import MedicationManager from './components/MedicationManager'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [serviceStatus, setServiceStatus] = useState('checking')

  // Check service health on mount
  useState(() => {
    const checkServices = async () => {
      try {
        const response = await fetch('/api/health')
        setServiceStatus(response.ok ? 'healthy' : 'error')
      } catch (error) {
        console.error('Service check failed:', error)
        setServiceStatus('error')
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
              <div className={`status-dot ${serviceStatus}`}></div>
              <span>System Status</span>
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
