export const uploadFileToDrive = async (file: File, accessToken: string): Promise<string> => {
  const metadata = {
    name: file.name,
    mimeType: file.type,
    // Optional: Creates a specific folder or keeps it in the root Drive
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file to Google Drive');
  }

  const data = await response.json();
  return data.id; // Returns the Google Drive File ID
};