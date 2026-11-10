from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

FREE_PARKING_LIMIT_HOURS = 3
HOURLY_RATE = 10.0

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///parking.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


db = SQLAlchemy(app)


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), default='driver')
    vehicle_plate = db.Column(db.String(30), default='')
    status = db.Column(db.String(20), default='active')
    bookings = db.relationship('Booking', backref='user', lazy=True)


class Spot(db.Model):
    __tablename__ = 'spots'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(10), unique=True, nullable=False)
    spot_type = db.Column(db.String(20), default='Standard')
    status = db.Column(db.String(20), default='free')
    bookings = db.relationship('Booking', backref='spot', lazy=True)


class Booking(db.Model):
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    spot_id = db.Column(db.Integer, db.ForeignKey('spots.id'), nullable=False)
    start_time = db.Column(db.String(50), nullable=False)
    end_time = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.String(20), default='$0.00')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


def serialize_spot(spot):
    return {
        'id': spot.id,
        'name': spot.name,
        'type': spot.spot_type,
        'status': spot.status,
    }


def serialize_user(user):
    return {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'vehicle_plate': user.vehicle_plate,
        'status': user.status,
    }


def parse_booking_datetime(value):
    if not value:
        raise ValueError('Missing booking time')

    try:
        return datetime.fromisoformat(str(value))
    except ValueError as exc:
        raise ValueError('Invalid booking time format') from exc


def calculate_charge(start_time, end_time):
    start = parse_booking_datetime(start_time)
    end = parse_booking_datetime(end_time)

    duration_hours = (end - start).total_seconds() / 3600
    if duration_hours <= 0:
        raise ValueError('End time must be after start time')

    extra_hours = max(0.0, duration_hours - FREE_PARKING_LIMIT_HOURS)
    charge = round(extra_hours * HOURLY_RATE, 2)
    return charge, duration_hours


def serialize_booking(booking):
    return {
        'id': booking.id,
        'driver': booking.user.name if booking.user else 'Unknown',
        'spot': booking.spot.name if booking.spot else 'Unknown',
        'date': booking.start_time[:10] if len(booking.start_time) >= 10 else booking.start_time,
        'time': f"{booking.start_time[11:16]} - {booking.end_time[11:16]}" if 'T' in booking.start_time and 'T' in booking.end_time else f"{booking.start_time} - {booking.end_time}",
        'amount': booking.amount,
        'charge': float(booking.amount.replace('$', '')) if booking.amount and booking.amount.startswith('$') else 0.0,
    }


def seed_data():
    if User.query.count() == 0:
        admin = User(name='Nina Thomas', email='admin@park.com', password='admin123', role='admin', vehicle_plate='N/A')
        driver = User(name='Daniel Okafor', email='driver@park.com', password='driver123', role='driver', vehicle_plate='KAA 230Z')
        db.session.add_all([admin, driver])

    if Spot.query.count() == 0:
        base_spots = [
            ('A1', 'Standard', 'free'), ('A2', 'Standard', 'occupied'), ('A3', 'VIP', 'reserved'), ('A4', 'Standard', 'free'),
            ('B1', 'EV', 'free'), ('B2', 'Standard', 'occupied'), ('B3', 'Disabled', 'reserved'), ('B4', 'Standard', 'free'),
            ('C1', 'Standard', 'occupied'), ('C2', 'EV', 'free'), ('C3', 'Standard', 'free'), ('C4', 'VIP', 'reserved'),
        ]
        for name, spot_type, status in base_spots:
            db.session.add(Spot(name=name, spot_type=spot_type, status=status))

    if Booking.query.count() == 0:
        driver_user = User.query.filter_by(email='driver@park.com').first()
        spot_a3 = Spot.query.filter_by(name='A3').first()
        spot_b1 = Spot.query.filter_by(name='B1').first()
        if driver_user and spot_a3:
            db.session.add(Booking(user_id=driver_user.id, spot_id=spot_a3.id, start_time='2026-11-09T09:00', end_time='2026-11-09T12:00', amount='$12.00'))
            spot_a3.status = 'reserved'
        if driver_user and spot_b1:
            db.session.add(Booking(user_id=driver_user.id, spot_id=spot_b1.id, start_time='2026-11-10T14:00', end_time='2026-11-10T17:00', amount='$15.00'))
            spot_b1.status = 'reserved'

    db.session.commit()


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    user = User.query.filter_by(email=email).first()
    if not user or user.password != password:
        return jsonify({'error': 'Invalid email or password'}), 401

    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'vehicle_plate': user.vehicle_plate,
    })


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    vehicle_plate = (data.get('vehicle_plate') or data.get('plate') or '').strip()

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists'}), 409

    user = User(name=name, email=email, password=password, role='driver', vehicle_plate=vehicle_plate)
    db.session.add(user)
    db.session.commit()

    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'vehicle_plate': user.vehicle_plate,
    }), 201


