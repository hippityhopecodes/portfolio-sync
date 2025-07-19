# Google Sheets authentication
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from typing import List
import os.path
import pickle
from ..config import settings

# Google Sheets client for interacting with Google Sheets API
class GoogleSheetsClient:
    SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

    # Initializes the GoogleSheetsClient
    def __init__(self):
        self.creds = self.get_credentials()
        self.service = build("sheets", "v4", credentials=self.creds)

    # Gets credentials for Google Sheets API
    def get_credentials(self) -> Credentials:
        creds = None

        # If a path exists
        if os.path.exists(settings.token_path):
            with open(settings.token_path, 'rb') as token:
                creds = pickle.load(token)
        # If no valid credentials, request new ones
        else:
            flow = InstalledAppFlow.from_client_secrets_file(settings.credentials_path, self.SCOPES)
            creds = flow.run_local_server(port = 0)
        with open(settings.token_path, 'wb') as token:
            pickle.dump(creds, token)

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