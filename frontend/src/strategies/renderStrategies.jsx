import FlipbookRenderer from '../components/Reader/FlipbookRenderer';
import ScrollRenderer from '../components/Reader/ScrollRenderer';

// Strategy pattern: BookViewer picks a component from this map based on the
// active render mode instead of branching with if/else through its own
// JSX. Adding a "Focus Mode" later means adding one more entry here.
export const RENDER_STRATEGIES = {
  flipbook: FlipbookRenderer,
  scroll: ScrollRenderer,
};
