const TRACKS = {
  rain: { label: 'Rain', url: '/audio/rain.mp3', loopSec: 180 },
  ocean: { label: 'Ocean', url: '/audio/ocean.mp3', loopSec: 240 },
  forest: { label: 'Forest', url: '/audio/forest.mp3', loopSec: 200 },
  lofi: { label: 'Lo-fi', url: '/audio/lofi.mp3', loopSec: 210 },
  none: { label: 'None', url: null, loopSec: 0 },
};

// Factory Method: calling code asks SoundscapeFactory.create('rain') and
// gets back the right track bundle without knowing the concrete asset
// layout or needing a big switch statement of its own.
class SoundscapeFactory {
  static create(theme) {
    return TRACKS[theme] || TRACKS.none;
  }

  static list() {
    return Object.keys(TRACKS);
  }
}

module.exports = SoundscapeFactory;
