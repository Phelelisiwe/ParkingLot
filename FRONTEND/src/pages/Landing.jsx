import { Link } from 'react-router-dom'
import './Landing.css'

export default function Landing() {
  return (
    <div className="landing-container">
      <div className="hero-content">
        <h1>Find & Reserve Your Parking Spot</h1>
        <p>Real-time availability · Easy booking · Stress-free parking</p>
        <Link to="/parking" className="cta-button">
          View Available Spots
        </Link>
      </div>

      <div className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <span>1️⃣</span>
            <h3>Pick Spot</h3>
            <p>Check our live grid for free spaces.</p>
          </div>
          <div className="step">
            <span>2️⃣</span>
            <h3>Reserve</h3>
            <p>Enter your name and time to book it.</p>
          </div>
          <div className="step">
            <span>3️⃣</span>
            <h3>Park</h3>
            <p>Arrive and park in your reserved spot.</p>
          </div>
        </div>
      </div>
    </div>
  )
}