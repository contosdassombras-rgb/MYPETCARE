import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { deleteFile, getPathFromUrl } from '../lib/storage';

export interface PetEvent {
  id: string;
  type: 'vaccine' | 'medication' | 'appointment' | 'special_care';
  title: string;
  date: string;
  time?: string;
  completed: boolean;
  notes?: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface PetHistoryItem {
  id: string;
  type: 'vaccine' | 'medication' | 'observation' | 'document' | 'weight' | 'food';
  title: string;
  date: string;
  notes?: string;
  attachments?: string[];
  attachmentType?: 'pdf' | 'img' | 'doc';
  value?: string | number;
}

export interface Pet {
  id: string;
  name: string;
  photo: string;
  birthDate: string;
  weight: number;
  breed: string;
  foodType: string;
  allergies: string;
  healthConditions: string;
  medications: string;
  status: 'up_to_date' | 'pending' | 'overdue';
  events: PetEvent[];
  history: PetHistoryItem[];
}

interface PetContextType {
  pets: Pet[];
  loading: boolean;
  addPet: (pet: Omit<Pet, 'id' | 'events' | 'history'>) => Promise<void>;
  updatePet: (id: string, pet: Partial<Pet>) => Promise<void>;
  deletePet: (id: string) => Promise<void>;
  addEvent: (petId: string, event: Omit<PetEvent, 'id'>) => Promise<void>;
  updateEvent: (petId: string, eventId: string, event: Partial<PetEvent>) => Promise<void>;
  deleteEvent: (petId: string, eventId: string) => Promise<void>;
  addHistory: (petId: string, item: Omit<PetHistoryItem, 'id'>) => Promise<void>;
  deleteHistory: (petId: string, itemId: string) => Promise<void>;
  syncLocalData: () => Promise<void>;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

export const PetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadData();
      } else {
        setPets([]);
        setLoading(false);
      }
    });

    // Carga inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadData();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select(`
          *,
          events (*),
          history_items (*)
        `)
        .order('name');

      if (petError) throw petError;

      const formattedPets: Pet[] = (petData || []).map(p => ({
        id: p.id,
        name: p.name,
        photo: p.photo_url || '',
        birthDate: p.birth_date,
        weight: p.weight || 0,
        breed: p.breed || '',
        foodType: p.food_type || '',
        allergies: p.allergies || '',
        healthConditions: p.health_conditions || '',
        medications: p.medications || '',
        status: p.status,
        events: (p.events || []).map((e: any) => ({
          id: e.id,
          type: e.type,
          title: e.title,
          date: e.date,
          time: e.time,
          completed: e.completed,
          notes: e.notes,
          recurrence: e.recurrence,
        })),
        history: (p.history_items || []).map((h: any) => ({
          id: h.id,
          type: h.type,
          title: h.title,
          date: h.date,
          notes: h.notes,
          attachments: h.attachments,
          attachmentType: h.attachment_type,
          value: h.value,
        })),
      }));

      setPets(formattedPets);
    } catch (err) {
      console.error('Error loading pets:', err);
    } finally {
      setLoading(false);
    }
  };

  const addPet = async (pet: Omit<Pet, 'id' | 'events' | 'history'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;
    if (!userId) {
      console.error('No authenticated user found for addPet');
      return;
    }

    const { data, error } = await supabase
      .from('pets')
      .insert([{
        owner_id: userId,
        name: pet.name,
        photo_url: pet.photo || null,
        birth_date: pet.birthDate || null,
        weight: pet.weight || 0,
        breed: pet.breed || null,
        food_type: pet.foodType || null,
        allergies: pet.allergies || null,
        health_conditions: pet.healthConditions || null,
        medications: pet.medications || null,
        status: pet.status || 'up_to_date',
      }])
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setPets(prev => [...prev, { ...pet, id: data.id, events: [], history: [] }]);
      return data.id;
    }
    return null;
  };

  const updatePet = async (id: string, updatedPet: Partial<Pet>) => {
    const dbUpdates: any = {};
    if (updatedPet.name !== undefined) dbUpdates.name = updatedPet.name;
    if (updatedPet.photo !== undefined) dbUpdates.photo_url = updatedPet.photo;
    if (updatedPet.birthDate !== undefined) dbUpdates.birth_date = updatedPet.birthDate;
    if (updatedPet.weight !== undefined) dbUpdates.weight = updatedPet.weight;
    if (updatedPet.breed !== undefined) dbUpdates.breed = updatedPet.breed;
    if (updatedPet.foodType !== undefined) dbUpdates.food_type = updatedPet.foodType;
    if (updatedPet.allergies !== undefined) dbUpdates.allergies = updatedPet.allergies;
    if (updatedPet.healthConditions !== undefined) dbUpdates.health_conditions = updatedPet.healthConditions;
    if (updatedPet.medications !== undefined) dbUpdates.medications = updatedPet.medications;
    if (updatedPet.status !== undefined) dbUpdates.status = updatedPet.status;

    const { error } = await supabase
      .from('pets')
      .update(dbUpdates)
      .eq('id', id);
    
    // In dev mode, we might not have a session but we can still try to local update
    if (error && !id.includes('-')) { // if it's not a real uuid it might be local
       console.error('Update error:', error);
    }

    if (error) throw error;
    setPets(prev => prev.map(p => p.id === id ? { ...p, ...updatedPet } : p));
  };

  const deletePet = async (id: string) => {
    const { error } = await supabase.from('pets').delete().eq('id', id);
    if (error) throw error;
    setPets(prev => prev.filter(p => p.id !== id));
  };

  const addEvent = async (petId: string, event: Omit<PetEvent, 'id'>) => {
    const { data, error } = await supabase
      .from('events')
      .insert([{
        pet_id: petId,
        type: event.type,
        title: event.title,
        date: event.date,
        time: event.time,
        completed: event.completed,
        notes: event.notes,
        recurrence: event.recurrence,
      }])
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setPets(prev => prev.map(p => p.id === petId ? {
        ...p,
        events: [...p.events, { ...event, id: data.id }]
      } : p));
    }
  };

  const updateEvent = async (petId: string, eventId: string, updatedEvent: Partial<PetEvent>) => {
    const dbUpdates: any = {};
    if (updatedEvent.type !== undefined) dbUpdates.type = updatedEvent.type;
    if (updatedEvent.title !== undefined) dbUpdates.title = updatedEvent.title;
    if (updatedEvent.date !== undefined) dbUpdates.date = updatedEvent.date;
    if (updatedEvent.time !== undefined) dbUpdates.time = updatedEvent.time;
    if (updatedEvent.completed !== undefined) dbUpdates.completed = updatedEvent.completed;
    if (updatedEvent.notes !== undefined) dbUpdates.notes = updatedEvent.notes;
    if (updatedEvent.recurrence !== undefined) dbUpdates.recurrence = updatedEvent.recurrence;

    const { error } = await supabase
      .from('events')
      .update(dbUpdates)
      .eq('id', eventId);

    if (error) throw error;
    setPets(prev => prev.map(p => p.id === petId ? {
      ...p,
      events: p.events.map(e => e.id === eventId ? { ...e, ...updatedEvent } : e)
    } : p));
  };

  const deleteEvent = async (petId: string, eventId: string) => {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) throw error;
    setPets(prev => prev.map(p => p.id === petId ? {
      ...p,
      events: p.events.filter(e => e.id !== eventId)
    } : p));
  };

  const addHistory = async (petId: string, item: Omit<PetHistoryItem, 'id'>) => {
    const { data, error } = await supabase
      .from('history_items')
      .insert([{
        pet_id: petId,
        type: item.type,
        title: item.title,
        date: item.date || new Date().toISOString().split('T')[0],
        notes: item.notes || null,
        attachments: item.attachments || [],
        attachment_type: item.attachmentType || null,
        value: item.value?.toString() || null,
      }])
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setPets(prev => prev.map(p => p.id === petId ? {
        ...p,
        history: [...p.history, { ...item, id: data.id }]
      } : p));
    }
  };

  const deleteHistory = async (petId: string, itemId: string) => {
    // 1. Find the item to see if it has attachments in storage
    const pet = pets.find(p => p.id === petId);
    const item = pet?.history.find(h => h.id === itemId);
    
    if (item?.attachments?.[0]) {
      const storagePath = getPathFromUrl(item.attachments[0]);
      if (storagePath) {
        try {
          await deleteFile(storagePath);
        } catch (err) {
          console.error('Failed to delete file from storage:', err);
        }
      }
    }

    // 2. Delete from DB
    const { error } = await supabase.from('history_items').delete().eq('id', itemId);
    if (error) throw error;
    setPets(prev => prev.map(p => p.id === petId ? {
      ...p,
      history: p.history.filter(h => h.id !== itemId)
    } : p));
  };

  const syncLocalData = async () => {
    const saved = localStorage.getItem('mypetcare_pets');
    if (!saved) return;

    try {
      const localPets: Pet[] = JSON.parse(saved);
      if (!Array.isArray(localPets)) return;

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) return;

      for (const pet of localPets) {
        // Simple duplicate check by name (optional)
        const { data: petData, error: petError } = await supabase
          .from('pets')
          .insert([{
            owner_id: userId,
            name: pet.name,
            photo_url: pet.photo,
            birth_date: pet.birthDate,
            weight: pet.weight,
            breed: pet.breed,
            food_type: pet.foodType,
            allergies: pet.allergies,
            health_conditions: pet.healthConditions,
            medications: pet.medications,
            status: pet.status,
          }])
          .select()
          .single();

        if (petError || !petData) continue;

        // Migrar eventos
        if (pet.events?.length > 0) {
          const eventsToInsert = pet.events.map(e => ({
            pet_id: petData.id,
            type: e.type,
            title: e.title,
            date: e.date,
            time: e.time,
            completed: e.completed,
            notes: e.notes,
            recurrence: e.recurrence,
          }));
          await supabase.from('events').insert(eventsToInsert);
        }

        // Migrar histórico
        if (pet.history?.length > 0) {
          const historyToInsert = pet.history.map(h => ({
            pet_id: petData.id,
            type: h.type,
            title: h.title,
            date: h.date,
            notes: h.notes,
            attachments: h.attachments,
            attachment_type: h.attachmentType,
            value: h.value?.toString(),
          }));
          await supabase.from('history_items').insert(historyToInsert);
        }
      }

      // Limpar após migração
      localStorage.removeItem('mypetcare_pets');
      await loadData();
    } catch (err) {
      console.error('Migration error:', err);
    }
  };

  return (
    <PetContext.Provider value={{ 
      pets, 
      loading, 
      addPet, 
      updatePet, 
      deletePet, 
      addEvent, 
      updateEvent, 
      deleteEvent, 
      addHistory, 
      deleteHistory,
      syncLocalData
    }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePets = () => {
  const context = useContext(PetContext);
  if (!context) throw new Error('usePets must be used within a PetProvider');
  return context;
};
