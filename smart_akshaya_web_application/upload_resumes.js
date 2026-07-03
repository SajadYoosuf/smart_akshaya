import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, 'public', 'google_sheets_credentials.json');
const RESUMES_DIR = path.join(__dirname, 'public', 'resumes');
const SHARED_FOLDER_ID = '1dKCAg8ohcWe-nDCXRFfIZe0P3IQ3ARjh';

async function uploadResumes() {
  try {
    console.log('Loading credentials...');
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log('Reading local resumes directory...');
    const files = fs.readdirSync(RESUMES_DIR).filter(file => file.endsWith('.pdf'));
    
    if (files.length === 0) {
      console.log('No .pdf files found in public/resumes directory.');
      return;
    }

    console.log(`Found ${files.length} resumes to upload to shared folder...`);

    for (const file of files) {
      console.log(`Uploading ${file}...`);
      const filePath = path.join(RESUMES_DIR, file);
      
      const fileMetadata = {
        name: file,
        parents: [SHARED_FOLDER_ID]
      };
      
      const media = {
        mimeType: 'application/pdf',
        body: fs.createReadStream(filePath)
      };
      
      const uploadedFile = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
      });
      
      console.log(`Successfully uploaded ${file} (ID: ${uploadedFile.data.id})`);
    }

    console.log('\n--- ALL UPLOADS COMPLETE ---');

  } catch (err) {
    console.error('Error during upload:', err);
  }
}

uploadResumes();
