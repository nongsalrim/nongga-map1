/**
 * @file urlCodec.js
 * @description URL-safe Base64 encoding/decoding utility for 1:1 farm shareable link parameters
 */

export function encodeFarmData(obj) {
  if (!obj) return '';
  try {
    const jsonStr = JSON.stringify(obj);
    const encoded = encodeURIComponent(jsonStr);
    const base64 = btoa(encoded);
    // Convert to URL-safe Base64 (replace +, / with -, _ and strip =)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (e) {
    console.error('encodeFarmData error:', e);
    return '';
  }
}

export function decodeFarmData(str) {
  if (!str || typeof str !== 'string') return null;
  try {
    // Restore standard Base64 padding and characters
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) {
      base64 += '='.repeat(4 - pad);
    }
    const decodedStr = atob(base64);
    const jsonStr = decodeURIComponent(decodedStr);
    return JSON.parse(jsonStr);
  } catch (e) {
    // Try direct decodeURIComponent fallback if not base64
    try {
      const jsonStr = decodeURIComponent(str);
      return JSON.parse(jsonStr);
    } catch (e2) {
      console.warn('decodeFarmData parsing failed:', e2);
      return null;
    }
  }
}
