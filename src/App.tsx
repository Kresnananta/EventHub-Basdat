import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { DashboardLayout } from "./components/layout/DashboardLayout"
import { Dashboard } from "./pages/Dashboard"
import { Landing } from "./pages/Landing"
import { Tickets } from './pages/Tickets'
import { Orders } from './pages/Orders'
import { Attendees } from './pages/Attendees'
import { EventDetail } from './pages/EventDetail'
import { EventBooking } from './pages/EventBooking'
import { YourEvents } from './pages/YourEvents'
import { Login } from './pages/Login'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Landing />} />
          <Route path='/login' element={<Login />} />
          <Route path='/event/:eventId' element={<EventDetail />} />
          <Route path='/booking/:eventId/:ticketTypeId' element={<EventBooking />} />
          <Route path='/your-events' element={<YourEvents />} />

          <Route element={<ProtectedRoute />}>
            <Route path='/dashboard' element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path='tickets' element={<Tickets />} />
              <Route path='orders' element={<Orders />} />
              <Route path='attendees' element={<Attendees />} />
            </Route>
          </Route>

          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
