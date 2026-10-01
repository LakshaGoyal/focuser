import { AgentState } from '../types.js';

export interface EnterFocusOptions {
  destination: string;
  durationMin: number;
}

export interface IFocusController {
  enterFocus(options: EnterFocusOptions): Promise<void>;
  exitFocus(): Promise<void>;
  getState(): AgentState;
}
