import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listingsApi } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { Listing } from '../../types';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [searchCity, setSearchCity] = useState('Hà Nội');
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFeaturedListings();
  }, []);

  const fetchFeaturedListings = async () => {
    try {
      const res = await listingsApi.search({ limit: 10 });
      setFeaturedListings(res.data.data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    navigation.navigate('Search', { city: searchCity });
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
        <Text style={styles.listingLocation}>{item.city}</Text>
        <Text style={styles.listingPrice}>
          {formatCurrency(Number(item.basePrice))}
          <Text style={styles.priceSuffix}>/đêm</Text>
        </Text>
        {item.averageRating && (
          <Text style={styles.listingRating}>★ {item.averageRating.toFixed(1)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFeaturedListings(); }} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>BookStay</Text>
          <Text style={styles.tagline}>Tìm homestay tại Hà Nội</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Bạn muốn đến đâu?"
            value={searchCity}
            onChangeText={setSearchCity}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Tìm kiếm</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('Search', { city: 'Hà Nội' })}
          >
            <Text style={styles.quickLinkEmoji}>🏠</Text>
            <Text style={styles.quickLinkText}>Hà Nội</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('Search', { city: 'Hồ Chí Minh' })}
          >
            <Text style={styles.quickLinkEmoji}>🌆</Text>
            <Text style={styles.quickLinkText}>TP.HCM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('Search', { city: 'Đà Nẵng' })}
          >
            <Text style={styles.quickLinkEmoji}>🏖️</Text>
            <Text style={styles.quickLinkText}>Đà Nẵng</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đề xuất cho bạn</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#db2777" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={featuredListings}
              renderItem={renderListing}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listingsContainer}
            />
          )}
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh mục</Text>
          <View style={styles.categories}>
            <TouchableOpacity style={styles.category}>
              <Text style={styles.categoryEmoji}>🏡</Text>
              <Text style={styles.categoryText}>Căn hộ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.category}>
              <Text style={styles.categoryEmoji}>🏰</Text>
              <Text style={styles.categoryText}>Biệt thự</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.category}>
              <Text style={styles.categoryEmoji}>🏕️</Text>
              <Text style={styles.categoryText}>Glamping</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.category}>
              <Text style={styles.categoryEmoji}>🌴</Text>
              <Text style={styles.categoryText}>Resort</Text>
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
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#db2777',
  },
  tagline: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#db2777',
    borderRadius: 25,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  quickLinks: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 10,
  },
  quickLink: {
    flex: 1,
    backgroundColor: '#fce7f3',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickLinkEmoji: {
    fontSize: 24,
  },
  quickLinkText: {
    marginTop: 4,
    fontSize: 12,
    color: '#374151',
  },
  section: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  listingsContainer: {
    paddingHorizontal: 15,
  },
  listingCard: {
    width: 200,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listingImage: {
    width: '100%',
    height: 130,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  listingInfo: {
    padding: 12,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  listingLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#db2777',
    marginTop: 4,
  },
  priceSuffix: {
    fontWeight: 'normal',
    color: '#6b7280',
  },
  listingRating: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
  },
  categories: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 10,
  },
  category: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 12,
    color: '#374151',
  },
});
