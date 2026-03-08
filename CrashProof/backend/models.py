from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    incidents = db.relationship('Incident', backref='user', lazy=True)

class Incident(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    severity = db.Column(db.Integer, nullable=False) # 1=Minor, 2=Severe
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    # Evidence details
    has_evidence = db.Column(db.Boolean, default=False)
    evidence_filename = db.Column(db.String(200), nullable=True)
    evidence_hash = db.Column(db.String(64), nullable=True) # SHA256 hash for integrity
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'timestamp': self.timestamp.isoformat(),
            'severity': self.severity,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'has_evidence': self.has_evidence,
            'evidence_filename': self.evidence_filename,
            'evidence_hash': self.evidence_hash
        }
