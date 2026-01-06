import { useState, useEffect } from 'react'
import { api } from './api'
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
  useEffect(() => {
    const checkServices = async () => {
      const services = ['patient', 'clinical', 'ai'];
      const results = {};

      for (const service of services) {
        const status = await api.checkHealth(service);
        results[service] = status.status === 'healthy' ? 'healthy' : 'error';
      }

      setServiceStatus(results);
    };

    checkServices()
  }, [])

  const tabs = [
    { id: 'dashboard', label: 'Executive Overview', component: Dashboard },
    { id: 'clinical', label: 'Clinical Intelligence', component: ClinicalNoteAnalyzer },
    { id: 'prescription', label: 'Smart Scanner', component: PrescriptionScanner },
    { id: 'interactions', label: 'Safety Guard', component: DrugInteractionChecker },
    { id: 'medications', label: 'Patient Care', component: MedicationManager }
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
