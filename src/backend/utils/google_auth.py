# Google Sheets authentication
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from typing import List
import json
from ..config import settings

# Google Sheets client for interacting with Google Sheets API
class GoogleSheetsClient:
    SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

    # Initializes the GoogleSheetsClient
    def __init__(self):
        self.creds = self.get_credentials()
        self.service = build("sheets", "v4", credentials=self.creds)

    # Gets credentials for Google Sheets API using service account
    def get_credentials(self) -> Credentials:
        # Load service account credentials from JSON file
        with open(settings.credentials_path, 'r') as f:
            service_account_info = json.load(f)
        
        # Create credentials from service account info
        creds = Credentials.from_service_account_info(
            service_account_info, 
            scopes=self.SCOPES
        )
        
        return creds

    # Reads a range of data from a Google Sheet
    def read_range(self, range_name: str) -> List[List]:
        result = self.service.spreadsheets().values().get(spreadsheetId=settings.sheet_id, range=range_name).execute()
        return result.get("values", [])

    #  Updates a batch of data in a Google Sheet, data should be a list of dictionaries with 'range' and 'values' keys
    def batch_update(self, data: List[dict]):
        body = {
            'valueInputOption': 'USER_ENTERED',
            'data': data
        }

        return self.service.spreadsheets().values().batchUpdate(spreadsheetId=settings.sheet_id, body=body).execute()