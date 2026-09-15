/**
 * Peer connection setup shared by the video call UI (Phase 2+). Documents the
 * contract now so `server/websocket/video-signaling.ts` and the eventual
 * `components/video/*` UI agree on shape without inventing it twice.
 */
const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export function createPeerConnection(onIceCandidate: (candidate: RTCIceCandidate) => void) {
  const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  connection.onicecandidate = (event) => {
    if (event.candidate) onIceCandidate(event.candidate);
  };
  return connection;
}

export async function createOffer(connection: RTCPeerConnection) {
  const offer = await connection.createOffer();
  await connection.setLocalDescription(offer);
  return offer;
}

export async function createAnswer(connection: RTCPeerConnection, offer: RTCSessionDescriptionInit) {
  await connection.setRemoteDescription(offer);
  const answer = await connection.createAnswer();
  await connection.setLocalDescription(answer);
  return answer;
}
