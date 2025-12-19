import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, MapPin, Thermometer, Wind, Download, ChevronDown, Users } from 'lucide-react';
import { cruiseAPI, observationAPI } from '../db/api';
import type { Cruise, CruiseObservation } from '../db/database';
import { format } from 'date-fns';
import { ObservationModal } from '../components/ObservationModal';
import { exportToCsv, exportToAspect, downloadFile, generateFilename } from '../services/export';

type TabType = 'observations' | 'roster';

export function CruiseObservations() {
  const { cruiseId } = useParams();
  const [cruise, setCruise] = useState<Cruise | null>(null);
  const [observations, setObservations] = useState<CruiseObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObservation, setEditingObservation] = useState<CruiseObservation | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('observations');

  useEffect(() => {
    loadData();
  }, [cruiseId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (exportMenuOpen && !target.closest('.export-menu-container')) {
        setExportMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportMenuOpen]);

  async function loadData() {
    if (!cruiseId) return;

    try {
      const [cruiseData, obsData] = await Promise.all([
        cruiseAPI.getById(cruiseId),
        observationAPI.getByCruise(cruiseId),
      ]);

      setCruise(cruiseData || null);
      setObservations(obsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(obsId: string) {
    if (!confirm('Are you sure you want to delete this observation?')) {
      return;
    }

    try {
      await observationAPI.delete(obsId);
      await loadData();
    } catch (error) {
      console.error('Error deleting observation:', error);
      alert('Failed to delete observation');
    }
  }

  function handleEdit(observation: CruiseObservation) {
    setEditingObservation(observation);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditingObservation(null);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingObservation(null);
    loadData();
  }

  function handleExportCsv() {
    if (!cruise) return;
    const csvContent = exportToCsv(cruise, observations);
    const filename = generateFilename(cruise, 'csv');
    downloadFile(filename, csvContent, 'text/csv');
    setExportMenuOpen(false);
  }

  function handleExportAspect() {
    if (!cruise) return;
    const aspectContent = exportToAspect(cruise, observations);
    const filename = generateFilename(cruise, 'txt');
    downloadFile(filename, aspectContent, 'text/plain');
    setExportMenuOpen(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!cruise) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Cruise not found</p>
        <Link to="/" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
          Back to Cruises
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/"
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Cruises</span>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{cruise.name}</h2>
            <div className="text-sm text-gray-400 space-y-1">
              <p>
                <span className="font-medium">Leader:</span> {cruise.voyage_leader}
              </p>
              <p>
                <span className="font-medium">Period:</span>{' '}
                {format(new Date(cruise.start_date), 'MMM d, yyyy')} -{' '}
                {format(new Date(cruise.end_date), 'MMM d, yyyy')}
              </p>
              {cruise.voyage_vessel && (
                <p>
                  <span className="font-medium">Vessel:</span> {cruise.voyage_vessel}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {observations.length > 0 && (
              <div className="relative export-menu-container">
                <button
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors text-sm text-gray-300"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {exportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-10">
                    <button
                      onClick={handleExportCsv}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors text-sm text-gray-300"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={handleExportAspect}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors text-sm text-gray-300"
                    >
                      Export as ASPECT
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <Link
              to={`/cruise/${cruiseId}/edit`}
              className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors text-sm text-gray-300"
            >
              Edit Cruise
            </Link>
            <button
              onClick={handleAdd}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>New Observation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-700">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('observations')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'observations'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Observations ({observations.length})
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center space-x-2 px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'roster'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Observer Roster</span>
          </button>
        </div>
      </div>

      {/* Observations Tab */}
      {activeTab === 'observations' && (
        <>
          {observations.length === 0 ? (
            <div className="bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <MapPin className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-200 mb-2">No observations yet</h3>
              <p className="text-gray-400 mb-6">Start recording sea ice observations for this cruise</p>
              <button
                onClick={handleAdd}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Add First Observation</span>
              </button>
            </div>
          ) : (
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ice Conc.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ice Categories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Weather
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Observer
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {observations.map((obs) => (
                  <tr key={obs.uuid} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {format(new Date(obs.entry_datetime), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {obs.latitude.toFixed(4)}°, {obs.longitude.toFixed(4)}°
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {obs.total_ice_concentration !== undefined
                        ? `${obs.total_ice_concentration}%`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      <div className="space-y-1 text-xs">
                        {obs.primary_ice && (
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-blue-400">P:</span>
                            <span>{obs.primary_ice.ice_concentration}/10</span>
                            <span className="text-gray-500">•</span>
                            <span>{obs.primary_ice.ice_type || '-'}</span>
                          </div>
                        )}
                        {obs.secondary_ice && (
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-green-400">S:</span>
                            <span>{obs.secondary_ice.ice_concentration}/10</span>
                            <span className="text-gray-500">•</span>
                            <span>{obs.secondary_ice.ice_type || '-'}</span>
                          </div>
                        )}
                        {obs.tertiary_ice && (
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-purple-400">T:</span>
                            <span>{obs.tertiary_ice.ice_concentration}/10</span>
                            <span className="text-gray-500">•</span>
                            <span>{obs.tertiary_ice.ice_type || '-'}</span>
                          </div>
                        )}
                        {!obs.primary_ice && !obs.secondary_ice && !obs.tertiary_ice && '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <div className="space-y-1">
                        {obs.air_temp !== undefined && (
                          <div className="flex items-center space-x-1">
                            <Thermometer className="h-3 w-3" />
                            <span>{obs.air_temp}°C</span>
                          </div>
                        )}
                        {obs.wind_speed !== undefined && (
                          <div className="flex items-center space-x-1">
                            <Wind className="h-3 w-3" />
                            <span>{obs.wind_speed} m/s</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {obs.observer || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(obs)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(obs.uuid)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="bg-gray-900 px-6 py-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>
                <strong>{observations.length}</strong> observations recorded
              </span>
              <span>
                Last updated: {format(new Date(), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
          </div>
        </div>
          )}
        </>
      )}

      {/* Roster Tab */}
      {activeTab === 'roster' && (
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {!cruise.rostered_persons || cruise.rostered_persons.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No observer roster configured</p>
              <Link
                to={`/cruise/${cruiseId}/edit`}
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Configure Roster
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Hour (UTC)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Observer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {Array.from({ length: 24 }, (_, hour) => {
                  const person = cruise.rostered_persons?.find(p =>
                    p.rostered_hours.includes(hour.toString())
                  );
                  return (
                    <tr key={hour} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">
                        {hour.toString().padStart(2, '0')}:00
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {person?.name || <span className="text-gray-500 italic">Not assigned</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {person?.contact || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Observation Modal */}
      {modalOpen && (
        <ObservationModal
          cruiseId={cruiseId!}
          observation={editingObservation}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
