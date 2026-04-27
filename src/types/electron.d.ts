export interface IElectronAPI {
  powerOff: () => void;
  reboot: () => void;
  quit: () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
