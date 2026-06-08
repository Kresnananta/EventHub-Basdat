import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AdminRoute } from './components/layout/AdminRoute'
import { DashboardLayout } from "./components/layout/DashboardLayout"
import { Dashboard } from "./pages/Dashboard"
import { Events } from "./pages/Events"
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
import { EditEvent } from './pages/EditEvent'
import { Venues } from './pages/Venues'
import { NotFound } from './pages/NotFound'
import { RoleManagement } from './pages/RoleManagement'

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
              <Route path='events' element={<Events />} />
              <Route path='events/:eventId/edit' element={<EditEvent />} />
              <Route path='create-event' element={<CreateEvent />} />
              <Route path='tickets' element={<Tickets />} />
              <Route path='orders' element={<Orders />} />
              <Route path='attendees' element={<Attendees />} />
              <Route path='check-in' element={<CheckIn />} />
              <Route element={<AdminRoute />}>
                <Route path='venues' element={<Venues />} />
                <Route path='roles' element={<RoleManagement />} />
              </Route>
            </Route>
          </Route>

          <Route path='*' element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
