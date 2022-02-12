import {
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';

window.RTCPeerConnection = window.RTCPeerConnection || RTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || RTCIceCandidate;
window.RTCSessionDescription =
  window.RTCSessionDescription || RTCSessionDescription;
window.MediaStream = window.MediaStream || MediaStream;
window.MediaStreamTrack = window.MediaStreamTrack || MediaStreamTrack;
window.navigator.mediaDevices = window.navigator.mediaDevices || mediaDevices;
window.navigator.getUserMedia =
  window.navigator.getUserMedia || mediaDevices.getUserMedia;

import JsSIP, {UA} from 'jssip';
import {softPhoneEmitter} from './eventEmitter';
import {IncomingRTCSessionEvent, OutgoingRTCSessionEvent} from 'jssip/lib/UA';
import {RTCSession} from 'jssip/lib/RTCSession';

if (process.env.NODE_ENV !== 'production') {
  JsSIP.debug.enable('JsSIP:*');
}

const domain = 'asterisk-demo.ast-dev.ai-studio-work.net';
const port = 8089;

console.log('domain: ', domain);

let socket = new JsSIP.WebSocketInterface(`wss://${domain}:${port}/ws`);

interface BTCSession {
  btc?: {
    sessionId: number;
    sessionType: 'currentSession' | 'holdSession';
  };
}

let currentSession: (RTCSession & BTCSession) | undefined;
let holdSession: (RTCSession & BTCSession) | undefined;
let ua: UA;
let isBusy = false;
// const audioPlayer = new Audio();

// let telephonering = new Audio.Sound();
// let ringback = new Audio.Sound();
// let endcall = new Audio.Sound();
// let holdmusic = new Audio.Sound();

// const initSound = async () => {
//   await telephonering.loadAsync(require('../assets/audios/telephonering.mp3'));
//   await ringback.loadAsync(require('../assets/audios/ringback.mp3'));
//   await endcall.loadAsync(require('../assets/audios/endcall.mp3'));
//   await holdmusic.loadAsync(require('../assets/audios/hold.mp3'));
// };

let sessionId = 0;
const getSessionId = () => {
  sessionId += 1;
  return sessionId;
};

export function pureRegister(sipAccount: string, sipPassword: string) {
  let configuration = {
    sockets: [socket],
    uri: 'sip:' + sipAccount + '@' + domain,
    password: sipPassword,
    register: true,
    contact_uri: 'sip:' + sipAccount + '@' + domain + ';transport=wss',
    session_timers: false,
  };

  ua = new JsSIP.UA(configuration);

  ua.on('connected', () => {
    softPhoneEmitter.emit('connected');
  });

  ua.on('registered', () => {
    softPhoneEmitter.emit('registered');
  });

  ua.on('sipEvent', data => {
    softPhoneEmitter.emit('sipEvent', data);
  });

  ua.on(
    'newRTCSession',
    (e: IncomingRTCSessionEvent | OutgoingRTCSessionEvent) => {
      softPhoneEmitter.emit('message', {type: 'newRTCSession', e});

      if (isBusy && e.session.direction === 'incoming') {
        terminateBusy(e.session);
        console.log('terminate session because busy');
        return;
      }

      if (!isBusy) {
        isBusy = true;
        console.log('set busy: true');

        currentSession = e.session;
        const btc: any = {
          sessionType: 'currentSession',
          sessionId: getSessionId(),
        };
        currentSession.btc = btc;
        console.log('Current session initialize');

        if (currentSession.direction === 'incoming') {
          softPhoneEmitter.emit('message', {
            type: 'incoming',
            btc,
            displayName: currentSession.remote_identity.display_name,
            phoneCall: currentSession.remote_identity.uri.user,
            session: currentSession,
          });
          // telephonering.playAsync();
          currentSession.on('peerconnection', () => {
            add_stream();
          });
        } else if (currentSession.direction === 'outgoing') {
          softPhoneEmitter.emit('message', {
            type: 'outgoing',
            btc,
            session: currentSession,
          });
          console.log('out going');
        }

        const direction = currentSession.direction;
        const target = {
          phoneNumber: (currentSession as any).remote_identity._uri._user,
        };

        currentSession.on('progress', () => {
          if (direction === 'outgoing') {
            //ringback.playAsync();
          }
          softPhoneEmitter.emit('message', {
            type: 'progress',
            direction,
            target,
            btc,
          });
        });

        currentSession.on('confirmed', () => {
          softPhoneEmitter.emit('message', {
            type: 'confirmed',
            direction,
            target,
            btc,
          });
          // telephonering.pauseAsync();
          // ringback.pauseAsync();
          isBusy = true;
          console.log('confirmed: session confirmed');
          console.log('confirmed: set isBusy:', isBusy);
        });

        currentSession.on('failed', () => {
          softPhoneEmitter.emit('message', {
            type: 'failed',
            direction,
            target,
            btc,
          });
          if (btc.sessionType === 'currentSession') {
            isBusy = false;
            currentSession = undefined;
          } else if (btc.sessionType === 'holdSession') {
            holdSession = undefined;
          }
          // telephonering.pauseAsync();
          // ringback.pauseAsync();
          // endcall.playAsync();
          // if (holdSession) {
          //   holdmusic.playAsync();
          // } else {
          //   holdmusic.pauseAsync();
          // }
          console.log('failed: session failed');
        });

        currentSession.on('ended', error => {
          softPhoneEmitter.emit('message', {
            type: 'ended',
            direction,
            target,
            error,
            btc,
          });
          // endcall.playAsync();
          console.log('ended: session ended');

          if (btc.sessionType === 'currentSession') {
            console.log('ended: set current session to undefined');
            currentSession = undefined;
            isBusy = false;
          } else if (btc.sessionType === 'holdSession') {
            console.log('ended: set hold session to undefined');
            holdSession = undefined;
          }
          if (holdSession) {
            // holdmusic.playAsync();
          } else {
            // holdmusic.pauseAsync();
          }
        });

        currentSession.on('accepted', () => {
          softPhoneEmitter.emit('message', {
            type: 'accepted',
            direction,
            target,
            btc,
          });
        });

        currentSession.on('update', () => {
          softPhoneEmitter.emit('message', {
            type: 'update',
            direction,
            target,
            btc,
          });
        });

        currentSession.on('hold', () => {
          // holdmusic.playAsync();
          softPhoneEmitter.emit('message', {
            type: 'hold',
            direction,
            target,
            btc,
          });

          btc.sessionType = 'holdSession';
        });

        currentSession.on('unhold', function () {
          // holdmusic.pauseAsync();
          softPhoneEmitter.emit('message', {
            type: 'unhold',
            direction,
            target,
            btc,
          });

          btc.sessionType = 'currentSession';
        });

        currentSession.on('muted', function () {
          softPhoneEmitter.emit('message', {
            type: 'mute',
            direction,
            target,
            btc,
          });
        });

        currentSession?.on('unmuted', function () {
          softPhoneEmitter.emit('message', {
            type: 'unmute',
            direction,
            target,
            btc,
          });
        });
      }
    },
  );

  ua.on('registrationFailed', e => {
    softPhoneEmitter.emit('message', {type: 'registrationFailed', e});
    ua.unregister();
    ua.stop();
  });

  ua.on('newMessage', () => {
    softPhoneEmitter.emit('message', {type: 'newMessage'});
  });

  ua.start();
}

export const unregister = () => {
  ua.on('unregistered', () => {
    softPhoneEmitter.emit('message', {type: 'unregistered'});
  });
  ua.on('disconnected', function () {
    softPhoneEmitter.emit('message', {type: 'disconnected'});
  });

  ua.unregister();
  ua.stop();
};

export function call(phoneNumber: string, displayName: string) {
  // holdmusic.pauseAsync();
  if (isBusy) {
    return;
  }

  if (currentSession) {
    currentSession.terminate();
  }

  let options: any = {
    mediaConstraints: {
      audio: true,
      video: false,
    },
    pcConfig: {
      rtcpMuxPolicy: 'negotiate',
    },
    fromDisplayName: displayName,
    sessionTimersExpires: 600,
  };

  ua.call('sip:' + phoneNumber + '@' + domain, options);
  add_stream();
}

export function refer() {
  let options = {
    replaces: currentSession,
    mediaConstraints: {audio: true, video: false},
    pcConfig: {
      rtcpMuxPolicy: 'negotiate',
    },
  };
  holdSession?.refer((currentSession as any)?.remote_identity.uri, options);
  currentSession?.terminate();
  holdSession?.terminate();
  softPhoneEmitter.emit('message', {type: 'transfer_success'});
}

export function hold(isHold = false) {
  if (!isHold) {
    isBusy = false;
    holdSession = currentSession;
    holdSession?.hold();
    currentSession = undefined;
  } else {
    isBusy = true;
    currentSession = holdSession;
    currentSession?.unhold();
    holdSession = undefined;
  }
}

export function mute(isMute = false) {
  console.log('Mute: ', isMute);
  if (!isMute) {
    currentSession?.mute();
  } else {
    currentSession?.unmute();
  }
}

export function answer() {
  let callOptions: any = {
    mediaConstraints: {
      audio: true, // only audio calls
      video: false,
    },
    pcConfig: {
      // rtcpMuxPolicy: 'negotiate',
    },
  };
  currentSession?.answer(callOptions);
}

export function terminate() {
  console.log('terminate current session: ', currentSession);
  isBusy = false;
  currentSession?.terminate();
  currentSession = undefined;
}

function terminateBusy(session: RTCSession) {
  let options = {
    status_code: 486,
    reason_phrase: 'Busy Here',
  };

  session.terminate(options);
}

function add_stream() {
  (currentSession?.connection as any).addEventListener(
    'addstream',
    function (e: any) {
      console.log('Stream: ', e.stream);
      // sipAudio.srcObject = e.stream;
      // sipAudio.playAsync();
    },
  );
}
