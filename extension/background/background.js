// Background script for handling messages and storage

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'savePassword') {
    handleSavePassword(message.data);
  }
});

async function handleSavePassword(passwordData) {
  try {
    const result = await chrome.storage.local.get(['token']);
    if (!result.token) return;

    const response = await fetch('http://localhost:5000/api/passwords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${result.token}`,
      },
      body: JSON.stringify(passwordData),
    });

    if (response.ok) {
      console.log('Password saved successfully');
    }
  } catch (error) {
    console.error('Failed to save password:', error);
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Password Manager Extension installed');
});