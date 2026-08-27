import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import HostPage from './pages/HostPage.jsx'
import JoinPage from './pages/JoinPage.jsx'
import ContestantPage from './pages/ContestantPage.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'

export default function App() {
  return (
    <div className="min-h-full">
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/host" element={<HostPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/play/:code" element={<ContestantPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
