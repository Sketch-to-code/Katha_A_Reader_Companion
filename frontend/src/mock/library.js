export const MOCK_BOOKS = [
  {
    _id: 'doc-1',
    title: 'The Wind-Up Bird Chronicle',
    author: 'Haruki Murakami',
    pageCount: 607,
    lastPageRead: 214,
    coverColor: '#3c4a5e',
    lastOpenedAt: new Date().toISOString(),
  },
  {
    _id: 'doc-2',
    title: 'Design Patterns',
    author: 'Gamma, Helm, Johnson, Vlissides',
    pageCount: 395,
    lastPageRead: 42,
    coverColor: '#6d4c3d',
    lastOpenedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'doc-3',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    pageCount: 256,
    lastPageRead: 0,
    coverColor: '#2f3b52',
    lastOpenedAt: null,
  },
  {
    _id: 'doc-4',
    title: 'Norwegian Wood',
    author: 'Haruki Murakami',
    pageCount: 296,
    lastPageRead: 88,
    coverColor: '#4a5d3a',
    lastOpenedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

export const MOCK_PAGE_TEXT = {
  left: `The rain had been falling since morning, a fine, deliberate rain that seemed to have no intention of stopping. Toru sat by the window watching the drops trace their slow paths down the glass, each one following the last as if along a route already decided.`,
  right: `He thought about the letter again — not its words exactly, but the shape it had left behind, the way a stone leaves a shape in water long after it has sunk. Some things are like that: the object disappears, but the disturbance remains.`,
};
