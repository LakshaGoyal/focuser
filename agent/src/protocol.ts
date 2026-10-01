import { IncomingCommand } from './types.js';

export class ProtocolValidator {
  /**
   * Validates and parses raw WebSocket message strings into strictly validated IncomingCommand objects.
   * Throws an Error if payload is invalid, unknown command, or fails type checks.
   */
  public static parseAndValidate(raw: string): IncomingCommand {
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error('Invalid JSON payload');
    }

    if (typeof data !== 'object' || data === null) {
      throw new Error('Command payload must be a JSON object');
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.type !== 'string') {
      throw new Error('Command payload missing "type" string property');
    }

    switch (obj.type) {
      case 'getState':
        return { type: 'getState' };

      case 'getPairingCode':
        return { type: 'getPairingCode' };

      case 'pair': {
        const code = typeof obj.code === 'string' ? obj.code.trim() : '';
        if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
          throw new Error('pair command requires valid 6-digit numeric string "code"');
        }
        return { type: 'pair', code };
      }

      case 'enterFocus': {
        const durationMin = Number(obj.durationMin);
        if (isNaN(durationMin) || durationMin <= 0) {
          throw new Error('enterFocus command requires positive numeric "durationMin"');
        }

        const destination = typeof obj.destination === 'string' ? obj.destination.trim() : 'codeforces';
        if (!destination) {
          throw new Error('enterFocus command requires non-empty string "destination"');
        }

        return {
          type: 'enterFocus',
          durationMin,
          destination,
        };
      }

      case 'exitFocus':
        return { type: 'exitFocus' };

      default:
        throw new Error(`Unauthorized or unknown command type: "${String(obj.type)}"`);
    }
  }
}
