import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../utils/api';
import { STORAGE_URL } from '../config/api';
import { LoadingScreen } from '../components/LoadingScreen';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

export const ItemDetailsScreen = ({ route, navigation }) => {
  const { itemId } = route.params;
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    try {
      const response = await api.getItem(itemId);
      if (response.success) {
        setItem(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load item details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleSubmitRequest = async () => {
    if (startDate >= endDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    // Check for conflicts with booked dates
    const bookedDates = item.booked_dates || [];
    const requestStart = startDate.getTime();
    const requestEnd = endDate.getTime();

    for (const booking of bookedDates) {
      const bookStart = new Date(booking.start_date).getTime();
      const bookEnd = new Date(booking.end_date).getTime();

      if (
        (requestStart >= bookStart && requestStart <= bookEnd) ||
        (requestEnd >= bookStart && requestEnd <= bookEnd) ||
        (requestStart <= bookStart && requestEnd >= bookEnd)
      ) {
        Alert.alert(
          'Dates Unavailable',
          `This item is already booked from ${booking.start_date} to ${booking.end_date}`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await api.createBorrowRequest(
        itemId,
        formatDate(startDate),
        formatDate(endDate),
        notes
      );

      if (response.success) {
        Alert.alert('Success', 'Borrow request submitted successfully');
        setShowRequestModal(false);
        setNotes('');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!item) {
    return null;
  }

  const isOwner = user && item.user && user.id === item.user.id;
  const images = item.images || [];

  return (
    <View style={styles.container}>
      <ScrollView>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageCarousel}
        >
          {images.length > 0 ? (
            images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: `${STORAGE_URL}/${image.image_path}` }}
                style={styles.image}
              />
            ))
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.category}>{item.category?.name}</Text>
            <Text style={styles.location}>{item.location}</Text>
          </View>

          <View style={styles.priceContainer}>
            {item.is_free ? (
              <Text style={styles.priceFree}>FREE</Text>
            ) : (
              <Text style={styles.price}>${item.daily_rate}/day</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{item.description}</Text>

          <Text style={styles.sectionTitle}>Owner</Text>
          <Text style={styles.ownerName}>{item.user?.name}</Text>

          {item.booked_dates && item.booked_dates.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Booked Dates</Text>
              {item.booked_dates.map((booking, index) => (
                <View key={index} style={styles.bookedDate}>
                  <Text style={styles.bookedDateText}>
                    {booking.start_date} to {booking.end_date}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {!isOwner && (
        <View style={styles.footer}>
          <Button
            title="Request to Borrow"
            onPress={() => setShowRequestModal(true)}
          />
        </View>
      )}

      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request to Borrow</Text>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateLabel}>Start Date:</Text>
              <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartPicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setStartDate(selectedDate);
                  }
                }}
                minimumDate={new Date()}
              />
            )}

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateLabel}>End Date:</Text>
              <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
            </TouchableOpacity>

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndPicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setEndDate(selectedDate);
                  }
                }}
                minimumDate={startDate}
              />
            )}

            <TextInput
              style={styles.notesInput}
              placeholder="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Submit Request"
              onPress={handleSubmitRequest}
              loading={submitting}
              style={styles.submitButton}
            />

            <Button
              title="Cancel"
              onPress={() => setShowRequestModal(false)}
              variant="secondary"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageCarousel: {
    height: 300,
  },
  image: {
    width: 400,
    height: 300,
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 18,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  category: {
    fontSize: 16,
    color: '#007AFF',
  },
  location: {
    fontSize: 16,
    color: '#666',
  },
  priceContainer: {
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  priceFree: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#34C759',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  ownerName: {
    fontSize: 16,
    color: '#666',
  },
  bookedDate: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  bookedDateText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 16,
    color: '#007AFF',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginBottom: 12,
  },
});
