import os
import hashlib
from cryptography.fernet import Fernet

# In a real app, this key would be securely stored in an environment variable
# and definitely NOT generated on the fly or hardcoded here. 
# We'll use a fixed key for the hackathon prototype so it works consistently.
# To generate a new one: Fernet.generate_key()
SECRET_KEY = b'v-9R_O7wLQ6XqjLxX6dGqgYtJ_Q5Htz1C-6zZ5y-_sU='
cipher_suite = Fernet(SECRET_KEY)

def generate_file_hash(file_data):
    """Generates a SHA256 hash for file integrity."""
    sha256_hash = hashlib.sha256()
    sha256_hash.update(file_data)
    return sha256_hash.hexdigest()

def encrypt_file(file_data):
    """Encrypts file data using AES (Fernet)."""
    encrypted_data = cipher_suite.encrypt(file_data)
    return encrypted_data

def decrypt_file(encrypted_data):
    """Decrypts file data using AES (Fernet)."""
    decrypted_data = cipher_suite.decrypt(encrypted_data)
    return decrypted_data
