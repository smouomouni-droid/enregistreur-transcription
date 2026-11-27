import { SpeechRecognition } from '@capgo/capacitor-speech-recognition';
import { Capacitor } from '@capacitor/core';

const $ = id => document.getElementById(id);

const startBtn = $('start');
const stopBtn = $('stop');
const result = $('result');
const status = $('status');

const copyBtn = $('copyText');
const saveBtn = $('saveText');
const downloadBtn = $('downloadText');
const clearBtn = $('clearHistory');

const themeSelect = $('theme');
const fontSelect = $('fontSize');
const autosaveCheck = $('autosave');

const isNative = Capacitor.isNativePlatform();

let listening = false;
let history = [];

function loadHistory() {
  try {
    history = JSON.parse(localStorage.getItem('transcription_history') || '[]');
    if (!Array.isArray(history)) history = [];
  } catch {
    history = [];
  }
}

function saveHistory() {
  localStorage.setItem('transcription_history', JSON.stringify(history));
}

function addHistory(text) {
  text = text.trim();
  if (!text) return;

  history.unshift({
    text,
    date: new Date().toLocaleString('fr-FR')
  });

  history = history.slice(0, 100);
  saveHistory();
  renderHistory();
}

function renderHistory() {
  const container = $('historyList');
  if (!container) return;

  container.replaceChildren();

  if (!history.length) {
    container.textContent = 'Aucune transcription enregistrée.';
    return;
  }

  history.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'card';

    const date = document.createElement('p');
    date.className = 'small';
    date.textContent = item.date;

    const text = document.createElement('p');
    text.textContent = item.text;

    const button = document.createElement('button');
    button.textContent = 'Ouvrir';
    button.className = 'secondary';
    button.onclick = () => {
      result.value = item.text;
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      $('home').classList.add('active');
      document.querySelectorAll('[data-page]').forEach(b => b.classList.remove('active'));
      document.querySelector('[data-page="home"]')?.classList.add('active');
      status.textContent = 'Transcription chargée.';
    };

    card.append(date, text, button);
    container.append(card);
  });
}

function applySettings() {
  const theme = localStorage.getItem('app_theme') || 'dark';
  const font = localStorage.getItem('app_font') || '16';
  const autosave = localStorage.getItem('app_autosave') !== 'false';
  const light = theme === 'light';

  themeSelect.value = theme;
  fontSelect.value = font;
  autosaveCheck.checked = autosave;

  document.body.style.background = light
    ? '#f2f5fa'
    : 'linear-gradient(145deg,#081426,#102b49)';
  document.body.style.color = light ? '#202b3c' : '#ffffff';

  document.querySelectorAll('.card').forEach(card => {
    card.style.background = light ? '#ffffff' : '#142b46';
    card.style.color = light ? '#202b3c' : '#ffffff';
    card.style.borderColor = light ? '#d5deea' : '#294665';
  });

  result.style.background = light ? '#ffffff' : '#091a2d';
  result.style.color = light ? '#202b3c' : '#ffffff';
  result.style.borderColor = light ? '#cbd5e1' : '#426184';
  result.style.fontSize = font + 'px';

  document.querySelectorAll('nav').forEach(nav => {
    nav.style.background = light ? '#ffffff' : '#091a2d';
    nav.style.borderColor = light ? '#d5deea' : '#294665';
  });

  document.querySelectorAll('nav button').forEach(button => {
    button.style.color = light ? '#334155' : '#a9c5e8';
  });

  document.querySelectorAll('select').forEach(select => {
    select.style.background = light ? '#ffffff' : '#091a2d';
    select.style.color = light ? '#202b3c' : '#ffffff';
    select.style.borderColor = light ? '#cbd5e1' : '#426184';
  });

  document.querySelectorAll('.small, #status, header p').forEach(element => {
    element.style.color = light ? '#526176' : '#a9c5e8';
  });
}

