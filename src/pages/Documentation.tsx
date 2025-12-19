import { useState } from 'react';
import { BookOpen, ChevronRight, ChevronDown } from 'lucide-react';

interface DocSection {
  title: string;
  content?: string;
  images?: { src: string; caption: string }[];
  subsections?: DocSection[];
}

const documentation: DocSection[] = [
  {
    title: 'Introduction',
    content: `TwIceBox is a complete modernization of IceBox, the Antarctic Sea Ice Processes and Climate (ASPeCt) observation software for collecting and analyzing sea ice data during research cruises.

This application enables researchers to:
- Record sea ice observations with coordinates
- Track meteorological data (temperature, wind, cloud cover)
- Document ice conditions and concentrations
- Manage observer rosters with hourly assignments
- Analyze and filter observation data
- Export data in CSV and ASPECT formats
- Import bulk observations from CSV files

Originally developed by the Australian Antarctic Division, this is a ground-up rewrite using modern web technologies while preserving all original functionality.`
  },
  {
    title: 'Getting Started',
    subsections: [
      {
        title: 'Creating a Cruise',
        content: `To begin recording observations:

1. Navigate to the home page and click "Create New Cruise"
2. Fill in the required cruise details:
   - Cruise Name
   - Voyage Leader
   - Captain Name
   - Start and End Dates
3. Optionally add vessel information and ice rating
4. Configure the observer roster if you want automated observer assignments
5. Click "Save Cruise" to create your cruise`
      },
      {
        title: 'Observer Roster',
        content: `The Observer Roster allows you to assign observers to specific UTC hours for automated assignment when creating observations.

To configure a roster:
1. When creating or editing a cruise, scroll to the "Observer Roster" section
2. Click "Add Observer" to add a new observer
3. Enter their name and contact information
4. Click on the hour buttons (00-23) to assign them to specific observation hours
5. Multiple observers can be added, and hours can be assigned to different observers

When creating a new observation, the observer field will automatically populate based on the observation time and your roster configuration.`
      }
    ]
  },
  {
    title: 'Recording Observations',
    subsections: [
      {
        title: 'Creating an Observation',
        content: `To record a new observation:

1. Navigate to your cruise's observation page
2. Click "New Observation"
3. The observation time defaults to the current time but can be adjusted
4. Enter the ship's position (latitude and longitude)
5. Record ice and meteorological observations as needed
6. Click "Save Observation"`
      },
      {
        title: 'Ice Observations',
        content: `Ice observations follow the ASPeCt protocol with three ice categories:

**Primary Ice** - The most prevalent ice type
**Secondary Ice** - The second most common ice type
**Tertiary Ice** - The third ice type if present

For each ice category, you can record:
- Ice Concentration (in tenths, 0-10)
- Ice Type (e.g., FY for First Year, MY for Multi-Year)
- Ice Thickness (thickness code or range)
- Floe Size (S, M, L, etc.)
- Topography (e.g., R0 for smooth, H5 for heavily ridged)
- Snow Type and Thickness
- Brown Ice presence
- Melt Pond Coverage, Depth, and Dimensions`
      },
      {
        title: 'Meteorological Observations',
        content: `Record weather conditions along with ice observations:

- **Air Temperature** - In degrees Celsius
- **Water Temperature** - Sea surface temperature in °C
- **Wind Speed** - In meters per second
- **Wind Direction** - In degrees (0-360)
- **Cloud Cover** - In oktas (0-8)
- **Visibility** - Select from categories (Excellent, Good, Moderate, Poor)
- **Weather Conditions** - Description of current weather
- **Observer Name** - Auto-populated from roster or manually entered
- **Comments** - Any additional notes`
      }
    ]
  },
  {
    title: 'ASPeCt Protocol Reference',
    subsections: [
      {
        title: 'Total Ice Concentration',
        content: `Total ice concentration is recorded in tenths (0-10), representing the fraction of the sea surface covered by ice:

- 0/10 - Open water (no ice)
- 1-3/10 - Very open drift ice
- 4-6/10 - Open drift ice
- 7-8/10 - Close drift ice
- 9-10/10 - Very close drift ice
- 10/10 - Compact/consolidated ice`
      },
      {
        title: 'Ice Types',
        content: `Common ice type codes:

**New Ice**
- NI - Nilas
- YI - Young ice

**First-Year Ice**
- FY - First-year ice
- TFY - Thin first-year ice
- MFY - Medium first-year ice
- TK - Thick first-year ice

**Old Ice**
- MY - Multi-year ice
- SY - Second-year ice`
      },
      {
        title: 'Ice Thickness Categories',
        content: `Ice thickness ranges (in cm):

- <5 - Nilas
- 5-10 - Dark nilas
- 10-15 - Light nilas
- 15-30 - Grey ice
- 30-70 - Grey-white ice
- 70-120 - Thin first-year ice
- 120-200 - Medium first-year ice
- >200 - Thick first-year ice
- Old ice - Multi-year or second-year ice`
      },
      {
        title: 'Floe Size',
        content: `Floe size categories:

- **G** - Giant (>10 km)
- **V** - Vast (2-10 km)
- **B** - Big (500-2000 m)
- **M** - Medium (100-500 m)
- **S** - Small (20-100 m)
- **C** - Cake (2-20 m)
- **BC** - Brash & Cake (<2 m)
- **P** - Pancake ice`,
        subsections: [
          {
            title: 'Reference Photography',
            content: 'Visual examples of different floe sizes and ice formations:',
            images: [
              { src: '/docs/_images/pancakes.jpg', caption: '100 - Pancakes: Cemented pancakes with raised rims' },
              { src: '/docs/_images/new-sheet-ice.jpg', caption: '200 - New Sheet Ice' },
              { src: '/docs/_images/brash-ice.jpg', caption: '300 - Brash/Broken Ice' },
              { src: '/docs/_images/cake-ice.jpg', caption: '400 - Cake Ice (<20m)' },
              { src: '/docs/_images/small-floes.jpg', caption: '500 - Small Floes (20-100m)' },
              { src: '/docs/_images/medium-floes.jpg', caption: '600 - Medium Floes (100-500m)' },
              { src: '/docs/_images/large-floes.jpg', caption: '700 - Large Floes (500-2000m)' },
              { src: '/docs/_images/vast-floes.jpg', caption: '800 - Vast Floes (>2000m)' }
            ]
          }
        ]
      },
      {
        title: 'Topography',
        content: `Ice surface topography codes consist of a letter and number:

**Ridge Type:**
- R - Ridged ice
- H - Hummocked ice
- U - Undulating ice

**Coverage (0-5):**
- 0 - Level ice
- 1 - 1-10% ridged
- 2 - 10-20% ridged
- 3 - 20-30% ridged
- 4 - 30-40% ridged
- 5 - >40% ridged

Example: R3 means ridged ice covering 20-30% of the surface`,
        subsections: [
          {
            title: 'Reference Photography',
            content: 'Visual examples of ice topography:',
            images: [
              { src: '/docs/_images/level-ice.jpg', caption: 'Level Ice - Smooth surface' },
              { src: '/docs/_images/finger-rafting.jpg', caption: 'Finger Rafting' },
              { src: '/docs/_images/consolidated-ridge.jpg', caption: 'Consolidated Ridge' },
              { src: '/docs/_images/new-unconsolidated-ridges.jpg', caption: 'New Unconsolidated Ridges' },
              { src: '/docs/_images/old-weathered-ridge.jpg', caption: 'Old Weathered Ridge' }
            ]
          }
        ]
      },
      {
        title: 'Brown Ice',
        content: `Brown ice refers to ice coloration caused by algal communities in different layers of the ice:

- **Surface** - Algae on top of the ice
- **Internal/Middle** - Algae within the ice structure
- **Bottom** - Algae on the underside of the ice

Brown ice is measured by the visual coloration intensity of each layer.`,
        subsections: [
          {
            title: 'Reference Photography',
            content: 'Examples of algal communities:',
            images: [
              { src: '/docs/_images/surface.jpg', caption: 'Surface Algal Community' },
              { src: '/docs/_images/internal.jpg', caption: 'Internal/Middle Algal Community' },
              { src: '/docs/_images/bottom.jpg', caption: 'Bottom Algal Community' }
            ]
          }
        ]
      }
    ]
  },
  {
    title: 'Data Management',
    subsections: [
      {
        title: 'Viewing Observations',
        content: `The observations table shows:
- Date and time of observation
- Position (latitude/longitude)
- Ice concentration
- Temperature and wind data
- Observer name

Click the eye icon to view full details of any observation.
Use the edit icon to modify observations.
Click the delete icon to remove observations (with confirmation).`
      },
      {
        title: 'Observer Roster View',
        content: `Switch to the "Observer Roster" tab to see the complete 24-hour roster:
- Each hour (00:00-23:00 UTC) is listed
- Assigned observer name and contact are displayed
- Unassigned hours are clearly marked

This view helps you verify your roster configuration and see at a glance who is responsible for observations at any given hour.`
      },
      {
        title: 'Exporting Data',
        content: `Export your cruise data in two formats:

**CSV Format**
Standard comma-separated values file suitable for:
- Excel and spreadsheet applications
- Statistical analysis software
- Custom data processing scripts

**ASPECT Format**
Specialized text format following the ASPeCt protocol conventions, suitable for:
- Official ASPeCt data submissions
- Integration with ASPeCt analysis tools
- Archival in the ASPeCt database

To export:
1. Navigate to your cruise's observations page
2. Click the "Export" button
3. Select your preferred format
4. The file will download automatically`
      },
      {
        title: 'Importing Data',
        content: `Import existing observations from CSV files:

1. Go to the Import page from the navigation menu
2. Click "Choose File" or drag and drop your CSV file
3. Review the preview of data to be imported
4. Select the target cruise for the import
5. Click "Import" to add the observations

CSV Format Requirements:
- Headers must match the expected column names
- Date/Time must be in ISO format or a recognizable date format
- Latitude and Longitude are required for each observation
- Other fields are optional but should use valid ASPeCt codes when provided`
      }
    ]
  },
  {
    title: 'Data Storage',
    content: `TwIceBox stores all data locally in your browser using IndexedDB:

**Advantages:**
- Works completely offline
- Fast access to your data
- No internet connection required
- Privacy - your data stays on your device

**Important Notes:**
- Data is stored in your browser's storage
- Clearing browser data will delete your observations
- For backup, regularly export your data to CSV or ASPECT format
- Consider copying exported files to cloud storage or external drives
- IndexedDB storage is per-browser, per-device

**Best Practices:**
- Export your cruise data at the end of each day
- Keep backups in multiple locations
- Before clearing browser data, ensure you have recent exports`
  },
  {
    title: 'Acknowledgements',
    content: `Reference photography and scientific guidance provided by:

Allison, I • Ackley, S • Calder, D • Canterbury, G • Delille, D • Fahrbach, E • Gormly, P • Haas, C • Haddock, P • Heil, P • Kosloff, P • Lytle, V • Massom, R • Monselesan, D • Reeves, R • Ushio, S • Worby, A

TwIceBox is a modernized version of IceBox, originally developed for the Australian Antarctic Division.

The ASPeCt protocol is maintained by the Antarctic Sea Ice Processes and Climate (ASPeCt) program.`
  }
];

