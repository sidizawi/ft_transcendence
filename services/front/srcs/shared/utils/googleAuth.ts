import { i18n } from '../i18n';

export class GoogleAuth {
  private static clientId = '7142370808-1m08nmob1rbm7puodpu61tr1itsbff90.apps.googleusercontent.com';
  private static callback: ((response: any) => void) | null = null;
  private static initialized = false;
  private static retryCount = 0;
  private static maxRetries = 5;

  static initialize(callback: (response: any) => void) {
    this.callback = callback;
    
    if (window.google) {
      this.initializeGoogleSignIn();
    } else {
      this.waitForGoogle();
    }
  }

  private static waitForGoogle() {
    if (this.retryCount >= this.maxRetries) {
      console.error('Failed to load Google Identity Services after maximum retries');
      return;
    }

    if (window.google) {
      this.initializeGoogleSignIn();
    } else {
      this.retryCount++;
      setTimeout(() => this.waitForGoogle(), 1000);
    }
  }

  private static initializeGoogleSignIn() {
    if (this.initialized || !window.google) return;

    try {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: 'popup',
        allowed_parent_origin: ['http://localhost:8000'],
        context: 'signin'
      });
      this.initialized = true;
      this.retryCount = 0;
    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error);
    }
  }

  private static handleCredentialResponse(response: any) {
    if (this.callback) {
      this.callback(response);
    }
  }

  static renderButton(elementId: string) {
    if (!window.google) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(() => this.renderButton(elementId), 1000);
      }
      return;
    }

    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      element.className = 'flex justify-center';
      
      const currentLang = i18n.language;
      const locale = this.mapLanguageToLocale(currentLang);
      
      window.google.accounts.id.renderButton(element, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'center',
        width: 280,
        locale
      });
    } catch (error) {
      console.error('Failed to render Google Sign-In button:', error);
    }
  }

  private static mapLanguageToLocale(lang: string): string {
    const localeMap: { [key: string]: string } = {
      'en': 'en_US',
      'de': 'de_DE',
      'fr': 'fr_FR',
      'nl': 'nl_NL'
    };
    return localeMap[lang] || 'en_US';
  }
}