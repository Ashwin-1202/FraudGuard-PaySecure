import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { ToastProvider } from './components/ToastContext'
import Overview from './pages/Overview'
import Transactions from './pages/Transactions'
import TransactionDetail from './pages/TransactionDetail'
import Alerts from './pages/Alerts'
import InvestigationQueue from './pages/InvestigationQueue'
import InvestigationDetail from './pages/InvestigationDetail'
import Cases from './pages/Cases'
import Analytics from './pages/Analytics'
import FraudInsights from './pages/FraudInsights'
import AnalyzeTransaction from './pages/AnalyzeTransaction'
import SystemStatusPage from './pages/SystemStatus'
import ModelMonitoring from './pages/ModelMonitoring'
import ConceptDrift from './pages/ConceptDrift'
import ModelComparison from './pages/ModelComparison'
import ThresholdOptimization from './pages/ThresholdOptimization'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Overview />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/:id" element={<TransactionDetail />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/investigations" element={<InvestigationQueue />} />
            <Route path="/investigations/:id" element={<InvestigationDetail />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/insights" element={<FraudInsights />} />
            <Route path="/analyze" element={<AnalyzeTransaction />} />
            <Route path="/system" element={<SystemStatusPage />} />
            <Route path="/model-monitoring" element={<ModelMonitoring />} />
            <Route path="/concept-drift" element={<ConceptDrift />} />
            <Route path="/model-comparison" element={<ModelComparison />} />
            <Route path="/threshold-optimization" element={<ThresholdOptimization />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
