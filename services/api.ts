
import { db, Timestamp } from '../firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  getDoc,
  limit,
  orderBy
} from 'firebase/firestore';
import {
  GiftItem,
  Reservation,
  ReservePayload,
  RemoveReservationPayload,
  User,
  InitialGiftItem
} from '../types';
import {
  INITIAL_GIFT_ITEMS_SEED,
  USERS_COLLECTION,
  GIFT_ITEMS_COLLECTION,
  RESERVATIONS_COLLECTION
} from '../constants';

// --- User Management ---
export const getOrCreateUser = async (name: string): Promise<User> => {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, where("name", "==", name), limit(1));

  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    return { docId: userDoc.id, ...userDoc.data() } as User;
  } else {
    const newUserRef = await addDoc(usersRef, {
      name: name,
      createdAt: Timestamp.now(),
    });
    return { docId: newUserRef.id, name, createdAt: Timestamp.now() };
  }
};

// --- Gift Item Seeding (for development/setup) ---
export const seedGiftItems = async (): Promise<void> => {
  const giftItemsRef = collection(db, GIFT_ITEMS_COLLECTION);
  const q = query(giftItemsRef, limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) { // Only seed if the collection is empty
    console.log("Seeding gift items...");
    const batch = writeBatch(db);
    INITIAL_GIFT_ITEMS_SEED.forEach((itemSeed: InitialGiftItem) => {
      const newItemRef = doc(collection(db, GIFT_ITEMS_COLLECTION)); // Auto-generate ID
      batch.set(newItemRef, { ...itemSeed, createdAt: Timestamp.now() });
    });
    await batch.commit();
    console.log("Gift items seeded successfully.");
  } else {
    console.log("Gift items collection is not empty. Skipping seed.");
  }
};
// Call seedGiftItems once, perhaps in App.tsx on initial load in a useEffect, or manually.
// For simplicity in this context, it can be called when api.ts is loaded,
// but for a real app, it's better to control this more explicitly.
// await seedGiftItems(); // Consider moving this to an explicit dev script or a one-time setup

// --- Gift List and Reservations ---
export const fetchGiftItems = async (): Promise<GiftItem[]> => {
  // 1. Fetch all gift items
  const giftItemsRef = collection(db, GIFT_ITEMS_COLLECTION);
  const giftItemsQuery = query(giftItemsRef, orderBy("originalId", "asc")); // Order by originalId
  const giftItemsSnapshot = await getDocs(giftItemsQuery);
  
  let fetchedItems: GiftItem[] = giftItemsSnapshot.docs.map(docSnapshot => ({
    docId: docSnapshot.id,
    ...(docSnapshot.data() as Omit<GiftItem, 'docId' | 'reservations'>),
    reservations: [], // Initialize reservations array
  }));

  // 2. Fetch all reservations
  const reservationsRef = collection(db, RESERVATIONS_COLLECTION);
  const reservationsSnapshot = await getDocs(reservationsRef);
  const allReservations: Reservation[] = reservationsSnapshot.docs.map(docSnapshot => ({
    docId: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Reservation, 'docId'>),
  }));

  // 3. Combine reservations into their respective gift items
  fetchedItems = fetchedItems.map(item => ({
    ...item,
    reservations: allReservations.filter(res => res.giftItemDocId === item.docId),
  }));
  
  return fetchedItems;
};

export const reserveGiftItem = async (payload: ReservePayload): Promise<void> => {
  const reservationsRef = collection(db, RESERVATIONS_COLLECTION);
  
  // Check if a reservation by this user for this item already exists
  const q = query(
    reservationsRef,
    where("userId", "==", payload.userId),
    where("giftItemDocId", "==", payload.giftItemDocId),
    limit(1)
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    // Update existing reservation
    const existingReservationDoc = querySnapshot.docs[0];
    const reservationToUpdateRef = doc(db, RESERVATIONS_COLLECTION, existingReservationDoc.id);
    await setDoc(reservationToUpdateRef, {
      quantity: payload.quantity,
      personName: payload.personName, // Update personName in case it changes (though unlikely for this app)
      updatedAt: Timestamp.now(),
    }, { merge: true }); // Merge to only update these fields
  } else {
    // Create new reservation
    await addDoc(reservationsRef, {
      ...payload,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
  // The component will re-fetch items to reflect changes.
};

export const removeReservation = async (payload: RemoveReservationPayload): Promise<void> => {
  const reservationsRef = collection(db, RESERVATIONS_COLLECTION);
  
  // Find the reservation document by userId and giftItemDocId
  const q = query(
    reservationsRef,
    where("userId", "==", payload.userId),
    where("giftItemDocId", "==", payload.giftItemDocId),
    limit(1)
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const reservationDocToDelete = querySnapshot.docs[0];
    await deleteDoc(doc(db, RESERVATIONS_COLLECTION, reservationDocToDelete.id));
  } else {
    console.warn("No reservation found to delete for payload:", payload);
    // Optionally throw an error or handle as a silent failure if the reservation doesn't exist.
  }
  // The component will re-fetch items to reflect changes.
};
