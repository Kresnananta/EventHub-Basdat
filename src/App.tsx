import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DashboardLayout } from "./components/layout/DashboardLayout"
import { Dashboard } from "./pages/Dashboard"
import { Landing } from "./pages/Landing"
import { Tickets } from './pages/Tickets'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Landing />} />

        <Route path='/dashboard' element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path='tickets' element={<Tickets />} />
        </Route>

        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
