
import { GiftItem } from './types';

export const API_BASE_URL = '/api'; // Mock, will be handled by localStorage simulation

export const INITIAL_GIFT_ITEMS: GiftItem[] = [
  { id: 1, name: "Fralda P", suggestedQuantity: 5, reservations: [], emoji: "👶" },
  { id: 2, name: "Fralda M", suggestedQuantity: 10, reservations: [], emoji: "👶" },
  { id: 3, name: "Lenço umedecido", suggestedQuantity: 10, reservations: [], emoji: "🧴" },
  { id: 4, name: "Pomada para assaduras", suggestedQuantity: 5, reservations: [], emoji: "🩹" },
  { id: 5, name: "Sabonete líquido", suggestedQuantity: 3, reservations: [], emoji: "🧼" },
  { id: 6, name: "Toalha de boca", suggestedQuantity: 8, reservations: [], emoji: "🍼" },
  { id: 7, name: "Manta de bebê", suggestedQuantity: 2, reservations: [], emoji: "🧸" },
  { id: 8, name: "Shampoo infantil", suggestedQuantity: 3, reservations: [], emoji: "🧴" },
];

export const GIFTS_STORAGE_KEY = 'chadebebe_alice_gifts';
