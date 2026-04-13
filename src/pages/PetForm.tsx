import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePets, Pet } from '../contexts/PetContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Camera, Save, ChevronLeft, Trash2, Upload, FileText, Image as ImageIcon, X } from 'lucide-react';
import { checkWeightVulnerability } from '../lib/healthUtils';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, TextArea } from '../components/ui/Input';
import { uploadFile } from '../lib/storage';
import { supabase } from '../lib/supabase';

export const PetForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pets, addPet, updatePet, deletePet, addHistory } = usePets();
  const { t } = useLanguage();

  const existingPet = pets.find(p => p.id === id);
  const [formData, setFormData] = useState<Partial<Pet>>(
    existingPet || {
      name: '',
      photo: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800',
      birthDate: '',
      weight: 0,
      breed: '',
      foodType: '',
      allergies: '',
      healthConditions: '',
      medications: '',
      status: 'up_to_date',
      history: [],
    }
  );

  const [weightInput, setWeightInput] = useState(existingPet?.weight.toString() || '');
  const [documentFiles, setDocumentFiles] = useState<{ name: string, type: string, url: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const sanitizeFilename = (name: string) => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/\s+/g, '_') // replace spaces with _
      .replace(/[^a-zA-Z0-9._-]/g, ''); // remove other special chars
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevenção de cliques duplos e validação
    if (!formData.name || loading) return;
    
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const devModeId = '24b2f3ec-aca9-4eaf-8e36-a8538a274c7f';
      const userId = session.data.session?.user.id || devModeId;
      
      let finalPhotoUrl = formData.photo || '';
      const weightVal = parseFloat(weightInput) || 0;
      const finalHistory = [...(formData.history || [])];

      // 1. Inserção Inicial do Pet (se for novo)
      let petId = id;
      if (!petId) {
        // Criamos o pet primeiro para ter o UUID
        petId = await addPet({
          ...formData,
          weight: weightVal,
          photo: '', // Placeholder
        } as Omit<Pet, 'id' | 'events' | 'history'>) || undefined;
        
        if (!petId) throw new Error('Falha ao criar pet');
      }

      // 2. Upload da Foto de Perfil (se houver nova foto)
      if (formData.photo?.startsWith('data:')) {
        const photoPath = `${userId}/${petId}/profile_${Date.now()}.jpg`;
        finalPhotoUrl = await uploadFile(formData.photo, photoPath);
      }

      // 3. Processamento de Histórico (Peso/Comida)
      if (existingPet) {
        if (weightVal !== existingPet.weight) {
          finalHistory.push({
            id: Math.random().toString(36).substring(2, 11),
            type: 'weight',
            title: t('weight_updated'),
            date: new Date().toISOString().split('T')[0],
            value: weightVal,
            notes: `${t('weight_changed_from')} ${existingPet.weight}kg ${t('to')} ${weightVal}kg`
          });
        }
        if (formData.foodType !== existingPet.foodType) {
          finalHistory.push({
            id: Math.random().toString(36).substring(2, 11),
            type: 'food',
            title: t('food_updated'),
            date: new Date().toISOString().split('T')[0],
            value: formData.foodType,
            notes: `${t('food_changed_from')} "${existingPet.foodType}" ${t('to')} "${formData.foodType}"`
          });
        }
      } else if (weightVal > 0) {
        // Registro inicial de peso para novos pets
        finalHistory.push({
          id: Math.random().toString(36).substring(2, 11),
          type: 'weight',
          title: t('initial_weight') || 'Peso Inicial',
          date: new Date().toISOString().split('T')[0],
          value: weightVal,
          notes: t('first_weight_registered') || 'Primeiro peso registrado'
        });
      }

      // 4. Upload de Documentos para o Storage
      for (const doc of documentFiles) {
        if (doc.url.startsWith('data:')) {
          const sanitizedName = sanitizeFilename(doc.name);
          const docPath = `${userId}/${petId}/documents/${Date.now()}_${sanitizedName}`;
          const uploadedUrl = await uploadFile(doc.url, docPath);
          
          finalHistory.push({
            id: Math.random().toString(36).substring(2, 11),
            type: 'document',
            title: doc.name,
            date: new Date().toISOString().split('T')[0],
            attachments: [uploadedUrl],
            attachmentType: doc.type.includes('pdf') ? 'pdf' : (doc.type.includes('word') ? 'doc' : 'img')
          });
        }
      }

      // 5. ATUALIZAÇÃO FINAL (Dados, Foto e Histórico Completo)
      await updatePet(petId, {
        ...formData,
        photo: finalPhotoUrl,
        weight: weightVal,
        history: finalHistory
      });

      // Feedback de sucesso e navegação
      navigate('/');
    } catch (err) {
      console.error('Error saving pet:', err);
      alert('Erro ao salvar os dados. ' + (err instanceof Error ? err.message : 'Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: any) => {
      if (file.size > 5 * 1024 * 1024) {
        alert("Arquivo muito grande. Limite de 5MB para salvamento local.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        
        if (id) {
          addHistory(id, {
            type: 'document',
            title: file.name,
            date: new Date().toISOString().split('T')[0],
            attachments: [base64],
            attachmentType: file.type.includes('pdf') ? 'pdf' : (file.type.includes('word') ? 'doc' : 'img')
          });
        } else {
          setDocumentFiles(prev => [...prev, { name: file.name, type: file.type, url: base64 }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = () => {
    if (id && window.confirm(t('confirm_delete_pet'))) {
      deletePet(id);
      navigate('/');
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-12">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-2xl">
          <ChevronLeft className="w-8 h-8" />
        </Button>
        <h1 className="text-4xl font-black font-headline tracking-tighter">{id ? t('edit_pet') : t('add_pet')}</h1>
        <div className="w-12" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Photo */}
        <div className="flex justify-center">
          <div className="relative group">
            <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-4 border-primary shadow-2xl transition-transform group-hover:scale-105 duration-500">
              <img src={formData.photo} alt="Pet" className="w-full h-full object-cover" />
              <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-10 h-10 text-white mb-2" />
                <span className="text-white text-xs font-bold uppercase tracking-widest">{t('change_photo')}</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setFormData({...formData, photo: reader.result as string});
                    reader.readAsDataURL(file);
                  }
                }} />
              </label>
            </div>
          </div>
        </div>

        <Card className="p-10 rounded-[3rem] space-y-8 border-none bg-surface-container-low/30 shadow-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input
              label={t('name')}
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('pet_name_placeholder')}
            />
            <Input
              label={t('breed')}
              value={formData.breed}
              onChange={e => setFormData({ ...formData, breed: e.target.value })}
              placeholder={t('breed_placeholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <Input
              label={t('birth_date')}
              type="date"
              value={formData.birthDate || ''}
              onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
            />
            <Input
              label={`${t('weight')} (kg)`}
              type="text"
              value={weightInput}
              onChange={e => {
                const val = e.target.value.replace(',', '.');
                if (/^\d*\.?\d*$/.test(val) || val === '') {
                  setWeightInput(val);
                }
              }}
              placeholder="0.0"
            />
          </div>

          <hr className="border-surface-container-high opacity-30 my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input
              label={t('food_type')}
              value={formData.foodType}
              onChange={e => setFormData({ ...formData, foodType: e.target.value })}
              placeholder={t('food_type_placeholder')}
            />
            <Input
              label={t('allergies')}
              value={formData.allergies}
              onChange={e => setFormData({ ...formData, allergies: e.target.value })}
              placeholder={t('allergies_placeholder')}
            />
          </div>

          <TextArea
            label={t('health_conditions')}
            value={formData.healthConditions}
            onChange={e => setFormData({ ...formData, healthConditions: e.target.value })}
            placeholder={t('medical_notes_placeholder')}
          />

          <Input
            label={t('medication')}
            value={formData.medications}
            onChange={e => setFormData({ ...formData, medications: e.target.value })}
            placeholder={t('medical_notes_placeholder')}
          />
        </Card>

        {/* Documents Section */}
        <section className="space-y-6">
          <div className="flex flex-col gap-1 px-4">
            <h3 className="text-2xl font-black font-headline tracking-tighter">{t('pet_documents')}</h3>
            <p className="text-sm text-on-surface-variant font-medium opacity-60">
              Tire fotos de laudos, exames ou anexe PDFs para ter tudo em mãos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <label className="flex flex-col items-center justify-center p-10 bg-surface-container-low border-2 border-dashed border-surface-container-high rounded-[2rem] hover:bg-primary-container/20 transition-all cursor-pointer group active:scale-95">
              <Upload className="w-10 h-10 text-primary group-hover:scale-110 transition-transform mb-3" />
              <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">{t('attach_file')}</span>
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>

            <label className="flex flex-col items-center justify-center p-10 bg-surface-container-low border-2 border-dashed border-surface-container-high rounded-[2rem] hover:bg-primary-container/20 transition-all cursor-pointer group active:scale-95">
              <Camera className="w-10 h-10 text-primary group-hover:scale-110 transition-transform mb-3" />
              <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">{t('take_photo')}</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          {/* Document Previews */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentFiles.map((doc, i) => (
              <Card key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low/50">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  {doc.type.includes('image') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-on-surface truncate">{doc.name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDocumentFiles(prev => prev.filter((_, idx) => idx !== i))}>
                  <X className="w-5 h-5" />
                </Button>
              </Card>
            ))}
          </div>
        </section>

        <div className="flex gap-6 pt-10">
          {id && (
            <Button
              type="button"
              variant="error"
              onClick={handleDelete}
              className="flex-1 py-5 rounded-3xl"
            >
              <Trash2 className="w-6 h-6" />
              {t('delete_pet')}
            </Button>
          )}
          <Button
            type="submit"
            className="flex-[2] py-5 rounded-3xl text-xl uppercase tracking-tighter"
          >
            <Save className="w-6 h-6" />
            {t('save')}
          </Button>
        </div>
      </form>
    </div>
  );
};
