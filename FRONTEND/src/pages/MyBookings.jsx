import { useState, useEffect } from 'react'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBookings = () => {
    fetch('http://localhost:5000/api/bookings')
      .then(res => res.json())
      .then(data => {
        setBookings(data)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleCancel = async (bookingId, spotNumber) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      // 1. Delete the booking
      await fetch(`http://localhost:5000/api/bookings/${bookingId}`, { method: 'DELETE' })
      
      // 2. Find the spot by number and set to free
      // (We fetch spots to find the correct ID)
      const res = await fetch('http://localhost:5000/api/spots')
      const spots = await res.json()
      const spot = spots.find(s => s.spot_number === spotNumber)

      if (spot) {
        await fetch(`http://localhost:5000/api/spots/${spot.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'free' })
        })
      }

      fetchBookings() // Refresh the list
    } catch (err) {
      alert("Failed to cancel booking")
    }
  }

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Loading bookings...</h2>

  return (
    <main className="app-main">
      <h2 style={{ marginBottom: '24px' }}>My Bookings</h2>
      
      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        bookings.map(booking => (
          <div key={booking.id} style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: 'var(--shadow)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Spot {booking.spot_number} <span style={{ fontSize: '14px', color: 'var(--reserved)', marginLeft: '10px' }}>🟡 Active</span></h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>👤 {booking.user_name}</p>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>📅 {booking.start_time.replace('T', ' ')} to {booking.end_time.replace('T', ' ')}</p>
            </div>
            <button 
              onClick={() => handleCancel(booking.id, booking.spot_number)} 
              style={{ background: '#EF4444', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}
            >
              Cancel Booking
            </button>
          </div>
        ))
      )}
    </main>
  )
}