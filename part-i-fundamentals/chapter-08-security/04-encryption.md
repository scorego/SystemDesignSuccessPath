# Encryption Fundamentals

## Introduction to Cryptography

Cryptography is the practice of securing information by transforming it into an unreadable format for unauthorized users while keeping it accessible to authorized parties. Understanding encryption is essential for protecting data in modern distributed systems.

## Types of Encryption

### Symmetric Encryption

**Definition**: Uses the same key for both encryption and decryption.

**Characteristics**:
- Fast and efficient for large amounts of data
- Key distribution challenge (how to securely share the key)
- Perfect for encrypting data at rest

**Common Algorithms**:
- **AES (Advanced Encryption Standard)**: Most widely used, supports 128, 192, 256-bit keys
- **ChaCha20**: Modern stream cipher, good for mobile devices
- **3DES**: Legacy, being phased out

**AES Encryption Example**:
```python
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
import os

class AESEncryption:
    def __init__(self, key=None):
        if key is None:
            self.key = os.urandom(32)  # 256-bit key
        else:
            self.key = key
    
    def encrypt(self, plaintext):
        # Generate random IV (Initialization Vector)
        iv = os.urandom(16)
        
        # Create cipher
        cipher = Cipher(algorithms.AES(self.key), modes.CBC(iv))
        encryptor = cipher.encryptor()
        
        # Pad the plaintext to be multiple of 16 bytes
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(plaintext.encode()) + padder.finalize()
        
        # Encrypt
        ciphertext = encryptor.update(padded_data) + encryptor.finalize()
        
        # Return IV + ciphertext (IV is not secret)
        return iv + ciphertext
    
    def decrypt(self, encrypted_data):
        # Extract IV and ciphertext
        iv = encrypted_data[:16]
        ciphertext = encrypted_data[16:]
        
        # Create cipher
        cipher = Cipher(algorithms.AES(self.key), modes.CBC(iv))
        decryptor = cipher.decryptor()
        
        # Decrypt
        padded_plaintext = decryptor.update(ciphertext) + decryptor.finalize()
        
        # Remove padding
        unpadder = padding.PKCS7(128).unpadder()
        plaintext = unpadder.update(padded_plaintext) + unpadder.finalize()
        
        return plaintext.decode()

# Usage example
aes = AESEncryption()
encrypted = aes.encrypt("Sensitive data here")
decrypted = aes.decrypt(encrypted)
print(f"Original: Sensitive data here")
print(f"Decrypted: {decrypted}")
```

### Asymmetric Encryption (Public Key Cryptography)

**Definition**: Uses a pair of keys - public key for encryption, private key for decryption.

**Characteristics**:
- Solves key distribution problem
- Slower than symmetric encryption
- Perfect for key exchange and digital signatures
- Enables secure communication without prior key sharing

**Common Algorithms**:
- **RSA**: Widely used, based on factoring large numbers
- **ECC (Elliptic Curve Cryptography)**: Smaller keys, same security level
- **Ed25519**: Modern, fast, secure

**RSA Implementation Example**:
```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

class RSAEncryption:
    def __init__(self):
        # Generate private key
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        self.public_key = self.private_key.public_key()
    
    def encrypt(self, plaintext):
        # Encrypt with public key
        ciphertext = self.public_key.encrypt(
            plaintext.encode(),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return ciphertext
    
    def decrypt(self, ciphertext):
        # Decrypt with private key
        plaintext = self.private_key.decrypt(
            ciphertext,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return plaintext.decode()
    
    def get_public_key_pem(self):
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

# Usage example
rsa_enc = RSAEncryption()
encrypted = rsa_enc.encrypt("Secret message")
decrypted = rsa_enc.decrypt(encrypted)
print(f"Decrypted: {decrypted}")
```

### Hybrid Encryption

**Concept**: Combines symmetric and asymmetric encryption to get benefits of both.

**Process**:
1. Generate random symmetric key
2. Encrypt data with symmetric key (fast)
3. Encrypt symmetric key with recipient's public key
4. Send both encrypted data and encrypted key

