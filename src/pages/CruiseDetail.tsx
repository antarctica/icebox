import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { cruiseAPI } from '../db/api';
import type { Cruise } from '../db/database';
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
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </Link>
        <h2 className="text-3xl font-bold text-gray-800">
          {isEditing ? 'Edit Cruise' : 'Create New Cruise'}
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          {/* Cruise Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cruise Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Antarctic Survey 2025"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Voyage Leader */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voyage Leader *
            </label>
            <input
              type="text"
              value={formData.voyage_leader}
              onChange={(e) => setFormData({ ...formData, voyage_leader: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.voyage_leader ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.voyage_leader && (
              <p className="text-red-500 text-sm mt-1">{errors.voyage_leader}</p>
            )}
          </div>

          {/* Captain Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Captain Name *
            </label>
            <input
              type="text"
              value={formData.captain_name}
              onChange={(e) => setFormData({ ...formData, captain_name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.captain_name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.captain_name && (
              <p className="text-red-500 text-sm mt-1">{errors.captain_name}</p>
            )}
          </div>

          {/* Vessel & Ice Rating */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voyage Vessel
              </label>
              <input
                type="text"
                value={formData.voyage_vessel}
                onChange={(e) => setFormData({ ...formData, voyage_vessel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ice Rating
              </label>
              <input
                type="text"
                value={formData.voyage_ice_rating}
                onChange={(e) =>
                  setFormData({ ...formData, voyage_ice_rating: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.start_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.start_date && (
                <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.end_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.end_date && (
                <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Measurement Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Measurement Reference
            </label>
            <textarea
              value={formData.measurement_reference}
              onChange={(e) =>
                setFormData({ ...formData, measurement_reference: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional measurement information..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t">
          <Link
            to={isEditing ? `/cruise/${cruiseId}` : '/'}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
