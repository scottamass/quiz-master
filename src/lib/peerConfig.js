// Shared PeerJS configuration and small diagnostics helper.
//
// Connectivity is the hard part of a serverless WebRTC app. The signaling
// handshake (via wss://0.peerjs.com) almost always succeeds, but the actual
// peer-to-peer DataChannel needs ICE to find a working network path. On open
// networks a STUN server is enough; on restrictive / corporate networks the
// only path that works is a TURN *relay*, and specifically TURN over TCP:443,
// which looks like normal HTTPS traffic and slips past most firewalls.
//
// We provide STUN + a public TURN relay (Open Relay by Metered, free) with
// UDP, TCP and TLS variants so ICE has the widest possible set of paths to try.
// This is what turns an intermittent / never-connecting DataChannel into a
// reliable one on locked-down networks.
export const PEER_CONFIG = {
  debug: 2,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turns:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
  },
}

// How long we wait for the peer-to-peer DataChannel before giving up.
export const CONNECT_TIMEOUT_MS = 20000

// If the DataChannel hasn't opened in this long, tear it down and retry once.
// WebRTC establishment is genuinely flaky; a single clean retry recovers most
// transient ICE failures without the user noticing.
export const DATACHANNEL_RETRY_MS = 7000

export function qlog(scope, ...args) {
  // eslint-disable-next-line no-console
  console.log(`[quiz:${scope}]`, ...args)
}
