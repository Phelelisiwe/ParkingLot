import { Link, NavLink } from 'react-router-dom'
import './Header.css'

export default function Header() {
  return (
    <header className="app-header">
      <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
        <h1>🅿️ Smart Parking</h1>
      </Link>
      <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/parking">Live Parking</NavLink>
        <NavLink to="/bookings">My Bookings</NavLink>
      </nav>
    </header>
  )
}