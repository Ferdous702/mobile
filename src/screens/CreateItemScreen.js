import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { imageUrl } from '../config/api';
import { useDialog } from '../contexts/DialogContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip, Loader } from '../components/UI';
import { colors, typography, spacing, radius, CONTENT_MAX_WIDTH } from '../theme';

const MAX_IMAGES = 5;
const EXT_MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic' };

const guessMime = (asset) => {
  if (asset.mimeType) return asset.mimeType;
  const ext = (asset.uri.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
  return EXT_MIME[ext] || 'image/jpeg';
};

export const CreateItemScreen = ({ navigation, route }) => {
  const editItem = route.params?.item;
  const isEditing = !!editItem;
  const { alert, toast } = useDialog();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [title, setTitle] = useState(editItem?.title || '');
  const [description, setDescription] = useState(editItem?.description || '');
  const [categoryId, setCategoryId] = useState(editItem?.category_id ? String(editItem.category_id) : '');
  const [location, setLocation] = useState(editItem?.location || '');
  const [isFree, setIsFree] = useState(!!editItem?.is_free);
  const [dailyRate, setDailyRate] = useState(
    editItem && !editItem.is_free && editItem.daily_rate != null ? String(Number(editItem.daily_rate)) : ''
  );
  const [images, setImages] = useState([]);
  const existingImages = editItem?.images || [];

  useEffect(() => {
    let mounted = true;
    api
      .getCategories()
      .then((res) => {
        if (!mounted) return;
        const list = res.data || [];
        setCategories(list);
        if (!isEditing && list.length) setCategoryId((c) => c || String(list[0].id));
      })
      .catch((err) => mounted && alert('Could not load categories', err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [isEditing, alert]);

  const clearError = (key) => errors[key] && setErrors((e) => ({ ...e, [key]: null }));

  const addAssets = (assets) => {
    setImages((prev) => [...prev, ...assets].slice(0, MAX_IMAGES));
    clearError('images');
  };

  const pickImage = async () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return alert('Limit reached', `You can add up to ${MAX_IMAGES} photos.`);
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return alert('Permission needed', 'Allow photo library access in your settings to add images.');
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.length) addAssets(result.assets);
    } catch (err) {
      alert('Could not open gallery', err.message);
    }
  };

  const takePhoto = async () => {
    if (images.length >= MAX_IMAGES) return alert('Limit reached', `You can add up to ${MAX_IMAGES} photos.`);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return alert('Permission needed', 'Allow camera access in your settings to take photos.');
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!result.canceled && result.assets?.length) addAssets(result.assets);
    } catch (err) {
      alert('Could not open camera', err.message);
    }
  };

  const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));

  const validate = () => {
    const next = {};
    if (!title.trim()) next.title = 'Give your item a title';
    if (!description.trim()) next.description = 'Add a short description';
    if (!categoryId) next.category = 'Choose a category';
    if (!location.trim()) next.location = 'Where can borrowers pick it up?';
    if (!isFree && !(parseFloat(dailyRate) > 0)) next.dailyRate = 'Enter a daily rate, or mark the item as free';
    if (!isEditing && images.length === 0) next.images = 'Add at least one photo';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category_id', categoryId);
      formData.append('location', location.trim());
      formData.append('is_free', isFree ? '1' : '0');
      formData.append('daily_rate', isFree ? '0' : String(parseFloat(dailyRate)));

      for (let i = 0; i < images.length; i++) {
        const asset = images[i];
        const type = guessMime(asset);
        const ext = type.split('/')[1] === 'jpeg' ? 'jpg' : type.split('/')[1];
        const name = asset.fileName || `photo_${i}.${ext}`;

        if (Platform.OS === 'web') {
          const blob = asset.file || (await (await fetch(asset.uri)).blob());
          formData.append('images[]', blob, name);
        } else {
          formData.append('images[]', { uri: asset.uri, name, type });
        }
      }

      if (isEditing) {
        await api.updateItem(editItem.id, formData);
      } else {
        await api.createItem(formData);
      }

      toast(isEditing ? 'Listing updated' : 'Listing published!');
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate('MyListingsMain');
    } catch (err) {
      alert('Could not save listing', err.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={64}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          {/* Photos */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionHint}>
              {isEditing ? 'Adding new photos replaces the current ones.' : `Up to ${MAX_IMAGES} photos. The first one is the cover.`}
            </Text>

            {isEditing && images.length === 0 && existingImages.length > 0 ? (
              <View style={styles.grid}>
                {existingImages.map((img, i) => (
                  <View key={img.id} style={styles.thumb}>
                    <Image source={{ uri: imageUrl(img.image_path) }} style={styles.thumbImage} />
                    {i === 0 ? <Text style={styles.coverBadge}>Cover</Text> : null}
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.grid}>
              {images.map((asset, i) => (
                <View key={`${asset.uri}-${i}`} style={styles.thumb}>
                  <Image source={{ uri: asset.uri }} style={styles.thumbImage} />
                  <Pressable onPress={() => removeImage(i)} style={styles.removeBtn} hitSlop={8} accessibilityLabel="Remove photo">
                    <Ionicons name="close" size={14} color={colors.textInverse} />
                  </Pressable>
                  {i === 0 ? <Text style={styles.coverBadge}>Cover</Text> : null}
                </View>
              ))}
              {images.length < MAX_IMAGES ? (
                <>
                  <Pressable onPress={pickImage} style={({ pressed }) => [styles.addTile, pressed && styles.addTilePressed]} accessibilityRole="button" accessibilityLabel="Add photos from gallery">
                    <Ionicons name="images-outline" size={24} color={colors.primary} />
                    <Text style={styles.addTileText}>Gallery</Text>
                  </Pressable>
                  {Platform.OS !== 'web' ? (
                    <Pressable onPress={takePhoto} style={({ pressed }) => [styles.addTile, pressed && styles.addTilePressed]} accessibilityRole="button" accessibilityLabel="Take a photo">
                      <Ionicons name="camera-outline" size={24} color={colors.primary} />
                      <Text style={styles.addTileText}>Camera</Text>
                    </Pressable>
                  ) : null}
                </>
              ) : null}
            </View>
            {errors.images ? <Text style={styles.errorText}>{errors.images}</Text> : null}
          </Card>

          {/* Details */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { marginBottom: spacing.lg }]}>Details</Text>
            <Input
              label="Title"
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                clearError('title');
              }}
              placeholder="e.g. Cordless power drill"
              maxLength={255}
              error={errors.title}
            />
            <Input
              label="Description"
              value={description}
              onChangeText={(t) => {
                setDescription(t);
                clearError('description');
              }}
              placeholder="Condition, what's included, any rules…"
              multiline
              error={errors.description}
            />
            <Input
              label="Pickup location"
              icon="location-outline"
              value={location}
              onChangeText={(t) => {
                setLocation(t);
                clearError('location');
              }}
              placeholder="e.g. Downtown, Sylhet"
              error={errors.location}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.chipWrap}>
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.name}
                  selected={categoryId === String(cat.id)}
                  onPress={() => {
                    setCategoryId(String(cat.id));
                    clearError('category');
                  }}
                  style={styles.chip}
                />
              ))}
            </View>
            {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
          </Card>

          {/* Pricing */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { marginBottom: spacing.md }]}>Pricing</Text>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Lend for free</Text>
                <Text style={styles.sectionHint}>Great for building trust with neighbours</Text>
              </View>
              <Switch
                value={isFree}
                onValueChange={setIsFree}
                trackColor={{ true: colors.primary, false: colors.borderStrong }}
                thumbColor={colors.surface}
                accessibilityLabel="Lend for free"
              />
            </View>
            {!isFree ? (
              <Input
                label="Daily rate (USD)"
                icon="cash-outline"
                value={dailyRate}
                onChangeText={(t) => {
                  setDailyRate(t.replace(/[^0-9.]/g, ''));
                  clearError('dailyRate');
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={errors.dailyRate}
                containerStyle={{ marginTop: spacing.lg, marginBottom: 0 }}
              />
            ) : null}
          </Card>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.inner}>
          <Button
            title={isEditing ? 'Save changes' : 'Publish listing'}
            icon={isEditing ? 'checkmark' : 'rocket-outline'}
            onPress={handleSubmit}
            loading={submitting}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const THUMB = 88;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 32 },
  inner: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  sectionHint: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.md },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  thumbImage: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(17,24,39,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBadge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    backgroundColor: colors.primary,
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  addTile: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  addTilePressed: { backgroundColor: colors.primarySoft },
  addTileText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { marginBottom: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  errorText: { ...typography.caption, color: colors.danger, marginTop: 6 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
