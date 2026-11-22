import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { api } from '../utils/api';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { LoadingScreen } from '../components/LoadingScreen';

export const CreateItemScreen = ({ navigation, route }) => {
  const editItem = route.params?.item;
  const isEditing = !!editItem;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [dailyRate, setDailyRate] = useState('');
  const [images, setImages] = useState([]);

  useEffect(() => {
    loadCategories();
    requestPermissions();
    
    if (isEditing && editItem) {
      setTitle(editItem.title);
      setDescription(editItem.description);
      setCategoryId(editItem.category_id.toString());
      setLocation(editItem.location);
      setIsFree(editItem.is_free);
      setDailyRate(editItem.daily_rate.toString());
    }
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert('Permission needed', 'Camera and gallery permissions are required');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.getCategories();
      if (response.success) {
        setCategories(response.data);
        if (!isEditing && response.data.length > 0) {
          setCategoryId(response.data[0].id.toString());
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only add up to 5 images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0]]);
    }
  };

  const takePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only add up to 5 images');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0]]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !description || !categoryId || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isFree && (!dailyRate || parseFloat(dailyRate) <= 0)) {
      Alert.alert('Error', 'Please enter a valid daily rate or mark as free');
      return;
    }

    if (!isEditing && images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category_id', categoryId);
      formData.append('location', location);
      formData.append('is_free', isFree ? '1' : '0');
      formData.append('daily_rate', isFree ? '0' : dailyRate);

      images.forEach((image, index) => {
        const uriParts = image.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        formData.append('images[]', {
          uri: image.uri,
          name: `photo_${index}.${fileType}`,
          type: `image/${fileType}`,
        });
      });

      let response;
      if (isEditing) {
        response = await api.updateItem(editItem.id, formData);
      } else {
        response = await api.createItem(formData);
      }

      if (response.success) {
        Alert.alert(
          'Success',
          isEditing ? 'Item updated successfully' : 'Item created successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Input
          label="Title *"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Power Drill"
        />

        <Input
          label="Description *"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your item..."
          multiline
          numberOfLines={4}
        />

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={categoryId}
              onValueChange={setCategoryId}
              style={styles.picker}
            >
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id.toString()} />
              ))}
            </Picker>
          </View>
        </View>

        <Input
          label="Location *"
          value={location}
          onChangeText={setLocation}
          placeholder="e.g., New York, NY"
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Available for Free</Text>
          <Switch value={isFree} onValueChange={setIsFree} />
        </View>

        {!isFree && (
          <Input
            label="Daily Rate ($) *"
            value={dailyRate}
            onChangeText={setDailyRate}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        )}

        <View style={styles.imagesContainer}>
          <Text style={styles.label}>Images * (Max 5)</Text>
          
          <View style={styles.imageButtonsRow}>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text style={styles.imageButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imagesGrid}>
            {images.map((image, index) => (
              <View key={index} style={styles.imagePreview}>
                <Image source={{ uri: image.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
                {index === 0 && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Primary</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <Button
          title={isEditing ? 'Update Item' : 'Create Item'}
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  imagesContainer: {
    marginBottom: 16,
  },
  imageButtonsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  imageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imagePreview: {
    width: 100,
    height: 100,
    margin: 4,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 8,
  },
});
