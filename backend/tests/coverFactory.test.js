'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { CoverFactory, Cover } = require('../services/factories/CoverFactory');

test('CoverFactory.create returns an extracted cover when hasNativeCover and existingCoverUrl are set', () => {
  const cover = CoverFactory.create({
    hasNativeCover: true,
    existingCoverUrl: 'https://cdn.example.com/covers/book1.jpg',
    title: 'Dune',
    author: 'Frank Herbert',
  });
  assert.ok(cover instanceof Cover);
  assert.equal(cover.type, 'extracted');
  assert.equal(cover.url, 'https://cdn.example.com/covers/book1.jpg');
});

test('CoverFactory.create generates a cover when hasNativeCover is false', () => {
  const cover = CoverFactory.create({
    hasNativeCover: false,
    existingCoverUrl: null,
    title: 'Dune',
    author: 'Frank Herbert',
  });
  assert.equal(cover.type, 'generated');
  assert.ok(typeof cover.url === 'string');
  assert.ok(cover.url.startsWith('/covers/generated/'));
  assert.ok(cover.url.endsWith('.svg'));
});

test('CoverFactory.create generates a cover when both flags are missing (falsy)', () => {
  const cover = CoverFactory.create({ title: 'My Book', author: 'Unknown' });
  assert.equal(cover.type, 'generated');
});

test('CoverFactory.create encodes special characters in the generated cover URL', () => {
  const cover = CoverFactory.create({
    hasNativeCover: false,
    title: 'Title & More',
    author: 'Auth/Or',
  });
  // URL must not contain raw & or /
  assert.ok(!cover.url.slice('/covers/generated/'.length).includes('&'));
});

test('CoverFactory.create returns a generated cover when hasNativeCover is true but existingCoverUrl is missing', () => {
  const cover = CoverFactory.create({
    hasNativeCover: true,
    existingCoverUrl: null,
    title: 'Ghost',
    author: 'Someone',
  });
  assert.equal(cover.type, 'generated');
});

