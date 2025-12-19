import { useState, useEffect } from 'react';
import { X, Save, MapPin, Thermometer, Wind, Cloud, Eye } from 'lucide-react';
import { cruiseAPI, observationAPI } from '../db/api';
import type { CruiseObservation, IceObservation, Cruise } from '../db/database';
import { SyncStatus, makeBlankIceObservation } from '../db/database';

interface ObservationModalProps {
  cruiseId: string;
  observation: CruiseObservation | null;
  onClose: () => void;
}

export function ObservationModal({ cruiseId, observation, onClose }: ObservationModalProps) {
  const isEditing = Boolean(observation);
  const [cruise, setCruise] = useState<Cruise | null>(null);

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

  const [primaryIce, setPrimaryIce] = useState<IceObservation | null>(
    observation?.primary_ice || null
  );
  const [secondaryIce, setSecondaryIce] = useState<IceObservation | null>(
    observation?.secondary_ice || null
  );
  const [tertiaryIce, setTertiaryIce] = useState<IceObservation | null>(
    observation?.tertiary_ice || null
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCruise();
  }, [cruiseId]);

  async function loadCruise() {
    try {
      const cruiseData = await cruiseAPI.getById(cruiseId);
      setCruise(cruiseData || null);
      
      // Auto-populate observer from roster if not editing
      if (!isEditing && cruiseData && cruiseData.rostered_persons) {
        const observerName = getNextObserver(cruiseData, new Date(formData.entry_datetime));
        if (observerName) {
          setFormData(prev => ({ ...prev, observer: observerName }));
        }
      }
    } catch (error) {
      console.error('Error loading cruise:', error);
    }
  }

  function getNextObserver(cruise: Cruise, datetime: Date): string {
    if (!cruise.rostered_persons || cruise.rostered_persons.length === 0) {
      return '';
    }

    const hour = datetime.getUTCHours().toString();
    const person = cruise.rostered_persons.find(p => 
      p.rostered_hours.includes(hour)
    );

    return person ? person.name : '';
  }

  function handleDateTimeChange(datetime: string) {
    setFormData(prev => ({ ...prev, entry_datetime: datetime }));
    
    // Auto-update observer based on new datetime if cruise roster exists and not manually changed
    if (cruise && cruise.rostered_persons && !isEditing) {
      const observerName = getNextObserver(cruise, new Date(datetime));
      if (observerName) {
        setFormData(prev => ({ ...prev, entry_datetime: datetime, observer: observerName }));
      }
    }
  }

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
        primary_ice: primaryIce || undefined,
        secondary_ice: secondaryIce || undefined,
        tertiary_ice: tertiaryIce || undefined,
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

      if (isEditing && observation) {
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

  function updateIceObservation(
    type: 'primary' | 'secondary' | 'tertiary',
    field: keyof IceObservation,
    value: string | number
  ) {
    const setter = type === 'primary' ? setPrimaryIce : type === 'secondary' ? setSecondaryIce : setTertiaryIce;
    const current = type === 'primary' ? primaryIce : type === 'secondary' ? secondaryIce : tertiaryIce;
    
    setter({
      ...(current || makeBlankIceObservation()),
      [field]: value,
    });
  }

  function removeIceObservation(type: 'primary' | 'secondary' | 'tertiary') {
    if (type === 'primary') setPrimaryIce(null);
    else if (type === 'secondary') setSecondaryIce(null);
    else setTertiaryIce(null);
  }

  function addIceObservation(type: 'primary' | 'secondary' | 'tertiary') {
    if (type === 'primary') setPrimaryIce(makeBlankIceObservation());
    else if (type === 'secondary') setSecondaryIce(makeBlankIceObservation());
    else setTertiaryIce(makeBlankIceObservation());
  }

  function renderIceObservationSection(
    type: 'primary' | 'secondary' | 'tertiary',
    iceData: IceObservation | null,
    title: string,
    color: string
  ) {
    const hasData = iceData !== null;

    return (
      <div className="border-t border-gray-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className={`text-lg font-semibold text-${color}-400`}>{title}</h4>
          {!hasData ? (
            <button
              type="button"
              onClick={() => addIceObservation(type)}
              className={`px-3 py-1 bg-${color}-900 hover:bg-${color}-800 text-${color}-200 rounded text-sm transition-colors`}
            >
              + Add {title}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => removeIceObservation(type)}
              className="px-3 py-1 bg-red-900 hover:bg-red-800 text-red-200 rounded text-sm transition-colors"
            >
              Remove
            </button>
          )}
        </div>

        {hasData && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Concentration (tenths)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={iceData.ice_concentration}
                onChange={(e) => updateIceObservation(type, 'ice_concentration', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                placeholder="0-10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ice Type
              </label>
              <input
                type="text"
                value={iceData.ice_type}
                onChange={(e) => updateIceObservation(type, 'ice_type', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                placeholder="e.g., FY, MY"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ice Thickness
              </label>
              <input
                type="text"
                value={iceData.ice_thickness}
                onChange={(e) => updateIceObservation(type, 'ice_thickness', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                placeholder="e.g., 30-70"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Floe Size
              </label>
              <input
                type="text"
                value={iceData.floe_size}
                onChange={(e) => updateIceObservation(type, 'floe_size', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                placeholder="e.g., S, M, L"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Topography
              </label>
              <input
                type="text"
                value={iceData.topography}
                onChange={(e) => updateIceObservation(type, 'topography', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                placeholder="e.g., R0, H5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Snow Type
              </label>
              <input
                type="text"
                value={iceData.snow_type || ''}
                onChange={(e) => updateIceObservation(type, 'snow_type', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Snow Thickness
              </label>
              <input
                type="text"
                value={iceData.snow_thickness || ''}
                onChange={(e) => updateIceObservation(type, 'snow_thickness', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Brown Ice
              </label>
              <input
                type="text"
                value={iceData.brown_ice || ''}
                onChange={(e) => updateIceObservation(type, 'brown_ice', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Melt Pond Coverage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={iceData.melt_pond_coverage || ''}
                onChange={(e) => updateIceObservation(type, 'melt_pond_coverage', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800">
          <h3 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Observation' : 'New Observation'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date/Time and Position */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date/Time *
              </label>
              <input
                type="datetime-local"
                value={formData.entry_datetime}
                onChange={(e) => handleDateTimeChange(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Latitude * (°)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className={`w-full px-4 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white ${
                  errors.latitude ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="-90 to 90"
              />
              {errors.latitude && (
                <p className="text-red-400 text-xs mt-1">{errors.latitude}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Longitude * (°)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className={`w-full px-4 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white ${
                  errors.longitude ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="-180 to 180"
              />
              {errors.longitude && (
                <p className="text-red-400 text-xs mt-1">{errors.longitude}</p>
              )}
            </div>
          </div>

          {/* Ice Concentration */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                placeholder="0-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Open Water Type
              </label>
              <input
                type="text"
                value={formData.open_water_type}
                onChange={(e) => setFormData({ ...formData, open_water_type: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              />
            </div>
          </div>

          {/* Sea Ice Categories */}
          {renderIceObservationSection('primary', primaryIce, 'Primary Ice', 'blue')}
          {renderIceObservationSection('secondary', secondaryIce, 'Secondary Ice', 'purple')}
          {renderIceObservationSection('tertiary', tertiaryIce, 'Tertiary Ice', 'green')}

          {/* Weather Conditions */}
          <div className="border-t border-gray-700 pt-6">
            <h4 className="text-lg font-semibold text-white mb-4">Weather Conditions</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Thermometer className="inline h-4 w-4 mr-1" />
                  Air Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.air_temp}
                  onChange={(e) => setFormData({ ...formData, air_temp: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Water Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.water_temp}
                  onChange={(e) => setFormData({ ...formData, water_temp: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Wind className="inline h-4 w-4 mr-1" />
                  Wind Speed (m/s)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.wind_speed}
                  onChange={(e) => setFormData({ ...formData, wind_speed: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wind Direction (°)
                </label>
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={formData.wind_direction}
                  onChange={(e) => setFormData({ ...formData, wind_direction: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  placeholder="0-360"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Cloud className="inline h-4 w-4 mr-1" />
                  Cloud Cover (oktas, 0-8)
                </label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={formData.cloud_cover}
                  onChange={(e) => setFormData({ ...formData, cloud_cover: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Eye className="inline h-4 w-4 mr-1" />
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Weather Conditions
              </label>
              <input
                type="text"
                value={formData.weather}
                onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                placeholder="e.g., Clear, Overcast, Snow"
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="border-t border-gray-700 pt-6">
            <h4 className="text-lg font-semibold text-white mb-4">Additional Information</h4>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Observer Name
              </label>
              {cruise && cruise.rostered_persons && cruise.rostered_persons.length > 0 ? (
                <select
                  value={formData.observer}
                  onChange={(e) => setFormData({ ...formData, observer: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                >
                  <option value="">Select observer...</option>
                  {cruise.rostered_persons.map((person, idx) => (
                    <option key={idx} value={person.name}>
                      {person.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.observer}
                  onChange={(e) => setFormData({ ...formData, observer: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  placeholder="Enter observer name"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comments
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                placeholder="Additional notes or observations..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700 sticky bottom-0 bg-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
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
