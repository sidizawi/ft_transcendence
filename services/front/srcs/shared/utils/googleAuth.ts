import { i18n } from '../i18n';

export class GoogleAuth {
  private static clientId = 'CLIENT_ID.apps.googleusercontent.com';; // How do I get it?
  private static callback: ((response: any) => void) | null = null;
  private static initialized = false;

  static initialize(callback: (response: any) => void) {
    this.callback = callback;
    
    if (window.google) {
      this.initializeGoogleSignIn();
    } else {
      // Wait for the script to load
      window.onload = () => {
        if (window.google) {
          this.initializeGoogleSignIn();
        } else {
          console.error('Google Identity Services not loaded');
        }
      };
    }
  }

  private static initializeGoogleSignIn() {
    if (this.initialized || !window.google) return;

    try {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true
      });
      this.initialized = true;
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
      console.warn('Google Identity Services not loaded, retrying...');
      setTimeout(() => this.renderButton(elementId), 1000);
      return;
    }

    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      // Add a wrapper div for centering
      element.className = 'flex justify-center';
      
      // Get current language and map to Google's locale format
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
        locale // Add locale for button text translation
      });

      // Let Google's styles load first, then apply our overrides
      setTimeout(() => {
        const button = element.querySelector('div[role="button"]');
        if (button) {
          button.classList.add(
            'bg-orange',
            'dark:bg-nature',
            'hover:bg-orange-darker',
            'dark:hover:bg-nature/90',
            'text-white',
            'dark:text-nature-lightest',
            'transition-colors'
          );
        }
      }, 100);
    } catch (error) {
      console.error('Failed to render Google Sign-In button:', error);
    }
  }

  // Map our language codes to Google's locale codes
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