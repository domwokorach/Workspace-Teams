export async function listMediaDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return {
    cameras: devices.filter((d) => d.kind === "videoinput"),
    microphones: devices.filter((d) => d.kind === "audioinput"),
    speakers: devices.filter((d) => d.kind === "audiooutput"),
  };
}

export function getUserMedia(deviceIds: { cameraId?: string; microphoneId?: string }) {
  return navigator.mediaDevices.getUserMedia({
    video: deviceIds.cameraId ? { deviceId: { exact: deviceIds.cameraId } } : true,
    audio: deviceIds.microphoneId ? { deviceId: { exact: deviceIds.microphoneId } } : true,
  });
}
