const API_BASE_URL = 'http://localhost:5000/api';

// Password visibility toggle function - FIXED
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('password-toggle')) {
    const input = e.target.closest('.password-input-container').querySelector('input');
    if (!input) return;

    input.type = input.type === 'password' ? 'text' : 'password';
    e.target.textContent = input.type === 'password' ? '👁️' : '🙈';
  }
});


class PasswordManager {
  constructor() {
    this.token = null;
    this.currentView = 'currentSite';
    this.init();
  }

  async init() {
    const result = await chrome.storage.local.get(['token']);
    if (result.token) {
      this.token = result.token;
      this.showMainInterface();
      this.loadPasswordsForCurrentSite();
    } else {
      this.showLoginForm();
    }
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('loginBtn').addEventListener('click', () => this.login());
    document.getElementById('registerBtn').addEventListener('click', () => this.register());
    document.getElementById('savePasswordBtn').addEventListener('click', () => this.showSavePasswordForm());
    document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    document.getElementById('saveBtn').addEventListener('click', () => this.savePassword());
    document.getElementById('cancelBtn').addEventListener('click', () => this.showMainInterface());
    
    document.getElementById('currentSiteTab').addEventListener('click', () => this.switchTab('currentSite'));
    document.getElementById('allPasswordsTab').addEventListener('click', () => this.switchTab('allPasswords'));

    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const activeForm = document.querySelector('div:not(.hidden)');
        if (activeForm && activeForm.id === 'loginForm') {
          this.login();
        } else if (activeForm && activeForm.id === 'savePasswordForm') {
          this.savePassword();
        }
      }
    });
  }

  switchTab(tab) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'currentSite') {
      document.getElementById('currentSiteTab').classList.add('active');
      document.getElementById('currentSiteView').classList.remove('hidden');
      document.getElementById('allPasswordsView').classList.add('hidden');
      this.loadPasswordsForCurrentSite();
    } else {
      document.getElementById('allPasswordsTab').classList.add('active');
      document.getElementById('currentSiteView').classList.add('hidden');
      document.getElementById('allPasswordsView').classList.remove('hidden');
      this.loadAllPasswords();
    }
    this.currentView = tab;
  }

  async login() {
    const email = document.getElementById('email').value.trim();
    const masterPassword = document.getElementById('masterPassword').value;

    if (!email || !masterPassword) {
      this.showError('loginError', 'Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, masterPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        await chrome.storage.local.set({ token: data.token });
        this.showSuccess('loginSuccess', 'Login successful!');
        setTimeout(() => {
          this.showMainInterface();
          this.loadPasswordsForCurrentSite();
        }, 1000);
      } else {
        this.showError('loginError', data.message);
      }
    } catch (error) {
      this.showError('loginError', 'Login failed. Please check your connection.');
    }
  }

  async register() {
    const email = document.getElementById('email').value.trim();
    const masterPassword = document.getElementById('masterPassword').value;

    if (!email || !masterPassword) {
      this.showError('loginError', 'Please fill in all fields');
      return;
    }

    if (masterPassword.length < 6) {
      this.showError('loginError', 'Master password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, masterPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        await chrome.storage.local.set({ token: data.token });
        this.showSuccess('loginSuccess', 'Account created successfully!');
        setTimeout(() => this.showMainInterface(), 1000);
      } else {
        this.showError('loginError', data.message);
      }
    } catch (error) {
      this.showError('loginError', 'Registration failed. Please try again.');
    }
  }

  async logout() {
    await chrome.storage.local.remove(['token']);
    this.token = null;
    this.showLoginForm();
  }

  async loadPasswordsForCurrentSite() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tab.url;

      const response = await fetch(`${API_BASE_URL}/passwords/url/${encodeURIComponent(url)}`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });

      const passwords = await response.json();
      this.displayPasswords(passwords, 'passwordList');
    } catch (error) {
      console.error('Failed to load passwords:', error);
      document.getElementById('passwordList').innerHTML = '<div class="no-passwords">Failed to load passwords</div>';
    }
  }

  async loadAllPasswords() {
    try {
      const response = await fetch(`${API_BASE_URL}/passwords`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });

      const passwords = await response.json();
      this.displayPasswords(passwords, 'allPasswordsList', true);
    } catch (error) {
      console.error('Failed to load all passwords:', error);
      document.getElementById('allPasswordsList').innerHTML = '<div class="no-passwords">Failed to load passwords</div>';
    }
  }

  displayPasswords(passwords, containerId, showActions = false) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (passwords.length === 0) {
      container.innerHTML = '<div class="no-passwords">No saved passwords found</div>';
      return;
    }

    passwords.forEach(pwd => {
      const item = document.createElement('div');
      item.className = 'password-item';
      
      const actionsHtml = showActions ? `
        <div class="password-actions">
          <button class="btn-small btn-secondary" data-action="copy" data-password="${pwd.password}">📋 Copy</button>
          <button class="btn-small btn-danger" data-action="delete" data-id="${pwd._id}">🗑️ Delete</button>
        </div>
      ` : '';

      item.innerHTML = `
        <div class="password-item-title">${pwd.website}</div>
        <div class="password-item-subtitle">${pwd.username}</div>
        ${actionsHtml}
      `;
      
      if (!showActions) {
        item.addEventListener('click', () => this.fillPassword(pwd));
      } else {
        // Add event listeners for action buttons - FIXED
        const copyBtn = item.querySelector('[data-action="copy"]');
        const deleteBtn = item.querySelector('[data-action="delete"]');
        
        if (copyBtn) {
          copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyPassword(pwd.password);
          });
        }
        
        if (deleteBtn) {
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deletePassword(pwd._id);
          });
        }
      }
      
      container.appendChild(item);
    });
  }

  // FIXED: Copy password function
  async copyPassword(password) {
    try {
      await navigator.clipboard.writeText(password);
      this.showTemporaryMessage('✅ Password copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy password:', error);
      this.showTemporaryMessage('❌ Failed to copy password', 'error');
    }
  }

  // FIXED: Delete password function
  async deletePassword(passwordId) {
    if (!confirm('Are you sure you want to delete this password?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/passwords/${passwordId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token}` },
      });

      if (response.ok) {
        this.showTemporaryMessage('✅ Password deleted successfully!', 'success');
        if (this.currentView === 'currentSite') {
          this.loadPasswordsForCurrentSite();
        } else {
          this.loadAllPasswords();
        }
      } else {
        this.showTemporaryMessage('❌ Failed to delete password', 'error');
      }
    } catch (error) {
      console.error('Failed to delete password:', error);
      this.showTemporaryMessage('❌ Failed to delete password', 'error');
    }
  }

  showTemporaryMessage(message, type) {
    const temp = document.createElement('div');
    temp.className = type === 'success' ? 'success' : 'error';
    temp.textContent = message;
    temp.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 250px;
      backdrop-filter: blur(10px);
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
    `;
    document.body.appendChild(temp);
    setTimeout(() => temp.remove(), 3000);
  }

  async fillPassword(passwordData) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (data) => {
        const usernameFields = document.querySelectorAll('input[type="email"], input[type="text"], input[name*="user"], input[name*="email"], input[id*="user"], input[id*="email"]');
        const passwordFields = document.querySelectorAll('input[type="password"]');
        
        if (usernameFields.length > 0) {
          usernameFields[0].value = data.username;
          usernameFields[0].dispatchEvent(new Event('input', { bubbles: true }));
          usernameFields[0].dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (passwordFields.length > 0) {
          passwordFields[0].value = data.password;
          passwordFields[0].dispatchEvent(new Event('input', { bubbles: true }));
          passwordFields[0].dispatchEvent(new Event('change', { bubbles: true }));
        }
      },
      args: [passwordData]
    });

    window.close();
  }

  async showSavePasswordForm() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
      const url = new URL(tab.url);
      document.getElementById('url').value = tab.url;
      document.getElementById('website').value = url.hostname.replace('www.', '');
    } catch (error) {
      document.getElementById('url').value = tab.url;
      document.getElementById('website').value = tab.url;
    }

    // Extract email/username and password from active tab
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const emailField = document.querySelector('input[type="email"], input[name*=user], input[name*=email], input[id*=user], input[id*=email]');
          const passwordField = document.querySelector('input[type="password"]');

          return {
            username: emailField ? emailField.value : '',
            password: passwordField ? passwordField.value : ''
          };
        },
      });

      const { username, password } = result[0].result || {};
      document.getElementById('username').value = username || '';
      document.getElementById('password').value = password || '';
    } catch (error) {
      console.warn('Could not extract credentials from page:', error);
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
    }

    // Show the save form
    document.getElementById('mainInterface').classList.add('hidden');
    document.getElementById('savePasswordForm').classList.remove('hidden');
  }


  async savePassword() {
    const website = document.getElementById('website').value.trim();
    const url = document.getElementById('url').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const notes = document.getElementById('notes').value.trim();

    if (!website || !url || !username || !password) {
      this.showError('saveError', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/passwords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ website, url, username, password, notes }),
      });

      if (response.ok) {
        this.showSuccess('saveSuccess', 'Password saved successfully!');
        setTimeout(() => {
          this.showMainInterface();
          this.loadPasswordsForCurrentSite();
          this.clearSaveForm();
        }, 1000);
      } else {
        const data = await response.json();
        this.showError('saveError', data.message || 'Failed to save password');
      }
    } catch (error) {
      this.showError('saveError', 'Failed to save password. Please try again.');
    }
  }

  clearSaveForm() {
    document.getElementById('website').value = '';
    document.getElementById('url').value = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('notes').value = '';
  }

  showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('mainInterface').classList.add('hidden');
    document.getElementById('savePasswordForm').classList.add('hidden');
    document.getElementById('email').value = '';
    document.getElementById('masterPassword').value = '';
    this.clearMessages();
  }

  showMainInterface() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('mainInterface').classList.remove('hidden');
    document.getElementById('savePasswordForm').classList.add('hidden');
    this.clearMessages();
  }

  showError(elementId, message) {
    this.clearMessages();
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
  }

  showSuccess(elementId, message) {
    this.clearMessages();
    const successElement = document.getElementById(elementId);
    successElement.textContent = message;
    successElement.classList.remove('hidden');
  }

  clearMessages() {
    document.querySelectorAll('.error, .success').forEach(el => {
      el.classList.add('hidden');
      el.textContent = '';
    });
  }
}

// Initialize - FIXED: Make it globally accessible
window.passwordManager = new PasswordManager();