```python
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

class HybridEncryption:
    def __init__(self, recipient_public_key):
        self.recipient_public_key = recipient_public_key
    
    def encrypt(self, plaintext):
        # Generate random symmetric key
        symmetric_key = Fernet.generate_key()
        
        # Encrypt data with symmetric key
        f = Fernet(symmetric_key)
        encrypted_data = f.encrypt(plaintext.encode())
        
        # Encrypt symmetric key with public key
        encrypted_key = self.recipient_public_key.encrypt(
            symmetric_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        return {
            'encrypted_data': encrypted_data,
            'encrypted_key': encrypted_key
        }
    
    def decrypt(self, encrypted_package, private_key):
        # Decrypt symmetric key with private key
        symmetric_key = private_key.decrypt(
            encrypted_package['encrypted_key'],
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        # Decrypt data with symmetric key
        f = Fernet(symmetric_key)
        plaintext = f.decrypt(encrypted_package['encrypted_data'])
        
        return plaintext.decode()
```

## Cryptographic Hash Functions

**Definition**: One-way functions that produce fixed-size output (digest) from variable-size input.

**Properties**:
- **Deterministic**: Same input always produces same output
- **Fixed output size**: Regardless of input size
- **Avalanche effect**: Small input change causes large output change
- **One-way**: Computationally infeasible to reverse
- **Collision resistant**: Hard to find two inputs with same output

### Common Hash Functions

**SHA-256 (Secure Hash Algorithm)**:
```python
import hashlib

def sha256_hash(data):
    return hashlib.sha256(data.encode()).hexdigest()

# Example
message = "Hello, World!"
hash_value = sha256_hash(message)
print(f"SHA-256: {hash_value}")
# Output: SHA-256: dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f
```

**Use Cases**:
- Password storage (with salt)
- Data integrity verification
- Digital signatures
- Blockchain and cryptocurrencies

### Password Hashing

**Never store passwords in plaintext or use simple hashing!**

**Vulnerable Approach**:
```python
# BAD: Plain MD5/SHA hashing
import hashlib

def bad_hash_password(password):
    return hashlib.md5(password.encode()).hexdigest()  # Vulnerable to rainbow tables
```

**Secure Approach with Salt and Key Stretching**:
```python
import bcrypt
import hashlib
import os
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

class SecurePasswordHashing:
    @staticmethod
    def hash_password_bcrypt(password):
        # bcrypt automatically handles salt and is designed to be slow
        salt = bcrypt.gensalt(rounds=12)  # Adjust rounds based on security needs
        return bcrypt.hashpw(password.encode('utf-8'), salt)
    
    @staticmethod
    def verify_password_bcrypt(password, hashed):
        return bcrypt.checkpw(password.encode('utf-8'), hashed)
    
    @staticmethod
    def hash_password_pbkdf2(password):
        # Generate random salt
        salt = os.urandom(32)
        
        # Create PBKDF2 key derivation function
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,  # Adjust based on security requirements
        )
        
        # Derive key from password
        key = kdf.derive(password.encode())
        
        # Return salt + key for storage
        return base64.b64encode(salt + key).decode()
    
    @staticmethod
    def verify_password_pbkdf2(password, stored_hash):
        # Decode stored hash
        decoded = base64.b64decode(stored_hash.encode())
        salt = decoded[:32]
        stored_key = decoded[32:]
        
        # Recreate KDF with same salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        
        try:
            kdf.verify(password.encode(), stored_key)
            return True
        except:
            return False

# Usage examples
hasher = SecurePasswordHashing()

# Using bcrypt (recommended)
password = "user_password_123"
hashed = hasher.hash_password_bcrypt(password)
is_valid = hasher.verify_password_bcrypt(password, hashed)
print(f"Password valid: {is_valid}")
```

## Digital Signatures

**Purpose**: Provide authentication, non-repudiation, and integrity verification.

**Process**:
1. Create hash of the message
2. Encrypt hash with sender's private key (signature)
3. Recipient decrypts signature with sender's public key
4. Compare decrypted hash with computed hash of received message

```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

class DigitalSignature:
    def __init__(self):
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        self.public_key = self.private_key.public_key()
    
    def sign_message(self, message):
        signature = self.private_key.sign(
            message.encode(),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return signature
    
    def verify_signature(self, message, signature, public_key=None):
        if public_key is None:
            public_key = self.public_key
        
        try:
            public_key.verify(
                signature,
                message.encode(),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except:
            return False

# Usage example
signer = DigitalSignature()
message = "This is an important document"
signature = signer.sign_message(message)
is_valid = signer.verify_signature(message, signature)
print(f"Signature valid: {is_valid}")
```

## Key Management

