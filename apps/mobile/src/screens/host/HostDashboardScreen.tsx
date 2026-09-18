import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hostApi } from '../../lib/api';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';

export default function HostDashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await hostApi.getDashboard();
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#db2777" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard Host</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Tổng thu nhập</Text>
            <Text style={styles.statValue}>{formatCurrency(stats?.totalEarnings || 0)}</Text>
            <Text style={styles.statSubtext}>Tháng này: {formatCurrency(stats?.monthlyEarnings || 0)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Đặt phòng</Text>
            <Text style={styles.statValue}>{stats?.totalBookings || 0}</Text>
            <Text style={styles.statSubtext}>+{stats?.pendingBookings || 0} đang chờ</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Homestay</Text>
            <Text style={styles.statValue}>{stats?.totalListings || 0}</Text>
            <Text style={styles.statSubtext}>{stats?.activeListings || 0} đang hoạt động</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Đánh giá TB</Text>
            <Text style={styles.statValue}>{(stats?.averageRating || 0).toFixed(1)} ★</Text>
            <Text style={styles.statSubtext}>{stats?.totalReviews || 0} đánh giá</Text>
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đặt phòng gần đây</Text>
          {stats?.recentBookings?.length > 0 ? (
            stats.recentBookings.map((booking: any) => (
              <View key={booking.id} style={styles.bookingItem}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingTitle}>{booking.listing?.title}</Text>
                  <Text style={styles.bookingMeta}>
                    {booking.guest?.name} · {formatCurrency(booking.totalPrice)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                    {getStatusLabel(booking.status)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Chưa có đặt phòng nào</Text>
          )}
        </View>

        {/* My Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Homestay của tôi</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>
          {stats?.listings?.length > 0 ? (
            stats.listings.map((listing: any) => (
              <View key={listing.id} style={styles.listingItem}>
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle}>{listing.title}</Text>
                  <Text style={styles.listingMeta}>
                    {listing._count?.bookings || 0} đặt phòng
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(listing.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(listing.status) }]}>
                    {getStatusLabel(listing.status)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Bạn chưa có homestay nào</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionText}>Thêm Homestay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionText}>Quản lý đặt phòng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionText}>Doanh thu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>Tin nhắn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#db2777',
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  bookingMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  listingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  listingMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
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
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '47%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#374151',
  },
});