export function Documentation() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Introduction']));

  function toggleSection(path: string) {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedSections(newExpanded);
  }

  function renderSection(section: DocSection, path: string, level: number = 0) {
    const isExpanded = expandedSections.has(path);
    const hasSubsections = section.subsections && section.subsections.length > 0;

    return (
      <div key={path} className={level > 0 ? 'ml-4' : ''}>
        <button
          onClick={() => toggleSection(path)}
          className={`w-full text-left py-3 px-4 rounded-lg transition-colors flex items-center justify-between group ${
            level === 0
              ? 'bg-gray-800 hover:bg-gray-700 mb-3'
              : 'bg-gray-900/50 hover:bg-gray-800/50 mb-2'
          }`}
        >
          <div className="flex items-center space-x-3">
            {hasSubsections ? (
              isExpanded ? (
                <ChevronDown className="h-5 w-5 text-blue-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )
            ) : (
              <div className="w-5" />
            )}
            <span
              className={`font-semibold ${
                level === 0 ? 'text-lg text-white' : 'text-base text-gray-200'
              }`}
            >
              {section.title}
            </span>
          </div>
        </button>

        {isExpanded && (
          <div className={`${level === 0 ? 'mb-6' : 'mb-3'}`}>
            {section.content && (
              <div className={`px-4 ${level > 0 ? 'ml-4' : ''} mb-4`}>
                <div className="prose prose-invert max-w-none">
                  {section.content.split('\n\n').map((paragraph, idx) => {
                    // Handle lists
                    if (paragraph.trim().match(/^[-•]\s/m) || paragraph.trim().match(/^\d+\.\s/m)) {
                      const items = paragraph.split('\n').filter(line => line.trim());
                      const isOrdered = items[0].trim().match(/^\d+\./);
                      const ListTag = isOrdered ? 'ol' : 'ul';
                      
                      return (
                        <ListTag key={idx} className="text-gray-300 space-y-2 mb-4">
                          {items.map((item, i) => (
                            <li key={i} className="leading-relaxed">
                              {item.replace(/^[-•]\s/, '').replace(/^\d+\.\s/, '')}
                            </li>
                          ))}
                        </ListTag>
                      );
                    }

                    // Handle bold text
                    const parts = paragraph.split(/\*\*(.*?)\*\*/g);
                    return (
                      <p key={idx} className="text-gray-300 leading-relaxed mb-4">
                        {parts.map((part, i) =>
                          i % 2 === 1 ? (
                            <strong key={i} className="text-white font-semibold">
                              {part}
                            </strong>
                          ) : (
                            part
                          )
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {section.images && (
              <div className={`px-4 ${level > 0 ? 'ml-4' : ''} mb-4`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.images.map((img, idx) => (
                    <div key={idx} className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700">
                      <img 
                        src={img.src} 
                        alt={img.caption}
                        className="w-full h-48 object-cover"
                      />
                      <p className="text-sm text-gray-400 p-3">{img.caption}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section.subsections?.map((subsection, idx) =>
              renderSection(subsection, `${path}/${idx}`, level + 1)
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <BookOpen className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Documentation</h1>
        </div>
        <p className="text-gray-400">
          Complete guide to using TwIceBox for sea ice observations
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        {documentation.map((section, idx) => renderSection(section, `${idx}`, 0))}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>TwIceBox • ASPeCt Sea Ice Observations</p>
        <p className="mt-1">© 2025 Australian Antarctic Division</p>
      </div>
    </div>
  );
}
