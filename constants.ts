
import { InitialGiftItem } from './types';

// Used for seeding the database if it's empty
export const INITIAL_GIFT_ITEMS_SEED: InitialGiftItem[] = [
  { originalId: 1, name: "Fralda P", suggestedQuantity: 5, emoji: "👶" },
  { originalId: 2, name: "Fralda M", suggestedQuantity: 10, emoji: "👶" },
  { originalId: 3, name: "Lenço umedecido", suggestedQuantity: 10, emoji: "🧴" },
  { originalId: 4, name: "Pomada para assaduras", suggestedQuantity: 5, emoji: "🩹" },
  { originalId: 5, name: "Sabonete líquido", suggestedQuantity: 3, emoji: "🧼" },
  { originalId: 6, name: "Toalha de boca", suggestedQuantity: 8, emoji: "🍼" },
  { originalId: 7, name: "Manta de bebê", suggestedQuantity: 2, emoji: "🧸" },
  { originalId: 8, name: "Shampoo infantil", suggestedQuantity: 3, emoji: "🧴" },
];

export const USERS_COLLECTION = 'users';
export const GIFT_ITEMS_COLLECTION = 'giftItems';
export const RESERVATIONS_COLLECTION = 'reservations';
