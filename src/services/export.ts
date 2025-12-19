import type { Cruise, CruiseObservation } from '../db/database';
import { format } from 'date-fns';

/**
 * Export cruise and observations to CSV format
 */
export function exportToCsv(cruise: Cruise, observations: CruiseObservation[]): string {
  const headers = [
    'Cruise Name',
    'Date/Time',
    'Latitude',
    'Longitude',
    'Ice Concentration (%)',
    'Open Water Type',
    // Primary Ice
    'Primary Ice Conc',
    'Primary Ice Type',
    'Primary Ice Thickness',
    'Primary Floe Size',
    'Primary Topography',
    // Secondary Ice
    'Secondary Ice Conc',
    'Secondary Ice Type',
    'Secondary Ice Thickness',
    'Secondary Floe Size',
    'Secondary Topography',
    // Tertiary Ice
    'Tertiary Ice Conc',
    'Tertiary Ice Type',
    'Tertiary Ice Thickness',
    'Tertiary Floe Size',
    'Tertiary Topography',
    // Met data
    'Air Temp (°C)',
    'Water Temp (°C)',
    'Wind Speed (m/s)',
    'Wind Direction (°)',
    'Cloud Cover (oktas)',
    'Visibility',
    'Weather',
    'Observer',
    'Comments'
  ];

  const rows = observations.map(obs => [
    cruise.name,
    format(new Date(obs.entry_datetime), 'yyyy-MM-dd HH:mm:ss'),
    obs.latitude.toFixed(6),
    obs.longitude.toFixed(6),
    obs.total_ice_concentration ?? '',
    obs.open_water_type ?? '',
    // Primary Ice
    obs.primary_ice?.ice_concentration ?? '',
    obs.primary_ice?.ice_type ?? '',
    obs.primary_ice?.ice_thickness ?? '',
    obs.primary_ice?.floe_size ?? '',
    obs.primary_ice?.topography ?? '',
    // Secondary Ice
    obs.secondary_ice?.ice_concentration ?? '',
    obs.secondary_ice?.ice_type ?? '',
    obs.secondary_ice?.ice_thickness ?? '',
    obs.secondary_ice?.floe_size ?? '',
    obs.secondary_ice?.topography ?? '',
    // Tertiary Ice
    obs.tertiary_ice?.ice_concentration ?? '',
    obs.tertiary_ice?.ice_type ?? '',
    obs.tertiary_ice?.ice_thickness ?? '',
    obs.tertiary_ice?.floe_size ?? '',
    obs.tertiary_ice?.topography ?? '',
    // Met data
    obs.air_temp ?? '',
    obs.water_temp ?? '',
    obs.wind_speed ?? '',
    obs.wind_direction ?? '',
    obs.cloud_cover ?? '',
    obs.visibility ?? '',
    obs.weather ?? '',
    obs.observer ?? '',
    (obs.comments ?? '').replace(/[\n\r]/g, ' ') // Remove line breaks from comments
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Export to ASPECT format (simplified version)
 * The original ASPECT format is complex - this is a basic implementation
 */
export function exportToAspect(cruise: Cruise, observations: CruiseObservation[]): string {
  const lines: string[] = [];
  
  // Header
  lines.push('ASPECT Sea Ice Observation Data');
  lines.push(`Cruise: ${cruise.name}`);
  lines.push(`Leader: ${cruise.voyage_leader}`);
  lines.push(`Vessel: ${cruise.voyage_vessel || 'N/A'}`);
  lines.push(`Period: ${format(new Date(cruise.start_date), 'yyyy-MM-dd')} to ${format(new Date(cruise.end_date), 'yyyy-MM-dd')}`);
  lines.push('');
  lines.push('--- Observations ---');
  lines.push('');

  // Observations
  observations.forEach((obs, index) => {
    lines.push(`Observation ${index + 1}`);
    lines.push(`Date/Time: ${format(new Date(obs.entry_datetime), 'yyyy-MM-dd HH:mm:ss')}`);
    lines.push(`Position: ${obs.latitude.toFixed(6)}° ${obs.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(obs.longitude).toFixed(6)}° ${obs.longitude >= 0 ? 'E' : 'W'}`);
    
    if (obs.total_ice_concentration !== undefined) {
      lines.push(`Total Ice Concentration: ${obs.total_ice_concentration}%`);
    }
    
    // Primary Ice
    if (obs.primary_ice) {
      lines.push(`Primary Ice: ${obs.primary_ice.ice_concentration}/10 - ${obs.primary_ice.ice_type || 'N/A'} - ${obs.primary_ice.ice_thickness || 'N/A'} - ${obs.primary_ice.floe_size || 'N/A'} - ${obs.primary_ice.topography || 'N/A'}`);
    }
    
    // Secondary Ice
    if (obs.secondary_ice) {
      lines.push(`Secondary Ice: ${obs.secondary_ice.ice_concentration}/10 - ${obs.secondary_ice.ice_type || 'N/A'} - ${obs.secondary_ice.ice_thickness || 'N/A'} - ${obs.secondary_ice.floe_size || 'N/A'} - ${obs.secondary_ice.topography || 'N/A'}`);
    }
    
    // Tertiary Ice
    if (obs.tertiary_ice) {
      lines.push(`Tertiary Ice: ${obs.tertiary_ice.ice_concentration}/10 - ${obs.tertiary_ice.ice_type || 'N/A'} - ${obs.tertiary_ice.ice_thickness || 'N/A'} - ${obs.tertiary_ice.floe_size || 'N/A'} - ${obs.tertiary_ice.topography || 'N/A'}`);
    }
    
    if (obs.air_temp !== undefined) {
      lines.push(`Air Temperature: ${obs.air_temp}°C`);
    }
    
    if (obs.water_temp !== undefined) {
      lines.push(`Water Temperature: ${obs.water_temp}°C`);
    }
    
    if (obs.wind_speed !== undefined) {
      lines.push(`Wind: ${obs.wind_speed} m/s${obs.wind_direction ? ` from ${obs.wind_direction}°` : ''}`);
    }
    
    if (obs.weather) {
      lines.push(`Weather: ${obs.weather}`);
    }
    
    if (obs.observer) {
      lines.push(`Observer: ${obs.observer}`);
    }
    
    if (obs.comments) {
      lines.push(`Comments: ${obs.comments}`);
    }
    
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Download a file with the given content
 */
export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a safe filename from cruise name and date
 */
export function generateFilename(cruise: Cruise, extension: string): string {
  const safeName = cruise.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = format(new Date(), 'yyyyMMdd');
  return `${safeName}_${dateStr}.${extension}`;
}
