from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root123",
        database="smart_parking"
    )

@app.route("/api/dashboard")
def dashboard():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.callproc("sp_dashboard_summary")
    for result in cursor.stored_results():
        data = result.fetchone()
    cursor.close()
    db.close()
    return jsonify(data)

@app.route("/api/slots")
def slots():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM parking_slots ORDER BY zone, slot_code")
    data = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(data)

@app.route("/api/available-slots")
def available_slots():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.callproc("sp_get_available_slots")
    for result in cursor.stored_results():
        data = result.fetchall()
    cursor.close()
    db.close()
    return jsonify(data)

@app.route("/api/active-entries")
def active_entries():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.callproc("sp_active_entries")
    for result in cursor.stored_results():
        data = result.fetchall()
    cursor.close()
    db.close()
    return jsonify(data)

@app.route("/api/entries")
def entries():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.callproc("sp_entry_log")
    for result in cursor.stored_results():
        data = result.fetchall()
    cursor.close()
    db.close()
    return jsonify(data)

@app.route("/api/payments")
def payments():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.callproc("sp_payment_history")
    for result in cursor.stored_results():
        data = result.fetchall()
    cursor.close()
    db.close()
    return jsonify(data)

@app.route("/api/zone-occupancy")
def zone_occupancy():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.callproc("sp_zone_occupancy")
    for result in cursor.stored_results():
        data = result.fetchall()
    cursor.close()
    db.close()
    return jsonify(data)

@app.route("/api/recent-activity")
def recent_activity():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.callproc("sp_recent_activity")
    for result in cursor.stored_results():
        data = result.fetchall()
    cursor.close()
    db.close()
    return jsonify(data)

@app.route("/api/entry", methods=["POST"])
def vehicle_entry():
    data = request.json
    db = get_db()
    cursor = db.cursor()
    cursor.callproc("sp_vehicle_entry", [
        data["vehicle_no"],
        data["vehicle_type"],
        data["owner_name"],
        data["slot_code"]
    ])
    db.commit()
    cursor.close()
    db.close()
    return jsonify({"success": True, "message": "Vehicle entry recorded"})

@app.route("/api/exit", methods=["POST"])
def vehicle_exit():
    data = request.json
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.callproc("sp_vehicle_exit", [
        data["vehicle_no"],
        data["payment_method"]
    ])
    db.commit()
    result = {}
    for r in cursor.stored_results():
        result = r.fetchone()
    cursor.close()
    db.close()
    return jsonify({"success": True, "data": result})

@app.route("/api/users")
def users():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT user_id, name, email, role, created_at FROM users")
    data = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(data)

@app.route("/api/bookings")
def bookings():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM bookings ORDER BY booking_time DESC")
    data = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(data)

@app.route("/api/revenue")
def revenue():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.callproc("sp_revenue_summary")
    for result in cursor.stored_results():
        data = result.fetchone()
    cursor.close()
    db.close()
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True, port=5000)