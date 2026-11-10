import { useState } from 'react'
import './BookingModal.css'

export default function BookingModal({ spot, onClose, onConfirm }) {
  const [name, setName] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !start || !end) return
    onConfirm({ user_name: name, spot_id: spot.id, start_time: start, end_time: end })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book Spot {spot.spot_number}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Your Name
            <input value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label>
            Start Time
            <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} required />
          </label>
          <label>
            End Time
            <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} required />
          </label>
          <button type="submit" className="confirm-btn">Confirm Booking</button>
        </form>
      </div>
    </div>
  )
}