# 🅿️ Smart Parking Lot System

A full-stack web application designed to monitor and manage parking spaces in real-time. Built for a school project.

## 🛠️ Tech Stack
- **Frontend:** React (Vite), React Router, CSS
- **Backend:** Python (Flask), Flask-SQLAlchemy
- **Database:** SQLite (local `parking.db` file)
- **Hardware (Planned):** ESP32 + Infrared Sensors to detect cars

## ✨ Features
- **Live Parking Grid:** View available (green), occupied (red), and reserved (yellow) spots.
- **Booking System:** Users can reserve a spot by entering their name and time.
- **Hardware Simulation:** A button that mimics a hardware sensor detecting a car and marking the spot as occupied.
- **My Bookings:** Users can view and cancel their active reservations.
- **Automatic Database Sync:** The database updates automatically when a user books or cancels.

## 🚀 How to Run Locally

### 1. Start the Backend (Python)
```bash
cd BACKEND
pip install flask flask-cors flask-sqlalchemy
python app.py