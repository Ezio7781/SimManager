import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getSimCards,
  addSimCard,
  updateSimCardStatus,
  getStatsFromCards,
} from './services/sim-card.service';
import { SimCard } from './types/sim-card';
import './App.scss';

const App: React.FC = () => {
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [filteredSimCards, setFilteredSimCards] = useState<SimCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'Active' | 'Deactivated' | 'Spam'
  >('all');
  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [statusMenuOpenId, setStatusMenuOpenId] = useState<string | null>(null);
  const [showAddSimModal, setShowAddSimModal] = useState(false);
  const [showPersonalizePanel, setShowPersonalizePanel] = useState(false);
  const [addSimError, setAddSimError] = useState('');
  const [newSimForm, setNewSimForm] = useState({
    id: '',
    phoneNumber: '',
    personName: '',
    status: 'Active' as const,
  });
  const [orgName, setOrgName] = useState('EduConnect');
  const [selectedColor, setSelectedColor] = useState('#667eea');
  const statusOptions: Array<'Active' | 'Deactivated' | 'Spam'> = [
    'Active',
    'Deactivated',
    'Spam',
  ];
  const accentColors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#374151'];
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const stats = getStatsFromCards(simCards);

  const loadSimCards = useCallback(async () => {
    setIsLoading(true);
    setPageError('');
    try {
      const data = await getSimCards();
      setSimCards(data);
    } catch {
      setPageError('Unable to load SIM data. Start the Vercel API or configure Vercel Postgres.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...simCards];
    if (activeFilter !== 'all') {
      filtered = filtered.filter(sim => sim.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        sim =>
          sim.id.toLowerCase().includes(query) ||
          sim.phoneNumber.includes(query) ||
          sim.personName.toLowerCase().includes(query)
      );
    }
    setFilteredSimCards(filtered);
  }, [simCards, activeFilter, searchQuery]);

  useEffect(() => {
    loadSimCards();
  }, [loadSimCards]);

  useEffect(() => {
    applyFilters();
  }, [simCards, activeFilter, searchQuery, applyFilters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target as Node)
      ) {
        setStatusMenuOpenId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const adjustColor = (color: string, amount: number): string => {
      let usePound = false;
      if (color[0] === '#') {
        color = color.slice(1);
        usePound = true;
      }
      const num = parseInt(color, 16);
      let r = (num >> 16) + amount;
      if (r > 255) r = 255;
      else if (r < 0) r = 0;
      let b = ((num >> 8) & 0x00ff) + amount;
      if (b > 255) b = 255;
      else if (b < 0) b = 0;
      let g = (num & 0x0000ff) + amount;
      if (g > 255) g = 255;
      else if (g < 0) g = 0;
      return (
        (usePound ? '#' : '') +
        ((g | (b << 8) | (r << 16))).toString(16).padStart(6, '0')
      );
    };

    document.documentElement.style.setProperty('--accent-color', selectedColor);
    document.documentElement.style.setProperty(
      '--accent-gradient',
      `linear-gradient(135deg, ${selectedColor} 0%, ${adjustColor(selectedColor, -20)} 100%)`
    );
  }, [selectedColor]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const toggleStatusMenu = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setStatusMenuOpenId(statusMenuOpenId === id ? null : id);
  };

  const handleUpdateSimStatus = async (
    sim: SimCard,
    status: 'Active' | 'Deactivated' | 'Spam'
  ) => {
    try {
      const data = await updateSimCardStatus(sim.id, status);
      setSimCards(data);
      setStatusMenuOpenId(null);
    } catch {
      setPageError('Unable to update the SIM status right now.');
    }
  };

  const handleSubmitAddSim = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = newSimForm.id.trim();
    const phoneNumber = newSimForm.phoneNumber.trim();
    const personName = newSimForm.personName.trim();

    if (!id || !phoneNumber || !personName) {
      setAddSimError('Enter a SIM ID, phone number, and assigned person.');
      return;
    }

    const duplicateId = simCards.some(s => s.id.toLowerCase() === id.toLowerCase());
    if (duplicateId) {
      setAddSimError('That SIM ID already exists.');
      return;
    }

    const createdSim: SimCard = {
      id,
      phoneNumber,
      personName,
      status: newSimForm.status,
      addedDate: new Date().toISOString().slice(0, 10),
    };

    try {
      const data = await addSimCard(createdSim);
      setSimCards(data);
      setPageError('');
      setShowAddSimModal(false);
      setNewSimForm({
        id: '',
        phoneNumber: '',
        personName: '',
        status: 'Active',
      });
      setAddSimError('');
    } catch {
      setAddSimError('Unable to save the SIM right now.');
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="white" fillOpacity="0.2"/>
                <path d="M12 11.5C12.8284 11.5 13.5 10.8284 13.5 10C13.5 9.17157 12.8284 8.5 12 8.5C11.1716 8.5 10.5 9.17157 10.5 10C10.5 10.8284 11.1716 11.5 12 11.5Z" fill="white"/>
                <path d="M7.5 13.5C8.60457 12.3954 10.2155 11.75 12 11.75C13.7845 11.75 15.3954 12.3954 16.5 13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="logo-text">
              <div className="logo-name">{orgName}</div>
              <div className="logo-subtitle">SimManager</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3H21V9H3V3Z" fill="currentColor"/>
                <path d="M3 11H21V21H3V11Z" fill="currentColor" fillOpacity="0.6"/>
              </svg>
            </span>
            <span>SIM Cards</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-stats">
            <div className="sidebar-stat">
              <span className="stat-dot active"></span>
              <span>Active</span>
              <span className="stat-count">{stats.active}</span>
            </div>
            <div className="sidebar-stat">
              <span className="stat-dot deactivated"></span>
              <span>Deactivated</span>
              <span className="stat-count">{stats.deactivated}</span>
            </div>
            <div className="sidebar-stat">
              <span className="stat-dot spam"></span>
              <span>Spam</span>
              <span className="stat-count">{stats.spam}</span>
            </div>
          </div>

          <button
            className="personalize-btn-sidebar"
            onClick={() => setShowPersonalizePanel(true)}
          >
            <span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.2323 2.00318L18.9966 5.76749C19.3871 6.15802 19.3871 6.79118 18.9966 7.18171L17.4966 8.68171L13.3183 4.50338L14.8183 3.00338C15.2088 2.61285 15.8419 2.61285 16.2325 3.00338C16.623 3.39391 16.623 4.02707 16.2325 4.4176L12.6184 8.03171L14.0319 9.44523L17.646 5.8311L16.2325 4.41758L14.8189 3.00405L18.433 6.61815L19.8466 8.03167L14.8466 13.0317L13.433 11.6182L10.0001 15.0511L9.00008 15.0511L8.99992 14.0511L12.4329 10.6181L11.0193 9.20457L2.00008 18.2238L2.00008 22.0001H5.7763L14.7956 13.0008L13.382 11.5873L16.815 8.15435L20.356 4.61333C21.137 3.83228 21.137 2.56828 20.356 1.78723C19.575 1.00618 18.311 1.00618 17.53 1.78723L15.2323 4.08496L15.2323 2.00318Z" fill="currentColor"/>
              </svg>
            </span>
            <span>Personalize</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-wrapper">
          <header className="page-header">
            <div className="header-left">
              <h1 className="page-title">SIM Cards</h1>
              <p className="page-subtitle">{stats.total} registered SIMs — {stats.active} active</p>
            </div>
            <button className="btn-primary-header" type="button" onClick={() => setShowAddSimModal(true)}>
              <span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
              <span>Add SIM</span>
            </button>
          </header>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">TOTAL SIMS</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">ACTIVE</div>
              <div className="stat-value active">{stats.active}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">DEACTIVATED</div>
              <div className="stat-value deactivated">{stats.deactivated}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">SPAM</div>
              <div className="stat-value spam">{stats.spam}</div>
            </div>
          </div>

          <div className="search-filter-bar">
            <div className="search-box">
              <span className="search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by ID, number, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-tags">
              <button
                className={`filter-tag ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                <span className="filter-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 3H2L9 12.46V19L15 23V12.46L22 3Z" fill="currentColor"/>
                  </svg>
                </span>
                <span>All</span>
              </button>
              <button
                className={`filter-tag ${activeFilter === 'Active' ? 'active' : ''}`}
                onClick={() => setActiveFilter('Active')}
              >
                <span className="filter-icon" style={{ color: '#10b981' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>Active</span>
              </button>
              <button
                className={`filter-tag ${activeFilter === 'Deactivated' ? 'active' : ''}`}
                onClick={() => setActiveFilter('Deactivated')}
              >
                <span className="filter-icon" style={{ color: '#6b7280' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <span>Deactivated</span>
              </button>
              <button
                className={`filter-tag ${activeFilter === 'Spam' ? 'active' : ''}`}
                onClick={() => setActiveFilter('Spam')}
              >
                <span className="filter-icon" style={{ color: '#d97706' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M10.29 3.86L1.82 18C1.67085 18.2568 1.58923 18.5603 1.58583 18.8757C1.58243 19.1911 1.65758 19.5004 1.80279 19.7764C1.948 20.0524 2.15838 20.2858 2.41747 20.4525C2.67655 20.6192 2.97653 20.7129 3.285 20.725L20.715 20.725C21.0235 20.7129 21.3235 20.6192 21.5826 20.4525C21.8417 20.2858 22.052 20.0524 22.1972 19.7764C22.3424 19.5004 22.4176 19.1911 22.4142 18.8757C22.4108 18.5603 22.3292 18.2568 22.18 18L13.71 3.86C13.5607 3.60041 13.3455 3.37935 13.0852 3.21939C12.8249 3.05944 12.5282 2.96592 12.225 2.94738C11.9218 2.92883 11.6191 2.98604 11.3454 3.11365C11.0717 3.24127 10.8348 3.43541 10.655 3.681L10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>Spam</span>
              </button>
            </div>
          </div>

          {pageError && <div className="page-message error">{pageError}</div>}
          {isLoading && <div className="page-message info">Loading SIM data...</div>}

          <div className="table-container">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SIM ID</th>
                    <th>PHONE NUMBER</th>
                    <th>ASSIGNED TO</th>
                    <th>ADDED</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSimCards.map(sim => (
                    <tr key={sim.id}>
                      <td className="sim-id-cell">{sim.id}</td>
                      <td className="phone-cell">{sim.phoneNumber}</td>
                      <td className="assigned-cell">
                        <div className="assigned-user">
                          <div className="user-avatar">{getInitials(sim.personName)}</div>
                          <span className="user-name">{sim.personName}</span>
                        </div>
                      </td>
                      <td className="date-cell">{sim.addedDate}</td>
                      <td className="status-cell">
                        <div
                          ref={statusMenuRef}
                          className={`status-dropdown ${statusMenuOpenId === sim.id ? 'open' : ''}`}
                        >
                          <button
                            type="button"
                            className={`status-trigger status-${sim.status.toLowerCase()}`}
                            onClick={(e) => toggleStatusMenu(sim.id, e)}
                          >
                            <span className="status-option-icon">
                              {sim.status === 'Active' && (
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5"/>
                                  <path d="M6.75 10L8.85 12.1L13.25 7.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                              {sim.status === 'Deactivated' && (
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M5.5 5.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                  <path d="M11.55 4.15C11.07 4.03 10.54 3.97 10 3.97C6.53 3.97 3.56 6.19 2.46 9.32C2.36 9.59 2.36 9.9 2.46 10.17C2.79 11.12 3.32 11.98 4.01 12.68" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                  <path d="M7.33 15.53C8.15 15.84 9.05 16.01 10 16.01C13.47 16.01 16.44 13.79 17.54 10.66C17.64 10.39 17.64 10.08 17.54 9.81C17.09 8.54 16.29 7.44 15.25 6.63" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                              )}
                              {sim.status === 'Spam' && (
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 3.25L16.75 15.25H3.25L10 3.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                                  <path d="M10 7.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                  <path d="M10 13.1H10.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                              )}
                            </span>
                            <span>{sim.status}</span>
                            <span className="status-caret">
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                          </button>
                          {statusMenuOpenId === sim.id && (
                            <div className="status-menu">
                              {statusOptions.map(status => (
                                <button
                                  key={status}
                                  type="button"
                                  className={`status-menu-option status-${status.toLowerCase()} ${sim.status === status ? 'selected' : ''}`}
                                  onClick={() => handleUpdateSimStatus(sim, status)}
                                >
                                  <span className="status-option-icon">
                                    {status === 'Active' && (
                                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5"/>
                                        <path d="M6.75 10L8.85 12.1L13.25 7.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    )}
                                    {status === 'Deactivated' && (
                                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5.5 5.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                        <path d="M11.55 4.15C11.07 4.03 10.54 3.97 10 3.97C6.53 3.97 3.56 6.19 2.46 9.32C2.36 9.59 2.36 9.9 2.46 10.17C2.79 11.12 3.32 11.98 4.01 12.68" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                        <path d="M7.33 15.53C8.15 15.84 9.05 16.01 10 16.01C13.47 16.01 16.44 13.79 17.54 10.66C17.64 10.39 17.64 10.08 17.54 9.81C17.09 8.54 16.29 7.44 15.25 6.63" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                      </svg>
                                    )}
                                    {status === 'Spam' && (
                                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10 3.25L16.75 15.25H3.25L10 3.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                                        <path d="M10 7.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                        <path d="M10 13.1H10.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                      </svg>
                                    )}
                                  </span>
                                  <span>{status}</span>
                                  {sim.status === status && (
                                    <span className="status-selected-indicator">
                                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5.5 10.5L8.5 13.5L14.5 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSimCards.length === 0 && (
                    <tr>
                      <td className="empty-state-cell" colSpan={5}>
                        <div className="empty-state">
                          <div className="empty-state-title">No SIM cards yet</div>
                          <div className="empty-state-text">Add your first SIM to start tracking numbers, assignees, and statuses.</div>
                          <button type="button" className="empty-state-action" onClick={() => setShowAddSimModal(true)}>Add SIM</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span className="footer-info">Showing {filteredSimCards.length} of {simCards.length} SIMs</span>
              <span className="footer-brand">{orgName} • SIM Manager</span>
            </div>
          </div>
        </div>
      </main>

      {showAddSimModal && (
        <div className="modal-overlay" onClick={() => setShowAddSimModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Add SIM</h3>
                <p>Create a new SIM record for your dashboard.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowAddSimModal(false)}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 5L15 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form className="sim-form" onSubmit={handleSubmitAddSim}>
              <div className="sim-form-grid">
                <div className="form-group">
                  <label htmlFor="sim-id">SIM ID</label>
                  <input
                    id="sim-id"
                    name="simId"
                    type="text"
                    value={newSimForm.id}
                    onChange={(e) => setNewSimForm({ ...newSimForm, id: e.target.value })}
                    placeholder="SIM-001"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sim-phone">Phone Number</label>
                  <input
                    id="sim-phone"
                    name="phoneNumber"
                    type="text"
                    value={newSimForm.phoneNumber}
                    onChange={(e) => setNewSimForm({ ...newSimForm, phoneNumber: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sim-person">Assigned To</label>
                  <input
                    id="sim-person"
                    name="personName"
                    type="text"
                    value={newSimForm.personName}
                    onChange={(e) => setNewSimForm({ ...newSimForm, personName: e.target.value })}
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sim-status">Status</label>
                  <select
                    id="sim-status"
                    name="status"
                    value={newSimForm.status}
                    onChange={(e) => setNewSimForm({ ...newSimForm, status: e.target.value as any })}
                  >
                    <option value="Active">Active</option>
                    <option value="Deactivated">Deactivated</option>
                    <option value="Spam">Spam</option>
                  </select>
                </div>
              </div>

              {addSimError && <div className="form-error">{addSimError}</div>}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddSimModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary-header">Save SIM</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPersonalizePanel && (
        <div className="personalize-overlay" onClick={() => setShowPersonalizePanel(false)}>
          <div className="personalize-panel" onClick={(e) => e.stopPropagation()}>
            <div className="personalize-header">
              <h3>Personalize</h3>
              <button className="modal-close" onClick={() => setShowPersonalizePanel(false)}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 5L15 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="personalize-content">
              <div className="branding-section">
                <div className="section-header">
                  <span className="section-icon" style={{ backgroundColor: `${selectedColor}22` }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke={selectedColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11.5C12.8284 11.5 13.5 10.8284 13.5 10C13.5 9.17157 12.8284 8.5 12 8.5C11.1716 8.5 10.5 9.17157 10.5 10C10.5 10.8284 11.1716 11.5 12 11.5Z" fill={selectedColor}/>
                      <path d="M7.5 13.5C8.60457 12.3954 10.2155 11.75 12 11.75C13.7845 11.75 15.3954 12.3954 16.5 13.5" stroke={selectedColor} strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <div>
                    <div className="section-title">Company Branding</div>
                    <div className="section-subtitle">Personalize your portal</div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Organization Name</label>
                  <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Accent Color</label>
                  <div className="color-picker">
                    {accentColors.map(color => (
                      <div
                        key={color}
                        className={`color-option ${selectedColor === color ? 'active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      >
                        {selectedColor === color && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button className="floating-personalize" onClick={() => setShowPersonalizePanel(true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.2323 2.00318L18.9966 5.76749C19.3871 6.15802 19.3871 6.79118 18.9966 7.18171L17.4966 8.68171L13.3183 4.50338L14.8183 3.00338C15.2088 2.61285 15.8419 2.61285 16.2325 3.00338C16.623 3.39391 16.623 4.02707 16.2325 4.4176L12.6184 8.03171L14.0319 9.44523L17.646 5.8311L16.2325 4.41758L14.8189 3.00405L18.433 6.61815L19.8466 8.03167L14.8466 13.0317L13.433 11.6182L10.0001 15.0511L9.00008 15.0511L8.99992 14.0511L12.4329 10.6181L11.0193 9.20457L2.00008 18.2238L2.00008 22.0001H5.7763L14.7956 13.0008L13.382 11.5873L16.815 8.15435L20.356 4.61333C21.137 3.83228 21.137 2.56828 20.356 1.78723C19.575 1.00618 18.311 1.00618 17.53 1.78723L15.2323 4.08496L15.2323 2.00318Z" fill={selectedColor}/>
        </svg>
      </button>
    </div>
  );
};

export default App;
