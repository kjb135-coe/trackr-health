import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useImagePicker } from '@/src/hooks/useImagePicker';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useImagePicker', () => {
  describe('takePhoto', () => {
    it('returns uri when camera permission granted and photo taken', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///photo.jpg' }],
      });

      const { result } = renderHook(() => useImagePicker());
      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.takePhoto();
      });

      expect(uri).toBe('file:///photo.jpg');
    });

    it('returns null and shows alert when camera permission denied', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: false,
      });

      const { result } = renderHook(() => useImagePicker());
      let uri: string | null = 'initial';
      await act(async () => {
        uri = await result.current.takePhoto();
      });

      expect(uri).toBeNull();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission needed',
        'Please grant camera permission.',
      );
      expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    });

    it('returns null when photo is canceled', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({ canceled: true });

      const { result } = renderHook(() => useImagePicker());
      let uri: string | null = 'initial';
      await act(async () => {
        uri = await result.current.takePhoto();
      });

      expect(uri).toBeNull();
    });

    it('uses custom permission message', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: false,
      });

      const { result } = renderHook(() => useImagePicker());
      await act(async () => {
        await result.current.takePhoto({
          permissionMessage: 'Camera access needed for scanning.',
        });
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission needed',
        'Camera access needed for scanning.',
      );
    });

    it('passes allowsEditing and aspect to launchCameraAsync', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({ canceled: true });

      const { result } = renderHook(() => useImagePicker());
      await act(async () => {
        await result.current.takePhoto({ allowsEditing: true, aspect: [4, 3] });
      });

      expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(
        expect.objectContaining({ allowsEditing: true, aspect: [4, 3] }),
      );
    });
  });

  describe('pickImage', () => {
    it('returns uri when library permission granted and image picked', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///gallery.jpg' }],
      });

      const { result } = renderHook(() => useImagePicker());
      let uri: string | null = null;
      await act(async () => {
        uri = await result.current.pickImage();
      });

      expect(uri).toBe('file:///gallery.jpg');
    });

    it('returns null and shows alert when library permission denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: false,
      });

      const { result } = renderHook(() => useImagePicker());
      let uri: string | null = 'initial';
      await act(async () => {
        uri = await result.current.pickImage();
      });

      expect(uri).toBeNull();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission needed',
        'Please grant photo library permission.',
      );
      expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
    });

    it('returns null when image pick is canceled', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true });

      const { result } = renderHook(() => useImagePicker());
      let uri: string | null = 'initial';
      await act(async () => {
        uri = await result.current.pickImage();
      });

      expect(uri).toBeNull();
    });
  });
});
