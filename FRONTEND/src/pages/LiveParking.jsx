import { useState, useEffect } from 'react'
import StatsBar from '../components/StatsBar'
import ParkingGrid from '../components/ParkingGrid'
import BookingModal from '../components/BookingModal'

export default function LiveParking() {
  const [spots, setSpots] = useState([]) // Start empty, fetch from backend
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [loading, setLoading] = useState(true)

  // 1. Fetch data from Python when page loads
  useEffect(() => {
    fetch('http://localhost:5000/api/spots')
      .then(res => res.json())
      .then(data => {
        setSpots(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching spots:", err)
        setLoading(false)
      })
  }, [])

  // 2. Handle booking a spot
  const handleConfirm = async (booking) => {
    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      })
      
      if (!response.ok) throw new Error("Failed to save")

      setSpots(prev =>
        prev.map(s => s.id === booking.spot_id ? { ...s, status: 'reserved' } : s)
      )
      alert(`Booked spot ${selectedSpot.spot_number} for ${booking.user_name}`)
      setSelectedSpot(null)
    } catch (err) {
      alert("Failed to connect to backend!")
      console.error(err)
    }
  }

  // 3. Simulate Hardware Sensor
  const simulateHardware = async () => {
    const freeSpot = spots.find(s => s.status === 'free')
    if (!freeSpot) return alert("Parking lot is full!")

    try {
      await fetch(`http://localhost:5000/api/spots/${freeSpot.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'occupied' })
      })

      setSpots(prev => prev.map(s => s.id === freeSpot.id ? { ...s, status: 'occupied' } : s))
      alert(`🔴 Hardware Sensor: Car detected in spot ${freeSpot.spot_number}!`)
    } catch (err) {
      alert("Hardware simulation failed")
    }
  }

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Loading parking spots...</h2>

  return (
    <main className="app-main">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Live Parking Availability</h2>
        
        {/* Hardware Simulation Button */}
        <button 
          onClick={simulateHardware}
          style={{ padding: '10px 16px', background: '#1E293B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🚗 Simulate Hardware Sensor
        </button>
      </div>

      <StatsBar spots={spots} />
      <ParkingGrid spots={spots} onSpotClick={setSelectedSpot} />
      
      {selectedSpot && (
        <BookingModal
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          onConfirm={handleConfirm}
        />
      )}
    </main>
  )
}