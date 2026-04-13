import React, { createContext, useContext, useState, useEffect } from 'react';

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
  value?: string | number; // For weight or specific values
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
  addPet: (pet: Omit<Pet, 'id' | 'events' | 'history'>) => void;
  updatePet: (id: string, pet: Partial<Pet>) => void;
  deletePet: (id: string) => void;
  addEvent: (petId: string, event: Omit<PetEvent, 'id'>) => void;
  updateEvent: (petId: string, eventId: string, event: Partial<PetEvent>) => void;
  deleteEvent: (petId: string, eventId: string) => void;
  addHistory: (petId: string, item: Omit<PetHistoryItem, 'id'>) => void;
  deleteHistory: (petId: string, itemId: string) => void;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substring(2, 11);

export const PetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pets, setPets] = useState<Pet[]>(() => {
    const saved = localStorage.getItem('mypetcare_pets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(p => ({
            ...p,
            events: p.events || [],
            history: p.history || []
          }));
        }
      } catch {
        // ignore parse errors, fallback to defaults
      }
    }
    return [
      {
        id: '1',
        name: 'Luna',
        photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400',
        birthDate: '2021-05-12',
        weight: 24.5,
        breed: 'Golden Retriever',
        foodType: 'Grain-free Salmon & Potato',
        allergies: 'Chicken Protein, Dairy',
        healthConditions: '',
        medications: 'Daily Glucosamine Supplement',
        status: 'up_to_date',
        events: [
          { id: 'e1', type: 'vaccine', title: 'Rabies Booster', date: '2026-05-12', completed: false, recurrence: 'yearly' },
        ],
        history: [
          { id: 'h1', type: 'vaccine', title: 'Annual Checkup', date: '2025-05-12', notes: 'All good' },
        ]
      },
      {
        id: '2',
        name: 'Milo',
        photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400',
        birthDate: '2019-08-15',
        weight: 4.2,
        breed: 'Domestic Shorthair',
        foodType: 'Premium Indoor Cat Food',
        allergies: '',
        healthConditions: '',
        medications: '',
        status: 'pending',
        events: [],
        history: []
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('mypetcare_pets', JSON.stringify(pets));
  }, [pets]);

  const addPet = (pet: Omit<Pet, 'id' | 'events' | 'history'>) => {
    const newPet: Pet = {
      ...pet,
      id: generateId(),
      events: [],
      history: []
    };
    setPets(prev => [...prev, newPet]);
  };

  const updatePet = (id: string, updatedPet: Partial<Pet>) => {
    setPets(prev => prev.map(p => p.id === id ? { ...p, ...updatedPet } : p));
  };

  const deletePet = (id: string) => {
    setPets(prev => prev.filter(p => p.id !== id));
  };

  const addEvent = (petId: string, event: Omit<PetEvent, 'id'>) => {
    setPets(prev => prev.map(p => p.id === petId ? {
      ...p,
      events: [...p.events, { ...event, id: generateId() }]
    } : p));
  };

  const updateEvent = (petId: string, eventId: string, updatedEvent: Partial<PetEvent>) => {
    setPets(prev => prev.map(p => p.id === petId ? {
      ...p,
      events: p.events.map(e => e.id === eventId ? { ...e, ...updatedEvent } : e)
    } : p));
  };

  const deleteEvent = (petId: string, eventId: string) => {
    setPets(prev => prev.map(p => p.id === petId ? {
      ...p,
      events: p.events.filter(e => e.id !== eventId)
    } : p));
  };

  const addHistory = (petId: string, item: Omit<PetHistoryItem, 'id'>) => {
    setPets(prev => prev.map(p => p.id === petId ? {
      ...p,
      history: [...p.history, { ...item, id: generateId() }]
    } : p));
  };

  const deleteHistory = (petId: string, itemId: string) => {
    setPets(prev => prev.map(p => p.id === petId ? {
      ...p,
      history: p.history.filter(h => h.id !== itemId)
    } : p));
  };

  return (
    <PetContext.Provider value={{ pets, addPet, updatePet, deletePet, addEvent, updateEvent, deleteEvent, addHistory, deleteHistory }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePets = () => {
  const context = useContext(PetContext);
  if (!context) throw new Error('usePets must be used within a PetProvider');
  return context;
};
