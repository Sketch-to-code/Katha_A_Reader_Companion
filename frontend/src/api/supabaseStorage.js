import apiClient from './apiClient';

export async function uploadPdfToSupabase(file) {
  if ((file.type && file.type !== 'application/pdf') || !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Choose a PDF file.');
  }
  if (!file.size || file.size > 50 * 1024 * 1024) {
    throw new Error('Choose a PDF smaller than 50 MB.');
  }

  const contentType = file.type || 'application/pdf';
  const { data: upload } = await apiClient.post('/documents/upload-url', {
    fileName: file.name,
    contentType,
    size: file.size,
  });
  const response = await fetch(upload.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Supabase PDF upload failed: ${await response.text() || response.statusText}`);
  }

  return { storagePath: upload.path };
}
