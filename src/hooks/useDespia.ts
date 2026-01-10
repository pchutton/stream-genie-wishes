import despia from 'despia-native';

/**
 * Hook for Despia native device features
 * Provides haptic feedback, device info, and other native capabilities
 * Only works when running in Despia native wrapper (App Store/Play Store builds)
 */
export const useDespia = () => {
  // Haptic feedback functions
  const haptics = {
    light: () => despia('lighthaptic://'),
    heavy: () => despia('heavyhaptic://'),
    success: () => despia('successhaptic://'),
    warning: () => despia('warninghaptic://'),
    error: () => despia('errorhaptic://'),
  };

  // UI controls
  const ui = {
    showSpinner: () => despia('spinneron://'),
    hideSpinner: () => despia('spinneroff://'),
    enableFullScreen: () => despia('hidebars://on'),
    disableFullScreen: () => despia('hidebars://off'),
    setStatusBarColor: (r: number, g: number, b: number) => 
      despia(`statusbarcolor://{${r}, ${g}, ${b}}`),
  };

  // Device info
  const getAppVersion = async () => {
    try {
      return await despia('getappversion://', ['versionNumber', 'bundleNumber']);
    } catch {
      return null;
    }
  };

  const getDeviceUUID = async () => {
    try {
      return await despia('get-uuid://', ['uuid']);
    } catch {
      return null;
    }
  };

  // Screenshot
  const takeScreenshot = () => despia('takescreenshot://');

  // Share functionality
  const shareApp = (message: string, url: string) => 
    despia(`shareapp://message?=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`);

  // Biometric authentication
  const requestBiometricAuth = () => despia('bioauth://');

  // Save image
  const saveImage = (imageUrl: string) => 
    despia(`savethisimage://?url=${encodeURIComponent(imageUrl)}`);

  return {
    haptics,
    ui,
    getAppVersion,
    getDeviceUUID,
    takeScreenshot,
    shareApp,
    requestBiometricAuth,
    saveImage,
  };
};

// Standalone haptic functions for quick access without hook
export const hapticLight = () => despia('lighthaptic://');
export const hapticHeavy = () => despia('heavyhaptic://');
export const hapticSuccess = () => despia('successhaptic://');
export const hapticWarning = () => despia('warninghaptic://');
export const hapticError = () => despia('errorhaptic://');
