
export interface User {
  docId: string;
  name: string;
  createdAt: Date;
}

export interface Reservation {
  docId: string; // Firestore document ID of the reservation itself
  userId: string;
  personName: string; // Denormalized for display
  quantity: number;
  giftItemDocId: string; // Added to link reservation to a gift item
  createdAt?: Date; // Optional because it might not be loaded initially
  updatedAt?: Date; // Optional
}

export interface GiftItem {
  docId: string; // Firestore document ID
  originalId: number; // ID from initial constants
  name: string;
  suggestedQuantity: number;
  reservations: Reservation[]; // Populated after fetching from multiple collections
  emoji: string;
  createdAt?: Date; // Optional
}

// Payload to reserve or update a reservation
export interface ReservePayload {
  userId: string;
  personName: string;
  giftItemDocId: string;
  quantity: number;
}

// Payload to remove a reservation
// We'll use userId and giftItemDocId to find the reservation to delete.
export interface RemoveReservationPayload {
  userId: string;
  giftItemDocId: string;
}

// For seeding
export interface InitialGiftItem {
  originalId: number;
  name: string;
  suggestedQuantity: number;
  emoji: string;
}
