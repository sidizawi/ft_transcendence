interface CredentialResponse {
  credential: string;
  select_by: string;
}

interface GsiButtonConfiguration {
  type: 'standard' | 'icon';
  theme: 'outline' | 'filled_blue' | 'filled_black';
  size: 'large' | 'medium' | 'small';
  text: 'signin_with' | 'signup_with' | 'continue_with' | 'signin' | undefined;
  shape: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment: 'left' | 'center';
  width?: number;
  locale?: string;
}

interface IdConfiguration {
  client_id: string;
  auto_select?: boolean;
  callback: (response: CredentialResponse) => void;
  login_uri?: string;
  native_callback?: Function;
  cancel_on_tap_outside?: boolean;
  prompt_parent_id?: string;
  nonce?: string;
  context?: string;
  state_cookie_domain?: string;
  ux_mode?: 'popup' | 'redirect';
  allowed_parent_origin?: string | string[];
  intermediate_iframe_close_callback?: Function;
}

interface GoogleAccountsId {
  initialize: (config: IdConfiguration) => void;
  prompt: (callback?: (notification: any) => void) => void;
  renderButton: (
    parent: HTMLElement,
    options: GsiButtonConfiguration,
    callback?: Function
  ) => void;
  disableAutoSelect: Function;
  storeCredential: Function;
  cancel: Function;
  onGoogleLibraryLoad: Function;
  revoke: Function;
}

interface Window {
  google?: {
    accounts: {
      id: GoogleAccountsId;
      oauth2?: any;
    };
  };
}