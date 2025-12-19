import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Ship, Calendar, Edit2, Trash2, Eye } from 'lucide-react';
import { cruiseAPI, observationAPI } from '../db/api';
import type { Cruise } from '../db/database';
import { format } from 'date-fns';

export function CruiseList() {
  const [cruises, setCruises] = useState<Cruise[]>([]);
  const [loading, setLoading] = useState(true);
  const [observationCounts, setObservationCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadCruises();
  }, []);

  async function loadCruises() {
    try {
      const data = await cruiseAPI.getAll();
      setCruises(data);

      // Load observation counts for each cruise
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (cruise) => {
          const obs = await observationAPI.getByCruise(cruise.uuid);
          counts[cruise.uuid] = obs.length;
        })
      );
      setObservationCounts(counts);
    } catch (error) {
      console.error('Error loading cruises:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(uuid: string) {
    if (!confirm('Are you sure you want to delete this cruise and all its observations?')) {
      return;
    }

    try {
      await cruiseAPI.delete(uuid);
      await loadCruises();
    } catch (error) {
      console.error('Error deleting cruise:', error);
      alert('Failed to delete cruise');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading cruises...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-white">Cruises</h2>
        <Link
          to="/cruise/create"
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>New Cruise</span>
        </Link>
      </div>

      {/* Cruise List */}
      {cruises.length === 0 ? (
        <div className="bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <Ship className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-200 mb-2">No cruises yet</h3>
          <p className="text-gray-400 mb-6">Create your first cruise to start recording observations</p>
          <Link
            to="/cruise/create"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create First Cruise</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cruises.map((cruise) => (
            <div
              key={cruise.uuid}
              className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {cruise.name}
                  </h3>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Ship className="h-4 w-4" />
                      <span>{cruise.voyage_vessel || 'Unknown vessel'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(cruise.start_date), 'MMM d, yyyy')} -{' '}
                        {format(new Date(cruise.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="text-sm text-gray-400 mb-3">
                  <span className="font-medium">{observationCounts[cruise.uuid] || 0}</span>{' '}
                  observations
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    to={`/cruise/${cruise.uuid}`}
                    className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </Link>
                  <Link
                    to={`/cruise/${cruise.uuid}/edit`}
                    className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded text-sm transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(cruise.uuid)}
                    className="flex items-center justify-center bg-red-900 hover:bg-red-800 text-red-200 px-3 py-2 rounded text-sm transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