@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()
    if user:
        return jsonify({
            'success': True,
            'message': f'A password reset link has been sent to {user.email}.',
        })

    return jsonify({
        'success': True,
        'message': 'If that email is registered, a reset link has been sent.',
    })


@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    free_spots = Spot.query.filter_by(status='free').count()
    occupied_spots = Spot.query.filter_by(status='occupied').count()
    reserved_spots = Spot.query.filter_by(status='reserved').count()

    return jsonify({
        'totals': {
            'available': free_spots,
            'occupied': occupied_spots,
            'reserved': reserved_spots,
            'revenue': '$2,840',
        },
        'spots': [serialize_spot(spot) for spot in Spot.query.order_by(Spot.id).all()],
        'gate_logs': [
            {'vehicle': 'KAA 230Z', 'entry': '08:15', 'exit': '10:45', 'status': 'Completed'},
            {'vehicle': 'FST 897Q', 'entry': '09:10', 'exit': '12:50', 'status': 'Completed'},
            {'vehicle': 'KDG 111P', 'entry': '11:00', 'exit': 'Pending', 'status': 'Active'},
        ],
        'activity': [
            'Driver Daniel Okafor booked Spot A3 for 3 hours.',
            'Two EV slots were checked and marked available.',
            'Security camera synced with gate checkpoint at 08:42.',
            'Overstay warning sent to 1 driver.',
        ],
        'revenue_breakdown': [
            {'label': 'Today', 'value': '$2,840'},
            {'label': 'This week', 'value': '$18,940'},
            {'label': 'Monthly', 'value': '$74,120'},
        ],
    })


@app.route('/api/drivers', methods=['GET'])
def get_drivers():
    drivers = User.query.filter_by(role='driver').all()
    result = []
    for driver in drivers:
        result.append({
            'name': driver.name,
            'plate': driver.vehicle_plate,
            'status': driver.status.capitalize(),
            'balance': '$45.00' if driver.name == 'Daniel Okafor' else '$18.00',
        })
    return jsonify(result)


@app.route('/api/spots', methods=['GET'])
def get_spots():
    spots = Spot.query.order_by(Spot.id).all()
    return jsonify([serialize_spot(spot) for spot in spots])


@app.route('/api/spots/<int:spot_id>/status', methods=['POST'])
def update_status(spot_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get('status')
    if new_status not in {'free', 'occupied', 'reserved'}:
        return jsonify({'error': 'Invalid status'}), 400

    spot = Spot.query.get(spot_id)
    if not spot:
        return jsonify({'error': 'Spot not found'}), 404

    spot.status = new_status
    db.session.commit()
    return jsonify({'success': True, 'spot': serialize_spot(spot)})


@app.route('/api/bookings', methods=['GET', 'POST'])
def bookings():
    if request.method == 'GET':
        bookings = Booking.query.order_by(Booking.id.desc()).all()
        return jsonify([serialize_booking(booking) for booking in bookings])

    data = request.get_json(silent=True) or {}
    spot_id = data.get('spot_id')
    driver_email = (data.get('driver_email') or '').strip().lower()
    start_time = data.get('start_time') or '2026-11-09T09:00'
    end_time = data.get('end_time') or '2026-11-09T12:00'

    if not spot_id:
        return jsonify({'error': 'Spot is required'}), 400

    spot = Spot.query.filter_by(id=spot_id).first()
    if not spot:
        spot = Spot.query.filter_by(name=str(spot_id)).first()
    if not spot:
        return jsonify({'error': 'Spot not found'}), 404

    user = User.query.filter_by(email=driver_email).first()
    if not user:
        return jsonify({'error': 'Driver not found'}), 404

    if spot.status == 'occupied':
        return jsonify({'error': 'This spot is currently occupied'}), 409

    try:
        charge, duration_hours = calculate_charge(start_time, end_time)
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    amount = f'${charge:.2f}'
    booking = Booking(user_id=user.id, spot_id=spot.id, start_time=start_time, end_time=end_time, amount=amount)
    spot.status = 'reserved'
    db.session.add(booking)
    db.session.commit()
    return jsonify({
        'success': True,
        'booking': serialize_booking(booking),
        'charge': charge,
        'duration_hours': round(duration_hours, 2),
        'free_hours': FREE_PARKING_LIMIT_HOURS,
        'message': f'First {FREE_PARKING_LIMIT_HOURS} hours are free; you were charged ${charge:.2f} for extra time.' if charge > 0 else 'Your stay is within the free parking window.',
    })


@app.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    spot = Spot.query.get(booking.spot_id)
    if spot:
        spot.status = 'free'
    db.session.delete(booking)
    db.session.commit()
    return jsonify({'success': True})


with app.app_context():
    db.create_all()
    seed_data()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)