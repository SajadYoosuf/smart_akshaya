import json
import requests
from bs4 import BeautifulSoup

HTML_FILE = '../ACE App - Web Admin.html'
API_URL = "https://akshayaapp.com/getformdata"

def get_forms_from_html():
    print(f"Reading {HTML_FILE}...")
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
    
    forms = []
    ul = soup.find('ul', class_='forms')
    for li in ul.find_all('li'):
        onclick = li.get('onclick', '')
        if 'openForm' in onclick:
            poster_id = onclick.split("'")[1]
            title_elem = li.find('p', class_='title')
            desc_elem = li.find('p', class_='description')
            title = title_elem.text.strip() if title_elem else "Unknown Title"
            subtitle = desc_elem.get('data-description', '').strip() if desc_elem else ""
            forms.append({'id': poster_id, 'title': title, 'subtitle': subtitle})
    return forms

def generate_json():
    forms = get_forms_from_html()
    session = requests.Session()
    
    print("Fetching filenames from API...")
    for f in forms:
        res = session.post(API_URL, data={"posterid": f['id'], "action": "getdata"})
        if res.status_code == 200:
            data = res.json()
            if data.get('status') == 'success':
                f['filename'] = data.get('filename')
                f['local_path'] = f['filename']
                
    with open('extracted_forms_data.json', 'w', encoding='utf-8') as f:
        json.dump(forms, f, ensure_ascii=False, indent=4)
    print("Saved extracted_forms_data.json successfully!")

if __name__ == "__main__":
    generate_json()
