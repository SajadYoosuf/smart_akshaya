import os
import asyncio
import requests
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from playwright.async_api import async_playwright

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/drive.file']
FOLDER_NAME = 'Application forms'

async def scrape_forms():
    print("Starting Playwright to scrape forms...")
    downloaded_files = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        print("Navigating to login page...")
        await page.goto("https://akshayaapp.com/login", wait_until="networkidle")

        print("Filling login credentials...")
        # Fill in the credentials you provided
        inputs = await page.locator("input").all()
        for inp in inputs:
            type_attr = await inp.get_attribute("type")
            if type_attr in ["text", "email"]:
                await inp.fill("MPM250")
            elif type_attr == "password":
                await inp.fill("Pooki@123")

        print("Submitting login form...")
        await page.keyboard.press("Enter")

        print("Waiting to reach webadmin dashboard...")
        # Wait until we reach webadmin
        try:
            await page.wait_for_url("**/webadmin**", timeout=20000)
            print("Successfully reached webadmin dashboard.")
        except Exception as e:
            print(f"Failed to reach webadmin: {e}")
            await browser.close()
            return []

        print("Navigating to Application Forms page...")
        await page.goto("https://akshayaapp.com/web_forms", wait_until="networkidle")

        print("Extracting form data and downloading PDFs...")
        # Example logic for extracting form cards. Note: Actual selectors will depend on the page structure
        # This will search for all <a> tags that look like PDF links
        
        links = await page.locator("a[href$='.pdf']").all()
        if len(links) == 0:
            print("No PDF links found. The page structure might be different.")
        
        for index, link in enumerate(links):
            url = await link.get_attribute("href")
            # In a real scenario, you'd extract the title/subtitle from surrounding elements here
            filename = f"form_{index}.pdf" 
            
            # Use requests with playwright cookies to download
            cookies = await context.cookies()
            session = requests.Session()
            for cookie in cookies:
                session.cookies.set(cookie['name'], cookie['value'], domain=cookie['domain'])
                
            print(f"Downloading {url}...")
            response = session.get(url)
            if response.status_code == 200:
                filepath = os.path.join(os.getcwd(), filename)
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                downloaded_files.append((filepath, filename))
                print(f"Downloaded: {filename}")
            else:
                print(f"Failed to download {url}")

        await browser.close()
    
    return downloaded_files


def authenticate_google_drive():
    """Shows basic usage of the Drive v3 API.
    Prints the names and ids of the first 10 files the user has access to.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists('drive_credentials.json'):
                print("ERROR: Missing drive_credentials.json file!")
                print("Please download it from Google Cloud Console and place it here.")
                return None
            flow = InstalledAppFlow.from_client_secrets_file(
                'drive_credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('drive', 'v3', credentials=creds)
        return service
    except Exception as error:
        print(f'An error occurred: {error}')
        return None

def upload_to_drive(service, files_to_upload):
    print(f"Searching for folder '{FOLDER_NAME}'...")
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

    for filepath, filename in files_to_upload:
        print(f"Uploading {filename} to Google Drive...")
        file_metadata = {
            'name': filename,
            'parents': [folder_id]
        }
        media = MediaFileUpload(filepath, mimetype='application/pdf', resumable=True)
        file = service.files().create(
            body=file_metadata, media_body=media, fields='id').execute()
        print(f"Uploaded {filename} with File ID: {file.get('id')}")

if __name__ == '__main__':
    print("=== Step 1: Scraping PDFs ===")
    downloaded_files = asyncio.run(scrape_forms())
    
    if not downloaded_files:
        print("No files were downloaded. Exiting.")
        exit(0)
        
    print("\n=== Step 2: Google Drive Authentication ===")
    drive_service = authenticate_google_drive()
    
    if drive_service:
        print("\n=== Step 3: Uploading to Google Drive ===")
        upload_to_drive(drive_service, downloaded_files)
        print("\nAll done!")
