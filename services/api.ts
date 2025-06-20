import { supabase } from '../supabaseClient';
import { GiftItem, Reservation, ReservePayload, RemoveReservationPayload, InitialGiftItem } from '../types';

export async function getOrCreateUser(name: string) {
  // Convert name to lowercase to ensure consistency
  const normalizedName = name.toLowerCase().trim();
  
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('name', normalizedName)
    .limit(1);

  if (fetchError) throw fetchError;

  if (users && users.length > 0) {
    // Map Supabase data to expected interface
    return {
      docId: users[0].id,
      name: users[0].name,
      createdAt: new Date(users[0].created_at)
    };
  }

  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({ name: normalizedName })
    .select()
    .single();

  if (insertError) throw insertError;

  // Map Supabase data to expected interface
  return {
    docId: newUser.id,
    name: newUser.name,
    createdAt: new Date(newUser.created_at)
  };
}

export async function fetchGiftItems(): Promise<GiftItem[]> {
  const { data: giftItems, error: giftError } = await supabase
    .from('gift_items')
    .select('*')
    .order('original_id');

  if (giftError) throw giftError;

  // Fetch all reservations for all gift items
  const { data: reservations, error: reservationError } = await supabase
    .from('reservations')
    .select('*');

  if (reservationError) throw reservationError;

  // Group reservations by gift item
  const reservationsByGiftItem = reservations?.reduce((acc: Record<string, Reservation[]>, reservation: any) => {
    if (!acc[reservation.gift_item_id]) {
      acc[reservation.gift_item_id] = [];
    }
    acc[reservation.gift_item_id].push({
      docId: reservation.id,
      userId: reservation.user_id,
      personName: reservation.person_name,
      quantity: reservation.quantity,
      giftItemDocId: reservation.gift_item_id,
      createdAt: reservation.created_at ? new Date(reservation.created_at) : undefined,
      updatedAt: reservation.updated_at ? new Date(reservation.updated_at) : undefined
    });
    return acc;
  }, {} as Record<string, Reservation[]>) || {};

  // Combine gift items with their reservations
  return (giftItems || []).map((item: any) => ({
    docId: item.id,
    originalId: item.original_id,
    name: item.name,
    suggestedQuantity: item.suggested_quantity,
    emoji: item.emoji,
    reservations: reservationsByGiftItem[item.id] || [],
    createdAt: item.created_at ? new Date(item.created_at) : undefined
  }));
}

export async function reserveGiftItem(payload: ReservePayload): Promise<void> {
  // Check if user already has a reservation for this item
  const { data: existingReservation, error: checkError } = await supabase
    .from('reservations')
    .select('*')
    .eq('user_id', payload.userId)
    .eq('gift_item_id', payload.giftItemDocId)
    .maybeSingle();

  if (checkError) {
    throw checkError;
  }

  if (existingReservation) {
    // Update existing reservation
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        quantity: payload.quantity,
        person_name: payload.personName,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingReservation.id);

    if (updateError) throw updateError;
  } else {
    // Create new reservation
    const { error: insertError } = await supabase
      .from('reservations')
      .insert({
        user_id: payload.userId,
        person_name: payload.personName,
        gift_item_id: payload.giftItemDocId,
        quantity: payload.quantity
      });

    if (insertError) throw insertError;
  }
}

export async function removeReservation(payload: RemoveReservationPayload): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('user_id', payload.userId)
    .eq('gift_item_id', payload.giftItemDocId);

  if (error) throw error;
}

export async function fetchAllUsers() {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at');

  if (error) throw error;

  return (users || []).map((user: any) => ({
    docId: user.id,
    name: user.name,
    createdAt: new Date(user.created_at)
  }));
}

export async function seedGiftItems(): Promise<void> {
  // Check if items already exist
  const { data: existingItems, error: checkError } = await supabase
    .from('gift_items')
    .select('id')
    .limit(1);

  if (checkError) throw checkError;

  // If items already exist, don't seed again
  if (existingItems && existingItems.length > 0) {
    return;
  }

  // Initial gift items data
  const initialGiftItems: InitialGiftItem[] = [
    { originalId: 1, name: "Fraldas P", suggestedQuantity: 10, emoji: "👶" },
    { originalId: 2, name: "Fraldas M", suggestedQuantity: 10, emoji: "👶" },
    { originalId: 3, name: "Fraldas G", suggestedQuantity: 8, emoji: "👶" },
    { originalId: 4, name: "Fraldas XG", suggestedQuantity: 6, emoji: "👶" },
    { originalId: 5, name: "Fraldas XXG", suggestedQuantity: 4, emoji: "👶" },
    { originalId: 6, name: "Lenços Umedecidos", suggestedQuantity: 5, emoji: "🧻" },
    { originalId: 7, name: "Pomada para Assaduras", suggestedQuantity: 3, emoji: "🧴" },
    { originalId: 8, name: "Sabonete Líquido", suggestedQuantity: 4, emoji: "🧼" },
    { originalId: 9, name: "Shampoo", suggestedQuantity: 3, emoji: "🧴" },
    { originalId: 10, name: "Toalhas de Banho", suggestedQuantity: 4, emoji: "🛁" },
    { originalId: 11, name: "Roupinhas 0-3 meses", suggestedQuantity: 6, emoji: "👕" },
    { originalId: 12, name: "Roupinhas 3-6 meses", suggestedQuantity: 6, emoji: "👕" },
    { originalId: 13, name: "Roupinhas 6-9 meses", suggestedQuantity: 4, emoji: "👕" },
    { originalId: 14, name: "Meias", suggestedQuantity: 8, emoji: "🧦" },
    { originalId: 15, name: "Gorros", suggestedQuantity: 4, emoji: "🧢" },
    { originalId: 16, name: "Mantas", suggestedQuantity: 3, emoji: "🛏️" },
    { originalId: 17, name: "Brinquedos", suggestedQuantity: 5, emoji: "🧸" },
    { originalId: 18, name: "Livros Infantis", suggestedQuantity: 4, emoji: "📚" },
    { originalId: 19, name: "Mamadeiras", suggestedQuantity: 3, emoji: "🍼" },
    { originalId: 20, name: "Chupetas", suggestedQuantity: 6, emoji: "🍼" }
  ];

  const { error: insertError } = await supabase
    .from('gift_items')
    .insert(initialGiftItems.map(item => ({
      original_id: item.originalId,
      name: item.name,
      suggested_quantity: item.suggestedQuantity,
      emoji: item.emoji
    })));

  if (insertError) throw insertError;
}

export async function addGiftItem(item: { name: string; emoji: string; suggestedQuantity: number }) {
  // Get the next original_id
  const { data: lastItem, error: fetchError } = await supabase
    .from('gift_items')
    .select('original_id')
    .order('original_id', { ascending: false })
    .limit(1);

  if (fetchError) throw fetchError;

  const nextOriginalId = (lastItem && lastItem.length > 0 ? lastItem[0].original_id : 0) + 1;

  const { data: newItem, error: insertError } = await supabase
    .from('gift_items')
    .insert({
      original_id: nextOriginalId,
      name: item.name.trim(),
      suggested_quantity: item.suggestedQuantity,
      emoji: item.emoji
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return {
    docId: newItem.id,
    originalId: newItem.original_id,
    name: newItem.name,
    suggestedQuantity: newItem.suggested_quantity,
    emoji: newItem.emoji,
    reservations: [],
    createdAt: newItem.created_at ? new Date(newItem.created_at) : undefined
  };
}