### Key Generation

**Requirements for Strong Keys**:
- Sufficient entropy (randomness)
- Appropriate key length for algorithm
- Secure random number generator

```python
import os
import secrets
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

class KeyManager:
    @staticmethod
    def generate_symmetric_key(key_length=32):
        """Generate cryptographically secure random key"""
        return os.urandom(key_length)  # 256-bit key
    
    @staticmethod
    def generate_rsa_keypair(key_size=2048):
        """Generate RSA key pair"""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=key_size
        )
        public_key = private_key.public_key()
        return private_key, public_key
    
    @staticmethod
    def serialize_private_key(private_key, password=None):
        """Serialize private key to PEM format"""
        encryption_algorithm = serialization.NoEncryption()
        if password:
            encryption_algorithm = serialization.BestAvailableEncryption(
                password.encode()
            )
        
        return private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=encryption_algorithm
        )
    
    @staticmethod
    def load_private_key(pem_data, password=None):
        """Load private key from PEM format"""
        return serialization.load_pem_private_key(
            pem_data,
            password=password.encode() if password else None
        )
```

### Key Storage and Protection

**Hardware Security Modules (HSMs)**:
- Dedicated cryptographic devices
- Tamper-resistant hardware
- High-performance cryptographic operations

**Key Management Services (KMS)**:
- Cloud-based key management (AWS KMS, Azure Key Vault, Google Cloud KMS)
- Centralized key lifecycle management
- Integration with cloud services

**Application-Level Key Protection**:
```python
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

class ApplicationKeyManager:
    def __init__(self, master_password):
        self.master_password = master_password
        self.master_key = self._derive_master_key()
    
    def _derive_master_key(self):
        """Derive master key from password"""
        salt = b'stable_salt_for_app'  # In production, use random salt stored securely
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.master_password.encode()))
        return key
    
    def encrypt_key(self, key_to_encrypt):
        """Encrypt a key with master key"""
        f = Fernet(self.master_key)
        return f.encrypt(key_to_encrypt)
    
    def decrypt_key(self, encrypted_key):
        """Decrypt a key with master key"""
        f = Fernet(self.master_key)
        return f.decrypt(encrypted_key)
    
    def store_key_securely(self, key_id, key_data):
        """Store key encrypted on disk"""
        encrypted_key = self.encrypt_key(key_data)
        
        # In production, use secure storage with proper permissions
        with open(f"keys/{key_id}.enc", "wb") as f:
            f.write(encrypted_key)
    
    def load_key_securely(self, key_id):
        """Load and decrypt key from disk"""
        with open(f"keys/{key_id}.enc", "rb") as f:
            encrypted_key = f.read()
        
        return self.decrypt_key(encrypted_key)
```

### Key Rotation

**Why Rotate Keys**:
- Limit exposure if key is compromised
- Comply with security policies
- Reduce cryptanalysis opportunities

**Key Rotation Strategy**:
```python
from datetime import datetime, timedelta
import json

class KeyRotationManager:
    def __init__(self):
        self.keys = {}
        self.rotation_period = timedelta(days=90)  # Rotate every 90 days
    
    def create_key_version(self, key_id):
        """Create new version of a key"""
        current_time = datetime.utcnow()
        
        if key_id not in self.keys:
            self.keys[key_id] = {
                'versions': {},
                'current_version': None
            }
        
        # Generate new key version
        version_id = f"v{len(self.keys[key_id]['versions']) + 1}"
        new_key = os.urandom(32)  # Generate new symmetric key
        
        self.keys[key_id]['versions'][version_id] = {
            'key_data': new_key,
            'created_at': current_time,
            'expires_at': current_time + self.rotation_period,
            'status': 'active'
        }
        
        # Update current version
        if self.keys[key_id]['current_version']:
            # Mark previous version as deprecated
            prev_version = self.keys[key_id]['current_version']
            self.keys[key_id]['versions'][prev_version]['status'] = 'deprecated'
        
        self.keys[key_id]['current_version'] = version_id
        return version_id
    
    def get_current_key(self, key_id):
        """Get current active key"""
        if key_id not in self.keys:
            return None
        
        current_version = self.keys[key_id]['current_version']
        if not current_version:
            return None
        
        return self.keys[key_id]['versions'][current_version]['key_data']
    
    def should_rotate_key(self, key_id):
        """Check if key should be rotated"""
        if key_id not in self.keys:
            return True
        
        current_version = self.keys[key_id]['current_version']
        if not current_version:
            return True
        
        key_info = self.keys[key_id]['versions'][current_version]
        return datetime.utcnow() >= key_info['expires_at']
    
    def cleanup_old_keys(self, key_id, retention_period=timedelta(days=30)):
        """Remove old key versions after retention period"""
        if key_id not in self.keys:
            return
        
        cutoff_time = datetime.utcnow() - retention_period
        versions_to_remove = []
        
        for version_id, key_info in self.keys[key_id]['versions'].items():
            if (key_info['status'] == 'deprecated' and 
                key_info['created_at'] < cutoff_time):
                versions_to_remove.append(version_id)
        
        for version_id in versions_to_remove:
            del self.keys[key_id]['versions'][version_id]
```

