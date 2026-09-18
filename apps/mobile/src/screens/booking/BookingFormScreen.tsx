import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingsApi } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

export default function BookingFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { listingId, listing } = route.params;

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState('1');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [price, setPrice] = useState({ nights: 0, subtotal: 0, cleaning: 0, total: 0 });

  useEffect(() => {
    if (checkIn && checkOut) {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const nights = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

      if (nights > 0 && listing) {
        const subtotal = Number(listing.basePrice) * nights;
        const cleaning = listing.cleaningFee ? Number(listing.cleaningFee) : 0;
        setPrice({ nights, subtotal, cleaning, total: subtotal + cleaning });
      }
    }
  }, [checkIn, checkOut]);

  const handleSubmit = async () => {
    if (!checkIn || !checkOut || !guestName || !guestPhone || !guestEmail) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    try {
      const res = await bookingsApi.create({
        listingId,
        checkIn,
        checkOut,
        guestCount: parseInt(guestCount),
        guestName,
        guestPhone,
        guestEmail,
        specialRequests,
      });

      const { bookingId } = res.data;

      // Create payment
      const paymentRes = await fetch(`http://10.0.2.2:3001/api/v1/payments/${bookingId}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(r => r.json());

      if (paymentRes.paymentUrl) {
        Alert.alert('Thành công', 'Đang chuyển đến thanh toán...');
        // In real app, would open payment URL
      } else {
        Alert.alert('Thành công', 'Đặt phòng thành công!');
        navigation.navigate('Main', { screen: 'Bookings' });
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Listing Info */}
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle}>{listing?.title}</Text>
          <Text style={styles.listingLocation}>{listing?.address}</Text>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ngày</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <Text style={styles.dateLabel}>Nhận phòng</Text>
              <TextInput
                style={styles.input}
                type="date"
                value={checkIn}
                onChangeText={setCheckIn}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.dateInput}>
              <Text style={styles.dateLabel}>Trả phòng</Text>
              <TextInput
                style={styles.input}
                value={checkOut}
                onChangeText={setCheckOut}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
        </View>

        {/* Guests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số khách</Text>
          <TextInput
            style={styles.input}
            value={guestCount}
            onChangeText={setGuestCount}
            keyboardType="numeric"
            placeholder={`Tối đa ${listing?.maxGuests || 1} khách`}
          />
        </View>

        {/* Guest Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách</Text>
          <TextInput
            style={styles.input}
            value={guestName}
            onChangeText={setGuestName}
            placeholder="Họ và tên"
          />
          <TextInput
            style={[styles.input, styles.inputMargin]}
            value={guestPhone}
            onChangeText={setGuestPhone}
            keyboardType="phone-pad"
            placeholder="Số điện thoại"
          />
          <TextInput
            style={[styles.input, styles.inputMargin]}
            value={guestEmail}
            onChangeText={setGuestEmail}
            keyboardType="email-address"
            placeholder="Email"
          />
        </View>

        {/* Special Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yêu cầu đặc biệt (tùy chọn)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={specialRequests}
            onChangeText={setSpecialRequests}
            placeholder="Ví dụ: Tôi cần check-in sớm..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Price Summary */}
        {price.nights > 0 && (
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {formatCurrency(Number(listing?.basePrice))} x {price.nights} đêm
              </Text>
              <Text style={styles.priceValue}>{formatCurrency(price.subtotal)}</Text>
            </View>
            {price.cleaning > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Phí dọn dẹp</Text>
                <Text style={styles.priceValue}>{formatCurrency(price.cleaning)}</Text>
              </View>
            )}
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{formatCurrency(price.total)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomCta}>
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Tiếp tục thanh toán</Text>
          )}
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
  scrollView: {
    flex: 1,
  },
  listingInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  listingLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputMargin: {
    marginTop: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priceSection: {
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 15,
    color: '#4b5563',
  },
  priceValue: {
    fontSize: 15,
    color: '#4b5563',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#db2777',
  },
  bottomCta: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#db2777',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
