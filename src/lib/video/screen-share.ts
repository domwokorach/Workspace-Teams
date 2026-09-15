export function getDisplayMedia() {
  return navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
}

export function replaceVideoTrack(connection: RTCPeerConnection, track: MediaStreamTrack) {
  const sender = connection.getSenders().find((s) => s.track?.kind === "video");
  return sender?.replaceTrack(track);
}
