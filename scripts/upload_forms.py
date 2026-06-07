import os
import json
import time
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

JSON_FILE = '../assets/forms_data.json'
FORMS_DIR = '../assets/forms/'
SCOPES = ['https://www.googleapis.com/auth/drive.file']
FOLDER_NAME = 'Application forms'

def authenticate_google_drive():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('drive_credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('drive', 'v3', credentials=creds)
        return service
    except Exception as error:
        print(f'An error occurred: {error}')
        return None

def upload_to_drive(service, forms):
    print(f"\nSearching for Google Drive folder '{FOLDER_NAME}'...")
    results = service.files().list(
        q=f"name='{FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        spaces='drive',
        fields='files(id, name)'
    ).execute()
    items = results.get('files', [])

    if not items:
        print(f"Folder '{FOLDER_NAME}' not found! Creating it...")
        file_metadata = {
            'name': FOLDER_NAME,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = service.files().create(body=file_metadata, fields='id').execute()
        folder_id = folder.get('id')
    else:
        folder_id = items[0]['id']
        print(f"Found folder ID: {folder_id}")

    for f in forms:
        filename = f.get('filename')
        if not filename:
            continue
            
        filepath = os.path.join(FORMS_DIR, filename)
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            continue
            
        print(f"Uploading {filename} to Google Drive...")
        
        # Check if it's a PDF or DOCX based on extension
        ext = filename.split('.')[-1].lower()
        if ext == 'pdf':
            mime = 'application/pdf'
        elif ext in ['doc', 'docx']:
            mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        else:
            mime = 'application/octet-stream'

        file_metadata = {'name': filename, 'parents': [folder_id]}
        media = MediaFileUpload(filepath, mimetype=mime, resumable=True)
        
        try:
            file = service.files().create(body=file_metadata, media_body=media, fields='id, webViewLink').execute()
            f['drive_link'] = file.get('webViewLink')
            print(f"Uploaded {filename} with File ID: {file.get('id')}")
        except Exception as e:
            print(f"Error uploading {filename}: {e}")
            
    return forms

if __name__ == "__main__":
    print(f"Reading {JSON_FILE}...")
    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        forms = json.load(f)
        
    drive_service = authenticate_google_drive()
    if drive_service:
        updated_forms = upload_to_drive(drive_service, forms)
        
        # Save updated forms
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(updated_forms, f, ensure_ascii=False, indent=4)
            
        print("\nAll done! Uploaded existing files and saved Google Drive links to forms_data.json.")
    else:
        print("Failed to authenticate Google Drive.")
