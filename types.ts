
export interface Reservation {
  personName: string;
  quantity: number;
}

export interface GiftItem {
  id: number;
  name: string;
  suggestedQuantity: number;
  reservations: Reservation[];
  emoji: string;
}

export interface ReservePayload {
  personName: string;
  itemId: number;
  quantity: number;
}

export interface RemoveReservationPayload {
  personName: string;
  itemId: number;
}