## Encryption in Practice

### Database Encryption

**Encryption at Rest**:
```python
import sqlite3
from cryptography.fernet import Fernet

class EncryptedDatabase:
    def __init__(self, db_path, encryption_key):
        self.db_path = db_path
        self.cipher = Fernet(encryption_key)
        self.conn = sqlite3.connect(db_path)
        self.create_tables()
    
    def create_tables(self):
        cursor = self.conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT NOT NULL,
                encrypted_email BLOB NOT NULL,
                encrypted_phone BLOB
            )
        ''')
        self.conn.commit()
    
    def encrypt_field(self, data):
        """Encrypt sensitive field"""
        if data is None:
            return None
        return self.cipher.encrypt(data.encode())
    
    def decrypt_field(self, encrypted_data):
        """Decrypt sensitive field"""
        if encrypted_data is None:
            return None
        return self.cipher.decrypt(encrypted_data).decode()
    
    def insert_user(self, username, email, phone=None):
        """Insert user with encrypted sensitive fields"""
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO users (username, encrypted_email, encrypted_phone)
            VALUES (?, ?, ?)
        ''', (
            username,
            self.encrypt_field(email),
            self.encrypt_field(phone) if phone else None
        ))
        self.conn.commit()
    
    def get_user(self, user_id):
        """Get user with decrypted sensitive fields"""
        cursor = self.conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        
        if row:
            return {
                'id': row[0],
                'username': row[1],
                'email': self.decrypt_field(row[2]),
                'phone': self.decrypt_field(row[3]) if row[3] else None
            }
        return None
```

### API Communication Encryption

**TLS/HTTPS Implementation**:
```python
import ssl
import socket
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import datetime

class TLSCertificateManager:
    @staticmethod
    def generate_self_signed_cert(hostname="localhost"):
        """Generate self-signed certificate for development"""
        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        
        # Create certificate
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "CA"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "San Francisco"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "My Company"),
            x509.NameAttribute(NameOID.COMMON_NAME, hostname),
        ])
        
        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.datetime.utcnow()
        ).not_valid_after(
            datetime.datetime.utcnow() + datetime.timedelta(days=365)
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName(hostname),
            ]),
            critical=False,
        ).sign(private_key, hashes.SHA256())
        
        return private_key, cert
    
    @staticmethod
    def save_cert_and_key(private_key, cert, key_file="server.key", cert_file="server.crt"):
        """Save certificate and private key to files"""
        # Save private key
        with open(key_file, "wb") as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        # Save certificate
        with open(cert_file, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))

# Usage with Flask
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return "Secure Hello World!"

if __name__ == '__main__':
    # Generate certificate for development
    cert_manager = TLSCertificateManager()
    private_key, cert = cert_manager.generate_self_signed_cert()
    cert_manager.save_cert_and_key(private_key, cert)
    
    # Run with HTTPS
    app.run(host='0.0.0.0', port=5000, ssl_context=('server.crt', 'server.key'))
```

## Performance Considerations

### Encryption Performance Comparison

