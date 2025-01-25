declare module 'qr-scanner' {
  export interface QrScannerOptions {
    returnDetailedScanResult?: boolean;
    highlightScanRegion?: boolean;
    highlightCodeOutline?: boolean;
    maxScansPerSecond?: number;
    preferredCamera?: 'environment' | 'user';
  }

  export interface QrScanResult {
    data: string;
    cornerPoints: Array<{ x: number; y: number }>;
  }

  export default class QrScanner {
    constructor(
      video: HTMLVideoElement,
      onResult: (result: QrScanResult | string) => void,
      options?: QrScannerOptions
    );

    static hasCamera(): Promise<boolean>;
    start(): Promise<void>;
    stop(): void;
    destroy(): void;
    setCamera(facingMode: string): Promise<void>;
    setInversionMode(inversionMode: 'original' | 'invert' | 'both'): void;
    static scanImage(
      imageOrFileOrUrl: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | string | File | URL,
      options?: QrScannerOptions
    ): Promise<QrScanResult | string>;
  }
}
