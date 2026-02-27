import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X, PlusCircle } from 'lucide-react';
import { parseObservationsCsv, parseAspectTextFile, detectFileFormat, generateSampleCsv, type ImportResult } from '../services/import';
import { observationAPI, cruiseAPI } from '../db/api';
import { downloadFile } from '../services/export';
import type { Cruise, CruiseObservation } from '../db/database';
import { SyncStatus } from '../db/database';

export function Import() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [cruiseId, setCruiseId] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [cruises, setCruises] = useState<Cruise[]>([]);
  const [creatingCruise, setCreatingCruise] = useState(false);

  useEffect(() => {
    cruiseAPI.getAll().then(setCruises);
  }, []);

  // When an ASPeCt file parse result comes in, try to auto-select a matching cruise by name
  function tryAutoSelectCruise(parseResult: ImportResult) {
    if (!parseResult.cruiseMeta?.name) return;
    const match = cruises.find(
      (c) => c.name.trim().toLowerCase() === parseResult.cruiseMeta!.name!.trim().toLowerCase()
    );
    if (match) setCruiseId(match.uuid);
  }

  async function handleCreateCruiseFromFile() {
    if (!result?.cruiseMeta) return;
    const meta = result.cruiseMeta;
    if (!meta.name || !meta.voyage_leader || !meta.captain_name) {
      alert('File metadata is missing required cruise fields (name, voyage_leader, captain_name).');
      return;
    }
    setCreatingCruise(true);
    try {
      const newCruise = await cruiseAPI.create({
        name: meta.name,
        voyage_leader: meta.voyage_leader,
        captain_name: meta.captain_name,
        voyage_vessel: meta.voyage_vessel,
        start_date: meta.start_date ? new Date(meta.start_date) : new Date(),
        end_date: meta.end_date ? new Date(meta.end_date) : new Date(),
        syncStatus: SyncStatus.LOCAL,
        published: false,
        localChanges: 0,
      });
      setCruises((prev) => [...prev, newCruise]);
      setCruiseId(newCruise.uuid);
    } catch (error) {
      alert(`Failed to create cruise: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreatingCruise(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;
    const isText =
      droppedFile.type === 'text/csv' ||
      droppedFile.type === 'text/plain' ||
      droppedFile.type === '' ||
      droppedFile.name.endsWith('.csv') ||
      droppedFile.name.endsWith('.txt') ||
      /^\d{8}[A-Za-z]{2}\d+$/.test(droppedFile.name);
    if (isText) {
      setFile(droppedFile);
      setResult(null);
    } else {
      alert('Please drop a CSV file or an ASPeCt text file (e.g. 20260101SD056)');
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  }

  async function handlePreview() {
    if (!file) return;

    try {
      const content = await file.text();
      const format = detectFileFormat(file.name, content);
      const parseResult =
        format === 'aspect'
          ? parseAspectTextFile(content)
          : parseObservationsCsv(content);
      setResult(parseResult);
      tryAutoSelectCruise(parseResult);
    } catch (error) {
      alert(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function handleImport() {
    if (!file || !cruiseId || !result) return;

    setImporting(true);
    try {
      // Import all observations
      const importPromises = result.observations.map((obs) =>
        observationAPI.create({
          ...obs as CruiseObservation,
          cruise: cruiseId,
        })
      );

      await Promise.all(importPromises);
      
      alert(`Successfully imported ${result.observations.length} observations!`);
      navigate(`/cruise/${cruiseId}`);
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  }

  function handleDownloadTemplate() {
    const template = generateSampleCsv();
    downloadFile('observation_template.csv', template, 'text/csv');
  }

  function handleReset() {
    setFile(null);
    setResult(null);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Import Observations</h2>
        <p className="text-gray-400">
          Upload a CSV file or an ASPeCt text file (e.g. <code className="text-blue-300">20260101SD056</code>) to import observations into a cruise.
        </p>
      </div>

      {/* Download Template */}
      <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-6 flex items-start space-x-3">
        <FileText className="h-5 w-5 text-blue-300 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-100 mb-1">Need a template?</h3>
          <p className="text-sm text-blue-200 mb-3">
            Download a sample CSV file with the correct format and example data.
          </p>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            <span>Download Template</span>
          </button>
        </div>
      </div>

      {/* Cruise Selector */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Cruise <span className="text-red-400">*</span>
        </label>
        {cruises.length === 0 ? (
          <p className="text-sm text-yellow-400">No cruises found. Create a cruise first, or import an ASPeCt file and use &ldquo;Create cruise from file&rdquo; below.</p>
        ) : (
          <select
            value={cruiseId}
            onChange={(e) => setCruiseId(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
          >
            <option value="">— Select a cruise —</option>
            {cruises.map((c) => (
              <option key={c.uuid} value={c.uuid}>
                {c.name}{c.voyage_vessel ? ` · ${c.voyage_vessel}` : ''} ({new Date(c.start_date).toLocaleDateString()} – {new Date(c.end_date).toLocaleDateString()})
              </option>
            ))}
          </select>
        )}

        {/* Create cruise from ASPeCt file metadata */}
        {result?.cruiseMeta && !cruiseId && (
          <button
            onClick={handleCreateCruiseFromFile}
            disabled={creatingCruise}
            className="mt-3 flex items-center space-x-2 text-sm bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{creatingCruise ? 'Creating...' : `Create cruise "${result.cruiseMeta.name}" from file`}</span>
          </button>
        )}
      </div>

      {/* File Upload Area */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Upload CSV or ASPeCt File</h3>
        
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-900' : 'border-gray-600'
            }`}
          >
            <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">
              Drag and drop your CSV or ASPeCt text file here, or
            </p>
            <label className="inline-block">
              <input
                type="file"
                accept=".csv,.txt,*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium">
                browse files
              </span>
            </label>
          </div>
        ) : (
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="font-medium text-gray-200">{file.name}</p>
                  <p className="text-sm text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex space-x-3">
              <button
                onClick={handlePreview}
                disabled={importing}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Preview Data
              </button>
              <button
                onClick={handleImport}
                disabled={!cruiseId || !result || result.errors.length > 0 || importing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import Observations'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ASPeCt Cruise Metadata */}
      {result?.cruiseMeta && (
        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cruise Info from File</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {result.cruiseMeta.name && (
              <><dt className="text-gray-400">Name</dt><dd className="text-gray-100">{result.cruiseMeta.name}</dd></>
            )}
            {result.cruiseMeta.voyage_vessel && (
              <><dt className="text-gray-400">Vessel</dt><dd className="text-gray-100">{result.cruiseMeta.voyage_vessel}</dd></>
            )}
            {result.cruiseMeta.voyage_leader && (
              <><dt className="text-gray-400">Voyage Leader</dt><dd className="text-gray-100">{result.cruiseMeta.voyage_leader}</dd></>
            )}
            {result.cruiseMeta.captain_name && (
              <><dt className="text-gray-400">Captain</dt><dd className="text-gray-100">{result.cruiseMeta.captain_name}</dd></>
            )}
            {result.cruiseMeta.start_date && (
              <><dt className="text-gray-400">Start Date</dt><dd className="text-gray-100">{new Date(result.cruiseMeta.start_date).toLocaleDateString()}</dd></>
            )}
            {result.cruiseMeta.end_date && (
              <><dt className="text-gray-400">End Date</dt><dd className="text-gray-100">{new Date(result.cruiseMeta.end_date).toLocaleDateString()}</dd></>
            )}
          </dl>
        </div>
      )}

      {/* Preview Results */}
      {result && (
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Import Preview</h3>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-900 border border-green-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-300">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Valid Observations</span>
              </div>
              <p className="text-2xl font-bold text-green-100 mt-2">
                {result.observations.length}
              </p>
            </div>

            <div className="bg-red-900 border border-red-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-300">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Errors</span>
              </div>
              <p className="text-2xl font-bold text-red-100 mt-2">
                {result.errors.length}
              </p>
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-red-300 mb-2">Errors Found:</h4>
              <div className="bg-red-900 border border-red-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                <ul className="space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-200">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-red-400 mt-2">
                Please fix these errors in your CSV file before importing.
              </p>
            </div>
          )}

          {/* Sample Data Preview */}
          {result.observations.length > 0 && (
            <div>
              <h4 className="font-semibold text-white mb-2">
                Sample Data (first 5 observations):
              </h4>
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Date/Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Latitude
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Longitude
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Ice Conc.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Observer
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {result.observations.slice(0, 5).map((obs, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-200">
                            {obs.entry_datetime ? new Date(obs.entry_datetime).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-200">
                            {obs.latitude?.toFixed(4) ?? 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-200">
                            {obs.longitude?.toFixed(4) ?? 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-200">
                            {obs.total_ice_concentration !== undefined
                              ? `${obs.total_ice_concentration}%`
                              : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-200">
                            {obs.observer || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