themeSelect.onchange = () => {
  localStorage.setItem('app_theme', themeSelect.value);
  applySettings();
};

fontSelect.onchange = () => {
  localStorage.setItem('app_font', fontSelect.value);
  applySettings();
};

autosaveCheck.onchange = () => {
  localStorage.setItem('app_autosave', String(autosaveCheck.checked));
};

document.querySelectorAll('[data-page]').forEach(button => {
  button.onclick = () => {
    const page = button.dataset.page;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    $(page)?.classList.add('active');

    document.querySelectorAll('[data-page]').forEach(b => b.classList.remove('active'));
    button.classList.add('active');

    if (page === 'history') renderHistory();
  };
});

if (!isNative) {
  status.textContent = 'Installe l’APK Android pour utiliser la reconnaissance vocale.';
}

SpeechRecognition.addListener('partialResults', event => {
  const text = event.accumulatedText ||
    ((event.accumulated || '') + ' ' + (event.matches?.[0] || '')).trim();

  if (text) result.value = text;
});

SpeechRecognition.addListener('error', event => {
  listening = false;
  status.textContent = 'Erreur vocale : ' + (event.message || 'service indisponible');
  startBtn.disabled = false;
  stopBtn.disabled = true;
});

startBtn.onclick = async () => {
  try {
    if (!isNative) {
      throw new Error('Cette fonction nécessite l’APK Android.');
    }

    const permission = await SpeechRecognition.requestPermissions();

    if (permission.speechRecognition !== 'granted') {
      throw new Error('Autorisation de reconnaissance vocale refusée.');
    }

    const available = await SpeechRecognition.available();

    if (!available.available) {
      throw new Error('Aucun service de reconnaissance vocale disponible.');
    }

    result.value = '';

    await SpeechRecognition.start({
      language: 'fr-FR',
      partialResults: true,
      popup: false,
      maxResults: 5,
      keepListeningMs: 60000
    });

    listening = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    status.textContent = 'Je t’écoute... Parle maintenant.';

  } catch (error) {
    status.textContent = 'Erreur : ' + error.message;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
};

stopBtn.onclick = async () => {
  try {
    if (listening) {
      await SpeechRecognition.stop();
    }

    listening = false;

    const last = await SpeechRecognition.getLastPartialResult();

    if (last.available && last.text) {
      result.value = last.text;
    }

    status.textContent = result.value.trim()
      ? 'Transcription terminée !'
      : 'Aucune parole reconnue. Réessaie.';

    if (result.value.trim() && autosaveCheck.checked) {
      addHistory(result.value);
    }

  } catch (error) {
    status.textContent = 'Erreur : ' + error.message;
  } finally {
    listening = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
};

copyBtn.onclick = async () => {
  const text = result.value.trim();

  if (!text) {
    status.textContent = 'Aucun texte à copier.';
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    status.textContent = 'Texte copié !';
  } catch {
    result.select();
    const copied = document.execCommand('copy');
    status.textContent = copied ? 'Texte copié !' : 'Copie impossible.';
  }
};

saveBtn.onclick = () => {
  if (!result.value.trim()) {
    status.textContent = 'Aucun texte à enregistrer.';
    return;
  }

  addHistory(result.value);
  status.textContent = 'Transcription enregistrée dans l’historique.';
};

downloadBtn.onclick = () => {
  if (!result.value.trim()) {
    status.textContent = 'Aucun texte à télécharger.';
    return;
  }

  const blob = new Blob([result.value], {
    type: 'text/plain;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'ma-transcription.txt';
  link.click();

  URL.revokeObjectURL(url);
  status.textContent = 'Téléchargement terminé.';
};

clearBtn.onclick = () => {
  if (!history.length) {
    status.textContent = 'L’historique est déjà vide.';
    return;
  }

  history = [];
  saveHistory();
  renderHistory();
  status.textContent = 'Historique effacé.';
};

loadHistory();
applySettings();
renderHistory();

stopBtn.disabled = true;
