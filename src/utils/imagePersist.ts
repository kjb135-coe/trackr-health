import * as FileSystem from 'expo-file-system/legacy';

const IMAGE_DIR = `${FileSystem.documentDirectory}images/`;

/**
 * Copies an image from a temporary URI to a permanent app directory.
 * Returns the persisted URI, or the original if persistence fails.
 */
export async function persistImage(tempUri: string): Promise<string> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const destUri = `${IMAGE_DIR}${filename}`;

    await FileSystem.copyAsync({ from: tempUri, to: destUri });
    return destUri;
  } catch {
    // Fall back to original URI if persistence fails
    return tempUri;
  }
}
