import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export const BACKGROUND_MUSIC_OPTIONS = [
  'Rain Drip',
  '40 Hz Binaural Beats',
  'Cafe Ambience',
  'Mute',
];

const MUSIC_KEY = 'katha_background_music';
const VOLUME_KEY = 'katha_background_music_volume';
const DEFAULT_VOLUME = 0.35;
const BackgroundMusicContext = createContext(null);

function getStoredMusic() {
  const stored = localStorage.getItem(MUSIC_KEY);
  return BACKGROUND_MUSIC_OPTIONS.includes(stored) ? stored : 'Mute';
}

function getStoredVolume() {
  const value = localStorage.getItem(VOLUME_KEY);
  if (value === null) return DEFAULT_VOLUME;
  const stored = Number(value);
  return Number.isFinite(stored) ? Math.min(1, Math.max(0, stored)) : DEFAULT_VOLUME;
}

export function BackgroundMusicProvider({ children }) {
  const [music, setMusic] = useState(getStoredMusic);
  const [volume, setVolume] = useState(getStoredVolume);
  const [playbackError, setPlaybackError] = useState('');
  const musicRef = useRef(music);
  const volumeRef = useRef(volume);
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const activeMusicRef = useRef('Mute');
  const stopTrackRef = useRef(null);

  const stopTrack = useCallback(() => {
    stopTrackRef.current?.();
    stopTrackRef.current = null;
    activeMusicRef.current = 'Mute';
  }, []);

  const playMusic = useCallback((selection) => {
    if (selection === 'Mute') {
      stopTrack();
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      setPlaybackError('Background music is not supported by this browser.');
      return;
    }

    let audioContext = audioContextRef.current;
    try {
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;
        const masterGain = audioContext.createGain();
        masterGain.gain.value = volumeRef.current;
        masterGain.connect(audioContext.destination);
        masterGainRef.current = masterGain;
      }

      if (activeMusicRef.current !== selection) {
        stopTrack();
        stopTrackRef.current = createMusicTrack(
          audioContext,
          masterGainRef.current,
          selection
        );
        activeMusicRef.current = selection;
      }

      void audioContext.resume().then(() => setPlaybackError('')).catch((error) => {
        setPlaybackError(`Background music could not start: ${error.message}`);
      });
    } catch (error) {
      stopTrack();
      setPlaybackError(`Background music could not start: ${error.message}`);
    }
  }, [stopTrack]);

  const setMusicTheme = useCallback((selection) => {
    if (!BACKGROUND_MUSIC_OPTIONS.includes(selection)) return;
    musicRef.current = selection;
    localStorage.setItem(MUSIC_KEY, selection);
    setMusic(selection);
    setPlaybackError('');
    playMusic(selection);
  }, [playMusic]);

  const setMusicVolume = useCallback((nextVolume) => {
    const normalized = Math.min(1, Math.max(0, Number(nextVolume)));
    if (!Number.isFinite(normalized)) return;
    volumeRef.current = normalized;
    localStorage.setItem(VOLUME_KEY, String(normalized));
    setVolume(normalized);
    const gain = masterGainRef.current?.gain;
    const audioContext = audioContextRef.current;
    if (gain && audioContext && audioContext.state !== 'closed') {
      gain.setTargetAtTime(normalized, audioContext.currentTime, 0.03);
    }
  }, []);

  useEffect(() => {
    const activateSavedMusic = () => {
      if (musicRef.current !== 'Mute') playMusic(musicRef.current);
    };
    document.addEventListener('pointerdown', activateSavedMusic, { once: true });
    document.addEventListener('keydown', activateSavedMusic, { once: true });
    return () => {
      document.removeEventListener('pointerdown', activateSavedMusic);
      document.removeEventListener('keydown', activateSavedMusic);
    };
  }, [playMusic]);

  useEffect(() => () => {
    stopTrack();
    const audioContext = audioContextRef.current;
    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close().catch((error) => {
        console.error('Could not close background music audio context:', error);
      });
    }
    audioContextRef.current = null;
    masterGainRef.current = null;
  }, [stopTrack]);

  const value = useMemo(() => ({
    music,
    setMusicTheme,
    volume,
    setMusicVolume,
    playbackError,
  }), [music, setMusicTheme, volume, setMusicVolume, playbackError]);

  return (
    <BackgroundMusicContext.Provider value={value}>
      {children}
    </BackgroundMusicContext.Provider>
  );
}

export function useBackgroundMusic() {
  const value = useContext(BackgroundMusicContext);
  if (!value) throw new Error('useBackgroundMusic must be used within BackgroundMusicProvider');
  return value;
}

function createMusicTrack(audioContext, output, selection) {
  const nodes = [];
  let intervalId;
  let stopped = false;
  const trackNode = (node) => {
    nodes.push(node);
    return node;
  };

  if (selection === '40 Hz Binaural Beats') {
    [[200, -1], [240, 1]].forEach(([frequency, pan]) => {
      const oscillator = trackNode(audioContext.createOscillator());
      const gain = trackNode(audioContext.createGain());
      const panner = trackNode(audioContext.createStereoPanner());
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      panner.pan.value = pan;
      gain.gain.value = 0.04;
      oscillator.connect(gain).connect(panner).connect(output);
      oscillator.start();
    });
  } else {
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 3, audioContext.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = Math.random() * 2 - 1;
    }

    const noise = trackNode(audioContext.createBufferSource());
    noise.buffer = buffer;
    noise.loop = true;
    if (selection === 'Rain Drip') {
      const filter = trackNode(audioContext.createBiquadFilter());
      const gain = trackNode(audioContext.createGain());
      filter.type = 'lowpass';
      filter.frequency.value = 1800;
      gain.gain.value = 0.055;
      noise.connect(filter).connect(gain).connect(output);
      noise.start();
      intervalId = window.setInterval(() => {
        if (stopped) return;
        const drop = audioContext.createOscillator();
        const dropGain = audioContext.createGain();
        drop.type = 'sine';
        drop.frequency.setValueAtTime(1700 + Math.random() * 1000, audioContext.currentTime);
        dropGain.gain.setValueAtTime(0.012, audioContext.currentTime);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.045);
        drop.connect(dropGain).connect(output);
        drop.onended = () => {
          drop.disconnect();
          dropGain.disconnect();
        };
        drop.start();
        drop.stop(audioContext.currentTime + 0.05);
      }, 220 + Math.random() * 280);
    } else {
      const chatterFilter = trackNode(audioContext.createBiquadFilter());
      const chatterGain = trackNode(audioContext.createGain());
      const roomFilter = trackNode(audioContext.createBiquadFilter());
      const roomGain = trackNode(audioContext.createGain());
      chatterFilter.type = 'bandpass';
      chatterFilter.frequency.value = 850;
      chatterFilter.Q.value = 0.6;
      chatterGain.gain.value = 0.035;
      roomFilter.type = 'lowpass';
      roomFilter.frequency.value = 260;
      roomGain.gain.value = 0.025;
      noise.connect(chatterFilter).connect(chatterGain).connect(output);
      noise.connect(roomFilter).connect(roomGain).connect(output);
      noise.start();
      intervalId = window.setInterval(() => {
        chatterFilter.frequency.setTargetAtTime(
          500 + Math.random() * 900,
          audioContext.currentTime,
          1.5
        );
      }, 1800);
    }
  }

  return () => {
    if (stopped) return;
    stopped = true;
    if (intervalId) window.clearInterval(intervalId);
    for (const node of nodes.reverse()) {
      if (typeof node.stop === 'function') node.stop();
      node.disconnect();
    }
  };
}
