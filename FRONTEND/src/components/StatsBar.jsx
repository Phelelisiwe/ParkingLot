import './StatsBar.css'

export default function StatsBar({ spots }) {
  const counts = {
    free: spots.filter(s => s.status === 'free').length,
    occupied: spots.filter(s => s.status === 'occupied').length,
    reserved: spots.filter(s => s.status === 'reserved').length,
  }

  return (
    <div className="stats-bar">
      <div className="stat free">
        <div className="num">{counts.free}</div>
        <div className="label">Free</div>
      </div>
      <div className="stat occupied">
        <div className="num">{counts.occupied}</div>
        <div className="label">Occupied</div>
      </div>
      <div className="stat reserved">
        <div className="num">{counts.reserved}</div>
        <div className="label">Reserved</div>
      </div>
    </div>
  )
}