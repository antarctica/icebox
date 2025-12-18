import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, MapPin, Thermometer, Wind, Download, ChevronDown } from 'lucide-react';
import { cruiseAPI, observationAPI } from '../db/api';
import type { Cruise, CruiseObservation } from '../db/database';
import { format } from 'date-fns';
import { ObservationModal } from '../components/ObservationModal';
import { exportToCsv, exportToAspect, downloadFile, generateFilename } from '../services/export';

export function CruiseObservations() {
  const { cruiseId } = useParams();
  const [cruise, setCruise] = useState<Cruise | null>(null);
  const [observations, setObservations] = useState<CruiseObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObservation, setEditingObservation] = useState<CruiseObservation | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

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
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!cruise) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cruise not found</p>
        <Link to="/" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
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
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Cruises</span>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{cruise.name}</h2>
            <div className="text-sm text-gray-600 space-y-1">
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
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {exportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={handleExportCsv}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={handleExportAspect}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm"
                    >
                      Export as ASPECT
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <Link
              to={`/cruise/${cruiseId}/edit`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
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

      {/* Observations List */}
      {observations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No observations yet</h3>
          <p className="text-gray-500 mb-6">Start recording sea ice observations for this cruise</p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add First Observation</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ice Conc.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weather
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observer
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {observations.map((obs) => (
                  <tr key={obs.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(obs.entry_datetime), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {obs.latitude.toFixed(4)}°, {obs.longitude.toFixed(4)}°
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {obs.total_ice_concentration !== undefined
                        ? `${obs.total_ice_concentration}%`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {obs.observer || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(obs)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(obs.uuid)}
                          className="text-red-600 hover:text-red-900"
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
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
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
