import os
import json
import time
import requests
from bs4 import BeautifulSoup
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

HTML_FILE = '../ACE App - Web Admin.html'
API_URL = "https://akshayaapp.com/getformdata"
DOWNLOAD_BASE_URL = "https://akshayaapp.com/uploads/forms/"
SCOPES = ['https://www.googleapis.com/auth/drive.file']
FOLDER_NAME = 'Application forms'

def get_forms_from_html():
    print(f"Reading {HTML_FILE}...")
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
    
    forms = []
    ul = soup.find('ul', class_='forms')
    if not ul:
        print("Could not find <ul class='forms'>")
        return forms
        
    for li in ul.find_all('li'):
        onclick = li.get('onclick', '')
        if 'openForm' in onclick:
            poster_id = onclick.split("'")[1]
            title_elem = li.find('p', class_='title')
            desc_elem = li.find('p', class_='description')
            
            title = title_elem.text.strip() if title_elem else "Unknown Title"
            subtitle = desc_elem.get('data-description', '').strip() if desc_elem else ""
            
            forms.append({
                'id': poster_id,
                'title': title,
                'subtitle': subtitle
            })
    return forms

def download_forms(forms):
    downloaded = []
    session = requests.Session()
    
    for f in forms:
        print(f"\nProcessing ID {f['id']} - {f['title']}")
        
        res = session.post(API_URL, data={"posterid": f['id'], "action": "getdata"})
        if res.status_code != 200:
            print(f"Failed to fetch data for ID {f['id']}")
            continue
            
        data = res.json()
        if data.get('status') != 'success':
            print(f"API returned non-success status for ID {f['id']}: {data}")
            continue
            
        filename = data.get('filename')
        if not filename:
            print(f"No filename found for ID {f['id']}")
            continue
            
        pdf_url = DOWNLOAD_BASE_URL + filename
        f['filename'] = filename
        print(f"Downloading {filename}...")
        
        try:
            pdf_res = session.get(pdf_url)
            if pdf_res.status_code == 200:
                filepath = os.path.join(os.getcwd(), filename)
                with open(filepath, 'wb') as pdf_file:
                    pdf_file.write(pdf_res.content)
                downloaded.append((filepath, filename))
                print("Download complete.")
            else:
                print(f"Failed to download PDF, status code {pdf_res.status_code}")
        except Exception as e:
            print(f"Error downloading {filename}: {e}")
            
        time.sleep(0.5)
        
    return downloaded


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

def upload_to_drive(service, files_to_upload, forms):
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

    # Upload files and update the forms list with the webViewLink
    for filepath, filename in files_to_upload:
        print(f"Uploading {filename} to Google Drive...")
        file_metadata = {'name': filename, 'parents': [folder_id]}
        media = MediaFileUpload(filepath, mimetype='application/pdf', resumable=True)
        file = service.files().create(body=file_metadata, media_body=media, fields='id, webViewLink').execute()
        
        # Find the form matching this filename and save the Drive Link
        for f in forms:
            if f.get('filename') == filename:
                f['drive_link'] = file.get('webViewLink')
                
        print(f"Uploaded {filename} with File ID: {file.get('id')}")


if __name__ == "__main__":
    forms = get_forms_from_html()
    print(f"Found {len(forms)} forms in HTML.")
    
    if forms:
        downloaded = download_forms(forms)
        if downloaded:
            print(f"\nSuccessfully downloaded {len(downloaded)} PDFs.")
            drive_service = authenticate_google_drive()
            if drive_service:
                upload_to_drive(drive_service, downloaded, forms)
                
                # Save all the extracted metadata to a JSON file!
                with open('extracted_forms_data.json', 'w', encoding='utf-8') as f:
                    json.dump(forms, f, ensure_ascii=False, indent=4)
                    
                print("\nAll done! Extracted titles, subtitles, and Google Drive links saved to 'extracted_forms_data.json'.")
            else:
                print("Failed to authenticate Google Drive.")
        else:
            print("No files were downloaded.")
