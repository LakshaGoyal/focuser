import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

interface PairingStore {
  isPaired: boolean;
  pairedAt?: number;
}

export class PairingManager {
  private pairingCode: string = '';
  private isPairedState: boolean = false;
  private filePath: string;

  constructor() {
    // Persistent storage location in user data directory
    const userDataPath = app?.getPath('userData') || process.cwd();
    this.filePath = path.join(userDataPath, 'pairing.json');
    this.loadState();

    if (!this.isPairedState) {
      this.generateNewPairingCode();
    }
  }

  public getPairingCode(): string {
    return this.pairingCode;
  }

  public isPaired(): boolean {
    return this.isPairedState;
  }

  public validateAndPair(inputCode: string): boolean {
    if (this.isPairedState) {
      return true;
    }

    const cleanInput = inputCode.trim();
    if (cleanInput && cleanInput === this.pairingCode) {
      this.isPairedState = true;
      this.pairingCode = ''; // Single-use code invalidated upon success
      this.saveState();
      console.log('[PairingManager] Local agent successfully paired with client!');
      return true;
    }

    console.warn('[PairingManager] Pairing code mismatch attempt.');
    return false;
  }

  public resetPairing(): void {
    this.isPairedState = false;
    this.generateNewPairingCode();
    this.saveState();
  }

  private generateNewPairingCode(): void {
    // Generate cryptographically random 6-digit integer (100000 to 999999)
    const num = crypto.randomInt(100000, 1000000);
    this.pairingCode = num.toString();
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const store: PairingStore = JSON.parse(data);
        this.isPairedState = Boolean(store.isPaired);
      }
    } catch (err) {
      console.warn('[PairingManager] Error reading pairing store, defaulting to unpaired:', err);
      this.isPairedState = false;
    }
  }

  private saveState(): void {
    try {
      const store: PairingStore = {
        isPaired: this.isPairedState,
        pairedAt: Date.now(),
      };
      fs.writeFileSync(this.filePath, JSON.stringify(store, null, 2), 'utf-8');
    } catch (err) {
      console.error('[PairingManager] Error saving pairing store:', err);
    }
  }
}
