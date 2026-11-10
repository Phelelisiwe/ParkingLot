import './SpotCard.css'

export default function SpotCard({ spot, onClick }) {
  const icons = { free: '🟢', occupied: '🔴', reserved: '🟡' }

  return (
    <div
      className={`spot ${spot.status}`}
      onClick={() => spot.status === 'free' && onClick(spot)}
    >
      <div className="icon">{icons[spot.status]}</div>
      <div className="label">{spot.spot_number}</div>
    </div>
  )
}