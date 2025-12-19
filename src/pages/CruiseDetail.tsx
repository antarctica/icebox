import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, Plus, X } from 'lucide-react';
import { cruiseAPI } from '../db/api';
import type { Cruise, RosteredPerson } from '../db/database';
import { SyncStatus } from '../db/database';

export function CruiseDetail() {
  const { cruiseId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(cruiseId);

  const [formData, setFormData] = useState({
    name: '',
    voyage_leader: '',
    voyage_vessel: '',
    voyage_ice_rating: '',
    captain_name: '',
    start_date: '',
    end_date: '',
    measurement_reference: '',
  });
  const [rosteredPersons, setRosteredPersons] = useState<RosteredPerson[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cruiseId) {
      loadCruise();
    }
  }, [cruiseId]);

  async function loadCruise() {
    try {
      const cruise = await cruiseAPI.getById(cruiseId!);
      if (cruise) {
        setFormData({
          name: cruise.name,
          voyage_leader: cruise.voyage_leader,
          voyage_vessel: cruise.voyage_vessel || '',
          voyage_ice_rating: cruise.voyage_ice_rating || '',
          captain_name: cruise.captain_name,
          start_date: cruise.start_date.toISOString().split('T')[0],
          end_date: cruise.end_date.toISOString().split('T')[0],
          measurement_reference: cruise.measurement_reference || '',
        });
        setRosteredPersons(cruise.rostered_persons || []);
      }
    } catch (error) {
      console.error('Error loading cruise:', error);
    } finally {
      setLoading(false);
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Cruise name is required';
    }
    if (!formData.voyage_leader.trim()) {
      newErrors.voyage_leader = 'Voyage leader is required';
    }
    if (!formData.captain_name.trim()) {
      newErrors.captain_name = 'Captain name is required';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }
    if (formData.start_date && formData.end_date && 
        new Date(formData.start_date) > new Date(formData.end_date)) {
      newErrors.end_date = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      const cruiseData = {
        name: formData.name.trim(),
        voyage_leader: formData.voyage_leader.trim(),
        voyage_vessel: formData.voyage_vessel.trim() || undefined,
        voyage_ice_rating: formData.voyage_ice_rating.trim() || undefined,
        captain_name: formData.captain_name.trim(),
        start_date: new Date(formData.start_date),
        end_date: new Date(formData.end_date),
        measurement_reference: formData.measurement_reference.trim() || undefined,
        rostered_persons: rosteredPersons.length > 0 ? rosteredPersons : undefined,
        syncStatus: SyncStatus.LOCAL,
        published: false,
        localChanges: 0,
      };

      if (isEditing) {
        await cruiseAPI.update(cruiseId!, cruiseData);
      } else {
        const newCruise = await cruiseAPI.create(cruiseData as Omit<Cruise, 'uuid'>);
        navigate(`/cruise/${newCruise.uuid}`);
        return;
      }

      navigate(`/cruise/${cruiseId}`);
    } catch (error) {
      console.error('Error saving cruise:', error);
      alert('Failed to save cruise');
    } finally {
      setSaving(false);
    }
  }

  function addRosteredPerson() {
    setRosteredPersons([...rosteredPersons, { name: '', contact: '', rostered_hours: [] }]);
  }

  function updateRosteredPerson(index: number, field: keyof RosteredPerson, value: any) {
    const updated = [...rosteredPersons];
    updated[index] = { ...updated[index], [field]: value };
    setRosteredPersons(updated);
  }

  function removeRosteredPerson(index: number) {
    setRosteredPersons(rosteredPersons.filter((_, i) => i !== index));
  }

  function toggleHour(personIndex: number, hour: string) {
    const person = rosteredPersons[personIndex];
    const hours = person.rostered_hours.includes(hour)
      ? person.rostered_hours.filter(h => h !== hour)
      : [...person.rostered_hours, hour].sort((a, b) => parseInt(a) - parseInt(b));
    updateRosteredPerson(personIndex, 'rostered_hours', hours);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={isEditing ? `/cruise/${cruiseId}` : '/'}
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </Link>
        <h2 className="text-3xl font-bold text-white">
          {isEditing ? 'Edit Cruise' : 'Create New Cruise'}
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg shadow-md p-6">
        <div className="space-y-6">
          {/* Cruise Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cruise Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="e.g., Antarctic Survey 2025"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Voyage Leader */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Voyage Leader *
            </label>
            <input
              type="text"
              value={formData.voyage_leader}
              onChange={(e) => setFormData({ ...formData, voyage_leader: e.target.value })}
              className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.voyage_leader ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.voyage_leader && (
              <p className="text-red-500 text-sm mt-1">{errors.voyage_leader}</p>
            )}
          </div>

          {/* Captain Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Captain Name *
            </label>
            <input
              type="text"
              value={formData.captain_name}
              onChange={(e) => setFormData({ ...formData, captain_name: e.target.value })}
              className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.captain_name ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.captain_name && (
              <p className="text-red-500 text-sm mt-1">{errors.captain_name}</p>
            )}
          </div>

          {/* Vessel & Ice Rating */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Voyage Vessel
              </label>
              <input
                type="text"
                value={formData.voyage_vessel}
                onChange={(e) => setFormData({ ...formData, voyage_vessel: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ice Rating
              </label>
              <input
                type="text"
                value={formData.voyage_ice_rating}
                onChange={(e) =>
                  setFormData({ ...formData, voyage_ice_rating: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.start_date ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {errors.start_date && (
                <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.end_date ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {errors.end_date && (
                <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Measurement Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Measurement Reference
            </label>
            <textarea
              value={formData.measurement_reference}
              onChange={(e) =>
                setFormData({ ...formData, measurement_reference: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional measurement information..."
            />
          </div>

          {/* Observer Roster */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Observer Roster</h3>
              <button
                type="button"
                onClick={addRosteredPerson}
                className="flex items-center space-x-2 px-3 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Observer</span>
              </button>
            </div>

            {rosteredPersons.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No observers rostered yet</p>
            ) : (
              <div className="space-y-4">
                {rosteredPersons.map((person, index) => (
                  <div key={index} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={person.name}
                            onChange={(e) => updateRosteredPerson(index, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Observer name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Contact
                          </label>
                          <input
                            type="text"
                            value={person.contact || ''}
                            onChange={(e) => updateRosteredPerson(index, 'contact', e.target.value)}
                            className="w-full px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Email or phone"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRosteredPerson(index)}
                        className="ml-2 p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Rostered Hours (UTC)
                      </label>
                      <div className="grid grid-cols-12 gap-1">
                        {Array.from({ length: 24 }, (_, i) => i.toString()).map((hour) => (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => toggleHour(index, hour)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              person.rostered_hours.includes(hour)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-600'
                            }`}
                          >
                            {hour.padStart(2, '0')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-700">
          <Link
            to={isEditing ? `/cruise/${cruiseId}` : '/'}
            className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            <span>{saving ? 'Saving...' : 'Save Cruise'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
