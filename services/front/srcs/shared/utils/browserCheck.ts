import Bowser from 'bowser';

interface BrowserRequirements {
  chrome: string;
  firefox: string;
  safari: string;
  edge: string;
}

export class BrowserCompatibility {
  private static minVersions: BrowserRequirements = {
    chrome: '90',
    firefox: '90',
    safari: '14',
    edge: '90'
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
      case 'safari':
        return majorVersion >= parseInt(this.minVersions.safari);
      case 'microsoft edge':
        return majorVersion >= parseInt(this.minVersions.edge);
      default:
        return false;
    }
  }

  static showWarning(): void {
    const browser = Bowser.getParser(window.navigator.userAgent);
    const browserName = browser.getBrowserName();
    const browserVersion = browser.getBrowserVersion();

    const warningElement = document.createElement('div');
    warningElement.className = 'fixed top-0 left-0 right-0 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 px-4 py-3 text-center transform transition-transform duration-300 ease-in-out z-50';
    warningElement.innerHTML = `
      <div class="container mx-auto flex items-center justify-between">
        <div class="flex-1">
          <p class="font-medium">
            ⚠️ Your browser (${browserName} ${browserVersion}) might not be fully supported.
            For the best experience, please use the latest version of Chrome, Firefox, Safari, or Edge.
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
        warningElement.style.transform = 'translateY(-100%)';
        setTimeout(() => warningElement.remove(), 300);
      });
    }

    document.body.prepend(warningElement);
  }
}