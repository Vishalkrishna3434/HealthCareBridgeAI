import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Layout from './Layout';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import ClinicalNoteAnalyzer from './components/ClinicalNoteAnalyzer';
import PrescriptionScanner from './components/PrescriptionScanner';
import DrugInteractionChecker from './components/DrugInteractionChecker';
import MedicationManager from './components/MedicationManager';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clinical" element={<ClinicalNoteAnalyzer />} />
              <Route path="/prescription" element={<PrescriptionScanner />} />
              <Route path="/interactions" element={<DrugInteractionChecker />} />
              <Route path="/medications" element={<MedicationManager />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
