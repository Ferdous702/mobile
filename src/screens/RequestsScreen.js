import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { api } from '../utils/api';
import { STORAGE_URL } from '../config/api';
import { LoadingScreen } from '../components/LoadingScreen';
import { Button } from '../components/Button';

export const RequestsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadRequests();
    });

    return unsubscribe;
  }, [navigation, activeTab]);

  const loadRequests = async () => {
    try {
      const response =
        activeTab === 'received'
          ? await api.getReceivedRequests()
          : await api.getSentRequests();

      if (response.success) {
        setRequests(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }, [activeTab]);

  const handleAccept = async (requestId) => {
    Alert.alert('Accept Request', 'Are you sure you want to accept this request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            const response = await api.acceptRequest(requestId);
            if (response.success) {
              Alert.alert('Success', 'Request accepted successfully');
              loadRequests();
            }
          } catch (error) {
            Alert.alert('Error', error.message || 'Failed to accept request');
          }
        },
      },
    ]);
  };

  const handleReject = async (requestId) => {
    Alert.alert('Reject Request', 'Are you sure you want to reject this request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await api.rejectRequest(requestId);
            if (response.success) {
              Alert.alert('Success', 'Request rejected successfully');
              loadRequests();
            }
          } catch (error) {
            Alert.alert('Error', error.message || 'Failed to reject request');
          }
        },
      },
    ]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'accepted':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderReceivedRequest = ({ item }) => {
    const primaryImage =
      item.item_listing?.images?.find((img) => img.is_primary) ||
      item.item_listing?.images?.[0];
    const imageUrl = primaryImage
      ? `${STORAGE_URL}/${primaryImage.image_path}`
      : null;

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.itemThumbnail} />
            ) : (
              <View style={[styles.itemThumbnail, styles.placeholderThumbnail]}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
            <View style={styles.requestDetails}>
              <Text style={styles.itemTitle}>{item.item_listing?.title}</Text>
              <Text style={styles.borrowerName}>From: {item.borrower?.name}</Text>
              <Text style={styles.requestDates}>
                {item.start_date} to {item.end_date}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        {item.status === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAccept(item.id)}
            >
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(item.id)}
            >
              <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
                Reject
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderSentRequest = ({ item }) => {
    const primaryImage =
      item.item_listing?.images?.find((img) => img.is_primary) ||
      item.item_listing?.images?.[0];
    const imageUrl = primaryImage
      ? `${STORAGE_URL}/${primaryImage.image_path}`
      : null;

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() =>
          navigation.navigate('ItemDetails', { itemId: item.item_listing?.id })
        }
      >
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.itemThumbnail} />
            ) : (
              <View style={[styles.itemThumbnail, styles.placeholderThumbnail]}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
            <View style={styles.requestDetails}>
              <Text style={styles.itemTitle}>{item.item_listing?.title}</Text>
              <Text style={styles.borrowerName}>
                Owner: {item.item_listing?.user?.name}
              </Text>
              <Text style={styles.requestDates}>
                {item.start_date} to {item.end_date}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Your notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => {
            setActiveTab('received');
            setLoading(true);
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'received' && styles.activeTabText,
            ]}
          >
            Received
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => {
            setActiveTab('sent');
            setLoading(true);
          }}
        >
          <Text
            style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}
          >
            Sent
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={requests}
        renderItem={
          activeTab === 'received' ? renderReceivedRequest : renderSentRequest
        }
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'received'
                ? 'No requests received yet'
                : 'No requests sent yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  listContent: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requestInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  itemThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderThumbnail: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 10,
  },
  requestDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  borrowerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  requestDates: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  notesContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  rejectButtonText: {
    color: '#FF3B30',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
