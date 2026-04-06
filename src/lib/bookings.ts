// Booking interfaces
export interface BookingItem {
  id: string
  eventId: string
  eventName: string
  ticketTypeId: string
  ticketName: string
  ticketPrice: number
  firstName: string
  lastName: string
  email: string
  phone: string
  quantity: number
  totalPrice: number
  bookingDate: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

// Get all bookings for current user
export const getBookings = (): BookingItem[] => {
  try {
    const bookings = localStorage.getItem('eventHubBookings')
    return bookings ? JSON.parse(bookings) : []
  } catch (error) {
    console.error('Error getting bookings:', error)
    return []
  }
}

// Add new booking
export const addBooking = (booking: Omit<BookingItem, 'id' | 'bookingDate' | 'status'>): BookingItem => {
  const bookings = getBookings()
  const newBooking: BookingItem = {
    ...booking,
    id: `BK-${Date.now()}`,
    bookingDate: new Date().toISOString(),
    status: 'confirmed'
  }
  bookings.push(newBooking)
  localStorage.setItem('eventHubBookings', JSON.stringify(bookings))
  return newBooking
}

// Get booking by ID
export const getBookingById = (id: string): BookingItem | undefined => {
  const bookings = getBookings()
  return bookings.find(b => b.id === id)
}

// Get bookings for specific event
export const getEventBookings = (eventId: string): BookingItem[] => {
  const bookings = getBookings()
  return bookings.filter(b => b.eventId === eventId)
}

// Cancel booking
export const cancelBooking = (id: string): boolean => {
  const bookings = getBookings()
  const booking = bookings.find(b => b.id === id)
  if (booking) {
    booking.status = 'cancelled'
    localStorage.setItem('eventHubBookings', JSON.stringify(bookings))
    return true
  }
  return false
}

// Delete booking
export const deleteBooking = (id: string): boolean => {
  const bookings = getBookings()
  const filteredBookings = bookings.filter(b => b.id !== id)
  if (filteredBookings.length < bookings.length) {
    localStorage.setItem('eventHubBookings', JSON.stringify(filteredBookings))
    return true
  }
  return false
}
