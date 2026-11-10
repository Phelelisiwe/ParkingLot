import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = 'http://localhost:5000/api'

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed')
  }

  return payload
}

function App() {
  const [auth, setAuth] = useState({ isLoggedIn: false, role: null, name: '', email: '' })
  const [dashboard, setDashboard] = useState({ totals: {}, spots: [], gate_logs: [], activity: [], revenue_breakdown: [] })
  const [bookings, setBookings] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(false)

  const refreshData = async () => {
    try {
      setLoading(true)
      const [dashboardData, bookingsData, driversData] = await Promise.all([
        apiRequest('/dashboard'),
        apiRequest('/bookings'),
        apiRequest('/drivers'),
      ])

      setDashboard(dashboardData)
      setBookings(bookingsData)
      setDrivers(driversData)
    } catch (error) {
      console.error('Failed to refresh data', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (auth.isLoggedIn) {
      refreshData()
    }
  }, [auth.isLoggedIn])

  const handleLogin = async (email, password, role) => {
    const payload = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    })

    setAuth({
      isLoggedIn: true,
      role: payload.role,
      name: payload.name,
      email: payload.email,
    })
    return payload
  }

  const handleRegister = async (form) => {
    const payload = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(form),
    })
    return payload
  }

  const handleLogout = () => {
    setAuth({ isLoggedIn: false, role: null, name: '', email: '' })
  }

  const reserveSpot = async (spotId, hours = 2) => {
    const start = new Date()
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000)

    const payload = await apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        spot_id: spotId,
        driver_email: auth.email,
        start_time: start.toISOString().slice(0, 16),
        end_time: end.toISOString().slice(0, 16),
      }),
    })

    await refreshData()
    return payload
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={
            auth.isLoggedIn ? (
              <Navigate to={auth.role === 'admin' ? '/admin' : '/driver'} replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />

        <Route
          path="/register"
          element={
            auth.isLoggedIn ? (
              <Navigate to={auth.role === 'admin' ? '/admin' : '/driver'} replace />
            ) : (
              <RegisterPage onRegister={handleRegister} />
            )
          }
        />

        <Route
          path="/admin/*"
          element={
            auth.isLoggedIn && auth.role === 'admin' ? (
              <AdminLayout userName={auth.name} onLogout={handleLogout} dashboard={dashboard} drivers={drivers} loading={loading} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/driver/*"
          element={
            auth.isLoggedIn && auth.role === 'driver' ? (
              <DriverLayout
                userName={auth.name}
                onLogout={handleLogout}
                spots={dashboard.spots}
                bookings={bookings}
                onReserve={reserveSpot}
                loading={loading}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-shell">
        <header className="landing-header">
          <div className="brand-badge">ParkFlow</div>
          <div className="brand-owner">Built by Andile Zulu</div>
          <nav className="landing-nav">
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </nav>
        </header>

        <section className="landing-hero">
          <div className="hero-video-layer">
            <video className="landing-bg-video" autoPlay muted loop playsInline poster="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80">
              <source src="/parking-bg-loop.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="landing-copy">
            <span className="eyebrow brand-eyebrow">Built by Andile Zulu</span>
            <h1>ParkFlow by Andile Zulu</h1>
            <p className="landing-text">
              A premium parking experience for malls and high-traffic facilities—bringing smarter access, seamless booking, and effortless management together in one modern platform.
            </p>

            <div className="cta-row">
              <Link to="/register" className="primary-btn">Create account</Link>
              <Link to="/login" className="secondary-btn">Login</Link>
            </div>

          </div>

        </section>

        <section className="feature-grid">
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Fast driver access</h3>
            <p>Drivers can register, log in, and reserve a bay in minutes without waiting in queues or circling the facility.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>Operational visibility</h3>
            <p>Admins see occupancy, bookings, and parking patterns in real time through a simplified control dashboard.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">💳</span>
            <h3>Smart charging logic</h3>
            <p>The system offers the first 3 hours free, then bills hourly after the free window to keep mall parking fair and manageable.</p>
          </div>
        </section>

        <section className="benefits-section">
          <div className="section-header">
            <p className="eyebrow">How it works</p>
            <h2>Built for customer convenience and operator control.</h2>
          </div>

          <div className="benefits-grid">
            <div className="benefit-box">
              <h4>1. Driver books online</h4>
              <p>Customers create an account, select a vehicle, and reserve available parking without stress.</p>
            </div>
            <div className="benefit-box">
              <h4>2. Staff monitors live data</h4>
              <p>Admins track bookings, remaining capacity, and activity across the parking lot from one central dashboard.</p>
            </div>
            <div className="benefit-box">
              <h4>3. Billing is automatic</h4>
              <p>Time is tracked intelligently, and overtime charges are applied only after the free 3-hour period ends.</p>
            </div>
          </div>
        </section>

        <section className="info-strip">
          <div className="info-strip-inner">
            <div>
              <span className="eyebrow">Why choose ParkFlow</span>
              <h3>Better parking experiences for mall visitors and management teams.</h3>
            </div>
            <ul>
              <li>Live parking status</li>
              <li>Driver and admin login flows</li>
              <li>Smart billing and free-hour rules</li>
              <li>Clean booking and reporting workflows</li>
            </ul>
          </div>
        </section>

        <section className="pricing-section">
          <div className="section-header centered-header">
            <p className="eyebrow">Simple pricing</p>
            <h2>Choose a plan that matches your parking operation.</h2>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <span className="pricing-tag">Starter</span>
              <h3>Essential</h3>
              <div className="price-row">
                <span className="price">$49</span>
                <span className="period">/ mo</span>
              </div>
              <ul>
                <li>Driver registration</li>
                <li>Basic booking dashboard</li>
                <li>Core occupancy tracking</li>
              </ul>
              <Link to="/register" className="secondary-btn pricing-btn">Get started</Link>
            </div>

            <div className="pricing-card featured-plan">
              <span className="pricing-tag">Most popular</span>
              <h3>Growth</h3>
              <div className="price-row">
                <span className="price">$99</span>
                <span className="period">/ mo</span>
              </div>
              <ul>
                <li>Everything in Essential</li>
                <li>Live admin controls</li>
                <li>Automated hourly billing</li>
              </ul>
              <Link to="/register" className="primary-btn pricing-btn">Start free trial</Link>
            </div>

            <div className="pricing-card">
              <span className="pricing-tag">Scale</span>
              <h3>Enterprise</h3>
              <div className="price-row">
                <span className="price">Custom</span>
                <span className="period">pricing</span>
              </div>
              <ul>
                <li>Multi-zone parking</li>
                <li>Advanced reporting</li>
                <li>Personalized support</li>
              </ul>
              <Link to="/register" className="secondary-btn pricing-btn">Talk to sales</Link>
            </div>
          </div>
        </section>

        <section className="testimonial-section">
          <div className="section-header centered-header">
            <p className="eyebrow">Customer feedback</p>
            <h2>Malls and facilities rely on ParkFlow to simplify movement.</h2>
          </div>

          <div className="testimonial-grid">
            <div className="testimonial-card">
              <p>“Our shoppers now find parking faster, and our team has a much clearer picture of occupancy and billing.”</p>
              <div className="person">
                <strong>Amelia Thompson</strong>
                <span>Operations Manager</span>
              </div>
            </div>

            <div className="testimonial-card">
              <p>“The free 3-hour model keeps visitors happy, while the admin dashboard gives us full control over the lot.”</p>
              <div className="person">
                <strong>David Njoroge</strong>
                <span>Mall Director</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('driver')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const payload = await onLogin(email, password, selectedRole)
      if (payload.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/driver')
      }
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setMessage('Enter your email first so we can send a reset link.')
      return
    }

    try {
      const payload = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setMessage(payload.message)
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="login-page auth-only">
      <div className="auth-visual-bg">
        <video autoPlay muted loop playsInline poster="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80">
          <source src="/parking-bg-loop.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="auth-panel auth-only-panel">
        <div className="auth-card">
          <div className="auth-header-row">
            <p className="eyebrow">Welcome back</p>
            <Link to="/" className="back-link">← Back</Link>
          </div>
          <h2>Login to your account</h2>

          <div className="role-toggle">
            <button type="button" className={selectedRole === 'driver' ? 'active' : ''} onClick={() => setSelectedRole('driver')}>Driver</button>
            <button type="button" className={selectedRole === 'admin' ? 'active' : ''} onClick={() => setSelectedRole('admin')}>Admin</button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </label>

            <label>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
            </label>

            <button type="submit" className="primary-btn full-width">Sign in</button>
          </form>

          <div className="inline-actions">
            <button type="button" className="ghost-btn" onClick={handleForgotPassword}>Forgot password?</button>
          </div>

          {message && <div className="error-box">{message}</div>}

          <div className="auth-links">
            <span>New driver?</span>
            <Link to="/register">Create an account</Link>
          </div>

          <div className="demo-box">
            <strong>Demo access</strong>
            <p>Driver: driver@park.com / driver123</p>
            <p>Admin: admin@park.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RegisterPage({ onRegister }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    vehicle_plate: '',
  })
  const [message, setMessage] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      await onRegister(form)
      navigate('/login')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="login-page auth-only">
      <div className="auth-visual-bg">
        <video autoPlay muted loop playsInline poster="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80">
          <source src="/signup-parking-loop.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="auth-panel auth-only-panel">
        <div className="auth-card">
          <div className="auth-header-row">
            <p className="eyebrow">Driver registration</p>
            <Link to="/" className="back-link">← Back</Link>
          </div>
          <h2>Create your account</h2>

          <form onSubmit={handleSubmit} className="register-form">
            <label>
              Full name
              <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Enter your full name" required />
            </label>

            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </label>

            <label>
              Password
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Create a password" required />
            </label>

            <label>
              Vehicle plate
              <input name="vehicle_plate" type="text" value={form.vehicle_plate} onChange={handleChange} placeholder="KAA 230Z" />
            </label>

            <button type="submit" className="primary-btn full-width">Register</button>
          </form>

          {message && <div className="error-box">{message}</div>}

          <div className="auth-links">
            <span>Already have an account?</span>
            <Link to="/login">Login here</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminLayout({ userName, onLogout, dashboard, drivers, loading }) {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div>
          <div className="logo">ParkFlow</div>
          <div className="user-pill">Admin • {userName}</div>
        </div>

        <nav className="nav-menu">
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>Dashboard</NavLink>
          <NavLink to="/admin/spots" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>Parking Map</NavLink>
          <NavLink to="/admin/drivers" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>Drivers</NavLink>
          <NavLink to="/admin/reports" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>Reports</NavLink>
        </nav>

        <button type="button" className="logout-btn" onClick={onLogout}>Logout</button>
      </aside>

      <main className="content-area">
        <Routes>
          <Route index element={<AdminDashboard dashboard={dashboard} />} />
          <Route path="spots" element={<AdminSpots spots={dashboard.spots} />} />
          <Route path="drivers" element={<AdminDrivers drivers={drivers} />} />
          <Route path="reports" element={<AdminReports dashboard={dashboard} />} />
        </Routes>
        {loading && <div className="loading-tag">Refreshing data...</div>}
      </main>
    </div>
  )
}

function DriverLayout({ userName, onLogout, spots, bookings, onReserve, loading }) {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div>
          <div className="logo">ParkFlow</div>
          <div className="user-pill">Driver • {userName}</div>
        </div>

        <nav className="nav-menu">
          <NavLink to="/driver" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>Overview</NavLink>
          <NavLink to="/driver/book" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>Book Spot</NavLink>
          <NavLink to="/driver/bookings" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>My Bookings</NavLink>
          <NavLink to="/driver/profile" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>Profile</NavLink>
        </nav>

        <button type="button" className="logout-btn" onClick={onLogout}>Logout</button>
      </aside>

      <main className="content-area">
        <Routes>
          <Route index element={<DriverDashboard bookings={bookings} />} />
          <Route path="book" element={<DriverBook spots={spots} onReserve={onReserve} />} />
          <Route path="bookings" element={<DriverBookings bookings={bookings} />} />
          <Route path="profile" element={<DriverProfile />} />
        </Routes>
        {loading && <div className="loading-tag">Refreshing data...</div>}
      </main>
    </div>
  )
}

function AdminDashboard({ dashboard }) {
  const totals = dashboard.totals || {}
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Admin dashboard</h1>
        </div>
        <button type="button" className="primary-btn">Export report</button>
      </header>

      <section className="stats-grid">
        <StatCard title="Available spots" value={String(totals.available || 0)} tone="green" />
        <StatCard title="Occupied bays" value={String(totals.occupied || 0)} tone="red" />
        <StatCard title="Reserved slots" value={String(totals.reserved || 0)} tone="amber" />
        <StatCard title="Revenue today" value={totals.revenue || '$0.00'} tone="blue" />
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="panel-header">
            <h3>Parking overview</h3>
            <span className="chip chip-success">Live</span>
          </div>
          <div className="spot-mini-grid">
            {(dashboard.spots || []).map((spot) => (
              <div key={spot.id} className={`spot-mini ${spot.status}`}>
                <span>{spot.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Revenue summary</h3>
            <span className="chip">Monthly</span>
          </div>
          <div className="revenue-list">
            {(dashboard.revenue_breakdown || []).map((item) => (
              <div key={item.label} className="revenue-item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel table-panel">
        <div className="panel-header">
          <h3>Latest gate activity</h3>
          <span className="chip">Updated</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(dashboard.gate_logs || []).map((entry, index) => (
              <tr key={`${entry.vehicle}-${index}`}>
                <td>{entry.vehicle}</td>
                <td>{entry.entry}</td>
                <td>{entry.exit}</td>
                <td><span className={entry.status === 'Completed' ? 'status-green' : 'status-amber'}>{entry.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}

function AdminSpots({ spots }) {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Control</p>
          <h1>Parking map</h1>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Live spot status</h3>
          <span className="chip chip-success">All sensors online</span>
        </div>
        <div className="parking-grid">
          {(spots || []).map((spot) => (
            <div key={spot.id} className={`parking-spot ${spot.status}`}>
              <span className="spot-name">{spot.name}</span>
              <span className="spot-type">{spot.type}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function AdminDrivers({ drivers }) {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Accounts</p>
          <h1>Driver management</h1>
        </div>
      </header>

      <section className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Plate</th>
              <th>Status</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {(drivers || []).map((driver) => (
              <tr key={driver.plate || driver.name}>
                <td>{driver.name}</td>
                <td>{driver.plate}</td>
                <td><span className={driver.status === 'Active' ? 'status-green' : 'status-amber'}>{driver.status}</span></td>
                <td>{driver.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}

function AdminReports({ dashboard }) {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Insights</p>
          <h1>System reports</h1>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard title="Peak occupancy" value="82%" tone="blue" />
        <StatCard title="Tickets issued" value="12" tone="amber" />
        <StatCard title="Avg. stay" value="2.6 hrs" tone="green" />
        <StatCard title="Guest entries" value="64" tone="red" />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Recent activity</h3>
        </div>
        <ul className="activity-list">
          {(dashboard.activity || []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </>
  )
}

function DriverDashboard({ bookings }) {
  const upcoming = bookings[0] || { spot: 'A3', time: '09:00 AM - 12:00 PM', date: '2026-11-09' }
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Welcome</p>
          <h1>Driver dashboard</h1>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard title="Bookings" value={String(bookings.length)} tone="blue" />
        <StatCard title="Available bays" value="08" tone="green" />
        <StatCard title="Pending fees" value="$0.00" tone="amber" />
        <StatCard title="Loyalty points" value="240" tone="red" />
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="panel-header">
            <h3>Upcoming reservation</h3>
            <span className="chip chip-success">Confirmed</span>
          </div>
          <div className="reservation-box">
            <h4>Spot {upcoming.spot}</h4>
            <p>{upcoming.date}</p>
            <p>{upcoming.time}</p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Quick actions</h3>
          </div>
          <div className="quick-actions">
            <button type="button" className="secondary-btn">Find parking</button>
            <button type="button" className="secondary-btn">Payment history</button>
            <button type="button" className="secondary-btn">Support</button>
          </div>
        </div>
      </section>
    </>
  )
}

function DriverBook({ spots, onReserve }) {
  const [durationHours, setDurationHours] = useState(2)

  const reserve = async (spot) => {
    if (spot.status !== 'free') return
    try {
      const response = await onReserve(spot.id, durationHours)
      alert(response.message || `Spot ${spot.name} reserved successfully.`)
    } catch (error) {
      alert(error.message)
    }
  }

  const chargePreview = durationHours > 3 ? (durationHours - 3) * 10 : 0

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Reserve</p>
          <h1>Book a parking slot</h1>
        </div>
      </header>

      <section className="panel booking-panel">
        <div className="booking-summary">
          <strong>Parking policy</strong>
          <p>First 3 hours are free. After that, the mall charges $10 per hour.</p>
        </div>

        <label className="duration-label">
          Booking hours
          <input
            type="range"
            min="1"
            max="12"
            value={durationHours}
            onChange={(event) => setDurationHours(Number(event.target.value))}
          />
          <span>{durationHours} hours</span>
        </label>

        <div className="charge-preview">
          Estimated cost: <strong>${chargePreview.toFixed(2)}</strong>
        </div>

        <div className="parking-grid compact">
          {(spots || []).map((spot) => (
            <div key={spot.id} className={`parking-spot ${spot.status}`}>
              <span className="spot-name">{spot.name}</span>
              <span className="spot-type">{spot.type}</span>
              {spot.status === 'free' ? (
                <button type="button" className="tiny-btn" onClick={() => reserve(spot)}>Reserve</button>
              ) : (
                <span className="slot-state">{spot.status}</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function DriverBookings({ bookings }) {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Trips</p>
          <h1>My bookings</h1>
        </div>
      </header>

      <section className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Spot</th>
              <th>Date</th>
              <th>Time</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(bookings || []).map((booking) => (
              <tr key={booking.id}>
                <td>{booking.spot}</td>
                <td>{booking.date}</td>
                <td>{booking.time}</td>
                <td>{booking.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}

function DriverProfile() {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>Account details</h1>
        </div>
      </header>

      <section className="profile-card panel">
        <div className="profile-row">
          <span>Name</span>
          <strong>Daniel Okafor</strong>
        </div>
        <div className="profile-row">
          <span>Email</span>
          <strong>daniel@parkflow.com</strong>
        </div>
        <div className="profile-row">
          <span>Vehicle</span>
          <strong>KAA 230Z</strong>
        </div>
        <div className="profile-row">
          <span>Status</span>
          <strong className="status-green">Verified</strong>
        </div>
      </section>
    </>
  )
}

function StatCard({ title, value, tone }) {
  return (
    <div className={`stat-card ${tone}`}>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  )
}

export default App
