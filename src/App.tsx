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
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { MyTickets } from './pages/MyTickets'
import { TicketDetail } from './pages/TicketDetail'
import { CheckIn } from './pages/CheckIn'
import { CreateEvent } from './pages/CreateEvent'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Landing />} />
          <Route path='/login' element={<Login />} />
          <Route path='/event/:eventId' element={<EventDetail />} />
          <Route path='/booking/:eventId/:ticketTypeId' element={<EventBooking />} />
          <Route path='/your-events' element={<Navigate to='/my-tickets' replace />} />
          <Route path='/my-tickets' element={<MyTickets />} />
          <Route path='/my-tickets/:ticketId' element={<TicketDetail />} />
          <Route path='/ticket/:ticketId' element={<TicketDetail />} />
          <Route path='/profile' element={<Profile />} />

          <Route element={<ProtectedRoute />}>
            <Route path='/dashboard' element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path='create-event' element={<CreateEvent />} />
              <Route path='tickets' element={<Tickets />} />
              <Route path='orders' element={<Orders />} />
              <Route path='attendees' element={<Attendees />} />
              <Route path='check-in' element={<CheckIn />} />
            </Route>
          </Route>

          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
