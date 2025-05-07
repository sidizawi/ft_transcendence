import Bowser from 'bowser';

interface BrowserRequirements {
  chrome: string;
  firefox: string;
  chromium: string;
  brave: string;
}

export class BrowserCompatibility {
  private static minVersions: BrowserRequirements = {
    chrome: '135',    // Minimum Chrome version
    firefox: '137',   // Minimum Firefox version
    chromium: '108',  // Minimum Chromium version
    brave: '1.77'     // Minimum Brave version
  };

  static check(): boolean {
    const browser = Bowser.getParser(window.navigator.userAgent);
    const browserName = browser.getBrowserName().toLowerCase();
    const browserVersion = browser.getBrowserVersion();

    if (!browserVersion) return false;

    const majorVersion = parseInt(browserVersion.split('.')[0]);

    switch (browserName) {
      case 'chrome':
        return majorVersion >= parseInt(this.minVersions.chrome);
      case 'firefox':
        return majorVersion >= parseInt(this.minVersions.firefox);
      case 'chromium':
        return majorVersion >= parseInt(this.minVersions.chromium);
      case 'brave':
        // Brave's user agent includes Chrome version, need to check for Brave specifically
        const isBrave = navigator.brave !== undefined;
        return isBrave && majorVersion >= parseInt(this.minVersions.brave);
      default:
        return false;
    }
  }

  static showWarning(): void {
    const browser = Bowser.getParser(window.navigator.userAgent);
    const browserName = browser.getBrowserName();
    const browserVersion = browser.getBrowserVersion();

    const warningElement = document.createElement('div');
    warningElement.className = 'fixed top-0 left-0 right-0 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 px-4 py-3 text-center z-50';
    warningElement.innerHTML = `
      <div class="container mx-auto flex items-center justify-between">
        <div class="flex-1">
          <p class="font-medium">
            ⚠️ Your browser (${browserName} ${browserVersion}) might not be fully supported.
            For the best experience, please use:
            <br>
            Chrome (135+), Firefox (137+), Brave (1.77+), or Chromium (108+)
          </p>
        </div>
        <button class="ml-4 text-yellow-900 dark:text-yellow-100 hover:text-yellow-700 dark:hover:text-yellow-300">
          ✕
        </button>
      </div>
    `;

    const closeButton = warningElement.querySelector('button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        warningElement.style.opacity = '0';
        warningElement.style.transform = 'translateY(-100%)';
        warningElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        setTimeout(() => warningElement.remove(), 300);
      });
    }

    document.body.prepend(warningElement);
  }
}