import { useState, useEffect } from 'react';
import { X, Save, MapPin, Thermometer, Wind, Cloud, Eye } from 'lucide-react';
import { observationAPI } from '../db/api';
import type { CruiseObservation, IceObservation } from '../db/database';
import { SyncStatus, makeBlankIceObservation } from '../db/database';

interface ObservationModalProps {
  cruiseId: string;
  observation: CruiseObservation | null;
  onClose: () => void;
}

export function ObservationModal({ cruiseId, observation, onClose }: ObservationModalProps) {
  const isEditing = Boolean(observation);

  const [formData, setFormData] = useState({
    entry_datetime: observation?.entry_datetime
      ? new Date(observation.entry_datetime).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    latitude: observation?.latitude?.toString() || '',
    longitude: observation?.longitude?.toString() || '',
    total_ice_concentration: observation?.total_ice_concentration?.toString() || '',
    open_water_type: observation?.open_water_type || '',
    water_temp: observation?.water_temp?.toString() || '',
    air_temp: observation?.air_temp?.toString() || '',
    wind_speed: observation?.wind_speed?.toString() || '',
    wind_direction: observation?.wind_direction?.toString() || '',
    cloud_cover: observation?.cloud_cover?.toString() || '',
    visibility: observation?.visibility || '',
    weather: observation?.weather || '',
    comments: observation?.comments || '',
    observer: observation?.observer || '',
  });

  const [iceObservations, setIceObservations] = useState<IceObservation[]>(
    observation?.ice_observations || []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.latitude) {
      newErrors.latitude = 'Latitude is required';
    } else {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude must be between -90 and 90';
      }
    }

    if (!formData.longitude) {
      newErrors.longitude = 'Longitude is required';
    } else {
      const lon = parseFloat(formData.longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) {
        newErrors.longitude = 'Longitude must be between -180 and 180';
      }
    }

    if (formData.total_ice_concentration) {
      const conc = parseFloat(formData.total_ice_concentration);
      if (isNaN(conc) || conc < 0 || conc > 100) {
        newErrors.total_ice_concentration = 'Ice concentration must be between 0 and 100';
      }
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
      const obsData: Partial<CruiseObservation> = {
        cruise: cruiseId,
        entry_datetime: new Date(formData.entry_datetime),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        total_ice_concentration: formData.total_ice_concentration
          ? parseInt(formData.total_ice_concentration)
          : undefined,
        open_water_type: formData.open_water_type || undefined,
        ice_observations: iceObservations.length > 0 ? iceObservations : undefined,
        water_temp: formData.water_temp ? parseFloat(formData.water_temp) : undefined,
        air_temp: formData.air_temp ? parseFloat(formData.air_temp) : undefined,
        wind_speed: formData.wind_speed ? parseFloat(formData.wind_speed) : undefined,
        wind_direction: formData.wind_direction ? parseInt(formData.wind_direction) : undefined,
        cloud_cover: formData.cloud_cover ? parseInt(formData.cloud_cover) : undefined,
        visibility: formData.visibility || undefined,
        weather: formData.weather || undefined,
        comments: formData.comments || undefined,
        observer: formData.observer || undefined,
        syncStatus: SyncStatus.LOCAL,
        localChanges: 0,
      };

      if (isEditing) {
        await observationAPI.update(observation.uuid, obsData);
      } else {
        await observationAPI.create(obsData as Omit<CruiseObservation, 'uuid'>);
      }

      onClose();
    } catch (error) {
      console.error('Error saving observation:', error);
      alert('Failed to save observation');
    } finally {
      setSaving(false);
    }
  }

  function addIceObservation() {
    setIceObservations([...iceObservations, makeBlankIceObservation()]);
  }

  function removeIceObservation(index: number) {
    setIceObservations(iceObservations.filter((_, i) => i !== index));
  }

  function updateIceObservation(index: number, field: keyof IceObservation, value: string | number) {
    const updated = [...iceObservations];
    updated[index] = { ...updated[index], [field]: value };
    setIceObservations(updated);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h3 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Observation' : 'New Observation'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date/Time and Position */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date/Time *
              </label>
              <input
                type="datetime-local"
                value={formData.entry_datetime}
                onChange={(e) => setFormData({ ...formData, entry_datetime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Latitude * (°)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.latitude ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="-90 to 90"
              />
              {errors.latitude && (
                <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude * (°)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.longitude ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="-180 to 180"
              />
              {errors.longitude && (
                <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>
              )}
            </div>
          </div>

          {/* Ice Concentration */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Ice Concentration (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.total_ice_concentration}
                onChange={(e) =>
                  setFormData({ ...formData, total_ice_concentration: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Open Water Type
              </label>
              <input
                type="text"
                value={formData.open_water_type}
                onChange={(e) => setFormData({ ...formData, open_water_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Weather Conditions */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Weather Conditions</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Thermometer className="inline h-4 w-4 mr-1" />
                  Air Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.air_temp}
                  onChange={(e) => setFormData({ ...formData, air_temp: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.water_temp}
                  onChange={(e) => setFormData({ ...formData, water_temp: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Wind className="inline h-4 w-4 mr-1" />
                  Wind Speed (m/s)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.wind_speed}
                  onChange={(e) => setFormData({ ...formData, wind_speed: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wind Direction (°)
                </label>
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={formData.wind_direction}
                  onChange={(e) => setFormData({ ...formData, wind_direction: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0-360"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Cloud className="inline h-4 w-4 mr-1" />
                  Cloud Cover (oktas, 0-8)
                </label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={formData.cloud_cover}
                  onChange={(e) => setFormData({ ...formData, cloud_cover: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Eye className="inline h-4 w-4 mr-1" />
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="excellent">Excellent (&gt;10 km)</option>
                  <option value="good">Good (4-10 km)</option>
                  <option value="moderate">Moderate (1-4 km)</option>
                  <option value="poor">Poor (&lt;1 km)</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weather Conditions
              </label>
              <input
                type="text"
                value={formData.weather}
                onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Clear, Overcast, Snow"
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h4>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observer Name
              </label>
              <input
                type="text"
                value={formData.observer}
                onChange={(e) => setFormData({ ...formData, observer: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes or observations..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? 'Saving...' : 'Save Observation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
