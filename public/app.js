import { SpeechRecognition } from '@capgo/capacitor-speech-recognition';
import { Capacitor } from '@capacitor/core';

const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const audioBtn = document.getElementById("audio");
const downloadTextBtn = document.getElementById("downloadText");
const result = document.getElementById("result");
const status = document.getElementById("status");

let audioBlob = null;
let mediaRecorder = null;
let chunks = [];

const isNative = Capacitor.isNativePlatform();

if (!isNative) {
  status.textContent = "Installe l'APK Android pour utiliser la reconnaissance vocale.";
}

SpeechRecognition.addListener("partialResults", (event) => {
  const text = event.accumulatedText ||
    ((event.accumulated || "") + " " + (event.matches?.[0] || "")).trim();

  if (text) result.value = text;
});

SpeechRecognition.addListener("error", (event) => {
  status.textContent = "Erreur vocale : " + event.message;
  startBtn.disabled = false;
  stopBtn.disabled = true;
});

startBtn.onclick = async () => {
  try {
    if (!isNative) {
      throw new Error("Cette fonction nécessite l'APK Android.");
    }

    const permission = await SpeechRecognition.requestPermissions();

    if (permission.speechRecognition !== "granted") {
      throw new Error("Autorisation du microphone refusée.");
    }

    const available = await SpeechRecognition.available();

    if (!available.available) {
      throw new Error("Aucun service de reconnaissance vocale disponible.");
    }

    chunks = [];
    audioBlob = null;
    result.value = "";

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    mediaRecorder.start();

    await SpeechRecognition.start({
      language: "fr-FR",
      partialResults: true,
      popup: false,
      maxResults: 5,
      keepListeningMs: 60000
    });

    startBtn.disabled = true;
    stopBtn.disabled = false;
    audioBtn.disabled = true;
    status.textContent = "Je t'écoute... Parle maintenant.";

  } catch (error) {
    status.textContent = "Erreur : " + error.message;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
};

stopBtn.onclick = async () => {
  try {
    await SpeechRecognition.stop();

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      await new Promise((resolve) => {
        mediaRecorder.onstop = resolve;
        mediaRecorder.stop();
      });
    }

    if (mediaRecorder?.stream) {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    if (chunks.length) {
      audioBlob = new Blob(chunks, {
        type: mediaRecorder.mimeType || "audio/webm"
      });
      audioBtn.disabled = false;
    }

    const last = await SpeechRecognition.getLastPartialResult();

    if (last.available && last.text) {
      result.value = last.text;
    }

    status.textContent = result.value
      ? "Transcription terminée !"
      : "Aucune parole reconnue. Réessaie.";

  } catch (error) {
    status.textContent = "Erreur : " + error.message;
  } finally {
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
};

audioBtn.onclick = () => {
  if (!audioBlob) return;

  const url = URL.createObjectURL(audioBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mon-enregistrement.webm";
  link.click();
  URL.revokeObjectURL(url);
};

downloadTextBtn.onclick = () => {
  if (!result.value.trim()) {
    status.textContent = "Il n'y a pas encore de texte à télécharger.";
    return;
  }

  const blob = new Blob([result.value], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ma-transcription.txt";
  link.click();
  URL.revokeObjectURL(url);
};
