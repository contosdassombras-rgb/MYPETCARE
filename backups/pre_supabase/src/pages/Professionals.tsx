import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, Phone, Star, Navigation, Plus, Info, User, MessageSquare, X, Search, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, TextArea } from '../components/ui/Input';

interface Review {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  rating: number;
  comment: string;
}

interface Clinic {
  id: string | number;
  name: string;
  address: string;
  phone?: string;
  whatsapp?: string;
  lat: number;
  lon: number;
  distance?: string;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const generateId = () => Math.random().toString(36).substring(2, 11);

const MAX_COMMENT_CHARS = 300;
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.n.osm.ch/api/interpreter'
];
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search?format=json&q=';

export const Professionals: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'clinics' | 'recommendations'>('clinics');
  const [citySearch, setCitySearch] = useState('');
  const [radius, setRadius] = useState(5); // km
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [lastCoords, setLastCoords] = useState<{lat: number, lon: number} | null>(null);

  const [isAddingReview, setIsAddingReview] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem('mypetcare_reviews');
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Dr. Sarah Mitchell', type: 'veterinarian', city: 'Animal City', state: 'AC', rating: 5, comment: 'Excellent care for senior dogs. Very patient and knowledgeable.' },
        { id: '2', name: 'Bubbles Pet Spa', type: 'pet_shop', city: 'Animal City', state: 'AC', rating: 4, comment: 'Great grooming service, my cat was very calm.' },
      ];
    } catch { return []; }
  });
  const [newReview, setNewReview] = useState<Omit<Review, 'id'>>({
    name: '', type: 'veterinarian', city: '', state: '', rating: 5, comment: '',
  });

  const fetchClinics = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    setLastCoords({ lat, lon });
    
    const query = `[out:json][timeout:25];(node["amenity"="veterinary"](around:${radius * 1000}, ${lat}, ${lon});way["amenity"="veterinary"](around:${radius * 1000}, ${lat}, ${lon});node["healthcare"="veterinary"](around:${radius * 1000}, ${lat}, ${lon});way["healthcare"="veterinary"](around:${radius * 1000}, ${lat}, ${lon}););out center;`;

    let lastErr = null;
    
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: query
        });

        if (!response.ok) throw new Error(`Server ${endpoint} failed`);
        
        const data = await response.json();
        const mappedClinics: Clinic[] = (data.elements || []).map((el: any) => {
          const coords = el.type === 'node' ? { lat: el.lat, lon: el.lon } : { lat: el.center.lat, lon: el.center.lon };
          return {
            id: el.id,
            name: el.tags.name || el.tags['name:pt'] || 'Clínica Veterinária',
            address: el.tags['addr:street'] 
              ? `${el.tags['addr:street']}${el.tags['addr:housenumber'] ? ', ' + el.tags['addr:housenumber'] : ''}`
              : el.tags['addr:full'] || 'Endereço registrado no mapa',
            phone: el.tags.phone || el.tags['contact:phone'] || el.tags['phone:mobile'],
            lat: coords.lat,
            lon: coords.lon
          };
        });

        setClinics(mappedClinics);
        setLoading(false);
        return;
      } catch (err) {
        console.warn(`Mirror ${endpoint} failed, trying next...`);
        lastErr = err;
      }
    }

    setError(t('error_fetching_clinics'));
    console.error('All Overpass mirrors failed:', lastErr);
    setLoading(false);
  }, [radius, t]);

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(t('location_permission'));
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchClinics(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn('Geolocation Error:', err);
        setLoading(false);
      }
    );
  }, [fetchClinics, t]);

  const handleSearchCity = async () => {
    if (!citySearch.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${NOMINATIM_URL}${encodeURIComponent(citySearch)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        fetchClinics(parseFloat(lat), parseFloat(lon));
      } else {
        setError(t('no_clinics_found'));
        setLoading(false);
      }
    } catch (err) {
      setError(t('error_fetching_clinics'));
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'clinics' && clinics.length === 0 && !loading && !citySearch) {
      handleGeolocation();
    }
  }, [activeTab, clinics.length, handleGeolocation, loading, citySearch]);

  const saveReviews = (updated: Review[]) => {
    setReviews(updated);
    localStorage.setItem('mypetcare_reviews', JSON.stringify(updated));
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    const isDuplicate = reviews.some(
      r => r.name.toLowerCase() === newReview.name.toLowerCase() && r.city.toLowerCase() === newReview.city.toLowerCase()
    );
    if (isDuplicate) return;
    saveReviews([...reviews, { ...newReview, id: generateId() }]);
    setIsAddingReview(false);
    setNewReview({ name: '', type: 'veterinarian', city: '', state: '', rating: 5, comment: '' });
  };

  const handleOpenMaps = (lat: number, lon: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <header className="mb-12 px-2">
        <h1 className="editorial-header">{t('search_professionals')}</h1>
        <div className="flex gap-4 mt-8 p-1.5 bg-surface-container-low rounded-2xl max-w-lg">
          <button
            onClick={() => setActiveTab('clinics')}
            className={cn(
              'flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all',
              activeTab === 'clinics' ? 'bg-surface-container-lowest shadow-lg text-primary scale-105' : 'text-on-surface-variant opacity-40 hover:opacity-100'
            )}
          >
            {t('nearby_clinics')}
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={cn(
              'flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all',
              activeTab === 'recommendations' ? 'bg-surface-container-lowest shadow-lg text-primary scale-105' : 'text-on-surface-variant opacity-40 hover:opacity-100'
            )}
          >
            {t('user_recommendations')}
          </button>
        </div>
      </header>

      {activeTab === 'clinics' ? (
        <div className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2">
            <div className="lg:col-span-2 flex gap-4">
              <div className="flex-1">
                <Input
                  value={citySearch}
                  onChange={e => setCitySearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchCity()}
                  placeholder={t('city_placeholder')}
                  className="py-5 px-6 rounded-2xl bg-surface-container-low/50"
                />
              </div>
              <Button
                onClick={handleSearchCity}
                isLoading={loading}
                className="py-5 px-10 rounded-2xl"
              >
                {t('search')}
              </Button>
            </div>

            <Card className="bg-surface-container-low/30 border-none p-6 rounded-[2rem] flex flex-col justify-center">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">{t('search_radius')}</span>
                <span className="text-primary font-black text-xl">{radius}km</span>
              </div>
              <input
                type="range" min="1" max="20" step="1"
                value={radius}
                onChange={e => setRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
            {loading && (
              <div className="col-span-full text-center py-32 bg-surface-container-low/20 rounded-[3rem] border-2 border-dashed border-surface-container-high/50">
                <Loader2 className="w-16 h-16 animate-spin text-primary opacity-20 mx-auto mb-6" />
                <p className="text-on-surface-variant font-black uppercase tracking-widest opacity-40">{t('loading_clinics')}</p>
              </div>
            )}

            {error && (
              <div className="col-span-full text-center py-20 text-error">
                <p className="font-bold">{error}</p>
                <Button variant="ghost" onClick={handleGeolocation} className="mt-4 underline">
                  Tentar novamente com GPS
                </Button>
              </div>
            )}

            {!loading && !error && clinics.length === 0 && (
              <div className="col-span-full text-center py-32 bg-surface-container-low/20 rounded-[3rem] border-2 border-dashed border-surface-container-high/50">
                <p className="text-on-surface-variant font-black uppercase tracking-widest opacity-40">{t('no_clinics_found')}</p>
              </div>
            )}

            {!loading && clinics.map(clinic => (
              <motion.div key={clinic.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="flex flex-col md:flex-row p-0 overflow-hidden border-none bg-surface-container-low/30 rounded-[2.5rem] group hover:bg-surface-container-low transition-colors duration-500 h-full">
                  <div className="w-full md:w-40 bg-primary/5 flex items-center justify-center p-8 shrink-0 group-hover:bg-primary/10 transition-colors">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Navigation className="w-10 h-10" />
                    </div>
                  </div>
                  <div className="p-8 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-2xl font-black font-headline text-on-surface mb-2 leading-tight">{clinic.name}</h3>
                      <div className="flex items-start gap-2 text-on-surface-variant opacity-60 mb-6">
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm font-bold leading-relaxed">{clinic.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Button
                        onClick={() => handleOpenMaps(clinic.lat, clinic.lon)}
                        className="flex-1 px-4 py-4 rounded-xl shadow-lg shadow-primary/20"
                      >
                        <Navigation className="w-4 h-4" />
                        {t('open_maps')}
                      </Button>
                      {clinic.phone && (
                        <div className="flex gap-2">
                          <a href={`tel:${clinic.phone}`}>
                            <Button variant="surface" size="icon" className="w-12 h-12 rounded-xl">
                              <Phone className="w-5 h-5" />
                            </Button>
                          </a>
                          <a href={`https://wa.me/${clinic.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="surface" size="icon" className="w-12 h-12 rounded-xl text-green-600 hover:bg-green-600/10">
                              <WhatsAppIcon className="w-6 h-6" />
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="flex justify-between items-end px-4">
            <div>
              <h2 className="text-4xl font-black font-headline tracking-tighter">{t('user_recommendations')}</h2>
              <p className="text-sm font-bold text-on-surface-variant opacity-40 uppercase tracking-widest mt-1">{t('tips_community')}</p>
            </div>
            <Button
              onClick={() => setIsAddingReview(true)}
              className="px-8 py-5 rounded-[2rem] shadow-2xl"
            >
              <Plus className="w-6 h-6 mr-2" />
              {t('add_recommendation')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
            {reviews.length === 0 ? (
              <div className="col-span-full text-center py-32 bg-surface-container-low/20 rounded-[3rem] border-2 border-dashed border-surface-container-high/50">
                <p className="text-on-surface-variant font-black uppercase tracking-widest opacity-40">{t('no_recommendations')}</p>
              </div>
            ) : (
              reviews.map(rec => (
                <motion.div key={rec.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="p-10 rounded-[2.5rem] bg-surface-container-lowest shadow-xl border-none relative overflow-hidden group h-full flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className="flex gap-5">
                        <div className="w-16 h-16 bg-primary-container text-primary rounded-2xl flex items-center justify-center shadow-inner">
                          <User className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-on-surface mb-1">{rec.name}</h3>
                          <Badge variant="surface" className="px-3 py-1 scale-90 -ml-1">{t(rec.type) || rec.type}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-secondary font-black bg-secondary/10 px-4 py-2 rounded-2xl">
                        <Star className="w-5 h-5 fill-current" />
                        {rec.rating}
                      </div>
                    </div>

                    <div className="relative mb-8 flex-grow">
                      <MessageSquare className="w-12 h-12 text-primary opacity-5 absolute -top-4 -left-4" />
                      <p className="text-on-surface-variant font-medium leading-relaxed italic text-lg relative z-10 pl-6 border-l-2 border-primary/20">
                        "{rec.comment}"
                      </p>
                    </div>

                    <div className="flex items-center pt-8 border-t border-surface-container-high/20 mt-auto">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                        <MapPin className="w-4 h-4 text-primary" />
                        {rec.city}{rec.state ? `, ${rec.state}` : ''}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Review Modal */}
      <AnimatePresence>
        {isAddingReview && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddingReview(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative w-full max-w-2xl bg-surface rounded-t-[3rem] md:rounded-[3rem] p-12 shadow-2xl overflow-y-auto max-h-[90vh] border-t-4 border-primary md:border-t-0"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black font-headline tracking-tighter">{t('add_review_title')}</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsAddingReview(false)} className="rounded-2xl">
                  <X className="w-8 h-8" />
                </Button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-60">{t('type')}</label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['veterinarian', 'clinic', 'pet_shop'] as const).map(type => (
                      <button key={type} type="button"
                        onClick={() => setNewReview({ ...newReview, type })}
                        className={cn('py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 active:scale-95',
                          newReview.type === type ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20' : 'bg-surface-container-low border-transparent text-on-surface-variant opacity-40'
                        )}>
                        {t(type)}
                      </button>
                    ))}
                  </div>
                </div>

                <Input 
                  label={t('local_name')} 
                  required 
                  value={newReview.name}
                  onChange={e => setNewReview({ ...newReview, name: e.target.value })}
                  placeholder={t('local_name_placeholder')}
                />

                <div className="grid grid-cols-2 gap-8">
                  <Input 
                    label={t('city')} 
                    required 
                    value={newReview.city}
                    onChange={e => setNewReview({ ...newReview, city: e.target.value })}
                  />
                  <Input 
                    label={t('state')} 
                    value={newReview.state || ''}
                    onChange={e => setNewReview({ ...newReview, state: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-60">{t('rating')}</label>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="text-2xl transition-all hover:scale-125 hover:rotate-12 active:scale-90"
                      >
                        <Star className={cn('w-10 h-10', star <= newReview.rating ? 'fill-secondary text-secondary drop-shadow-lg' : 'text-on-surface-variant opacity-20')} />
                      </button>
                    ))}
                  </div>
                </div>

                <TextArea
                  label={t('comment')}
                  required
                  value={newReview.comment}
                  onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Compartilhe como foi sua experiência..."
                />

                <Button type="submit" className="w-full py-6 rounded-3xl text-xl font-black shadow-2xl mt-4">
                  <Save className="w-6 h-6 mr-2" />
                  {t('submit')}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
