import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DashboardLayout } from "./components/layout/DashboardLayout"
import { Dashboard } from "./pages/Dashboard"
import { Landing } from "./pages/Landing"
import { Tickets } from './pages/Tickets'
import { Orders } from './pages/Orders'
import { Attendees } from './pages/Attendees'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Landing />} />

        <Route path='/dashboard' element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path='tickets' element={<Tickets />} />
          <Route path='orders' element={<Orders />} />
          <Route path='attendees' element={<Attendees />} />
        </Route>

        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
