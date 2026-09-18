import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listingsApi } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Listing, Review } from '../../types';

const { width } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = route.params;
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const res = await listingsApi.getById(id);
      setListing(res.data);
      setReviews(res.data.reviews || []);
    } catch (error) {
      console.error('Error fetching listing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#db2777" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Không tìm thấy homestay</Text>
      </View>
    );
  }

  const images = listing.images?.length > 0
    ? listing.images.sort((a, b) => a.order - b.order)
    : [{ url: 'https://via.placeholder.com/400x300', order: 0 }];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImage(index);
            }}
          >
            {images.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img.url }}
                style={styles.image}
              />
            ))}
          </ScrollView>
          <View style={styles.imageDots}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentImage && styles.dotActive,
                ]}
              />
            ))}
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{listing.title}</Text>
          <View style={styles.locationRow}>
            <Text style={styles.location}>{listing.address}, {listing.city}</Text>
            {listing.averageRating && (
              <Text style={styles.rating}>★ {listing.averageRating.toFixed(1)} ({listing.reviewCount})</Text>
            )}
          </View>

          {/* Property Info */}
          <View style={styles.propertyInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>{listing.maxGuests}</Text>
              <Text style={styles.infoLabel}>Khách</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>{listing.bedrooms}</Text>
              <Text style={styles.infoLabel}>Phòng ngủ</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>{listing.bathrooms}</Text>
              <Text style={styles.infoLabel}>Phòng tắm</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Amenities */}
          {listing.amenities?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tiện nghi</Text>
              <View style={styles.amenities}>
                {listing.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenity}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Đánh giá</Text>
              {reviews.slice(0, 3).map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.reviewerInitial}>
                        {review.reviewer?.name?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.reviewerName}>{review.reviewer?.name}</Text>
                      <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                    </View>
                  </View>
                  {review.comment && (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>
              {formatCurrency(Number(listing.basePrice))}
              <Text style={styles.priceSuffix}> /đêm</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('BookingForm', { listingId: id, listing })}
        >
          <Text style={styles.bookButtonText}>Đặt phòng</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width,
    height: 280,
    backgroundColor: '#e5e7eb',
  },
  imageDots: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#374151',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  location: {
    fontSize: 15,
    color: '#6b7280',
    flex: 1,
  },
  rating: {
    fontSize: 15,
    color: '#f59e0b',
    fontWeight: '500',
  },
  propertyInfo: {
    flexDirection: 'row',
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenity: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  amenityText: {
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize',
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#db2777',
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '500',
  },
  reviewDate: {
    fontSize: 13,
    color: '#9ca3af',
  },
  reviewComment: {
    marginTop: 8,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  priceSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#db2777',
  },
  priceSuffix: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#6b7280',
  },
  bottomCta: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  bookButton: {
    backgroundColor: '#db2777',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
