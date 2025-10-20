import firebase_admin
import google.cloud
from firebase_admin import credentials, firestore
from datetime import datetime


class FirestoreStorage:
    def __init__(self):
        self.cred = credentials.Certificate("./firebase_cred.json")
        app = firebase_admin.initialize_app(self.cred)
        self.store = firestore.client()

    def warning_devices(self, timestamp, devices):
        # Data for the new document
        document_data = {
            'datetime': timestamp,
            'device': devices
        }

        # Add a new document to the "anomalies" collection
        # Firestore will automatically generate a document ID
        result = self.store.collection(u'anomalies').add(document_data)

        print(f"Document added with ID: {result[1].id}")

    def publishing_event(self, device, value, timestamp=None):
        document_data = {
            'datetime': datetime.now() if timestamp is None else timestamp,
            'device': device,
            'value': value
        }

        result = self.store.collection(u'anomalies').add(document_data)

        print(f"Document added with ID: {result[1].id}")
