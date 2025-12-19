import { useState, useEffect } from 'react';
import { cruiseAPI, observationAPI } from '../db/api';
import type { Cruise, CruiseObservation } from '../db/database';
import { format } from 'date-fns';
import { Filter, BarChart3, Download, MapPin, Thermometer } from 'lucide-react';
import { exportToCsv, downloadFile } from '../services/export';

interface FilterCriteria {
  cruiseId: string;
  startDate: string;
  endDate: string;
  minLat: string;
  maxLat: string;
  minLon: string;
  maxLon: string;
  minIceConc: string;
  maxIceConc: string;
}

interface Statistics {
  totalObservations: number;
  avgIceConcentration: number;
  avgAirTemp: number;
  avgWaterTemp: number;
  avgWindSpeed: number;
  dateRange: { start: Date | null; end: Date | null };
}

export function AnalysisFilter() {
  const [cruises, setCruises] = useState<Cruise[]>([]);
  const [filteredObservations, setFilteredObservations] = useState<CruiseObservation[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({
    cruiseId: '',
    startDate: '',
    endDate: '',
    minLat: '',
    maxLat: '',
    minLon: '',
    maxLon: '',
    minIceConc: '',
    maxIceConc: '',
  });

  useEffect(() => {
    loadCruises();
  }, []);

  async function loadCruises() {
    try {
      const allCruises = await cruiseAPI.getAll();
      setCruises(allCruises);
    } catch (error) {
      console.error('Error loading cruises:', error);
    }
  }

  async function handleApplyFilters() {
    setLoading(true);
    try {
      let observations: CruiseObservation[] = [];

      // Load observations based on cruise filter
      if (filters.cruiseId) {
        observations = await observationAPI.getByCruise(filters.cruiseId);
      } else {
        // Load all observations from all cruises
        const allObs = await Promise.all(
          cruises.map((cruise) => observationAPI.getByCruise(cruise.uuid))
        );
        observations = allObs.flat();
      }

      // Apply date filters
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        observations = observations.filter(
          (obs) => new Date(obs.entry_datetime) >= startDate
        );
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        observations = observations.filter(
          (obs) => new Date(obs.entry_datetime) <= endDate
        );
      }

      // Apply geographic filters
      if (filters.minLat) {
        const minLat = parseFloat(filters.minLat);
        observations = observations.filter((obs) => obs.latitude >= minLat);
      }
      if (filters.maxLat) {
        const maxLat = parseFloat(filters.maxLat);
        observations = observations.filter((obs) => obs.latitude <= maxLat);
      }
      if (filters.minLon) {
        const minLon = parseFloat(filters.minLon);
        observations = observations.filter((obs) => obs.longitude >= minLon);
      }
      if (filters.maxLon) {
        const maxLon = parseFloat(filters.maxLon);
        observations = observations.filter((obs) => obs.longitude <= maxLon);
      }

      // Apply ice concentration filters
      if (filters.minIceConc) {
        const minIce = parseFloat(filters.minIceConc);
        observations = observations.filter(
          (obs) => obs.total_ice_concentration !== undefined && obs.total_ice_concentration >= minIce
        );
      }
      if (filters.maxIceConc) {
        const maxIce = parseFloat(filters.maxIceConc);
        observations = observations.filter(
          (obs) => obs.total_ice_concentration !== undefined && obs.total_ice_concentration <= maxIce
        );
      }

      setFilteredObservations(observations);
      calculateStatistics(observations);
    } catch (error) {
      console.error('Error applying filters:', error);
      alert('Failed to apply filters');
    } finally {
      setLoading(false);
    }
  }

  function calculateStatistics(observations: CruiseObservation[]) {
    if (observations.length === 0) {
      setStatistics(null);
      return;
    }

    const stats: Statistics = {
      totalObservations: observations.length,
      avgIceConcentration: 0,
      avgAirTemp: 0,
      avgWaterTemp: 0,
      avgWindSpeed: 0,
      dateRange: { start: null, end: null },
    };

    // Calculate averages
    const iceConcs = observations
      .filter((obs) => obs.total_ice_concentration !== undefined)
      .map((obs) => obs.total_ice_concentration!);
    if (iceConcs.length > 0) {
      stats.avgIceConcentration = iceConcs.reduce((a, b) => a + b, 0) / iceConcs.length;
    }

    const airTemps = observations
      .filter((obs) => obs.air_temp !== undefined)
      .map((obs) => obs.air_temp!);
    if (airTemps.length > 0) {
      stats.avgAirTemp = airTemps.reduce((a, b) => a + b, 0) / airTemps.length;
    }

    const waterTemps = observations
      .filter((obs) => obs.water_temp !== undefined)
      .map((obs) => obs.water_temp!);
    if (waterTemps.length > 0) {
      stats.avgWaterTemp = waterTemps.reduce((a, b) => a + b, 0) / waterTemps.length;
    }

    const windSpeeds = observations
      .filter((obs) => obs.wind_speed !== undefined)
      .map((obs) => obs.wind_speed!);
    if (windSpeeds.length > 0) {
      stats.avgWindSpeed = windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length;
    }

    // Calculate date range
    const dates = observations.map((obs) => new Date(obs.entry_datetime));
    stats.dateRange.start = new Date(Math.min(...dates.map((d) => d.getTime())));
    stats.dateRange.end = new Date(Math.max(...dates.map((d) => d.getTime())));

    setStatistics(stats);
  }

  function handleExport() {
    if (filteredObservations.length === 0) return;

    const cruise = cruises.find((c) => c.uuid === filters.cruiseId);
    const dummyCruise: Cruise = cruise || {
      uuid: 'analysis',
      name: 'Analysis Export',
      voyage_leader: '',
      captain_name: '',
      start_date: new Date(),
      end_date: new Date(),
      syncStatus: 0,
      published: false,
    };

    const csvContent = exportToCsv(dummyCruise, filteredObservations);
    const filename = `analysis_export_${format(new Date(), 'yyyyMMdd')}.csv`;
    downloadFile(filename, csvContent, 'text/csv');
  }

  function handleReset() {
    setFilters({
      cruiseId: '',
      startDate: '',
      endDate: '',
      minLat: '',
      maxLat: '',
      minLon: '',
      maxLon: '',
      minIceConc: '',
      maxIceConc: '',
    });
    setFilteredObservations([]);
    setStatistics(null);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Analysis & Filtering</h2>
        <p className="text-gray-400">
          Filter observations by various criteria and view statistical summaries.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Filter Criteria</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Cruise Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cruise
            </label>
            <select
              value={filters.cruiseId}
              onChange={(e) => setFilters({ ...filters, cruiseId: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            >
              <option value="">All Cruises</option>
              {cruises.map((cruise) => (
                <option key={cruise.uuid} value={cruise.uuid}>
                  {cruise.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            />
          </div>

          {/* Geographic Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Min Latitude
            </label>
            <input
              type="number"
              step="0.0001"
              value={filters.minLat}
              onChange={(e) => setFilters({ ...filters, minLat: e.target.value })}
              placeholder="-90 to 90"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Latitude
            </label>
            <input
              type="number"
              step="0.0001"
              value={filters.maxLat}
              onChange={(e) => setFilters({ ...filters, maxLat: e.target.value })}
              placeholder="-90 to 90"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Min Longitude
            </label>
            <input
              type="number"
              step="0.0001"
              value={filters.minLon}
              onChange={(e) => setFilters({ ...filters, minLon: e.target.value })}
              placeholder="-180 to 180"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Longitude
            </label>
            <input
              type="number"
              step="0.0001"
              value={filters.maxLon}
              onChange={(e) => setFilters({ ...filters, maxLon: e.target.value })}
              placeholder="-180 to 180"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            />
          </div>

          {/* Ice Concentration Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Min Ice Concentration (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.minIceConc}
              onChange={(e) => setFilters({ ...filters, minIceConc: e.target.value })}
              placeholder="0-100"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Ice Concentration (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.maxIceConc}
              onChange={(e) => setFilters({ ...filters, maxIceConc: e.target.value })}
              placeholder="0-100"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Filter className="h-4 w-4" />
            <span>{loading ? 'Applying...' : 'Apply Filters'}</span>
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-white">Statistics</h3>
            </div>
            {filteredObservations.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Export Results</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
              <p className="text-sm text-blue-300 mb-1">Total Observations</p>
              <p className="text-2xl font-bold text-blue-100">
                {statistics.totalObservations}
              </p>
            </div>

            <div className="bg-purple-900 border border-purple-700 rounded-lg p-4">
              <p className="text-sm text-purple-300 mb-1">Avg Ice Conc.</p>
              <p className="text-2xl font-bold text-purple-100">
                {statistics.avgIceConcentration.toFixed(1)}%
              </p>
            </div>

            <div className="bg-red-900 border border-red-700 rounded-lg p-4">
              <p className="text-sm text-red-300 mb-1">Avg Air Temp</p>
              <p className="text-2xl font-bold text-red-100">
                {statistics.avgAirTemp.toFixed(1)}°C
              </p>
            </div>

            <div className="bg-cyan-900 border border-cyan-700 rounded-lg p-4">
              <p className="text-sm text-cyan-300 mb-1">Avg Water Temp</p>
              <p className="text-2xl font-bold text-cyan-100">
                {statistics.avgWaterTemp.toFixed(1)}°C
              </p>
            </div>

            <div className="bg-green-900 border border-green-700 rounded-lg p-4">
              <p className="text-sm text-green-300 mb-1">Avg Wind Speed</p>
              <p className="text-2xl font-bold text-green-100">
                {statistics.avgWindSpeed.toFixed(1)} m/s
              </p>
            </div>
          </div>

          {statistics.dateRange.start && statistics.dateRange.end && (
            <div className="mt-4 text-sm text-gray-400">
              <span className="font-medium">Date Range:</span>{' '}
              {format(statistics.dateRange.start, 'MMM d, yyyy')} -{' '}
              {format(statistics.dateRange.end, 'MMM d, yyyy')}
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      {filteredObservations.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              Filtered Observations ({filteredObservations.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
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
                    Air Temp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Water Temp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Observer
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredObservations.map((obs) => (
                  <tr key={obs.uuid} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {format(new Date(obs.entry_datetime), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-gray-500" />
                        <span>
                          {obs.latitude.toFixed(4)}, {obs.longitude.toFixed(4)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {obs.total_ice_concentration !== undefined
                        ? `${obs.total_ice_concentration}%`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {obs.air_temp !== undefined ? (
                        <div className="flex items-center space-x-1">
                          <Thermometer className="h-3 w-3 text-red-400" />
                          <span>{obs.air_temp.toFixed(1)}°C</span>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {obs.water_temp !== undefined ? `${obs.water_temp.toFixed(1)}°C` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {obs.observer || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && filteredObservations.length === 0 && statistics === null && (
        <div className="bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <BarChart3 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-200 mb-2">No Results</h3>
          <p className="text-gray-400">
            Apply filters above to analyze your observation data.
          </p>
        </div>
      )}
    </div>
  );
}
