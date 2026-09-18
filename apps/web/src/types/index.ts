export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'GUEST' | 'HOST' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  avatar?: string;
  createdAt: string;
}

export interface HostProfile {
  id: string;
  userId: string;
  businessName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  listingCount: number;
  totalEarnings: number;
  user: User;
}

export interface Listing {
  id: string;
  hostId: string;
  title: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  city: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  area?: number;
  basePrice: number;
  weekendPrice?: number;
  cleaningFee?: number;
  amenities: string[];
  images: ListingImage[];
  status: string;
  averageRating?: number;
  reviewCount?: number;
  host: HostProfile;
  createdAt: string;
}

export interface ListingImage {
  id: string;
  url: string;
  order: number;
}

export interface Booking {
  id: string;
  listingId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestCount: number;
  specialRequests?: string;
  nightlyRate: number;
  cleaningFee?: number;
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  refundAmount?: number;
  status: string;
  listing?: Listing;
  payment?: Payment;
  createdAt: string;
}

export interface Payment {
  id: string;
  status: string;
  vnpResponseCode?: string;
  lockExpiresAt?: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  reviewer: User;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  sender: User;
  readAt?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
