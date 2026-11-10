import pytest

from app import app, db, User, Spot


@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    with app.app_context():
        db.drop_all()
        db.create_all()
        admin = User(name='Nina Thomas', email='admin@park.com', password='admin123', role='admin', vehicle_plate='N/A')
        driver = User(name='Daniel Okafor', email='driver@park.com', password='driver123', role='driver', vehicle_plate='KAA 230Z')
        spot = Spot(name='A1', spot_type='Standard', status='free')
        db.session.add_all([admin, driver, spot])
        db.session.commit()
        yield app.test_client()
        db.drop_all()


def test_login_endpoint(client):
    response = client.post('/api/auth/login', json={
        'email': 'admin@park.com',
        'password': 'admin123'
    })

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['role'] == 'admin'
    assert payload['name'] == 'Nina Thomas'


def test_dashboard_endpoint(client):
    response = client.get('/api/dashboard')

    assert response.status_code == 200
    payload = response.get_json()
    assert 'totals' in payload
    assert 'spots' in payload


def test_driver_registration(client):
    response = client.post('/api/auth/register', json={
        'name': 'New Driver',
        'email': 'newdriver@park.com',
        'password': 'pass123',
        'vehicle_plate': 'XYZ 908A'
    })

    assert response.status_code == 201
    payload = response.get_json()
    assert payload['role'] == 'driver'
    assert payload['email'] == 'newdriver@park.com'


def test_free_window_and_overtime_charge(client):
    spot = Spot.query.filter_by(name='A1').first()
    response = client.post('/api/bookings', json={
        'driver_email': 'driver@park.com',
        'spot_id': spot.id,
        'start_time': '2026-11-09T09:00',
        'end_time': '2026-11-09T11:00',
    })
    assert response.status_code == 200
    payload = response.get_json()
    assert payload['charge'] == 0.0

    response = client.post('/api/bookings', json={
        'driver_email': 'driver@park.com',
        'spot_id': spot.id,
        'start_time': '2026-11-09T12:00',
        'end_time': '2026-11-09T16:00',
    })
    assert response.status_code == 200
    payload = response.get_json()
    assert payload['charge'] == 10.0
