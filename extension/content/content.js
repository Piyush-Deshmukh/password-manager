// Content script for auto-detecting login forms and offering to save passwords

class ContentScript {
  constructor() {
    this.init();
  }

  init() {
    // Listen for form submissions
    document.addEventListener('submit', (e) => this.handleFormSubmit(e));
    
    // Listen for password field focus
    document.addEventListener('focus', (e) => {
      if (e.target.type === 'password') {
        this.handlePasswordFieldFocus(e.target);
      }
    }, true);
  }

  async handleFormSubmit(event) {
    const form = event.target;
    const passwordField = form.querySelector('input[type="password"]');
    const usernameField = form.querySelector('input[type="email"], input[type="text"]');

    if (passwordField && usernameField && passwordField.value && usernameField.value) {
      // Check if user is logged in
      const result = await chrome.storage.local.get(['token']);
      if (result.token) {
        this.showSavePasswordPrompt(usernameField.value, passwordField.value);
      }
    }
  }

  async handlePasswordFieldFocus(passwordField) {
    // Check if user is logged in
    const result = await chrome.storage.local.get(['token']);
    if (!result.token) return;

    // Get saved passwords for this site
    try {
      const response = await fetch(`http://localhost:5000/api/passwords/url/${encodeURIComponent(window.location.href)}`, {
        headers: {
          'Authorization': `Bearer ${result.token}`,
        },
      });

      const passwords = await response.json();
      if (passwords.length > 0) {
        this.showAutoFillSuggestions(passwordField, passwords);
      }
    } catch (error) {
      console.error('Failed to load passwords:', error);
    }
  }

  showSavePasswordPrompt(username, password) {
    // Create a simple prompt to save password
    const shouldSave = confirm(`Would you like to save the password for ${username} on ${window.location.hostname}?`);
    
    if (shouldSave) {
      // Send message to background script or popup to save password
      chrome.runtime.sendMessage({
        action: 'savePassword',
        data: {
          website: window.location.hostname,
          url: window.location.href,
          username: username,
          password: password
        }
      });
    }
  }

  showAutoFillSuggestions(passwordField, passwords) {
    // Create a dropdown with password suggestions
    const dropdown = document.createElement('div');
    dropdown.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 10000;
      max-height: 200px;
      overflow-y: auto;
    `;

    const rect = passwordField.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';
    dropdown.style.width = rect.width + 'px';

    passwords.forEach(pwd => {
      const option = document.createElement('div');
      option.style.cssText = `
        padding: 10px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      `;
      option.textContent = pwd.username;
      option.addEventListener('click', () => {
        this.fillLoginForm(pwd);
        dropdown.remove();
      });
      dropdown.appendChild(option);
    });

    document.body.appendChild(dropdown);

    // Remove dropdown when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== passwordField) {
        dropdown.remove();
      }
    }, { once: true });
  }

  fillLoginForm(passwordData) {
    const usernameFields = document.querySelectorAll('input[type="email"], input[type="text"]');
    const passwordFields = document.querySelectorAll('input[type="password"]');

    // Fill username
    for (let field of usernameFields) {
      if (field.offsetParent !== null) { // Check if field is visible
        field.value = passwordData.username;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        break;
      }
    }

    // Fill password
    for (let field of passwordFields) {
      if (field.offsetParent !== null) { // Check if field is visible
        field.value = passwordData.password;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        break;
      }
    }
  }
}

// Initialize content script
new ContentScript();