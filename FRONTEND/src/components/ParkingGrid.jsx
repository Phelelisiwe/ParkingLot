import SpotCard from './SpotCard'
import './ParkingGrid.css'

export default function ParkingGrid({ spots, onSpotClick }) {
  return (
    <div className="parking-grid">
      {spots.map(spot => (
        <SpotCard key={spot.id} spot={spot} onClick={onSpotClick} />
      ))}
    </div>
  )
}