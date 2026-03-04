export function getMediaType(uri: string): 'image/png' | 'image/jpeg' {
  return uri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
}
