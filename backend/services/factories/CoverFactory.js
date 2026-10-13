// Factory Method: the caller asks for "a cover" and never needs to know
// whether it got an ExtractedCover (the PDF already had a title page) or a
// GeneratedCover (one rendered from title/author text).
class Cover {
  constructor({ type, url }) {
    this.type = type; // 'extracted' | 'generated'
    this.url = url;
  }
}

class CoverFactory {
  static create({ hasNativeCover, existingCoverUrl, title, author }) {
    if (hasNativeCover && existingCoverUrl) {
      return new Cover({ type: 'extracted', url: existingCoverUrl });
    }
    // In a real implementation this would render an SVG/canvas cover with
    // the title & author and upload it; here we return a deterministic
    // placeholder so the rest of the app has something to point at.
    const slug = encodeURIComponent(`${title} — ${author}`);
    return new Cover({ type: 'generated', url: `/covers/generated/${slug}.svg` });
  }
}

module.exports = { CoverFactory, Cover };
