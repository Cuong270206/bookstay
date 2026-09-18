import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingsApi } from '../../lib/api';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import { Booking } from '../../types';

const TABS = ['Tất cả', 'Sắp tới', 'Hoàn thành', 'Đã hủy'];

export default function MyBookingsScreen() {
  const navigation = useNavigation<any>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await bookingsApi.getMy();
      setBookings(res.data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    Alert.alert(
      'Hủy đặt phòng',
      'Bạn có chắc muốn hủy đặt phòng này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Có, hủy',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingsApi.cancel(bookingId);
              Alert.alert('Thành công', 'Đã hủy đặt phòng');
              fetchBookings();
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể hủy');
            }
          },
        },
      ]
    );
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return ['PENDING', 'CONFIRMED'].includes(b.status);
    if (activeTab === 2) return b.status === 'COMPLETED';
    if (activeTab === 3) return ['CANCELLED', 'REFUNDED'].includes(b.status);
    return true;
  });

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.listingTitle} numberOfLines={1}>
          {item.listing?.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.listingLocation}>{item.listing?.address}</Text>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Nhận phòng</Text>
          <Text style={styles.infoValue}>{formatDate(item.checkIn)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Trả phòng</Text>
          <Text style={styles.infoValue}>{formatDate(item.checkOut)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.price}>{formatCurrency(item.totalPrice)}</Text>
        <View style={styles.actions}>
          {['PENDING', 'CONFIRMED'].includes(item.status) && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(item.id)}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đặt phòng của tôi</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === index && styles.tabActive]}
            onPress={() => setActiveTab(index)}
          >
            <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#db2777" />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchBookings(); }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có đặt phòng nào</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#db2777',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#db2777',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listingLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#db2777',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
