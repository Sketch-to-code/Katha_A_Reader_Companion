import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export const BACKGROUND_MUSIC_OPTIONS = [
  'Rain Drip',
  'Cafe Ambience',
  'Deep Focus Noise',
  '40 Hz Binaural Beats',
  'Custom Audio',
  'Mute',
];

const MUSIC_KEY = 'katha_background_music';
const VOLUME_KEY = 'katha_background_music_volume';
const DEFAULT_VOLUME = 0.45;
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
  const [isPlaying, setIsPlaying] = useState(false); // always start paused; user must click Play
  const [playbackError, setPlaybackError] = useState('');
  const [customAudioName, setCustomAudioName] = useState('');

  const musicRef = useRef(music);
  const volumeRef = useRef(volume);
  const isPlayingRef = useRef(isPlaying);
  const customAudioUrlRef = useRef(null);
  const customAudioElRef = useRef(null);

  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const activeMusicRef = useRef('Mute');
  const stopTrackRef = useRef(null);

  // Full teardown only when changing soundscape or unmounting
  const teardownTrack = useCallback(() => {
    stopTrackRef.current?.();
    stopTrackRef.current = null;
    if (customAudioElRef.current) {
      customAudioElRef.current.pause();
      customAudioElRef.current.currentTime = 0;
    }
    activeMusicRef.current = 'Mute';
  }, []);

  // Pause without resetting timestamp
  const pausePlayback = useCallback(() => {
    if (activeMusicRef.current === 'Custom Audio' && customAudioElRef.current) {
      customAudioElRef.current.pause();
    } else if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend().catch(() => {});
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, []);

  const playMusic = useCallback((selection) => {
    if (selection === 'Mute') {
      teardownTrack();
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    if (selection === 'Custom Audio') {
      if (!customAudioUrlRef.current) {
        setPlaybackError('Please upload an audio file first.');
        return;
      }

      let audio = customAudioElRef.current;
      if (!audio) {
        audio = new Audio(customAudioUrlRef.current);
        audio.loop = true;
        customAudioElRef.current = audio;
      }
      audio.volume = volumeRef.current;

      // Resume from current timestamp
      audio.play().then(() => {
        setIsPlaying(true);
        isPlayingRef.current = true;
        setPlaybackError('');
        activeMusicRef.current = 'Custom Audio';
      }).catch((err) => {
        setPlaybackError(`Custom audio playback error: ${err.message}`);
      });
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

      // If already created and simply suspended, resume without resetting
      if (activeMusicRef.current === selection && audioContext.state === 'suspended') {
        void audioContext.resume().then(() => {
          setPlaybackError('');
          setIsPlaying(true);
          isPlayingRef.current = true;
        }).catch((error) => {
          setPlaybackError(`Background music could not resume: ${error.message}`);
        });
        return;
      }

      // If switching soundscapes, teardown previous and create new
      if (activeMusicRef.current !== selection) {
        teardownTrack();
        stopTrackRef.current = createMusicTrack(
          audioContext,
          masterGainRef.current,
          selection
        );
        activeMusicRef.current = selection;
      }

      void audioContext.resume().then(() => {
        setPlaybackError('');
        setIsPlaying(true);
        isPlayingRef.current = true;
      }).catch((error) => {
        setPlaybackError(`Background music could not start: ${error.message}`);
      });
    } catch (error) {
      teardownTrack();
      setPlaybackError(`Background music could not start: ${error.message}`);
    }
  }, [teardownTrack]);

  const setMusicTheme = useCallback((selection) => {
    if (!BACKGROUND_MUSIC_OPTIONS.includes(selection)) return;
    const isDifferentTrack = selection !== musicRef.current;
    musicRef.current = selection;
    localStorage.setItem(MUSIC_KEY, selection);
    setMusic(selection);
    setPlaybackError('');

    if (selection === 'Mute') {
      teardownTrack();
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      if (isDifferentTrack) {
        teardownTrack();
      }
      playMusic(selection);
    }
  }, [playMusic, teardownTrack]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      // Pause, keeping exact timestamp
      pausePlayback();
    } else {
      // Resume from exact timestamp
      const target = musicRef.current === 'Mute' ? 'Rain Drip' : musicRef.current;
      playMusic(target);
    }
  }, [pausePlayback, playMusic]);

  const setMusicVolume = useCallback((nextVolume) => {
    const normalized = Math.min(1, Math.max(0, Number(nextVolume)));
    if (!Number.isFinite(normalized)) return;
    volumeRef.current = normalized;
    localStorage.setItem(VOLUME_KEY, String(normalized));
    setVolume(normalized);

    if (customAudioElRef.current) {
      customAudioElRef.current.volume = normalized;
    }

    const gain = masterGainRef.current?.gain;
    const audioContext = audioContextRef.current;
    if (gain && audioContext && audioContext.state !== 'closed') {
      gain.setTargetAtTime(normalized, audioContext.currentTime, 0.03);
    }
  }, []);

  const uploadCustomAudio = useCallback((file) => {
    if (!file) return;
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-wav'];
    const hasValidExt = /\.(mp3|wav|ogg)$/i.test(file.name);
    if (!validTypes.includes(file.type) && !hasValidExt) {
      setPlaybackError('Please upload an audio file (.mp3, .wav, or .ogg).');
      return;
    }

    if (customAudioUrlRef.current) {
      URL.revokeObjectURL(customAudioUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    customAudioUrlRef.current = url;
    setCustomAudioName(file.name);

    if (customAudioElRef.current) {
      customAudioElRef.current.pause();
    }
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = volumeRef.current;
    customAudioElRef.current = audio;

    setMusicTheme('Custom Audio');
  }, [setMusicTheme]);

  useEffect(() => {
    const activateSavedMusic = () => {
      if (musicRef.current !== 'Mute' && isPlayingRef.current) {
        playMusic(musicRef.current);
      }
    };
    document.addEventListener('pointerdown', activateSavedMusic, { once: true });
    document.addEventListener('keydown', activateSavedMusic, { once: true });
    return () => {
      document.removeEventListener('pointerdown', activateSavedMusic);
      document.removeEventListener('keydown', activateSavedMusic);
    };
  }, [playMusic]);

  useEffect(() => () => {
    teardownTrack();
    if (customAudioUrlRef.current) {
      URL.revokeObjectURL(customAudioUrlRef.current);
    }
    const audioContext = audioContextRef.current;
    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close().catch((error) => {
        console.error('Could not close background music audio context:', error);
      });
    }
    audioContextRef.current = null;
    masterGainRef.current = null;
  }, [teardownTrack]);

  const value = useMemo(() => ({
    music,
    setMusicTheme,
    volume,
    setMusicVolume,
    isPlaying,
    togglePlay,
    play: () => {
      const target = music === 'Mute' ? 'Rain Drip' : music;
      playMusic(target);
    },
    pause: pausePlayback,
    uploadCustomAudio,
    customAudioName,
    playbackError,
  }), [music, setMusicTheme, volume, setMusicVolume, isPlaying, togglePlay, playMusic, pausePlayback, uploadCustomAudio, customAudioName, playbackError]);

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
      gain.gain.value = 0.05;
      oscillator.connect(gain).connect(panner).connect(output);
      oscillator.start();
    });
  } else if (selection === 'Deep Focus Noise') {
    // Rich velvety brown noise
    const bufferSize = audioContext.sampleRate * 4;
    const buffer = audioContext.createBuffer(2, bufferSize, audioContext.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i += 1) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Gain compensation
      }
    }
    const noise = trackNode(audioContext.createBufferSource());
    noise.buffer = buffer;
    noise.loop = true;
    const filter = trackNode(audioContext.createBiquadFilter());
    filter.type = 'lowpass';
    filter.frequency.value = 450;
    const gain = trackNode(audioContext.createGain());
    gain.gain.value = 0.12;
    noise.connect(filter).connect(gain).connect(output);
    noise.start();
  } else {
    // 3 seconds of white noise buffer
    const buffer = audioContext.createBuffer(2, audioContext.sampleRate * 3, audioContext.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const samples = buffer.getChannelData(channel);
      for (let index = 0; index < samples.length; index += 1) {
        samples[index] = Math.random() * 2 - 1;
      }
    }

    const noise = trackNode(audioContext.createBufferSource());
    noise.buffer = buffer;
    noise.loop = true;

    if (selection === 'Rain Drip') {
      const rumble = trackNode(audioContext.createBiquadFilter());
      const rumbleGain = trackNode(audioContext.createGain());
      rumble.type = 'lowpass';
      rumble.frequency.value = 1600;
      rumbleGain.gain.value = 0.06;

      const softHiss = trackNode(audioContext.createBiquadFilter());
      const hissGain = trackNode(audioContext.createGain());
      softHiss.type = 'bandpass';
      softHiss.frequency.value = 3200;
      softHiss.Q.value = 0.8;
      hissGain.gain.value = 0.035;

      noise.connect(rumble).connect(rumbleGain).connect(output);
      noise.connect(softHiss).connect(hissGain).connect(output);
      noise.start();

      intervalId = window.setInterval(() => {
        if (stopped) return;
        const drop = audioContext.createOscillator();
        const dropGain = audioContext.createGain();
        const panner = audioContext.createStereoPanner ? audioContext.createStereoPanner() : null;
        drop.type = 'sine';
        const startFreq = 1600 + Math.random() * 1200;
        drop.frequency.setValueAtTime(startFreq, audioContext.currentTime);
        drop.frequency.exponentialRampToValueAtTime(startFreq * 0.4, audioContext.currentTime + 0.045);
        dropGain.gain.setValueAtTime(0.016, audioContext.currentTime);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.045);

        if (panner) {
          panner.pan.value = Math.random() * 1.6 - 0.8;
          drop.connect(dropGain).connect(panner).connect(output);
        } else {
          drop.connect(dropGain).connect(output);
        }

        drop.onended = () => {
          drop.disconnect();
          dropGain.disconnect();
          panner?.disconnect();
        };
        drop.start();
        drop.stop(audioContext.currentTime + 0.05);
      }, 180 + Math.random() * 240);
    } else {
      // Cafe Ambience
      const chatterFilter = trackNode(audioContext.createBiquadFilter());
      const chatterGain = trackNode(audioContext.createGain());
      const roomFilter = trackNode(audioContext.createBiquadFilter());
      const roomGain = trackNode(audioContext.createGain());
      chatterFilter.type = 'bandpass';
      chatterFilter.frequency.value = 850;
      chatterFilter.Q.value = 0.6;
      chatterGain.gain.value = 0.04;
      roomFilter.type = 'lowpass';
      roomFilter.frequency.value = 320;
      roomGain.gain.value = 0.03;
      noise.connect(chatterFilter).connect(chatterGain).connect(output);
      noise.connect(roomFilter).connect(roomGain).connect(output);
      noise.start();

      // Ambient cafe movement/chimes
      intervalId = window.setInterval(() => {
        if (stopped) return;
        chatterFilter.frequency.setTargetAtTime(
          480 + Math.random() * 800,
          audioContext.currentTime,
          1.2
        );

        // Occasional porcelain clink
        if (Math.random() > 0.6) {
          const clink = audioContext.createOscillator();
          const clinkGain = audioContext.createGain();
          clink.type = 'triangle';
          clink.frequency.setValueAtTime(2600 + Math.random() * 800, audioContext.currentTime);
          clinkGain.gain.setValueAtTime(0.008, audioContext.currentTime);
          clinkGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.08);
          clink.connect(clinkGain).connect(output);
          clink.onended = () => {
            clink.disconnect();
            clinkGain.disconnect();
          };
          clink.start();
          clink.stop(audioContext.currentTime + 0.09);
        }
      }, 1600);
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
