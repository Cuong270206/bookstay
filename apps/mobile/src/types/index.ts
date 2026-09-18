// User types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role: 'GUEST' | 'HOST' | 'ADMIN';
  createdAt: string;
}

// Listing types
export interface Listing {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  basePrice: number;
  weekendPrice?: number;
  cleaningFee?: number;
  amenities: string[];
  status: 'PENDING_REVIEW' | 'PUBLISHED' | 'NEEDS_EDIT' | 'SUSPENDED';
  images: ListingImage[];
  averageRating?: number;
  reviewCount?: number;
  host?: User;
}

export interface ListingImage {
  id: string;
  url: string;
  order: number;
  isCover: boolean;
}

// Booking types
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';

export interface Booking {
  id: string;
  listingId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  specialRequests?: string;
  status: BookingStatus;
  totalPrice: number;
  refundAmount?: number;
  listing?: Listing;
  guest?: User;
}

// Review types
export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: User;
}

// Chat types
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  otherUser: User;
  listingId: string;
  listingTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

// Host types
export interface HostProfile {
  id: string;
  userId: string;
  businessName: string;
  businessLicense?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  user?: User;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
}
