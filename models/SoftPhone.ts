export enum CallingState {
  progress = 'progress',
  confirmed = 'confirmed',
  failed = 'failed',
  ended = 'ended',
}

export enum CallDirection {
  incoming = 'incoming',
  outgoing = 'outgoing',
}

export interface Target {
  phoneNumber: string;
  displayName?: string;
  phoneCall: string;
}

export interface CallingSession {
  id?: string;
  state?: CallingState;
  direction?: CallDirection;
  target?: Target;
  startTime?: Date;
  isHold?: boolean;
  isMute?: boolean;
}

export interface SoftPhoneState {
  isRegistered: boolean;
  currentSession?: CallingSession;
  holdSession?: CallingSession;
}
