import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { parseObservationsCsv, generateSampleCsv, type ImportResult } from '../services/import';
import { observationAPI } from '../db/api';
import { downloadFile } from '../services/export';
import type { CruiseObservation } from '../db/database';

export function Import() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [cruiseId, setCruiseId] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

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
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      setResult(null);
    } else {
      alert('Please drop a CSV file');
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
      const parseResult = parseObservationsCsv(content);
      setResult(parseResult);
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
          Upload a CSV file to import observations into a cruise. Download the template to see the required format.
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

      {/* Cruise ID Input */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Cruise ID <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={cruiseId}
          onChange={(e) => setCruiseId(e.target.value)}
          placeholder="Enter the UUID of the cruise to import into"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
        />
        <p className="mt-2 text-sm text-gray-400">
          You can find the cruise UUID in the URL when viewing a cruise's observations.
        </p>
      </div>

      {/* File Upload Area */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Upload CSV File</h3>
        
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
              Drag and drop your CSV file here, or
            </p>
            <label className="inline-block">
              <input
                type="file"
                accept=".csv"
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