```python
import time
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

def benchmark_encryption():
    # Test data
    data_sizes = [1024, 10240, 102400, 1024000]  # 1KB, 10KB, 100KB, 1MB
    
    # Generate keys
    symmetric_key = os.urandom(32)
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()
    
    for size in data_sizes:
        test_data = os.urandom(size)
        print(f"\nTesting with {size} bytes:")
        
        # Symmetric encryption (AES)
        start_time = time.time()
        cipher = Cipher(algorithms.AES(symmetric_key), modes.ECB())
        encryptor = cipher.encryptor()
        # Pad data to multiple of 16 bytes for ECB mode
        padded_data = test_data + b'\x00' * (16 - len(test_data) % 16)
        encrypted = encryptor.update(padded_data) + encryptor.finalize()
        aes_time = time.time() - start_time
        print(f"  AES encryption: {aes_time:.4f} seconds")
        
        # RSA encryption (only for small data due to size limitations)
        if size <= 190:  # RSA 2048-bit can encrypt max ~190 bytes
            start_time = time.time()
            rsa_encrypted = public_key.encrypt(
                test_data,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            rsa_time = time.time() - start_time
            print(f"  RSA encryption: {rsa_time:.4f} seconds")
        else:
            print(f"  RSA encryption: N/A (data too large)")

# Run benchmark
# benchmark_encryption()
```

### Optimization Strategies

**1. Choose Appropriate Algorithms**:
- Use AES for bulk data encryption
- Use RSA/ECC for key exchange and digital signatures
- Consider ChaCha20-Poly1305 for mobile devices

**2. Hardware Acceleration**:
- Use AES-NI instructions on modern CPUs
- Leverage GPU acceleration for cryptographic operations
- Consider dedicated cryptographic hardware

**3. Caching and Reuse**:
```python
class OptimizedEncryption:
    def __init__(self):
        self.cipher_cache = {}
        self.max_cache_size = 100
    
    def get_cipher(self, key):
        """Cache cipher objects to avoid recreation overhead"""
        key_hash = hashlib.sha256(key).hexdigest()
        
        if key_hash not in self.cipher_cache:
            if len(self.cipher_cache) >= self.max_cache_size:
                # Remove oldest entry
                oldest_key = next(iter(self.cipher_cache))
                del self.cipher_cache[oldest_key]
            
            self.cipher_cache[key_hash] = Fernet(key)
        
        return self.cipher_cache[key_hash]
    
    def encrypt_optimized(self, data, key):
        cipher = self.get_cipher(key)
        return cipher.encrypt(data.encode())
```

## Common Encryption Mistakes

### 1. Using ECB Mode
```python
# BAD: ECB mode reveals patterns
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

def bad_encryption(data, key):
    cipher = Cipher(algorithms.AES(key), modes.ECB())  # Don't use ECB!
    encryptor = cipher.encryptor()
    return encryptor.update(data) + encryptor.finalize()

# GOOD: Use CBC or GCM mode with random IV
def good_encryption(data, key):
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    encrypted = encryptor.update(data) + encryptor.finalize()
    return iv + encrypted  # Prepend IV to ciphertext
```

### 2. Reusing IVs/Nonces
```python
# BAD: Reusing IV
class BadEncryption:
    def __init__(self, key):
        self.key = key
        self.iv = os.urandom(16)  # Fixed IV - NEVER DO THIS!
    
    def encrypt(self, data):
        cipher = Cipher(algorithms.AES(self.key), modes.CBC(self.iv))
        # ... encryption logic

# GOOD: Generate new IV for each encryption
class GoodEncryption:
    def __init__(self, key):
        self.key = key
    
    def encrypt(self, data):
        iv = os.urandom(16)  # New IV each time
        cipher = Cipher(algorithms.AES(self.key), modes.CBC(iv))
        # ... encryption logic
```

### 3. Not Authenticating Encrypted Data
```python
# BAD: Encryption without authentication
def encrypt_only(data, key):
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    encrypted = encryptor.update(data) + encryptor.finalize()
    return iv + encrypted

# GOOD: Authenticated encryption
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def authenticated_encryption(data, key, associated_data=None):
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce for GCM
    ciphertext = aesgcm.encrypt(nonce, data, associated_data)
    return nonce + ciphertext
```

## Key Takeaways

1. **Use established algorithms**: AES, RSA, ECC, SHA-256
2. **Symmetric for bulk data**, asymmetric for key exchange
3. **Always use random IVs/nonces** for each encryption
4. **Authenticate encrypted data** to prevent tampering
5. **Proper key management** is crucial for security
6. **Regular key rotation** limits exposure
7. **Consider performance implications** of cryptographic choices
8. **Never implement crypto yourself** - use established libraries

## Next Steps

Now that you understand encryption fundamentals, let's explore how these concepts are applied in [HTTPS & TLS/SSL](05-https-tls.md) to secure web communications.