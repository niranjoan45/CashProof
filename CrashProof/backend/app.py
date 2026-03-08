import os
import json
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from models import db, Incident, User
from werkzeug.security import generate_password_hash, check_password_hash
from security import generate_file_hash, encrypt_file, decrypt_file
from ml_model import predict_accident_severity, load_model

app = Flask(__name__)
CORS(app) # Enable CORS for frontend testing

# Configure SQLite DB
basedir = os.path.abspath(os.path.dirname(__name__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'crashproof.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Ensure upload directory exists
UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize DB and Model
with app.app_context():
    db.create_all()
    load_model() # Ensure model is trained on startup

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({"status": "Backend is running!"})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing required fields"}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already exists"}), 409

    hashed_password = generate_password_hash(data['password'])
    new_user = User(name=data['name'], email=data['email'], password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully", "user_id": new_user.id}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400

    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password_hash, data['password']):
        # For a hackathon, returning user_id is a simple session mock
        return jsonify({"message": "Login successful", "user_id": user.id, "name": user.name}), 200
    
    return jsonify({"error": "Invalid email or password"}), 401

@app.route('/api/predict', methods=['POST'])
def predict_accident():
    """Analyzes recent sensor data window to detect an accident."""
    data = request.json
    if not data or 'features' not in data:
        return jsonify({"error": "Missing sensor 'features' list"}), 400
    
    features = data['features']
    if len(features) != 6:
        return jsonify({"error": "Expected 6 features [acc_x, acc_y, acc_z, gyro, sound, dur]"}), 400

    severity = predict_accident_severity(features)
    
    # Map raw severity int to string for frontend
    severity_map = {0: "Normal", 1: "Minor", 2: "Severe"}
    
    return jsonify({
        "severity_level": severity,
        "severity_desc": severity_map.get(severity, "Unknown")
    })

@app.route('/api/report_incident', methods=['POST'])
def report_incident():
    """Records an incident and handles evidence upload via multipart/form-data."""
    user_id = request.form.get('user_id', type=int)
    severity = request.form.get('severity', type=int)
    latitude = request.form.get('latitude', type=float)
    longitude = request.form.get('longitude', type=float)
    
    if severity is None or user_id is None:
        return jsonify({"error": "Missing severity or user_id"}), 400

    incident = Incident(
        user_id=user_id,
        severity=severity,
        latitude=latitude,
        longitude=longitude
    )
    
    # Handle video/audio evidence if present
    file = request.files.get('evidence_file')
    if file:
        file_data = file.read()
        
        # 1. Generate SHA256 Hash for integrity
        file_hash = generate_file_hash(file_data)
        
        # 2. Encrypt the file using AES
        encrypted_data = encrypt_file(file_data)
        
        # 3. Save locally
        filename = f"incident_{file_hash[:8]}.enc"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        with open(filepath, 'wb') as f:
            f.write(encrypted_data)
            
        incident.has_evidence = True
        incident.evidence_filename = filename
        incident.evidence_hash = file_hash

    db.session.add(incident)
    db.session.commit()
    
    # Mock sending emergency alerts
    if severity >= 1:
        print(f"🚨 ALERT DISPATCHED 🚨 -> Severity: {severity}, Loc: {latitude},{longitude}")

    return jsonify({"message": "Incident reported via CrashProof", "incident": incident.to_dict()}), 201

@app.route('/api/history', methods=['GET'])
def get_history():
    """Fetch user's accident history."""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
         return jsonify({"error": "Missing user_id parameter"}), 400
         
    incidents = Incident.query.filter_by(user_id=user_id).order_by(Incident.timestamp.desc()).all()
    return jsonify([i.to_dict() for i in incidents])

@app.route('/api/evidence/<int:incident_id>', methods=['GET'])
def get_evidence(incident_id):
    """Serves the decrypted evidence file for an incident."""
    incident = Incident.query.get_or_404(incident_id)
    if not incident.has_evidence or not incident.evidence_filename:
        return jsonify({"error": "No evidence for this incident"}), 404
        
    filepath = os.path.join(UPLOAD_FOLDER, incident.evidence_filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "Evidence file not found on disk"}), 404
        
    with open(filepath, 'rb') as f:
        encrypted_data = f.read()
        
    # Decrypt
    try:
        decrypted_data = decrypt_file(encrypted_data)
    except Exception as e:
        return jsonify({"error": "Failed to decrypt evidence (corrupted/tampered)"}), 500
        
    # Verify hash integrity
    current_hash = generate_file_hash(decrypted_data)
    if current_hash != incident.evidence_hash:
        return jsonify({"error": "EVIDENCE TAMPERED: Integrity hash mismatch!"}), 403

    # Save temporary decrypted file to send (in production, stream directly from memory if possible)
    temp_filepath = os.path.join(UPLOAD_FOLDER, f"temp_{incident.evidence_filename}.mp4")
    with open(temp_filepath, 'wb') as f:
        f.write(decrypted_data)
        
    return send_file(temp_filepath, as_attachment=False)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
