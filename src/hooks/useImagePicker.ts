import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { IMAGE_QUALITY } from '@/src/utils/constants';

interface PickerOptions {
  permissionMessage?: string;
  allowsEditing?: boolean;
  aspect?: [number, number];
}

export function useImagePicker() {
  const takePhoto = useCallback(async (options: PickerOptions = {}): Promise<string | null> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        options.permissionMessage || 'Please grant camera permission.',
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: IMAGE_QUALITY,
      ...(options.allowsEditing !== undefined && { allowsEditing: options.allowsEditing }),
      ...(options.aspect && { aspect: options.aspect }),
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  }, []);

  const pickImage = useCallback(async (options: PickerOptions = {}): Promise<string | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        options.permissionMessage || 'Please grant photo library permission.',
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: IMAGE_QUALITY,
      ...(options.allowsEditing !== undefined && { allowsEditing: options.allowsEditing }),
      ...(options.aspect && { aspect: options.aspect }),
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  }, []);

  return { takePhoto, pickImage };
}
