import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listingsApi } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { Listing } from '../../types';

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [city, setCity] = useState(route.params?.city || 'Hà Nội');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const res = await listingsApi.search({ city, page: pageNum, limit: 20 });
      if (pageNum === 1) {
        setListings(res.data.data || []);
      } else {
        setListings((prev) => [...prev, ...(res.data.data || [])]);
      }
      setTotal(res.data.meta?.total || 0);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchListings(1);
  };

  const renderListing = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={styles.listingCard}
      onPress={() => navigation.navigate('ListingDetail', { id: item.id })}
    >
      <Image
        source={{ uri: item.images?.[0]?.url || 'https://via.placeholder.com/300x200' }}
        style={styles.listingImage}
      />
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.listingLocation}>{item.address}, {item.city}</Text>
        <Text style={styles.listingMeta}>
          {item.maxGuests} khách · {item.bedrooms} PN · {item.bathrooms} WC
        </Text>
        <View style={styles.listingBottom}>
          <Text style={styles.listingPrice}>
            {formatCurrency(Number(item.basePrice))}
            <Text style={styles.priceSuffix}>/đêm</Text>
          </Text>
          {item.averageRating && (
            <Text style={styles.listingRating}>★ {item.averageRating.toFixed(1)} ({item.reviewCount})</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Thành phố..."
            value={city}
            onChangeText={setCity}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Tìm</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.resultCount}>{total} homestay tại {city}</Text>
      </View>

      {/* Results */}
      <FlatList
        data={listings}
        renderItem={renderListing}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchListings(1); }} />
        }
        onEndReached={() => {
          if (!isLoading && listings.length < total) {
            fetchListings(page + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không tìm thấy homestay nào</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading && listings.length > 0 ? (
            <ActivityIndicator size="small" color="#db2777" style={{ marginVertical: 20 }} />
          ) : null
        }
      />
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
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#db2777',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultCount: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  listingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listingImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#e5e7eb',
  },
  listingInfo: {
    padding: 16,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  listingLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  listingMeta: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  listingBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#db2777',
  },
  priceSuffix: {
    fontWeight: 'normal',
    color: '#6b7280',
    fontSize: 13,
  },
  listingRating: {
    fontSize: 14,
    color: '#f59e0b',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
