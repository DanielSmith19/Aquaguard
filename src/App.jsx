import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

const STORAGE_KEY = 'aquaguard-organizations';

const roleLabels = {
  lifeguard: 'Lifeguard',
  manager: 'Manager',
  admin: 'Admin',
};

const assistantSources = [
  'American Red Cross Lifeguarding Manual',
  'StarGuard: Best Practices for Lifeguards (5th Edition)',
  'Pool & Spa Operator Handbook (2024 Edition)',
  'National Pool and Waterpark Lifeguard Training (Ellis & Associates)',
  'The Ultimate Guide to Pool Maintenance (3rd Edition)',
  'Lifeguarding For Dummies',
];

const assistantQuickPrompts = [
  'Cloudy water and chlorine spike',
  'How to respond to suspected spinal injury',
  'What to check before opening a pool',
  'How to handle elevated pH',
  'What to include in a shift handoff',
];

const messageTabs = [
  { id: 'announcements', label: 'Announcements' },
  { id: 'direct', label: 'Personal' },
  { id: 'groups', label: 'Groups' },
];

const masterChecklist = [
  'Test chlorine levels',
  'Check pH balance',
  'Inspect drain covers',
  'Check rescue equipment',
  'Verify capacity counter',
  'Clear lane rope tangles',
  'Check water temperature',
  'Backwash filter',
  'Add alkalinity increaser',
  'Inspect pool perimeter',
];

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const chemistryMetricMap = {
  'Free chlorine': { key: 'chlorine', unit: 'ppm' },
  'pH level': { key: 'ph', unit: '' },
  Capacity: { key: 'capacity', unit: 'guests' },
  'Water temp': { key: 'temperature', unit: 'F' },
};

const realPoolLocations = [
  {
    id: 'rex-nettleford-hall',
    name: 'Rex Nettleford Hall',
    subtitle: 'UWI Mona, Kingston 7',
    zoneLabel: 'Lane 3',
    latitude: 18.00288,
    longitude: -76.74195,
    radiusMeters: 90,
    geofenced: true,
  },
  {
    id: 'kintyre-community',
    name: 'Kintyre Community Pool',
    subtitle: 'Kintyre, St. Andrew',
    zoneLabel: 'Main pool',
    latitude: 18.02133,
    longitude: -76.72688,
    radiusMeters: 1400,
    geofenced: true,
  },
];

const seedOrganizations = [
  {
    id: 'org-aquaguard-demo',
    code: 'AQA-101',
    name: 'AquaGuard Demo Ops',
    adminName: 'Daniel Smith',
    email: 'daniel@aquaguardops.com',
    password: 'AquaGuard2026!',
    region: 'Kingston Coastal District',
    poolCount: 3,
    employees: {
      'LG-6001': {
        id: 'LG-6001',
        name: 'Daniel Smith',
        role: 'lifeguard',
        schedule: 'Rex Nettleford Hall 8am-4pm today',
        assignedPoolId: 'rex-nettleford-hall',
        phone: '(876) 555-0101',
        certifications: 'Lifeguard, CPR/AED, First Aid',
        profileNote: 'Prefers early-morning opening shifts.',
        avatarUrl: '',
      },
      'MG-7001': {
        id: 'MG-7001',
        name: 'Daniel Smith',
        role: 'manager',
        schedule: 'All pools visible today',
        phone: '(876) 555-0101',
        certifications: 'Lifeguard Instructor, CPR/AED',
        profileNote: 'Operations lead for Kingston sites.',
        avatarUrl: '',
      },
      'AD-9001': {
        id: 'AD-9001',
        name: 'Daniel Smith',
        role: 'admin',
        schedule: 'Full organization access today',
        phone: '(876) 555-0101',
        certifications: 'Operations Admin',
        profileNote: 'Tenant owner and configuration lead.',
        avatarUrl: '',
      },
    },
    pools: buildStarterPools('AquaGuard Demo Ops', 3),
    schedules: buildStarterSchedules('AquaGuard Demo Ops'),
    communications: buildStarterCommunications('AquaGuard Demo Ops'),
  },
  {
    id: 'org-sunridge',
    code: 'SUN-001',
    name: 'Sunridge Aquatics',
    adminName: 'Marcus Thompson',
    email: 'marcus@sunridgeaquatics.com',
    password: 'demo1234',
    region: 'North Shore',
    poolCount: 4,
    employees: {
      'LG-4821': {
        id: 'LG-4821',
        name: 'Jordan Doe',
        role: 'lifeguard',
        schedule: 'Rex Nettleford Hall 7am-3pm today',
        assignedPoolId: 'rex-nettleford-hall',
        phone: '(876) 555-0102',
        certifications: 'Lifeguard, CPR/AED',
        profileNote: 'Focuses on opening inspections and handoff notes.',
        avatarUrl: '',
      },
      'MG-0012': {
        id: 'MG-0012',
        name: 'Marcus Thompson',
        role: 'manager',
        schedule: 'All pools visible today',
        phone: '(876) 555-0103',
        certifications: 'Pool Operator, CPR/AED',
        profileNote: 'Supervises multi-pool operations.',
        avatarUrl: '',
      },
      'AD-0001': {
        id: 'AD-0001',
        name: 'Sarah Chen',
        role: 'admin',
        schedule: 'No specific pool schedule today',
        phone: '(876) 555-0104',
        certifications: 'Admin Operations',
        profileNote: 'Handles staff setup and compliance records.',
        avatarUrl: '',
      },
    },
    pools: buildStarterPools('Sunridge Aquatics', 4),
    schedules: buildStarterSchedules('Sunridge Aquatics'),
    communications: buildStarterCommunications('Sunridge Aquatics'),
  },
  {
    id: 'org-harbor',
    code: 'HBR-204',
    name: 'Harbor Aquatics Group',
    adminName: 'Alex Rivera',
    email: 'operations@harboraquatics.com',
    password: 'demo1234',
    region: 'Harbor District',
    poolCount: 2,
    employees: {
      'LG-3302': {
        id: 'LG-3302',
        name: 'Alex Rivera',
        role: 'lifeguard',
        schedule: 'Kintyre Community Pool 9am-5pm today',
        assignedPoolId: 'kintyre-community',
        phone: '(876) 555-0105',
        certifications: 'Lifeguard, Waterpark Safety',
        profileNote: 'Specializes in high-traffic pool coverage.',
        avatarUrl: '',
      },
      'MG-7002': {
        id: 'MG-7002',
        name: 'Harbor Lead',
        role: 'manager',
        schedule: 'All pools visible today',
        phone: '(876) 555-0106',
        certifications: 'Manager, CPR/AED',
        profileNote: 'Coordinates the harbor district sites.',
        avatarUrl: '',
      },
    },
    pools: buildStarterPools('Harbor Aquatics Group', 2),
    schedules: buildStarterSchedules('Harbor Aquatics Group'),
    communications: buildStarterCommunications('Harbor Aquatics Group'),
  },
];

function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = window.localStorage.getItem('aquaguard-theme');
    return storedTheme === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('aquaguard-theme', theme);
  }, [theme]);

  return (
    <div className="app-theme-shell">
      <ThemeToggle theme={theme} onToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} />
      <Routes>
        <Route path="/" element={<AuthPortal />} />
        <Route path="/dashboard" element={<RoleGateway fallbackTitle="Lifeguard Dashboard" />} />
        <Route path="/manager" element={<RoleGateway fallbackTitle="Manager Dashboard" />} />
        <Route path="/admin" element={<RoleGateway fallbackTitle="Admin Dashboard" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="theme-toggle" type="button" onClick={onToggle}>
      <span className="theme-toggle-dot" />
      <strong>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</strong>
    </button>
  );
}

function AuthPortal() {
  const [mode, setMode] = useState('signin');
  const [organizations, setOrganizations] = useState(() => loadOrganizations());
  const [orgQuery, setOrgQuery] = useState('');
  const [verifiedOrgCode, setVerifiedOrgCode] = useState('');
  const [orgError, setOrgError] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [verifiedEmployee, setVerifiedEmployee] = useState(null);
  const [employeeError, setEmployeeError] = useState('');
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [registrationForm, setRegistrationForm] = useState({
    organizationName: '',
    adminName: '',
    workEmail: '',
    password: '',
    region: '',
    poolCount: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    saveOrganizations(organizations);
  }, [organizations]);

  const verifiedOrg = useMemo(
    () => organizations.find((organization) => organization.code === verifiedOrgCode) ?? null,
    [organizations, verifiedOrgCode],
  );

  const handleOrgVerify = (event) => {
    event.preventDefault();

    const normalizedQuery = orgQuery.trim().toLowerCase();
    const organization = organizations.find(
      (entry) =>
        entry.code.toLowerCase() === normalizedQuery ||
        entry.name.toLowerCase() === normalizedQuery,
    );

    if (!normalizedQuery) {
      setVerifiedOrgCode('');
      setVerifiedEmployee(null);
      setOrgError('Enter your organization code or company name to continue.');
      return;
    }

    if (!organization) {
      setVerifiedOrgCode('');
      setVerifiedEmployee(null);
      setOrgError('Organization not found. Check the code or ask your manager.');
      return;
    }

    setVerifiedOrgCode(organization.code);
    setVerifiedEmployee(null);
    setEmployeeId('');
    setOrgError('');
    setEmployeeError('');
  };

  const handleEmployeeVerify = (event) => {
    event.preventDefault();

    if (!verifiedOrg) {
      setEmployeeError('Verify your organization before entering an employee ID.');
      return;
    }

    const normalizedId = employeeId.trim().toUpperCase();
    const employee = verifiedOrg.employees[normalizedId];

    if (!normalizedId) {
      setVerifiedEmployee(null);
      setEmployeeError('Enter your Employee ID to continue.');
      return;
    }

    if (!employee) {
      setVerifiedEmployee(null);
      setEmployeeError('That ID is not in this organization workspace.');
      return;
    }

    setVerifiedEmployee(employee);
    setEmployeeError('');
  };

  const handleRegistrationChange = (field, value) => {
    setRegistrationForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleRegisterOrganization = (event) => {
    event.preventDefault();

    const organizationName = registrationForm.organizationName.trim();
    const adminName = registrationForm.adminName.trim();
    const workEmail = registrationForm.workEmail.trim().toLowerCase();
    const password = registrationForm.password.trim();
    const region = registrationForm.region.trim();
    const poolCountValue = Number.parseInt(registrationForm.poolCount, 10);

    if (!organizationName || !adminName || !workEmail || !password) {
      setRegistrationError('Fill in the required company and admin details first.');
      setRegistrationMessage('');
      return;
    }

    const code = buildOrgCode(organizationName, organizations);
    const pools = buildStarterPools(organizationName, poolCountValue);
    const starterEmployees = buildStarterEmployees(adminName, organizationName, poolCountValue, pools);
    const nextOrganization = {
      id: `org-${code.toLowerCase()}`,
      code,
      name: organizationName,
      adminName,
      email: workEmail,
      password,
      region: region || 'Not provided',
      poolCount: Number.isNaN(poolCountValue) ? pools.length : poolCountValue,
      employees: starterEmployees,
      pools,
      schedules: buildStarterSchedules(organizationName),
    };

    setOrganizations((current) => [nextOrganization, ...current]);
    setMode('signin');
    setOrgQuery(code);
    setVerifiedOrgCode(code);
    setVerifiedEmployee(null);
    setEmployeeId('');
    setOrgError('');
    setEmployeeError('');
    setRegistrationError('');
    setRegistrationMessage(
      `${organizationName} created. Your organization code is ${code}. Starter IDs were created for ${adminName}: LG-6001, MG-7001, and AD-9001.`,
    );
    setRegistrationForm({
      organizationName: '',
      adminName: '',
      workEmail: '',
      password: '',
      region: '',
      poolCount: '',
    });
  };

  const handleContinue = () => {
    if (!verifiedEmployee || !verifiedOrg) {
      return;
    }

    const routeByRole = {
      lifeguard: '/dashboard',
      manager: '/manager',
      admin: '/admin',
    };

    navigate(routeByRole[verifiedEmployee.role] ?? '/dashboard', {
      state: {
        employee: verifiedEmployee,
        organization: verifiedOrg,
      },
    });
  };

  const staffCount = verifiedOrg ? Object.keys(verifiedOrg.employees).length : 0;
  const featuredOrg = organizations.find((organization) => organization.code === 'AQA-101');

  return (
    <main className="app-shell">
      <section className="auth-layout">
        <div className="brand-column">
          <div className="brand-lockup">
            <span className="brand-kicker">AquaGuard</span>
            <h1>AquaGuard</h1>
            <p>Pool operations platform</p>
          </div>

          <div className="hero-card">
            <div className="hero-copy">
              <span className="hero-label">Multi-tenant access</span>
              <h2>Each aquatic company gets its own secure workspace.</h2>
              <p>
                Register an organization, issue an org code, and keep staff,
                pools, logbooks, schedules, and geofencing isolated by company.
              </p>
            </div>
            <div className="wave-stack" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="benefit-card">
            <h3>What multi-tenancy unlocks</h3>
            <ul>
              <li>Separate databases and schedules for every lifeguard company</li>
              <li>Organization-specific login before employee verification</li>
              <li>Pool-owned logbooks and manager-controlled geofenced sites</li>
            </ul>
          </div>

          {featuredOrg ? (
            <div className="credential-card">
              <h3>Development credentials</h3>
              <p>Use this tenant as your standing company login while we build AquaGuard.</p>
              <div className="credential-grid">
                <div>
                  <span>Organization</span>
                  <strong>{featuredOrg.name}</strong>
                </div>
                <div>
                  <span>Org code</span>
                  <strong>{featuredOrg.code}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{featuredOrg.email}</strong>
                </div>
                <div>
                  <span>Password</span>
                  <strong>{featuredOrg.password}</strong>
                </div>
                <div>
                  <span>Lifeguard ID</span>
                  <strong>LG-6001</strong>
                </div>
                <div>
                  <span>Manager ID</span>
                  <strong>MG-7001</strong>
                </div>
                <div>
                  <span>Admin ID</span>
                  <strong>AD-9001</strong>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <section className="auth-panel">
          <div className="mode-switch" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={mode === 'signin' ? 'mode-pill active' : 'mode-pill'}
              onClick={() => setMode('signin')}
            >
              Employee Sign In
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'mode-pill active' : 'mode-pill'}
              onClick={() => setMode('register')}
            >
              Register Organization
            </button>
          </div>

          {mode === 'signin' ? (
            <div className="auth-stack">
              <div className="panel-heading">
                <h2>Sign in to your workspace</h2>
                <p>Start with your organization, then verify your employee ID.</p>
              </div>

              <div className="stepper">
                <div className="step-row">
                  <div className={`step-dot ${verifiedOrg ? 'done' : 'active'}`}>1</div>
                  <div>
                    <div className={`step-label ${!verifiedOrg ? 'active' : ''}`}>
                      Organization
                    </div>
                    <div className="step-subtext">
                      {verifiedOrg
                        ? `${verifiedOrg.name} · ${verifiedOrg.code}`
                        : 'Enter your company code or name'}
                    </div>
                  </div>
                </div>

                <div className="step-row compact">
                  <div className={`step-dot ${verifiedOrg ? 'active' : 'idle'}`}>2</div>
                  <div className={`step-label ${verifiedOrg ? 'active' : ''}`}>
                    Enter your employee ID
                  </div>
                </div>
              </div>

              {registrationMessage ? (
                <p className="status-message success">{registrationMessage}</p>
              ) : null}

              <form className="card" onSubmit={handleOrgVerify}>
                <label className="field-label" htmlFor="org-query">
                  Organization code or company name
                </label>
                <input
                  id="org-query"
                  className="text-input"
                  type="text"
                  placeholder="AQA-101 or AquaGuard Demo Ops"
                  value={orgQuery}
                  onChange={(event) => setOrgQuery(event.target.value)}
                />
                <button className="primary-button" type="submit">
                  Verify organization
                </button>
              </form>

              {orgError ? <p className="status-message error">{orgError}</p> : null}

              {verifiedOrg ? (
                <>
                  <div className="org-found">
                    <div>
                      <div className="org-name">{verifiedOrg.name}</div>
                      <div className="org-sub">
                        {staffCount} staff · {verifiedOrg.poolCount} pools · {verifiedOrg.code}
                      </div>
                    </div>
                    <span className="verified-chip">Verified</span>
                  </div>

                  <form className="card employee-card" onSubmit={handleEmployeeVerify}>
                    <label className="field-label centered" htmlFor="employee-id">
                      Employee ID
                    </label>
                    <input
                      id="employee-id"
                      className="employee-input"
                      type="text"
                      placeholder="LG-6001"
                      value={employeeId}
                      onChange={(event) => setEmployeeId(event.target.value.toUpperCase())}
                    />
                    <p className="input-hint">
                      Your ID is provided by your manager inside your organization.
                    </p>
                    <button className="primary-button" type="submit">
                      Verify ID
                    </button>

                    {verifiedEmployee ? (
                      <div className="profile-card" aria-live="polite">
                        <div className="profile-header">
                          <div className="avatar-badge">
                            {initialsForName(verifiedEmployee.name)}
                          </div>
                          <div className="profile-copy">
                            <h3>{verifiedEmployee.name}</h3>
                            <p>
                              {verifiedEmployee.id} · {verifiedOrg.name}
                            </p>
                            <span className={`role-badge ${verifiedEmployee.role}`}>
                              {roleLabels[verifiedEmployee.role]}
                            </span>
                          </div>
                        </div>

                        <div className="schedule-card">
                          <span className="schedule-label">Today&apos;s schedule</span>
                          <strong>{verifiedEmployee.schedule}</strong>
                        </div>

                        <button className="secondary-button" type="button" onClick={handleContinue}>
                          Continue as {firstName(verifiedEmployee.name)}
                        </button>
                      </div>
                    ) : null}
                  </form>

                  {employeeError ? <p className="status-message error">{employeeError}</p> : null}

                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      setVerifiedOrgCode('');
                      setVerifiedEmployee(null);
                      setEmployeeId('');
                      setEmployeeError('');
                      setOrgQuery('');
                    }}
                  >
                    Wrong organization?
                  </button>
                </>
              ) : null}
            </div>
          ) : (
            <form className="auth-stack" onSubmit={handleRegisterOrganization}>
              <div className="panel-heading">
                <h2>Register your organization</h2>
                <p>Create a company workspace and get a unique org code for staff login.</p>
              </div>

              <div className="card form-grid">
                <div>
                  <label className="field-label" htmlFor="organization-name">
                    Organization name
                  </label>
                  <input
                    id="organization-name"
                    className="text-input"
                    type="text"
                    placeholder="e.g. BlueWave Aquatics"
                    value={registrationForm.organizationName}
                    onChange={(event) =>
                      handleRegistrationChange('organizationName', event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="admin-name">
                    Your name
                  </label>
                  <input
                    id="admin-name"
                    className="text-input"
                    type="text"
                    placeholder="Full name"
                    value={registrationForm.adminName}
                    onChange={(event) => handleRegistrationChange('adminName', event.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="work-email">
                    Work email
                  </label>
                  <input
                    id="work-email"
                    className="text-input"
                    type="email"
                    placeholder="you@company.com"
                    value={registrationForm.workEmail}
                    onChange={(event) => handleRegistrationChange('workEmail', event.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    className="text-input"
                    type="password"
                    placeholder="Create a password"
                    value={registrationForm.password}
                    onChange={(event) => handleRegistrationChange('password', event.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="region">
                    Region or service area
                  </label>
                  <input
                    id="region"
                    className="text-input"
                    type="text"
                    placeholder="Kingston waterfront"
                    value={registrationForm.region}
                    onChange={(event) => handleRegistrationChange('region', event.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="pool-count">
                    Number of pools
                  </label>
                  <input
                    id="pool-count"
                    className="text-input"
                    type="number"
                    min="0"
                    placeholder="4"
                    value={registrationForm.poolCount}
                    onChange={(event) => handleRegistrationChange('poolCount', event.target.value)}
                  />
                </div>
              </div>

              <div className="info-card">
                <h3>After registering you get</h3>
                <ul>
                  <li>A unique organization code to share with your staff</li>
                  <li>An isolated workspace for pools, schedules, and personnel</li>
                  <li>Starter IDs, scheduling, and manager-controlled geofenced pools</li>
                </ul>
              </div>

              {registrationError ? <p className="status-message error">{registrationError}</p> : null}

              <button className="primary-button" type="submit">
                Create organization
              </button>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}

function RoleGateway({ fallbackTitle }) {
  const location = useLocation();
  const organizationFromRoute = location.state?.organization;
  const employee = location.state?.employee;
  const organization = getOrganizationById(organizationFromRoute?.id) ?? organizationFromRoute;

  if (employee?.role === 'lifeguard' && organization) {
    return <LifeguardDashboard organization={organization} employee={employee} />;
  }

  if (employee?.role === 'manager' && organization) {
    return <ManagerDashboard organization={organization} employee={employee} />;
  }

  if (employee?.role === 'admin' && organization) {
    return <AdminDashboard organization={organization} employee={employee} />;
  }

  return (
    <main className="placeholder-shell">
      <section className="placeholder-card">
        <span className="hero-label">AquaGuard Workspace</span>
        <h1>{fallbackTitle}</h1>
        <p>Sign in again to load your organization workspace.</p>
      </section>
    </main>
  );
}

function LifeguardDashboard({ organization, employee }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [poolState, setPoolState] = useState(() => organization.pools ?? []);
  const [schedules, setSchedules] = useState(() => organization.schedules ?? []);
  const [communications, setCommunications] = useState(() => organization.communications ?? buildStarterCommunications(organization.name));
  const [alerts, setAlerts] = useState(() => organization.alerts ?? []);
  const [incidents, setIncidents] = useState(() => organization.incidents ?? []);
  const [memberPasses, setMemberPasses] = useState(() => organization.memberPasses ?? []);
  const [attendanceRecords, setAttendanceRecords] = useState(() => organization.attendanceRecords ?? []);
  const [timesheets, setTimesheets] = useState(() => organization.timesheets ?? []);
  const [attendanceNotifications, setAttendanceNotifications] = useState(
    () => organization.attendanceNotifications ?? [],
  );
  const [payrollSettings, setPayrollSettings] = useState(() =>
    normalizePayrollSettings(organization.payrollSettings),
  );
  const [leaveRequests, setLeaveRequests] = useState(() => organization.leaveRequests ?? []);
  const [shiftSwapRequests, setShiftSwapRequests] = useState(() => organization.shiftSwapRequests ?? []);
  const [employeeDirectory, setEmployeeDirectory] = useState(() => organization.employees ?? {});
  const [employeeProfile, setEmployeeProfile] = useState(() => organization.employees?.[employee.id] ?? employee);
  const [locationState, setLocationState] = useState({
    status: 'idle',
    message: 'Verify your location to unlock shift start.',
    distanceMeters: null,
    checkedAt: '',
    latitude: null,
    longitude: null,
  });
  const [shiftStartedAt, setShiftStartedAt] = useState('');
  const [draftLogTitle, setDraftLogTitle] = useState('');
  const [draftLogDetails, setDraftLogDetails] = useState('');
  const [memberLookup, setMemberLookup] = useState('');
  const [memberMessage, setMemberMessage] = useState('');
  const [incidentForm, setIncidentForm] = useState({
    title: '',
    details: '',
    severity: 'yellow',
    photo: '',
  });
  const [leaveForm, setLeaveForm] = useState({
    fromDate: formatDateInputOffset(1),
    toDate: formatDateInputOffset(1),
    reason: '',
  });
  const [swapForm, setSwapForm] = useState({
    requesterShiftId: '',
    targetEmployeeId: '',
    note: '',
  });
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState(() =>
    buildAssistantResponse('What should I check before opening a pool?'),
  );

  useEffect(() => {
    setPoolState(organization.pools ?? []);
    setSchedules(organization.schedules ?? []);
    setCommunications(organization.communications ?? buildStarterCommunications(organization.name));
    setAlerts(organization.alerts ?? []);
    setIncidents(organization.incidents ?? []);
    setMemberPasses(organization.memberPasses ?? []);
    setAttendanceRecords(organization.attendanceRecords ?? []);
    setTimesheets(organization.timesheets ?? []);
    setAttendanceNotifications(organization.attendanceNotifications ?? []);
    setPayrollSettings(normalizePayrollSettings(organization.payrollSettings));
    setLeaveRequests(organization.leaveRequests ?? []);
    setShiftSwapRequests(organization.shiftSwapRequests ?? []);
    setEmployeeDirectory(organization.employees ?? {});
    setEmployeeProfile(organization.employees?.[employee.id] ?? employee);
  }, [organization]);

  const currentEmployee = employeeProfile;
  const assignedPool =
    poolState.find((pool) => pool.id === currentEmployee.assignedPoolId) ?? poolState[0] ?? null;
  const currentSchedule = findEmployeeSchedule(schedules, currentEmployee.id);
  const shiftAccess = getShiftAccessState(currentSchedule);
  const activeAlerts = alerts.filter((alert) => alert.poolId === assignedPool?.id && alert.status !== 'resolved');
  const poolIncidents = incidents.filter((incident) => incident.poolId === assignedPool?.id);
  const myAttendance = attendanceRecords.filter((record) => record.employeeId === currentEmployee.id);
  const activeAttendanceRecord =
    attendanceRecords.find(
      (record) => record.employeeId === currentEmployee.id && record.status === 'in-progress',
    ) ?? null;
  const activeBreak = activeAttendanceRecord ? getOpenBreak(activeAttendanceRecord) : null;
  const payrollSummary = calculatePayrollSummary(currentEmployee, schedules, attendanceRecords);
  const eligibleSwapTargets = Object.values(employeeDirectory).filter(
    (person) => person.id !== currentEmployee.id && person.role === 'lifeguard',
  );
  const myLeaveRequests = leaveRequests.filter((request) => request.employeeId === currentEmployee.id);
  const mySwapRequests = shiftSwapRequests.filter((request) => request.requesterId === currentEmployee.id);
  const myScheduleConflicts = detectScheduleConflicts(schedules, employeeDirectory).filter(
    (conflict) => conflict.employeeId === currentEmployee.id,
  );
  const myUpcomingSchedules = schedules
    .filter((entry) => entry.employeeId === currentEmployee.id)
    .filter((entry) => new Date(`${entry.date}T00:00:00`) >= getWeekStartDate(new Date()))
    .sort((first, second) => new Date(`${first.date}T00:00:00`) - new Date(`${second.date}T00:00:00`));
  const nextWeekStart = addDays(getWeekStartDate(new Date()), 7);
  const currentWeekSchedules = myUpcomingSchedules.filter(
    (entry) => new Date(`${entry.date}T00:00:00`) < nextWeekStart,
  );
  const nextWeekSchedules = myUpcomingSchedules.filter(
    (entry) => new Date(`${entry.date}T00:00:00`) >= nextWeekStart,
  );
  const myTimesheetHistory = buildEmployeeTimesheetHistory(
    currentEmployee,
    attendanceRecords,
    payrollSettings.payPeriod,
    organization.id,
  );
  const checklist = assignedPool?.checklist ?? [];
  const completedCount = checklist.filter((item) => item.completed).length;
  const checkedLocationAgo = locationState.checkedAt ? `Checked ${locationState.checkedAt}` : '';

  const saveOperationsState = ({
    nextPools = poolState,
    nextSchedules = schedules,
    nextAlerts = alerts,
    nextIncidents = incidents,
    nextMemberPasses = memberPasses,
    nextAttendanceRecords = attendanceRecords,
    nextTimesheets = timesheets,
    nextAttendanceNotifications = attendanceNotifications,
    nextPayrollSettings = payrollSettings,
    nextLeaveRequests = leaveRequests,
    nextShiftSwapRequests = shiftSwapRequests,
    nextEmployees = employeeDirectory,
  }) => {
    const derivedAlerts = mergeDerivedAlerts(nextPools, nextAlerts);
    const poolsWithAlerts = nextPools.map((pool) => ({
      ...pool,
      recentAlerts: derivedAlerts
        .filter((alert) => alert.poolId === pool.id && alert.status !== 'resolved')
        .slice(0, 3)
        .map(summarizeAlertForPool),
    }));

    setPoolState(poolsWithAlerts);
    setSchedules(nextSchedules);
    setAlerts(derivedAlerts);
    setIncidents(nextIncidents);
    setMemberPasses(nextMemberPasses);
    setAttendanceRecords(nextAttendanceRecords);
    setTimesheets(nextTimesheets);
    setAttendanceNotifications(nextAttendanceNotifications);
    setPayrollSettings(nextPayrollSettings);
    setLeaveRequests(nextLeaveRequests);
    setShiftSwapRequests(nextShiftSwapRequests);
    setEmployeeDirectory(nextEmployees);

    updateOrganizationInStorage(organization.id, (currentOrganization) => ({
      ...currentOrganization,
      pools: poolsWithAlerts,
      employees: nextEmployees,
      schedules: nextSchedules,
      alerts: derivedAlerts,
      incidents: nextIncidents,
      memberPasses: nextMemberPasses,
      attendanceRecords: nextAttendanceRecords,
      timesheets: nextTimesheets,
      attendanceNotifications: nextAttendanceNotifications,
      payrollSettings: nextPayrollSettings,
      leaveRequests: nextLeaveRequests,
      shiftSwapRequests: nextShiftSwapRequests,
    }));
  };

  const persistPools = (nextPools) => {
    setPoolState(nextPools);
    saveOperationsState({ nextPools });
  };

  const persistCommunications = (nextCommunications) => {
    setCommunications(nextCommunications);
    updateOrganizationInStorage(organization.id, (currentOrganization) => ({
      ...currentOrganization,
      communications: nextCommunications,
    }));
  };

  const persistEmployeeProfile = (nextProfile) => {
    const mergedProfile = {
      ...currentEmployee,
      ...nextProfile,
    };
    setEmployeeProfile(mergedProfile);
    setEmployeeDirectory((current) => ({
      ...current,
      [employee.id]: mergedProfile,
    }));
    updateEmployeeInStorage(organization.id, employee.id, nextProfile);
  };

  const updateMyAvailability = (day, field, value) => {
    const nextProfile = {
      availability: {
        ...currentEmployee.availability,
        [day]: {
          ...currentEmployee.availability[day],
          [field]: value,
        },
      },
    };
    persistEmployeeProfile(nextProfile);
    saveOperationsState({
      nextEmployees: {
        ...employeeDirectory,
        [currentEmployee.id]: {
          ...currentEmployee,
          ...nextProfile,
        },
      },
    });
  };

  const handleLogout = () => {
    navigate('/', { replace: true });
  };

  const handleCheckLocation = () => {
    if (!assignedPool) {
      setLocationState({
        status: 'error',
        message: 'No assigned pool is attached to this shift yet.',
        distanceMeters: null,
        checkedAt: '',
      });
      return;
    }

    if (!assignedPool.geofenced || assignedPool.latitude === null || assignedPool.longitude === null) {
      setLocationState({
        status: 'error',
        message: 'This pool does not have a geofence yet. Ask a manager or admin to add coordinates.',
        distanceMeters: null,
        checkedAt: '',
      });
      return;
    }

    if (!navigator.geolocation) {
      setLocationState({
        status: 'error',
        message: 'Geolocation is not available in this browser.',
        distanceMeters: null,
        checkedAt: '',
      });
      return;
    }

    setLocationState({
      status: 'checking',
      message: 'Checking your current location against the pool geofence...',
      distanceMeters: null,
      checkedAt: '',
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distanceMeters = getDistanceMeters(
          position.coords.latitude,
          position.coords.longitude,
          assignedPool.latitude,
          assignedPool.longitude,
        );
        const checkedAt = formatTimeShort(new Date());

        if (distanceMeters <= assignedPool.radiusMeters) {
          setLocationState({
            status: 'verified',
            message: `On-site verified for ${assignedPool.name}. Start Shift is now unlocked.`,
            distanceMeters,
            checkedAt,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          return;
        }

        setLocationState({
          status: 'outside',
          message: `You are ${Math.round(distanceMeters)}m away from ${assignedPool.name}. Move closer to start your shift.`,
          distanceMeters,
          checkedAt,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        const lookup = {
          1: 'Location permission was denied.',
          2: 'Your location could not be determined.',
          3: 'Location request timed out.',
        };

        setLocationState({
          status: 'error',
          message: lookup[error.code] ?? 'Unable to verify location right now.',
          distanceMeters: null,
          checkedAt: '',
          latitude: null,
          longitude: null,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const handleStartShift = () => {
    if (locationState.status !== 'verified' || !shiftAccess.canStart || activeAttendanceRecord) {
      return;
    }

    const now = new Date();
    const startMinutes = currentSchedule?.startMinutes ?? null;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const lateMinutes =
      startMinutes === null || nowMinutes <= startMinutes ? 0 : Math.max(nowMinutes - startMinutes, 0);
    const nextRecord = normalizeAttendanceRecord({
      id: `attendance-${currentEmployee.id}-${Date.now()}`,
      orgId: organization.id,
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      role: currentEmployee.role,
      shiftId: currentSchedule?.id ?? '',
      shiftLabel: currentSchedule?.shiftLabel ?? currentEmployee.schedule,
      poolId: assignedPool?.id ?? '',
      poolName: assignedPool?.name ?? '',
      clockInAt: formatTimeShort(now),
      clockInTimestamp: now.toISOString(),
      clockOutAt: '',
      clockOutTimestamp: '',
      hoursWorked: 0,
      status: 'in-progress',
      dateLabel: formatDateShort(now),
      breaks: [],
      lateMinutes,
      managerNotificationSent: lateMinutes > 10,
      clockEvents: [
        {
          id: `clock-event-${Date.now()}`,
          type: 'clock-in',
          timestamp: now.toISOString(),
          timeLabel: formatTimeShort(now),
          latitude: locationState.latitude,
          longitude: locationState.longitude,
          employeeId: currentEmployee.id,
          orgId: organization.id,
          poolId: assignedPool?.id ?? '',
        },
      ],
    });
    const nextAttendanceRecords = [nextRecord, ...attendanceRecords];
    const nextNotifications =
      lateMinutes > 10
        ? [
            normalizeAttendanceNotification({
              id: `attendance-note-${Date.now()}`,
              orgId: organization.id,
              employeeId: currentEmployee.id,
              employeeName: currentEmployee.name,
              poolId: assignedPool?.id ?? '',
              poolName: assignedPool?.name ?? '',
              managerId:
                Object.values(employeeDirectory).find((person) => person.role === 'manager')?.id ?? '',
              title: 'Late clock-in alert',
              message: `${currentEmployee.name} clocked in ${lateMinutes} minutes late for ${assignedPool?.name}.`,
              createdAt: now.toISOString(),
              type: 'late-clock-in',
            }),
            ...attendanceNotifications,
          ]
        : attendanceNotifications;

    saveOperationsState({
      nextAttendanceRecords,
      nextTimesheets: mergeTimesheetsFromAttendance(
        timesheets,
        nextAttendanceRecords,
        employeeDirectory,
        organization.id,
        payrollSettings,
      ),
      nextAttendanceNotifications: nextNotifications,
    });
    setShiftStartedAt(formatTimeLong(now));

    if (lateMinutes > 10 && 'Notification' in window) {
      const managerName =
        Object.values(employeeDirectory).find((person) => person.role === 'manager')?.name ?? 'manager';
      const showNotification = () =>
        new window.Notification('AquaGuard late arrival', {
          body: `${currentEmployee.name} clocked in ${lateMinutes} minutes late. Notify ${managerName}.`,
        });

      if (window.Notification.permission === 'granted') {
        showNotification();
      } else if (window.Notification.permission === 'default') {
        window.Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            showNotification();
          }
        });
      }
    }
  };

  const handleEndShift = () => {
    if (!activeAttendanceRecord) {
      return;
    }

    const now = new Date();
    const nextAttendanceRecords = attendanceRecords.map((record) =>
      record.id === activeAttendanceRecord.id
        ? finalizeAttendanceRecord(record, now, locationState)
        : record,
    );

    saveOperationsState({
      nextAttendanceRecords,
      nextTimesheets: mergeTimesheetsFromAttendance(
        timesheets,
        nextAttendanceRecords,
        employeeDirectory,
        organization.id,
        payrollSettings,
      ),
    });
    setShiftStartedAt('');
  };

  const handleStartBreak = () => {
    if (!activeAttendanceRecord || getOpenBreak(activeAttendanceRecord)) {
      return;
    }

    const now = new Date();
    const nextAttendanceRecords = attendanceRecords.map((record) =>
      record.id === activeAttendanceRecord.id
        ? {
            ...record,
            breaks: [
              ...record.breaks,
              {
                id: `break-${Date.now()}`,
                startTimestamp: now.toISOString(),
                startLabel: formatTimeShort(now),
                endTimestamp: '',
                endLabel: '',
              },
            ],
            clockEvents: [
              ...record.clockEvents,
              {
                id: `clock-event-${Date.now()}`,
                type: 'break-start',
                timestamp: now.toISOString(),
                timeLabel: formatTimeShort(now),
                latitude: locationState.latitude,
                longitude: locationState.longitude,
                employeeId: currentEmployee.id,
                orgId: organization.id,
                poolId: assignedPool?.id ?? '',
              },
            ],
          }
        : record,
    );

    saveOperationsState({
      nextAttendanceRecords,
      nextTimesheets: mergeTimesheetsFromAttendance(
        timesheets,
        nextAttendanceRecords,
        employeeDirectory,
        organization.id,
        payrollSettings,
      ),
    });
  };

  const handleEndBreak = () => {
    if (!activeAttendanceRecord || !getOpenBreak(activeAttendanceRecord)) {
      return;
    }

    const now = new Date();
    const nextAttendanceRecords = attendanceRecords.map((record) =>
      record.id === activeAttendanceRecord.id
        ? {
            ...record,
            breaks: record.breaks.map((entry) =>
              !entry.endTimestamp
                ? {
                    ...entry,
                    endTimestamp: now.toISOString(),
                    endLabel: formatTimeShort(now),
                  }
                : entry,
            ),
            clockEvents: [
              ...record.clockEvents,
              {
                id: `clock-event-${Date.now()}`,
                type: 'break-end',
                timestamp: now.toISOString(),
                timeLabel: formatTimeShort(now),
                latitude: locationState.latitude,
                longitude: locationState.longitude,
                employeeId: currentEmployee.id,
                orgId: organization.id,
                poolId: assignedPool?.id ?? '',
              },
            ],
          }
        : record,
    );

    saveOperationsState({
      nextAttendanceRecords,
      nextTimesheets: mergeTimesheetsFromAttendance(
        timesheets,
        nextAttendanceRecords,
        employeeDirectory,
        organization.id,
        payrollSettings,
      ),
    });
  };

  const toggleChecklistItem = (itemId) => {
    const nextPools = poolState.map((pool) => {
      if (pool.id !== assignedPool?.id) {
        return pool;
      }

      const nextChecklist = pool.checklist.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        if (item.completed) {
          return {
            ...item,
            completed: false,
            completedBy: '',
            completedAt: '',
          };
        }

        return {
          ...item,
          completed: true,
          completedBy: employee.name,
          completedAt: formatTimeShort(new Date()),
        };
      });

      return {
        ...pool,
        checklist: nextChecklist,
        lastUpdatedLabel: 'Updated just now',
        lastLoggedBy: employee.name,
      };
    });

    saveOperationsState({ nextPools });
  };

  const handleAddLogEntry = (event) => {
    event.preventDefault();

    if (!draftLogTitle.trim() || !draftLogDetails.trim() || !assignedPool) {
      return;
    }

    const nextEntry = {
      id: `log-${Date.now()}`,
      title: draftLogTitle.trim(),
      details: draftLogDetails.trim(),
      author: employee.name,
      timeLabel: formatTimeShort(new Date()),
    };

    const nextPools = poolState.map((pool) => {
      if (pool.id !== assignedPool.id) {
        return pool;
      }

      return {
        ...pool,
        shiftLogs: [nextEntry, ...pool.shiftLogs],
        lastUpdatedLabel: 'Updated just now',
        lastLoggedBy: employee.name,
      };
    });

    saveOperationsState({ nextPools });
    setDraftLogTitle('');
    setDraftLogDetails('');
  };

  const handleIncidentPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setIncidentForm((current) => ({
        ...current,
        photo: typeof reader.result === 'string' ? reader.result : '',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleIncidentSubmit = (event) => {
    event.preventDefault();

    if (!incidentForm.title.trim() || !incidentForm.details.trim() || !assignedPool) {
      return;
    }

    const nextIncident = normalizeIncident({
      id: `incident-${Date.now()}`,
      poolId: assignedPool.id,
      poolName: assignedPool.name,
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      title: incidentForm.title.trim(),
      details: incidentForm.details.trim(),
      severity: incidentForm.severity,
      shiftLabel: currentSchedule?.shiftLabel ?? currentEmployee.schedule,
      reportedAt: formatTimeShort(new Date()),
      status: 'open',
      photo: incidentForm.photo,
    });

    const nextPools = poolState.map((pool) =>
      pool.id === assignedPool.id
        ? {
            ...pool,
            shiftLogs: [
              {
                id: `log-${Date.now()}`,
                title: `Incident logged: ${nextIncident.title}`,
                details: nextIncident.details,
                author: currentEmployee.name,
                timeLabel: nextIncident.reportedAt,
              },
              ...pool.shiftLogs,
            ],
            lastLoggedBy: currentEmployee.name,
            lastLogTime: nextIncident.reportedAt,
            lastUpdatedLabel: 'Updated just now',
          }
        : pool,
    );

    saveOperationsState({
      nextPools,
      nextIncidents: [nextIncident, ...incidents],
      nextAlerts: [
        ...alerts,
        {
          id: `${assignedPool.id}-incident-${Date.now()}`,
          poolId: assignedPool.id,
          poolName: assignedPool.name,
          type: 'incident-open',
          title: 'Incident report submitted',
          message: `${currentEmployee.name} logged "${nextIncident.title}".`,
          severity: incidentForm.severity === 'red' ? 'red' : 'orange',
          source: 'incident report',
          status: 'open',
          createdAt: nextIncident.reportedAt,
          escalateAfterMinutes: 0,
          acknowledgedAt: '',
          acknowledgedBy: '',
        },
      ],
    });

    setIncidentForm({
      title: '',
      details: '',
      severity: 'yellow',
      photo: '',
    });
    setActiveTab('home');
  };

  const handleVerifyMember = (event) => {
    event.preventDefault();

    if (!memberLookup.trim() || !assignedPool) {
      return;
    }

    const normalizedLookup = memberLookup.trim().toLowerCase();
    const member = memberPasses.find(
      (entry) =>
        entry.passId.toLowerCase() === normalizedLookup ||
        entry.memberName.toLowerCase() === normalizedLookup,
    );

    if (!member) {
      setMemberMessage('Pass not found in this organization.');
      return;
    }

    if (member.status !== 'active') {
      setMemberMessage(`${member.memberName} is ${member.status}. Ask a manager before entry.`);
      return;
    }

    const currentCapacity = extractStatusMetric(assignedPool, 'Capacity') ?? 0;
    const capacityLimit = assignedPool.thresholds?.capacityLimit ?? 50;
    const nextCapacity = Math.min(currentCapacity + 1, capacityLimit + 5);

    const nextPools = poolState.map((pool) => {
      if (pool.id !== assignedPool.id) {
        return pool;
      }

      return {
        ...pool,
        statusCards: pool.statusCards.map((card) =>
          card.label === 'Capacity'
            ? {
                ...card,
                value: `${Math.round(nextCapacity)}/${capacityLimit}`,
                note:
                  nextCapacity >= capacityLimit
                    ? 'capacity reached'
                    : `${Math.round((nextCapacity / capacityLimit) * 100)}% full`,
                tone: nextCapacity >= capacityLimit ? 'warn' : 'ok',
              }
            : card,
        ),
        shiftLogs: [
          {
            id: `log-${Date.now()}`,
            title: 'Member pass verified',
            details: `${member.memberName} checked in with pass ${member.passId}.`,
            author: currentEmployee.name,
            timeLabel: formatTimeShort(new Date()),
          },
          ...pool.shiftLogs,
        ],
      };
    });

    const nextMemberPasses = memberPasses.map((entry) =>
      entry.id === member.id
        ? {
            ...entry,
            lastScannedAt: formatTimeShort(new Date()),
            lastPoolName: assignedPool.name,
          }
        : entry,
    );

    saveOperationsState({
      nextPools,
      nextMemberPasses,
    });

    setMemberMessage(`${member.memberName} verified for ${assignedPool.name}. Capacity updated.`);
    setMemberLookup('');
  };

  const submitLeaveRequest = (event) => {
    event.preventDefault();
    if (!leaveForm.reason.trim()) {
      return;
    }

    const nextRequest = normalizeLeaveRequest({
      id: `leave-${Date.now()}`,
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      role: currentEmployee.role,
      fromDate: leaveForm.fromDate,
      toDate: leaveForm.toDate,
      reason: leaveForm.reason.trim(),
      status: 'pending',
    });

    saveOperationsState({
      nextLeaveRequests: [nextRequest, ...leaveRequests],
    });
    setLeaveForm({
      fromDate: formatDateInputOffset(1),
      toDate: formatDateInputOffset(1),
      reason: '',
    });
  };

  const submitSwapRequest = (event) => {
    event.preventDefault();
    if (!swapForm.targetEmployeeId || !swapForm.requesterShiftId) {
      return;
    }

    const target = employeeDirectory[swapForm.targetEmployeeId];
    if (!target) {
      return;
    }

    const requestedShift = schedules.find((entry) => entry.id === swapForm.requesterShiftId);
    const targetSchedule = findEmployeeSchedule(schedules, target.id);
    const nextRequest = normalizeShiftSwapRequest({
      id: `swap-${Date.now()}`,
      requesterId: currentEmployee.id,
      requesterName: currentEmployee.name,
      requesterRole: currentEmployee.role,
      targetEmployeeId: target.id,
      targetEmployeeName: target.name,
      targetRole: target.role,
      requesterShiftId: requestedShift?.id ?? currentSchedule?.id ?? '',
      targetShiftId: targetSchedule?.id ?? '',
      note:
        swapForm.note.trim() ||
        `Swap requested for ${requestedShift?.day ?? currentSchedule?.day ?? 'scheduled'} shift.`,
      status: 'pending',
    });

    saveOperationsState({
      nextShiftSwapRequests: [nextRequest, ...shiftSwapRequests],
    });
    setSwapForm({
      requesterShiftId: '',
      targetEmployeeId: '',
      note: '',
    });
  };

  const handleReleaseCapacity = () => {
    if (!assignedPool) {
      return;
    }

    const currentCapacity = extractStatusMetric(assignedPool, 'Capacity') ?? 0;
    const capacityLimit = assignedPool.thresholds?.capacityLimit ?? 50;
    const nextCapacity = Math.max(currentCapacity - 1, 0);

    const nextPools = poolState.map((pool) =>
      pool.id === assignedPool.id
        ? {
            ...pool,
            statusCards: pool.statusCards.map((card) =>
              card.label === 'Capacity'
                ? {
                    ...card,
                    value: `${Math.round(nextCapacity)}/${capacityLimit}`,
                    note: `${Math.round((nextCapacity / Math.max(capacityLimit, 1)) * 100)}% full`,
                    tone: 'ok',
                  }
                : card,
            ),
          }
        : pool,
    );

    saveOperationsState({ nextPools });
  };

  const handleAssistantSubmit = (event) => {
    event.preventDefault();

    if (!assistantQuery.trim()) {
      return;
    }

    setAssistantResponse(buildAssistantResponse(assistantQuery));
  };

  if (!assignedPool) {
    return (
      <main className="placeholder-shell">
        <section className="placeholder-card">
          <span className="hero-label">AquaGuard Workspace</span>
          <h1>No Pool Assigned</h1>
          <p>This lifeguard account does not have a pool assignment yet.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mobile-shell">
      <section className="mobile-frame">
        <div className="mobile-statusbar">
          <span>9:41</span>
          <span>●●●</span>
        </div>

        {activeTab === 'home' ? (
          <div className="mobile-screen">
            <header className="mobile-header">
              <div>
                <h1>Good morning, {firstName(employee.name)}</h1>
                <p>{shiftStartedAt ? `Shift started ${shiftStartedAt}` : currentEmployee.schedule}</p>
                <div className="duty-row">
                  <span className={shiftStartedAt ? 'duty-chip active' : 'duty-chip'}>
                    {shiftStartedAt ? 'On duty' : 'Ready for shift'}
                  </span>
                  <span className="duty-location">
                    {assignedPool.name} · {assignedPool.zoneLabel}
                  </span>
                </div>
                <p className="subtle-home-copy">{shiftAccess.nextShiftLabel}</p>
              </div>
              <div className="mobile-header-actions">
                <button className="logout-button mobile" type="button" onClick={handleLogout}>
                  Log out
                </button>
                <div className="profile-bubble">{initialsForName(employee.name)}</div>
              </div>
            </header>

            <div className="home-dashboard-grid">
              <section className="home-section home-status-panel">
                <h2>Pool Status</h2>
                <div className="status-grid">
                  {assignedPool.statusCards.map((card) => (
                    <article key={card.label} className="status-card">
                      <span>{card.label}</span>
                      <strong>{card.value}</strong>
                      <p className={card.tone}>{card.note}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="home-section home-shift-panel">
                <h2>Shift Start</h2>
                <article className="home-card">
                  <div className="home-card-header">
                    <div>
                      <strong>{assignedPool.name}</strong>
                      <p>
                        {assignedPool.subtitle} ·{' '}
                        {assignedPool.geofenced
                          ? `Geofence radius ${assignedPool.radiusMeters}m`
                          : 'Geofence not configured'}
                      </p>
                    </div>
                    <span className={`badge ${locationState.status}`}>{locationState.status}</span>
                  </div>
                  <p className="home-copy">{locationState.message}</p>
                  <p className="home-meta">{shiftAccess.message}</p>
                  {checkedLocationAgo ? (
                    <p className="home-meta">
                      {checkedLocationAgo}
                      {locationState.distanceMeters !== null
                        ? ` · ${Math.round(locationState.distanceMeters)}m from pool`
                        : ''}
                    </p>
                  ) : null}
                  <div className="button-row">
                    <button className="secondary-button compact" type="button" onClick={handleCheckLocation}>
                      Check location
                    </button>
                    <button
                      className="primary-button compact"
                      type="button"
                      disabled={locationState.status !== 'verified' || !shiftAccess.canStart}
                      onClick={handleStartShift}
                    >
                      Start Shift
                    </button>
                    {activeAttendanceRecord ? (
                      <button className="ghost-button compact" type="button" onClick={handleEndShift}>
                        End Shift
                      </button>
                    ) : null}
                  </div>
                  {activeAttendanceRecord ? (
                    <div className="button-row">
                      <button
                        className="secondary-button compact"
                        type="button"
                        onClick={activeBreak ? handleEndBreak : handleStartBreak}
                      >
                        {activeBreak ? 'End Break' : 'Start Break'}
                      </button>
                      <span className="home-meta inline-pill">
                        {activeAttendanceRecord.lateMinutes > 10
                          ? `${activeAttendanceRecord.lateMinutes} min late · manager alerted`
                          : activeAttendanceRecord.lateMinutes > 0
                            ? `${activeAttendanceRecord.lateMinutes} min late`
                            : 'On-time clock-in'}
                      </span>
                    </div>
                  ) : null}
                </article>
              </section>

              <section className="home-section home-actions-panel">
                <h2>Quick Actions</h2>
                <div className="quick-actions">
                  <button className="quick-card" type="button" onClick={() => setActiveTab('workforce')}>
                    <span className="quick-icon mint">$</span>
                    <strong>Payroll</strong>
                  </button>
                  <button className="quick-card" type="button" onClick={() => setActiveTab('assistant')}>
                    <span className="quick-icon mint">◔</span>
                    <strong>Ask AI</strong>
                  </button>
                  <button className="quick-card" type="button" onClick={() => setActiveTab('members')}>
                    <span className="quick-icon blue">⌁</span>
                    <strong>Scan pass</strong>
                  </button>
                  <button className="quick-card" type="button" onClick={() => setActiveTab('incidents')}>
                    <span className="quick-icon sand">⚠</span>
                    <strong>Log incident</strong>
                  </button>
                  <button className="quick-card" type="button" onClick={() => setActiveTab('messages')}>
                    <span className="quick-icon violet">✉</span>
                    <strong>Message team</strong>
                  </button>
                </div>
              </section>

              <section className="home-section home-alerts-panel">
                <h2>Recent Alerts</h2>
                <div className="alert-list">
                  {activeAlerts.map((alert) => (
                    <article key={alert.id} className="alert-card">
                      <div className={`alert-icon ${alert.severity}`}>{alert.severity === 'red' ? '!' : alert.severity === 'orange' ? '!' : 'i'}</div>
                      <div>
                        <strong>{alert.title}</strong>
                        <p>{alert.message}</p>
                        <span>
                          {alert.createdAt} · {alert.source} · {alert.severity.toUpperCase()}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="home-section home-next-panel">
                <h2>Next Up</h2>
                <article className="home-card">
                  <div className="home-card-header">
                    <div>
                      <strong>Shift window</strong>
                      <p>{currentSchedule ? `${currentSchedule.day} · ${currentSchedule.shiftLabel}` : 'No shift assigned'}</p>
                    </div>
                    <span className={`badge ${shiftAccess.state}`}>{shiftAccess.state}</span>
                  </div>
                  <p className="home-copy">
                    {shiftAccess.state === 'override'
                      ? 'A manager override is currently active for this shift.'
                      : 'Schedule windows, geofence checks, and pool alerts now work together before shift start.'}
                  </p>
                </article>
              </section>
            </div>
          </div>
        ) : null}

        {activeTab === 'logbook' ? (
          <div className="mobile-screen">
            <header className="mobile-subheader">
              <button className="back-link" type="button" onClick={() => setActiveTab('home')}>
                ‹ My pools
              </button>
              <h1>{assignedPool.name}</h1>
              <p>
                {assignedPool.type} · {assignedPool.zoneLabel} · {assignedPool.lastUpdatedLabel}
              </p>
              <div className="last-log-chip">
                Last logged by {assignedPool.lastLoggedBy} · {assignedPool.lastLogTime}
              </div>
            </header>

            <section className="logbook-section">
              <div className="section-row">
                <h2>
                  Shift Checklist — {completedCount} of {checklist.length} done
                </h2>
                <div className="progress-bar">
                  <span
                    style={{
                      width: `${(completedCount / Math.max(checklist.length, 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="checklist-card">
                {checklist.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={item.completed ? 'checklist-item done' : 'checklist-item'}
                    onClick={() => toggleChecklistItem(item.id)}
                  >
                    <span className="checkmark">{item.completed ? '✓' : ''}</span>
                    <span className="checklist-copy">
                      <strong>{item.label}</strong>
                      <small>
                        {item.completed
                          ? `${item.completedBy} · ${item.completedAt}`
                          : 'Not yet done'}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="logbook-section">
              <h2>Shift Log</h2>
              <div className="log-entry-list">
                {assignedPool.shiftLogs.map((entry) => (
                  <article key={entry.id} className="log-entry-card">
                    <div className="log-entry-header">
                      <strong>{entry.title}</strong>
                      <span>{entry.timeLabel}</span>
                    </div>
                    <p>{entry.details}</p>
                    <small>{entry.author}</small>
                  </article>
                ))}
              </div>

              <form className="log-composer" onSubmit={handleAddLogEntry}>
                <input
                  className="dark-input"
                  type="text"
                  placeholder="Log title"
                  value={draftLogTitle}
                  onChange={(event) => setDraftLogTitle(event.target.value)}
                />
                <textarea
                  className="dark-input dark-textarea"
                  placeholder="Add a shift note, chemical adjustment, or handoff detail"
                  value={draftLogDetails}
                  onChange={(event) => setDraftLogDetails(event.target.value)}
                />
                <button className="outline-button" type="submit">
                  + Add log entry
                </button>
              </form>
            </section>
          </div>
        ) : null}

        {activeTab === 'messages' ? (
          <MessagingCenter
            variant="mobile"
            employee={employee}
            participants={Object.values(organization.employees).map((person) => person.name)}
            communications={communications}
            onCommunicationsChange={persistCommunications}
            canManageAnnouncements={false}
          />
        ) : null}

        {activeTab === 'assistant' ? (
          <div className="mobile-screen">
            <header className="mobile-subheader">
              <button className="back-link" type="button" onClick={() => setActiveTab('home')}>
                ‹ Home
              </button>
              <h1>AquaGuard Assistant</h1>
              <p>
                Training-safe guidance for lifeguarding, emergency response, and pool operations.
              </p>
              <div className="last-log-chip">Grounded in 6 core reference domains for AquaGuard</div>
            </header>

            <section className="logbook-section">
              <h2>Assistant modes</h2>
              <div className="prompt-list">
                <button type="button" className="prompt-card" onClick={() => setAssistantQuery('Emergency response: when should I close the pool?')}>
                  Emergency response
                </button>
                <button type="button" className="prompt-card" onClick={() => setAssistantQuery('Maintenance troubleshooting for pumps and filters')}>
                  Maintenance
                </button>
                <button type="button" className="prompt-card" onClick={() => setAssistantQuery('What triggers a pool closure based on chemistry or safety?')}>
                  Closure decisions
                </button>
              </div>
            </section>

            <section className="logbook-section">
              <h2>Knowledge Base</h2>
              <div className="source-chip-list">
                {assistantSources.map((source) => (
                  <span key={source} className="source-chip">
                    {source}
                  </span>
                ))}
              </div>
            </section>

            <section className="logbook-section">
              <h2>Ask the assistant</h2>
              <form className="log-composer" onSubmit={handleAssistantSubmit}>
                <textarea
                  className="dark-input dark-textarea"
                  placeholder="Ask about water chemistry, emergency care, scanning procedures, maintenance, or lifeguard best practices"
                  value={assistantQuery}
                  onChange={(event) => setAssistantQuery(event.target.value)}
                />
                <button className="primary-button compact" type="submit">
                  Get guidance
                </button>
              </form>
            </section>

            <section className="logbook-section">
              <h2>Quick prompts</h2>
              <div className="prompt-list">
                {assistantQuickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="prompt-card"
                    onClick={() => {
                      setAssistantQuery(prompt);
                      setAssistantResponse(buildAssistantResponse(prompt));
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </section>

            <section className="logbook-section">
              <h2>Assistant response</h2>
              <article className="assistant-card">
                <div className="assistant-header">
                  <strong>{assistantResponse.title}</strong>
                  <span>{assistantResponse.domain}</span>
                </div>
                <p>{assistantResponse.summary}</p>
                <ul className="assistant-steps">
                  {assistantResponse.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
                <div className="assistant-footer">
                  <span>{assistantResponse.escalation}</span>
                  <small>
                    Training support only. Follow site protocol and certified emergency procedures.
                  </small>
                </div>
              </article>
            </section>

            <section className="home-section">
              <h2>Payroll Snapshot</h2>
              <article className="home-card">
                <div className="home-card-header">
                  <div>
                    <strong>{payrollSummary.hours.toFixed(2)} hours tracked</strong>
                    <p>${payrollSummary.grossPay.toFixed(2)} gross pay at ${payrollSummary.payRate}/hr</p>
                  </div>
                  <button className="secondary-button compact inline-action" type="button" onClick={() => setActiveTab('workforce')}>
                    Open
                  </button>
                </div>
              </article>
            </section>
          </div>
        ) : null}

        {activeTab === 'members' ? (
          <div className="mobile-screen">
            <header className="mobile-subheader">
              <button className="back-link" type="button" onClick={() => setActiveTab('home')}>
                ‹ Home
              </button>
              <h1>Member Verification</h1>
              <p>Verify active member passes, update capacity, and keep a scan history for the pool.</p>
            </header>

            <section className="logbook-section">
              <h2>Verify pass</h2>
              <form className="log-composer" onSubmit={handleVerifyMember}>
                <input
                  className="dark-input"
                  type="text"
                  placeholder="Enter pass ID or member name"
                  value={memberLookup}
                  onChange={(event) => setMemberLookup(event.target.value)}
                />
                <div className="button-row">
                  <button className="primary-button compact" type="submit">
                    Verify pass
                  </button>
                  <button className="secondary-button compact" type="button" onClick={handleReleaseCapacity}>
                    Release guest
                  </button>
                </div>
              </form>
              {memberMessage ? <p className="status-message success">{memberMessage}</p> : null}
            </section>

            <section className="logbook-section">
              <h2>Recent scans</h2>
              <div className="log-entry-list">
                {memberPasses
                  .filter((entry) => entry.lastPoolName === assignedPool.name || entry.homePool === assignedPool.name)
                  .slice(0, 6)
                  .map((entry) => (
                    <article key={entry.id} className="log-entry-card">
                      <div className="log-entry-header">
                        <strong>{entry.memberName}</strong>
                        <span>{entry.lastScannedAt || 'Not scanned yet'}</span>
                      </div>
                      <p>
                        {entry.passId} · {entry.status}
                      </p>
                      <small>{entry.lastPoolName || entry.homePool}</small>
                    </article>
                  ))}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === 'incidents' ? (
          <div className="mobile-screen">
            <header className="mobile-subheader">
              <button className="back-link" type="button" onClick={() => setActiveTab('home')}>
                ‹ Home
              </button>
              <h1>Incident Reporting</h1>
              <p>Capture incidents fast, attach a photo, and push them to the manager review queue.</p>
            </header>

            <section className="logbook-section">
              <h2>New incident</h2>
              <form className="log-composer" onSubmit={handleIncidentSubmit}>
                <input
                  className="dark-input"
                  type="text"
                  placeholder="Incident title"
                  value={incidentForm.title}
                  onChange={(event) =>
                    setIncidentForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
                <select
                  className="dark-input"
                  value={incidentForm.severity}
                  onChange={(event) =>
                    setIncidentForm((current) => ({
                      ...current,
                      severity: event.target.value,
                    }))
                  }
                >
                  <option value="yellow">Low severity</option>
                  <option value="orange">Needs manager review</option>
                  <option value="red">Critical / closure risk</option>
                </select>
                <textarea
                  className="dark-input dark-textarea"
                  placeholder="Describe what happened, where, and what actions were taken"
                  value={incidentForm.details}
                  onChange={(event) =>
                    setIncidentForm((current) => ({
                      ...current,
                      details: event.target.value,
                    }))
                  }
                />
                <label className="outline-button file-trigger">
                  Attach photo
                  <input type="file" accept="image/*" onChange={handleIncidentPhoto} hidden />
                </label>
                {incidentForm.photo ? <img className="incident-photo-preview" src={incidentForm.photo} alt="Incident preview" /> : null}
                <button className="primary-button compact" type="submit">
                  Submit incident
                </button>
              </form>
            </section>

            <section className="logbook-section">
              <h2>Open incidents</h2>
              <div className="log-entry-list">
                {poolIncidents.slice(0, 5).map((incident) => (
                  <article key={incident.id} className="log-entry-card">
                    <div className="log-entry-header">
                      <strong>{incident.title}</strong>
                      <span>{incident.reportedAt}</span>
                    </div>
                    <p>{incident.details}</p>
                    <small>
                      {incident.employeeName} · {incident.status}
                    </small>
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === 'workforce' ? (
          <div className="mobile-screen">
            <header className="mobile-subheader">
              <button className="back-link" type="button" onClick={() => setActiveTab('home')}>
                ‹ Home
              </button>
              <h1>Employee Self-Service</h1>
              <p>Review your schedule, swaps, time off, pay history, certifications, and availability.</p>
            </header>

            <section className="logbook-section">
              <h2>This week&apos;s schedule</h2>
              <div className="log-entry-list">
                {currentWeekSchedules.length ? (
                  currentWeekSchedules.map((schedule) => (
                    <article key={schedule.id} className="log-entry-card">
                      <div className="log-entry-header">
                        <strong>{schedule.poolName}</strong>
                        <span>{schedule.status}</span>
                      </div>
                      <p>
                        {schedule.day} · {schedule.shiftLabel}
                      </p>
                      <small>{schedule.date}</small>
                    </article>
                  ))
                ) : (
                  <article className="log-entry-card">
                    <div className="log-entry-header">
                      <strong>No shifts this week</strong>
                      <span>Clear</span>
                    </div>
                    <p>Your current week has no assigned shifts yet.</p>
                  </article>
                )}
              </div>
            </section>

            <section className="logbook-section">
              <h2>Next week</h2>
              <div className="log-entry-list">
                {nextWeekSchedules.length ? (
                  nextWeekSchedules.map((schedule) => (
                    <article key={schedule.id} className="log-entry-card">
                      <div className="log-entry-header">
                        <strong>{schedule.poolName}</strong>
                        <span>{schedule.status}</span>
                      </div>
                      <p>
                        {schedule.day} · {schedule.shiftLabel}
                      </p>
                      <small>{schedule.date}</small>
                    </article>
                  ))
                ) : (
                  <article className="log-entry-card">
                    <div className="log-entry-header">
                      <strong>No next-week shifts</strong>
                      <span>Pending</span>
                    </div>
                    <p>Your next week schedule has not been published yet.</p>
                  </article>
                )}
              </div>
            </section>

            <section className="logbook-section">
              <h2>My timesheet</h2>
              <div className="log-entry-list">
                <article className="log-entry-card">
                  <div className="log-entry-header">
                    <strong>Total tracked hours</strong>
                    <span>{payrollSummary.hours.toFixed(2)} hrs</span>
                  </div>
                  <p>
                    Gross pay estimate: ${payrollSummary.grossPay.toFixed(2)} at ${payrollSummary.payRate}/hr
                  </p>
                  <small>{myAttendance.length} attendance records on file</small>
                </article>
                {myAttendance.slice(0, 4).map((record) => (
                  <article key={record.id} className="log-entry-card">
                    <div className="log-entry-header">
                      <strong>{record.dateLabel}</strong>
                      <span>{record.hoursWorked.toFixed(2)} hrs</span>
                    </div>
                    <p>
                      {record.poolName || assignedPool.name} · {record.clockInAt} - {record.clockOutAt || 'In progress'}
                    </p>
                    <small>
                      {record.status}
                      {record.breaks?.length ? ` · ${record.breaks.length} break${record.breaks.length > 1 ? 's' : ''}` : ''}
                    </small>
                  </article>
                ))}
              </div>
            </section>

            <section className="logbook-section">
              <h2>Timesheets and pay stubs</h2>
              <div className="log-entry-list">
                {myTimesheetHistory.slice(0, 3).map((timesheet) => (
                    <article key={timesheet.id} className="log-entry-card">
                      <div className="log-entry-header">
                        <strong>{timesheet.periodLabel}</strong>
                        <span>{timesheet.totalHours.toFixed(2)} hrs</span>
                      </div>
                      <p>${timesheet.grossTotal.toFixed(2)} estimated pay</p>
                      <div className="button-row">
                        <small>{timesheet.status === 'current' ? 'Current pay period' : 'Previous pay period'}</small>
                        <button
                          className="secondary-button compact inline-action"
                          type="button"
                          onClick={() => exportPayStubPdfLike(timesheet, currentEmployee.name, organization.name)}
                        >
                          Pay stub
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            </section>

            <section className="logbook-section">
              <h2>Shift swap request</h2>
              <form className="log-composer" onSubmit={submitSwapRequest}>
                <select
                  className="dark-input"
                  value={swapForm.requesterShiftId}
                  onChange={(event) =>
                    setSwapForm((current) => ({
                      ...current,
                      requesterShiftId: event.target.value,
                    }))
                  }
                >
                  <option value="">Choose your shift</option>
                  {myUpcomingSchedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.day} · {schedule.poolName} · {schedule.shiftLabel}
                    </option>
                  ))}
                </select>
                <select
                  className="dark-input"
                  value={swapForm.targetEmployeeId}
                  onChange={(event) =>
                    setSwapForm((current) => ({
                      ...current,
                      targetEmployeeId: event.target.value,
                    }))
                  }
                >
                  <option value="">Choose lifeguard</option>
                  {eligibleSwapTargets.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
                <textarea
                  className="dark-input dark-textarea"
                  placeholder="Reason for swap"
                  value={swapForm.note}
                  onChange={(event) =>
                    setSwapForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                />
                <button className="primary-button compact" type="submit">
                  Request swap
                </button>
              </form>
              <div className="log-entry-list">
                {mySwapRequests.slice(0, 3).map((request) => (
                  <article key={request.id} className="log-entry-card">
                    <div className="log-entry-header">
                      <strong>{request.targetEmployeeName}</strong>
                      <span>{request.status}</span>
                    </div>
                    <p>{request.note}</p>
                    <small>Awaiting manager or admin review</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="logbook-section">
              <h2>Leave request</h2>
              <form className="log-composer" onSubmit={submitLeaveRequest}>
                <div className="button-row">
                  <input
                    className="dark-input"
                    type="date"
                    value={leaveForm.fromDate}
                    onChange={(event) =>
                      setLeaveForm((current) => ({
                        ...current,
                        fromDate: event.target.value,
                      }))
                    }
                  />
                  <input
                    className="dark-input"
                    type="date"
                    value={leaveForm.toDate}
                    onChange={(event) =>
                      setLeaveForm((current) => ({
                        ...current,
                        toDate: event.target.value,
                      }))
                    }
                  />
                </div>
                <textarea
                  className="dark-input dark-textarea"
                  placeholder="Reason for leave"
                  value={leaveForm.reason}
                  onChange={(event) =>
                    setLeaveForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                />
                <button className="primary-button compact" type="submit">
                  Request leave
                </button>
              </form>
              <div className="log-entry-list">
                {myLeaveRequests.slice(0, 3).map((request) => (
                  <article key={request.id} className="log-entry-card">
                    <div className="log-entry-header">
                      <strong>
                        {request.fromDate} to {request.toDate}
                      </strong>
                      <span>{request.status}</span>
                    </div>
                    <p>{request.reason}</p>
                    <small>{request.reviewer ? `${request.reviewer} · ${request.reviewedAt}` : 'Pending review'}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="logbook-section">
              <h2>Availability</h2>
              <AvailabilityEditor
                variant="mobile"
                employee={currentEmployee}
                onUpdateAvailability={updateMyAvailability}
              />
            </section>

            {myScheduleConflicts.length ? (
              <section className="logbook-section">
                <h2>Schedule flags</h2>
                <div className="log-entry-list">
                  {myScheduleConflicts.map((conflict) => (
                    <article key={conflict.id} className="log-entry-card">
                      <div className="log-entry-header">
                        <strong>{conflict.type}</strong>
                        <span>Needs review</span>
                      </div>
                      <p>{conflict.message}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'profile' ? (
          <ProfileSection
            variant="mobile"
            organizationId={organization.id}
            employee={currentEmployee}
            onProfileChange={persistEmployeeProfile}
          />
        ) : null}

        <nav className="mobile-nav">
          <button
            type="button"
            className={activeTab === 'home' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('home')}
          >
            <span>⌘</span>
            <strong>Home</strong>
          </button>
          <button
            type="button"
            className={activeTab === 'logbook' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('logbook')}
          >
            <span>▤</span>
            <strong>Pool log</strong>
          </button>
          <button
            type="button"
            className={activeTab === 'assistant' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('assistant')}
          >
            <span>◔</span>
            <strong>Assistant</strong>
          </button>
          <button
            type="button"
            className={activeTab === 'messages' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('messages')}
          >
            <span>✉</span>
            <strong>Messages</strong>
          </button>
          <button
            type="button"
            className={activeTab === 'profile' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('profile')}
          >
            <span>◡</span>
            <strong>Profile</strong>
          </button>
        </nav>
      </section>
    </main>
  );
}

function ManagerDashboard({ organization, employee }) {
  const navigate = useNavigate();
  const [poolState, setPoolState] = useState(() => organization.pools ?? []);
  const [schedules, setSchedules] = useState(() => organization.schedules ?? []);
  const [communications, setCommunications] = useState(() => organization.communications ?? buildStarterCommunications(organization.name));
  const [alerts, setAlerts] = useState(() => organization.alerts ?? []);
  const [incidents, setIncidents] = useState(() => organization.incidents ?? []);
  const [memberPasses, setMemberPasses] = useState(() => organization.memberPasses ?? []);
  const [attendanceRecords, setAttendanceRecords] = useState(() => organization.attendanceRecords ?? []);
  const [timesheets, setTimesheets] = useState(() => organization.timesheets ?? []);
  const [attendanceNotifications, setAttendanceNotifications] = useState(
    () => organization.attendanceNotifications ?? [],
  );
  const [payrollSettings, setPayrollSettings] = useState(() =>
    normalizePayrollSettings(organization.payrollSettings),
  );
  const [leaveRequests, setLeaveRequests] = useState(() => organization.leaveRequests ?? []);
  const [shiftSwapRequests, setShiftSwapRequests] = useState(() => organization.shiftSwapRequests ?? []);
  const [employeeDirectory, setEmployeeDirectory] = useState(() => organization.employees ?? {});
  const [employeeProfile, setEmployeeProfile] = useState(() => organization.employees?.[employee.id] ?? employee);
  const [activeSection, setActiveSection] = useState('command');
  const [selectedPoolId, setSelectedPoolId] = useState(() => organization.pools?.[0]?.id ?? '');
  const [poolForm, setPoolForm] = useState({
    name: '',
    subtitle: '',
    zoneLabel: '',
    latitude: '',
    longitude: '',
    radiusMeters: '75',
  });
  const [leaveForm, setLeaveForm] = useState({
    fromDate: formatDateInputOffset(1),
    toDate: formatDateInputOffset(1),
    reason: '',
  });
  const [swapForm, setSwapForm] = useState({
    targetEmployeeId: '',
    note: '',
  });
  const currentEmployee = employeeProfile;
  const organizationEmployees = Object.values(employeeDirectory);

  useEffect(() => {
    setPoolState(organization.pools ?? []);
    setSchedules(organization.schedules ?? []);
    setCommunications(organization.communications ?? buildStarterCommunications(organization.name));
    setAlerts(organization.alerts ?? []);
    setIncidents(organization.incidents ?? []);
    setMemberPasses(organization.memberPasses ?? []);
    setAttendanceRecords(organization.attendanceRecords ?? []);
    setTimesheets(organization.timesheets ?? []);
    setAttendanceNotifications(organization.attendanceNotifications ?? []);
    setPayrollSettings(normalizePayrollSettings(organization.payrollSettings));
    setLeaveRequests(organization.leaveRequests ?? []);
    setShiftSwapRequests(organization.shiftSwapRequests ?? []);
    setEmployeeDirectory(organization.employees ?? {});
    setEmployeeProfile(organization.employees?.[employee.id] ?? employee);
    setSelectedPoolId(organization.pools?.[0]?.id ?? '');
  }, [organization]);

  const saveManagerState = ({
    nextPools = poolState,
    nextSchedules = schedules,
    nextAlerts = alerts,
    nextIncidents = incidents,
    nextMemberPasses = memberPasses,
    nextAttendanceRecords = attendanceRecords,
    nextTimesheets = timesheets,
    nextAttendanceNotifications = attendanceNotifications,
    nextPayrollSettings = payrollSettings,
    nextLeaveRequests = leaveRequests,
    nextShiftSwapRequests = shiftSwapRequests,
    nextEmployees = employeeDirectory,
  }) => {
    const derivedAlerts = mergeDerivedAlerts(nextPools, nextAlerts);
    const syncedEmployees = syncEmployeesFromSchedules(
      nextEmployees,
      nextSchedules,
      nextPools,
      organization.name,
    );
    const poolsWithAlerts = nextPools.map((pool) => ({
      ...pool,
      recentAlerts: derivedAlerts
        .filter((alert) => alert.poolId === pool.id && alert.status !== 'resolved')
        .slice(0, 3)
        .map(summarizeAlertForPool),
    }));

    setPoolState(poolsWithAlerts);
    setSchedules(nextSchedules);
    setAlerts(derivedAlerts);
    setIncidents(nextIncidents);
    setMemberPasses(nextMemberPasses);
    setAttendanceRecords(nextAttendanceRecords);
    setTimesheets(nextTimesheets);
    setAttendanceNotifications(nextAttendanceNotifications);
    setPayrollSettings(nextPayrollSettings);
    setLeaveRequests(nextLeaveRequests);
    setShiftSwapRequests(nextShiftSwapRequests);
    setEmployeeDirectory(syncedEmployees);
    updateOrganizationInStorage(organization.id, (currentOrganization) => ({
      ...currentOrganization,
      poolCount: poolsWithAlerts.length,
      pools: poolsWithAlerts,
      employees: syncedEmployees,
      schedules: nextSchedules,
      alerts: derivedAlerts,
      incidents: nextIncidents,
      memberPasses: nextMemberPasses,
      attendanceRecords: nextAttendanceRecords,
      timesheets: nextTimesheets,
      attendanceNotifications: nextAttendanceNotifications,
      payrollSettings: nextPayrollSettings,
      leaveRequests: nextLeaveRequests,
      shiftSwapRequests: nextShiftSwapRequests,
    }));
  };

  const saveManagerCommunications = (nextCommunications) => {
    setCommunications(nextCommunications);
    updateOrganizationInStorage(organization.id, (currentOrganization) => ({
      ...currentOrganization,
      communications: nextCommunications,
    }));
  };

  const saveManagerProfile = (nextProfile) => {
    const mergedProfile = {
      ...currentEmployee,
      ...nextProfile,
    };
    setEmployeeProfile(mergedProfile);
    updateEmployeeInStorage(organization.id, employee.id, nextProfile);
  };

  const handlePoolFieldChange = (field, value) => {
    setPoolForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAddPool = (event) => {
    event.preventDefault();

    if (!poolForm.name.trim()) {
      return;
    }

    const latitude = Number.parseFloat(poolForm.latitude);
    const longitude = Number.parseFloat(poolForm.longitude);
    const radiusMeters = Number.parseInt(poolForm.radiusMeters, 10);
    const hasCoordinates = !Number.isNaN(latitude) && !Number.isNaN(longitude);

    const nextPool = normalizePool({
      id: `pool-${Date.now()}`,
      name: poolForm.name.trim(),
      subtitle: poolForm.subtitle.trim() || 'Custom service area',
      zoneLabel: poolForm.zoneLabel.trim() || 'Main pool',
      type: 'Custom',
      geofenced: hasCoordinates,
      latitude: hasCoordinates ? latitude : null,
      longitude: hasCoordinates ? longitude : null,
      radiusMeters: Number.isNaN(radiusMeters) ? 75 : radiusMeters,
      thresholds: buildDefaultThresholds(40),
      checklistTemplate: masterChecklist,
      lastLoggedBy: employee.name,
      lastLogTime: formatTimeShort(new Date()),
      lastUpdatedLabel: 'just now',
      statusCards: [
        { label: 'Free chlorine', value: '2.4', note: 'ppm · within range', tone: 'ok' },
        { label: 'pH level', value: '7.5', note: 'balanced', tone: 'ok' },
        { label: 'Capacity', value: '0/40', note: 'new pool setup', tone: 'ok' },
        { label: 'Water temp', value: '78°', note: 'F · normal', tone: 'ok' },
      ],
      recentAlerts: [],
      shiftLogs: [
        {
          id: `log-${Date.now()}`,
          title: 'Pool created',
          details: 'Manager added this pool to the organization workspace.',
          author: employee.name,
          timeLabel: formatTimeShort(new Date()),
        },
      ],
      checklist: buildChecklist(employee.name, false),
    });

    const nextPools = [...poolState, nextPool];
    saveManagerState({
      nextPools,
      nextMemberPasses: [...memberPasses, ...buildDefaultMembers(nextPool.name)],
    });
    setSelectedPoolId(nextPool.id);
    setPoolForm({
      name: '',
      subtitle: '',
      zoneLabel: '',
      latitude: '',
      longitude: '',
      radiusMeters: '75',
    });
  };

  const toggleGeofence = (poolId) => {
    const nextPools = poolState.map((pool) => {
      if (pool.id !== poolId) {
        return pool;
      }

      return {
        ...pool,
        geofenced: !pool.geofenced,
      };
    });

    saveManagerState({ nextPools });
  };

  const updateSchedule = (scheduleId, field, value) => {
    const nextSchedules = schedules.map((entry) =>
      entry.id === scheduleId
        ? normalizeScheduleEntry({
            ...entry,
            [field]: value,
          })
        : entry,
    );
    saveManagerState({ nextSchedules });
  };

  const addScheduleEntry = (entry) => {
    saveManagerState({
      nextSchedules: [
        ...schedules,
        normalizeScheduleEntry({
          ...entry,
          id: `sched-${Date.now()}`,
          orgId: organization.id,
        }),
      ],
    });
  };

  const updateEmployeeAvailability = (employeeId, day, field, value) => {
    const nextEmployees = {
      ...employeeDirectory,
      [employeeId]: {
        ...employeeDirectory[employeeId],
        availability: {
          ...employeeDirectory[employeeId].availability,
          [day]: {
            ...employeeDirectory[employeeId].availability[day],
            [field]: field === 'enabled' ? value : value,
          },
        },
      },
    };
    saveManagerState({ nextEmployees });
  };

  const updateEmployeeHr = (employeeId, nextProfile) => {
    const nextEmployees = {
      ...employeeDirectory,
      [employeeId]: {
        ...employeeDirectory[employeeId],
        ...nextProfile,
      },
    };
    saveManagerState({ nextEmployees });
  };

  const toggleScheduleOverride = (scheduleId) => {
    const nextSchedules = schedules.map((entry) =>
      entry.id === scheduleId
        ? {
            ...entry,
            overrideActive: !entry.overrideActive,
            overrideReason: entry.overrideActive ? '' : `Override granted by ${currentEmployee.name}`,
          }
        : entry,
    );
    saveManagerState({ nextSchedules });
  };

  const updatePoolThreshold = (poolId, field, value) => {
    const nextValue = Number.parseFloat(value);
    const nextPools = poolState.map((pool) =>
      pool.id === poolId
        ? {
            ...pool,
            thresholds: {
              ...pool.thresholds,
              [field]: Number.isNaN(nextValue) ? pool.thresholds?.[field] ?? 0 : nextValue,
            },
          }
        : pool,
    );
    saveManagerState({ nextPools });
  };

  const updatePoolMetric = (poolId, label, value) => {
    const nextPools = poolState.map((pool) =>
      pool.id === poolId
        ? {
            ...pool,
            statusCards: pool.statusCards.map((card) =>
              card.label === label
                ? {
                    ...card,
                    value,
                  }
                : card,
            ),
            lastUpdatedLabel: 'Updated just now',
          }
        : pool,
    );
    saveManagerState({ nextPools });
  };

  const updatePoolChecklistTemplate = (poolId, nextTemplateText) => {
    const nextTemplate = nextTemplateText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const nextPools = poolState.map((pool) =>
      pool.id === poolId
        ? {
            ...pool,
            checklistTemplate: nextTemplate,
            checklist: nextTemplate.map((label, index) => {
              const existingItem = pool.checklist[index];
              return existingItem
                ? {
                    ...existingItem,
                    label,
                  }
                : {
                    id: `check-${index + 1}`,
                    label,
                    completed: false,
                    completedBy: '',
                    completedAt: '',
                  };
            }),
          }
        : pool,
    );
    saveManagerState({ nextPools });
  };

  const acknowledgeAlert = (alertId) => {
    const nextAlerts = alerts.map((alert) =>
      alert.id === alertId
        ? {
            ...alert,
            status: 'acknowledged',
            acknowledgedBy: currentEmployee.name,
            acknowledgedAt: formatTimeShort(new Date()),
          }
        : alert,
    );
    saveManagerState({ nextAlerts });
  };

  const resolveAlert = (alertId) => {
    const nextAlerts = alerts.map((alert) =>
      alert.id === alertId
        ? {
            ...alert,
            status: 'resolved',
            acknowledgedBy: currentEmployee.name,
            acknowledgedAt: formatTimeShort(new Date()),
          }
        : alert,
    );
    saveManagerState({ nextAlerts });
  };

  const updateIncidentStatus = (incidentId, status) => {
    const nextIncidents = incidents.map((incident) =>
      incident.id === incidentId
        ? {
            ...incident,
            status,
            reviewer: currentEmployee.name,
            reviewedAt: formatTimeShort(new Date()),
          }
        : incident,
    );
    saveManagerState({ nextIncidents });
  };

  const reviewLeaveRequest = (requestId, status) => {
    const nextLeaveRequests = leaveRequests.map((request) =>
      request.id === requestId
        ? {
            ...request,
            status,
            reviewer: currentEmployee.name,
            reviewedAt: formatTimeShort(new Date()),
          }
        : request,
    );
    saveManagerState({ nextLeaveRequests });
  };

  const reviewShiftSwap = (requestId, status) => {
    const request = shiftSwapRequests.find((entry) => entry.id === requestId);
    const nextShiftSwapRequests = shiftSwapRequests.map((entry) =>
      entry.id === requestId
        ? {
            ...entry,
            status,
            reviewer: currentEmployee.name,
            reviewedAt: formatTimeShort(new Date()),
          }
        : entry,
    );
    const nextSchedules =
      status === 'approved' && request ? applyShiftSwapToSchedules(schedules, request) : schedules;
    saveManagerState({ nextShiftSwapRequests, nextSchedules });
  };

  const submitManagerLeaveRequest = (event) => {
    event.preventDefault();
    if (!leaveForm.reason.trim()) {
      return;
    }
    saveManagerState({
      nextLeaveRequests: [
        normalizeLeaveRequest({
          id: `leave-${Date.now()}`,
          employeeId: currentEmployee.id,
          employeeName: currentEmployee.name,
          role: currentEmployee.role,
          fromDate: leaveForm.fromDate,
          toDate: leaveForm.toDate,
          reason: leaveForm.reason.trim(),
          status: 'pending',
        }),
        ...leaveRequests,
      ],
    });
    setLeaveForm({
      fromDate: formatDateInputOffset(1),
      toDate: formatDateInputOffset(1),
      reason: '',
    });
  };

  const submitManagerSwapRequest = (event) => {
    event.preventDefault();
    if (!swapForm.targetEmployeeId) {
      return;
    }
    const target = employeeDirectory[swapForm.targetEmployeeId];
    const targetSchedule = findEmployeeSchedule(schedules, target?.id);
    saveManagerState({
      nextShiftSwapRequests: [
        normalizeShiftSwapRequest({
          id: `swap-${Date.now()}`,
          requesterId: currentEmployee.id,
          requesterName: currentEmployee.name,
          requesterRole: currentEmployee.role,
          targetEmployeeId: target.id,
          targetEmployeeName: target.name,
          targetRole: target.role,
          requesterShiftId: findEmployeeSchedule(schedules, currentEmployee.id)?.id ?? '',
          targetShiftId: targetSchedule?.id ?? '',
          note: swapForm.note.trim() || 'Manager swap request',
          status: 'pending',
        }),
        ...shiftSwapRequests,
      ],
    });
    setSwapForm({
      requesterShiftId: '',
      targetEmployeeId: '',
      note: '',
    });
  };

  const updateEmployeePayrollField = (employeeId, field, value) => {
    const parsedValue = Number.parseFloat(value);
    const nextEmployees = {
      ...employeeDirectory,
      [employeeId]: {
        ...employeeDirectory[employeeId],
        [field]: Number.isNaN(parsedValue) ? employeeDirectory[employeeId][field] : parsedValue,
      },
    };
    saveManagerState({
      nextEmployees,
      nextTimesheets: mergeTimesheetsFromAttendance(
        timesheets,
        attendanceRecords,
        nextEmployees,
        organization.id,
        payrollSettings,
      ),
    });
  };

  const updatePayrollSettings = (field, value) => {
    const nextPayrollSettings = {
      ...payrollSettings,
      [field]: value,
    };
    saveManagerState({
      nextPayrollSettings,
      nextTimesheets: mergeTimesheetsFromAttendance(
        timesheets,
        attendanceRecords,
        employeeDirectory,
        organization.id,
        nextPayrollSettings,
      ),
    });
  };

  const updateTimesheetAdjustments = (timesheetId, adjustmentType, amount) => {
    const parsedAmount = Number.parseFloat(amount);
    const nextTimesheets = timesheets.map((timesheet) => {
      if (timesheet.id !== timesheetId) {
        return timesheet;
      }
      const normalizedAmount = Number.isNaN(parsedAmount) ? 0 : parsedAmount;
      const nextBonuses =
        adjustmentType === 'bonus'
          ? normalizedAmount > 0
            ? [{ id: `${timesheetId}-bonus`, label: 'One-off bonus', amount: normalizedAmount }]
            : []
          : timesheet.bonuses;
      const nextDeductions =
        adjustmentType === 'deduction'
          ? normalizedAmount > 0
            ? [{ id: `${timesheetId}-deduction`, label: 'One-off deduction', amount: normalizedAmount }]
            : []
          : timesheet.deductions;
      const paySummary = calculateTimesheetPay({
        totalHours: timesheet.totalHours,
        hourlyRate: timesheet.hourlyRate,
        overtimeThreshold: timesheet.overtimeThreshold,
        overtimeMultiplier: timesheet.overtimeMultiplier,
        bonuses: nextBonuses,
        deductions: nextDeductions,
      });
      return {
        ...timesheet,
        bonuses: nextBonuses,
        deductions: nextDeductions,
        grossTotal: paySummary.grossTotal,
      };
    });
    saveManagerState({ nextTimesheets });
  };

  const finalizePayroll = () => {
    const nextTimesheets = timesheets.map((timesheet) =>
      timesheet.status === 'approved'
        ? {
            ...timesheet,
            status: 'finalized',
            finalizedAt: new Date().toISOString(),
          }
        : timesheet,
    );
    saveManagerState({ nextTimesheets });
  };

  const selectedPool = poolState.find((pool) => pool.id === selectedPoolId) ?? poolState[0] ?? null;
  const handleLogout = () => {
    navigate('/', { replace: true });
  };

  return (
    <main className="dashboard-shell">
      <section className="dashboard-layout">
        <div className="dashboard-hero">
          <div className="dashboard-hero-top">
            <div>
              <span className="hero-label">Manager Dashboard</span>
              <h1>{organization.name}</h1>
              <p>
                Signed in as {employee.name}. View every pool logbook, manage geofenced sites, and set
                the weekly shift schedule for your team.
              </p>
            </div>
            <button className="logout-button" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>

        <div className="stats-row">
          <article className="stat-card">
            <span>Pools</span>
            <strong>{poolState.length}</strong>
          </article>
          <article className="stat-card">
            <span>On shift</span>
            <strong>{schedules.filter((entry) => entry.role === 'lifeguard' && getShiftAccessState(entry).canStart).length}</strong>
          </article>
          <article className="stat-card">
            <span>Open alerts</span>
            <strong>{alerts.filter((alert) => alert.status !== 'resolved').length}</strong>
          </article>
          <article className="stat-card">
            <span>Incidents</span>
            <strong>{incidents.filter((incident) => incident.status !== 'resolved').length}</strong>
          </article>
        </div>

        <div className="manager-tabs">
          <button
            type="button"
            className={activeSection === 'command' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('command')}
          >
            Command center
          </button>
          <button
            type="button"
            className={activeSection === 'alerts' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('alerts')}
          >
            Alerts
          </button>
          <button
            type="button"
            className={activeSection === 'incidents' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('incidents')}
          >
            Incidents
          </button>
          <button
            type="button"
            className={activeSection === 'locations' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('locations')}
          >
            Pool setup
          </button>
          <button
            type="button"
            className={activeSection === 'payroll' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('payroll')}
          >
            Payroll
          </button>
          <button
            type="button"
            className={activeSection === 'schedule' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('schedule')}
          >
            Scheduling panel
          </button>
          <button
            type="button"
            className={activeSection === 'messages' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('messages')}
          >
            Messaging
          </button>
          <button
            type="button"
            className={activeSection === 'hr' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('hr')}
          >
            HR
          </button>
          <button
            type="button"
            className={activeSection === 'profile' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('profile')}
          >
            Profile
          </button>
        </div>

        {activeSection === 'command' ? (
          <OperationsCommandCenter
            organization={organization}
            pools={poolState}
            schedules={schedules}
            attendanceRecords={attendanceRecords}
            attendanceNotifications={attendanceNotifications}
            alerts={alerts}
            timesheets={timesheets}
            shiftSwapRequests={shiftSwapRequests}
            employees={organizationEmployees}
            onOpenSection={setActiveSection}
          />
        ) : null}

        {activeSection === 'alerts' ? (
          <AlertsWorkbench
            pools={poolState}
            alerts={alerts}
            selectedPool={selectedPool}
            onSelectPool={setSelectedPoolId}
            onUpdatePoolMetric={updatePoolMetric}
            onUpdatePoolThreshold={updatePoolThreshold}
            onAcknowledgeAlert={acknowledgeAlert}
            onResolveAlert={resolveAlert}
            onRunAlertScan={() => saveManagerState({})}
          />
        ) : null}

        {activeSection === 'incidents' ? (
          <IncidentQueueSection incidents={incidents} onUpdateIncidentStatus={updateIncidentStatus} />
        ) : null}

        {activeSection === 'locations' ? (
          <PoolSetupWorkbench
            poolForm={poolForm}
            onPoolFieldChange={handlePoolFieldChange}
            onAddPool={handleAddPool}
            pools={poolState}
            selectedPool={selectedPool}
            onSelectPool={setSelectedPoolId}
            onToggleGeofence={toggleGeofence}
            onUpdatePoolThreshold={updatePoolThreshold}
            onUpdatePoolChecklistTemplate={updatePoolChecklistTemplate}
          />
        ) : null}

        {activeSection === 'payroll' ? (
          <PayrollPanel
            organizationName={organization.name}
            employeeDirectory={employeeDirectory}
            schedules={schedules}
            attendanceRecords={attendanceRecords}
            timesheets={timesheets}
            payrollSettings={payrollSettings}
            viewerId={currentEmployee.id}
            scope="manager"
            canReviewTimesheets
            canFinalizePayroll
            onPayrollSettingsChange={updatePayrollSettings}
            onEmployeePayrollFieldChange={updateEmployeePayrollField}
            onAdjustTimesheet={updateTimesheetAdjustments}
            onFinalizePayroll={finalizePayroll}
            onReviewTimesheet={(timesheetId, status) =>
              saveManagerState({
                nextTimesheets: timesheets.map((timesheet) =>
                  timesheet.id === timesheetId
                    ? {
                        ...timesheet,
                        status,
                        reviewer: currentEmployee.name,
                        reviewedAt: new Date().toISOString(),
                      }
                    : timesheet,
                ),
              })
            }
          />
        ) : null}

        {activeSection === 'schedule' ? (
          <article className="dashboard-card">
            <SchedulingWorkbench
              viewerRole="manager"
              organizationId={organization.id}
              pools={poolState}
              employeeDirectory={employeeDirectory}
              schedules={schedules}
              onAddScheduleEntry={addScheduleEntry}
              onUpdateSchedule={updateSchedule}
              onToggleScheduleOverride={toggleScheduleOverride}
              onAutoFill={() =>
                saveManagerState({
                  nextSchedules: [
                    ...schedules,
                    ...buildAutoFillSchedules({
                      organizationId: organization.id,
                      pools: poolState,
                      schedules,
                      employeeDirectory,
                      weekStartDate: getWeekStartDate(),
                    }).filter((suggested) => suggested.employeeId),
                  ],
                })
              }
              onUpdateEmployeeAvailability={updateEmployeeAvailability}
            />
            <PeopleOpsPanel
              viewerRole="manager"
              employeeDirectory={employeeDirectory}
              leaveRequests={leaveRequests}
              shiftSwapRequests={shiftSwapRequests}
              currentEmployee={currentEmployee}
              leaveForm={leaveForm}
              swapForm={swapForm}
              onLeaveFormChange={setLeaveForm}
              onSwapFormChange={setSwapForm}
              onSubmitLeaveRequest={submitManagerLeaveRequest}
              onSubmitSwapRequest={submitManagerSwapRequest}
              onReviewLeaveRequest={reviewLeaveRequest}
              onReviewShiftSwap={reviewShiftSwap}
            />
          </article>
        ) : null}

        {activeSection === 'messages' ? (
          <MessagingCenter
            variant="dashboard"
            employee={currentEmployee}
            participants={organizationEmployees.map((person) => person.name)}
            communications={communications}
            onCommunicationsChange={saveManagerCommunications}
            canManageAnnouncements
          />
        ) : null}

        {activeSection === 'hr' ? (
          <HRManagementPanel
            employeeDirectory={employeeDirectory}
            viewerName={currentEmployee.name}
            onSaveEmployeeHr={updateEmployeeHr}
          />
        ) : null}

        {activeSection === 'profile' ? (
          <ProfileSection
            variant="dashboard"
            organizationId={organization.id}
            employee={currentEmployee}
            onProfileChange={saveManagerProfile}
          />
        ) : null}
      </section>
    </main>
  );
}

function AdminDashboard({ organization, employee }) {
  const navigate = useNavigate();
  const [poolState, setPoolState] = useState(() => organization.pools ?? []);
  const [schedules, setSchedules] = useState(() => organization.schedules ?? []);
  const [communications, setCommunications] = useState(() => organization.communications ?? buildStarterCommunications(organization.name));
  const [alerts, setAlerts] = useState(() => organization.alerts ?? []);
  const [incidents, setIncidents] = useState(() => organization.incidents ?? []);
  const [memberPasses, setMemberPasses] = useState(() => organization.memberPasses ?? []);
  const [attendanceRecords, setAttendanceRecords] = useState(() => organization.attendanceRecords ?? []);
  const [timesheets, setTimesheets] = useState(() => organization.timesheets ?? []);
  const [attendanceNotifications, setAttendanceNotifications] = useState(
    () => organization.attendanceNotifications ?? [],
  );
  const [payrollSettings, setPayrollSettings] = useState(() =>
    normalizePayrollSettings(organization.payrollSettings),
  );
  const [leaveRequests, setLeaveRequests] = useState(() => organization.leaveRequests ?? []);
  const [shiftSwapRequests, setShiftSwapRequests] = useState(() => organization.shiftSwapRequests ?? []);
  const [employeeDirectory, setEmployeeDirectory] = useState(() => organization.employees ?? {});
  const [employeeProfile, setEmployeeProfile] = useState(() => organization.employees?.[employee.id] ?? employee);
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedPoolId, setSelectedPoolId] = useState(() => organization.pools?.[0]?.id ?? '');
  const [poolForm, setPoolForm] = useState({
    name: '',
    subtitle: '',
    zoneLabel: '',
    latitude: '',
    longitude: '',
    radiusMeters: '75',
  });
  const [staffForm, setStaffForm] = useState({
    id: '',
    name: '',
    role: 'lifeguard',
    assignedPoolId: organization.pools?.[0]?.id ?? '',
  });
  const [leaveForm, setLeaveForm] = useState({
    fromDate: formatDateInputOffset(1),
    toDate: formatDateInputOffset(1),
    reason: '',
  });
  const [swapForm, setSwapForm] = useState({
    targetEmployeeId: '',
    note: '',
  });
  const currentEmployee = employeeProfile;
  const organizationEmployees = Object.values(employeeDirectory);

  useEffect(() => {
    setPoolState(organization.pools ?? []);
    setSchedules(organization.schedules ?? []);
    setCommunications(organization.communications ?? buildStarterCommunications(organization.name));
    setAlerts(organization.alerts ?? []);
    setIncidents(organization.incidents ?? []);
    setMemberPasses(organization.memberPasses ?? []);
    setAttendanceRecords(organization.attendanceRecords ?? []);
    setTimesheets(organization.timesheets ?? []);
    setAttendanceNotifications(organization.attendanceNotifications ?? []);
    setPayrollSettings(normalizePayrollSettings(organization.payrollSettings));
    setLeaveRequests(organization.leaveRequests ?? []);
    setShiftSwapRequests(organization.shiftSwapRequests ?? []);
    setEmployeeDirectory(organization.employees ?? {});
    setEmployeeProfile(organization.employees?.[employee.id] ?? employee);
    setSelectedPoolId(organization.pools?.[0]?.id ?? '');
  }, [organization]);

  const saveAdminState = ({
    nextPools = poolState,
    nextSchedules = schedules,
    nextAlerts = alerts,
    nextIncidents = incidents,
    nextMemberPasses = memberPasses,
    nextAttendanceRecords = attendanceRecords,
    nextTimesheets = timesheets,
    nextAttendanceNotifications = attendanceNotifications,
    nextPayrollSettings = payrollSettings,
    nextLeaveRequests = leaveRequests,
    nextShiftSwapRequests = shiftSwapRequests,
    nextEmployees = employeeDirectory,
    employeeUpdater,
  }) => {
    const baseEmployees = employeeUpdater
      ? employeeUpdater({ employees: employeeDirectory }).employees
      : nextEmployees;
    const derivedAlerts = mergeDerivedAlerts(nextPools, nextAlerts);
    const syncedEmployees = syncEmployeesFromSchedules(
      baseEmployees,
      nextSchedules,
      nextPools,
      organization.name,
    );
    const poolsWithAlerts = nextPools.map((pool) => ({
      ...pool,
      recentAlerts: derivedAlerts
        .filter((alert) => alert.poolId === pool.id && alert.status !== 'resolved')
        .slice(0, 3)
        .map(summarizeAlertForPool),
    }));

    setPoolState(poolsWithAlerts);
    setSchedules(nextSchedules);
    setAlerts(derivedAlerts);
    setIncidents(nextIncidents);
    setMemberPasses(nextMemberPasses);
    setAttendanceRecords(nextAttendanceRecords);
    setTimesheets(nextTimesheets);
    setAttendanceNotifications(nextAttendanceNotifications);
    setPayrollSettings(nextPayrollSettings);
    setLeaveRequests(nextLeaveRequests);
    setShiftSwapRequests(nextShiftSwapRequests);
    setEmployeeDirectory(syncedEmployees);
    updateOrganizationInStorage(organization.id, (currentOrganization) => ({
      ...currentOrganization,
      poolCount: poolsWithAlerts.length,
      pools: poolsWithAlerts,
      employees: syncedEmployees,
      schedules: nextSchedules,
      alerts: derivedAlerts,
      incidents: nextIncidents,
      memberPasses: nextMemberPasses,
      attendanceRecords: nextAttendanceRecords,
      timesheets: nextTimesheets,
      attendanceNotifications: nextAttendanceNotifications,
      payrollSettings: nextPayrollSettings,
      leaveRequests: nextLeaveRequests,
      shiftSwapRequests: nextShiftSwapRequests,
    }));
  };

  const saveAdminCommunications = (nextCommunications) => {
    setCommunications(nextCommunications);
    updateOrganizationInStorage(organization.id, (currentOrganization) => ({
      ...currentOrganization,
      communications: nextCommunications,
    }));
  };

  const saveAdminProfile = (nextProfile) => {
    const mergedProfile = {
      ...currentEmployee,
      ...nextProfile,
    };
    setEmployeeProfile(mergedProfile);
    updateEmployeeInStorage(organization.id, employee.id, nextProfile);
  };

  const handlePoolFieldChange = (field, value) => {
    setPoolForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAddPool = (event) => {
    event.preventDefault();

    if (!poolForm.name.trim()) {
      return;
    }

    const latitude = Number.parseFloat(poolForm.latitude);
    const longitude = Number.parseFloat(poolForm.longitude);
    const radiusMeters = Number.parseInt(poolForm.radiusMeters, 10);
    const hasCoordinates = !Number.isNaN(latitude) && !Number.isNaN(longitude);

    const nextPool = normalizePool({
      id: `pool-${Date.now()}`,
      name: poolForm.name.trim(),
      subtitle: poolForm.subtitle.trim() || 'Custom service area',
      zoneLabel: poolForm.zoneLabel.trim() || 'Main pool',
      type: 'Custom',
      geofenced: hasCoordinates,
      latitude: hasCoordinates ? latitude : null,
      longitude: hasCoordinates ? longitude : null,
      radiusMeters: Number.isNaN(radiusMeters) ? 75 : radiusMeters,
      thresholds: buildDefaultThresholds(40),
      checklistTemplate: masterChecklist,
      lastLoggedBy: employee.name,
      lastLogTime: formatTimeShort(new Date()),
      lastUpdatedLabel: 'just now',
      statusCards: [
        { label: 'Free chlorine', value: '2.4', note: 'ppm · within range', tone: 'ok' },
        { label: 'pH level', value: '7.5', note: 'balanced', tone: 'ok' },
        { label: 'Capacity', value: '0/40', note: 'new pool setup', tone: 'ok' },
        { label: 'Water temp', value: '78°', note: 'F · normal', tone: 'ok' },
      ],
      recentAlerts: [],
      shiftLogs: [
        {
          id: `log-${Date.now()}`,
          title: 'Pool created',
          details: 'Admin added this pool to the organization workspace.',
          author: employee.name,
          timeLabel: formatTimeShort(new Date()),
        },
      ],
      checklist: buildChecklist(employee.name, false),
    });

    saveAdminState({
      nextPools: [...poolState, nextPool],
      nextMemberPasses: [...memberPasses, ...buildDefaultMembers(nextPool.name)],
    });
    setSelectedPoolId(nextPool.id);
    setPoolForm({
      name: '',
      subtitle: '',
      zoneLabel: '',
      latitude: '',
      longitude: '',
      radiusMeters: '75',
    });
  };

  const toggleGeofence = (poolId) => {
    const nextPools = poolState.map((pool) =>
      pool.id === poolId
        ? {
            ...pool,
            geofenced: !pool.geofenced,
          }
        : pool,
    );
    saveAdminState({ nextPools });
  };

  const updatePoolThreshold = (poolId, field, value) => {
    const nextValue = Number.parseFloat(value);
    const nextPools = poolState.map((pool) =>
      pool.id === poolId
        ? {
            ...pool,
            thresholds: {
              ...pool.thresholds,
              [field]: Number.isNaN(nextValue) ? pool.thresholds?.[field] ?? 0 : nextValue,
            },
          }
        : pool,
    );
    saveAdminState({ nextPools });
  };

  const updatePoolMetric = (poolId, label, value) => {
    const nextPools = poolState.map((pool) =>
      pool.id === poolId
        ? {
            ...pool,
            statusCards: pool.statusCards.map((card) =>
              card.label === label
                ? {
                    ...card,
                    value,
                  }
                : card,
            ),
            lastUpdatedLabel: 'Updated just now',
          }
        : pool,
    );
    saveAdminState({ nextPools });
  };

  const updatePoolChecklistTemplate = (poolId, nextTemplateText) => {
    const nextTemplate = nextTemplateText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const nextPools = poolState.map((pool) =>
      pool.id === poolId
        ? {
            ...pool,
            checklistTemplate: nextTemplate,
            checklist: nextTemplate.map((label, index) => {
              const existingItem = pool.checklist[index];
              return existingItem
                ? {
                    ...existingItem,
                    label,
                  }
                : {
                    id: `check-${index + 1}`,
                    label,
                    completed: false,
                    completedBy: '',
                    completedAt: '',
                  };
            }),
          }
        : pool,
    );
    saveAdminState({ nextPools });
  };

  const acknowledgeAlert = (alertId) => {
    const nextAlerts = alerts.map((alert) =>
      alert.id === alertId
        ? {
            ...alert,
            status: 'acknowledged',
            acknowledgedBy: currentEmployee.name,
            acknowledgedAt: formatTimeShort(new Date()),
          }
        : alert,
    );
    saveAdminState({ nextAlerts });
  };

  const resolveAlert = (alertId) => {
    const nextAlerts = alerts.map((alert) =>
      alert.id === alertId
        ? {
            ...alert,
            status: 'resolved',
            acknowledgedBy: currentEmployee.name,
            acknowledgedAt: formatTimeShort(new Date()),
          }
        : alert,
    );
    saveAdminState({ nextAlerts });
  };

  const updateIncidentStatus = (incidentId, status) => {
    const nextIncidents = incidents.map((incident) =>
      incident.id === incidentId
        ? {
            ...incident,
            status,
            reviewer: currentEmployee.name,
            reviewedAt: formatTimeShort(new Date()),
          }
        : incident,
    );
    saveAdminState({ nextIncidents });
  };

  const reviewLeaveRequest = (requestId, status) => {
    const nextLeaveRequests = leaveRequests.map((request) =>
      request.id === requestId
        ? {
            ...request,
            status,
            reviewer: currentEmployee.name,
            reviewedAt: formatTimeShort(new Date()),
          }
        : request,
    );
    saveAdminState({ nextLeaveRequests });
  };

  const reviewShiftSwap = (requestId, status) => {
    const request = shiftSwapRequests.find((entry) => entry.id === requestId);
    const nextShiftSwapRequests = shiftSwapRequests.map((entry) =>
      entry.id === requestId
        ? {
            ...entry,
            status,
            reviewer: currentEmployee.name,
            reviewedAt: formatTimeShort(new Date()),
          }
        : entry,
    );
    const nextSchedules =
      status === 'approved' && request ? applyShiftSwapToSchedules(schedules, request) : schedules;
    saveAdminState({ nextShiftSwapRequests, nextSchedules });
  };

  const submitAdminLeaveRequest = (event) => {
    event.preventDefault();
    if (!leaveForm.reason.trim()) {
      return;
    }
    saveAdminState({
      nextLeaveRequests: [
        normalizeLeaveRequest({
          id: `leave-${Date.now()}`,
          employeeId: currentEmployee.id,
          employeeName: currentEmployee.name,
          role: currentEmployee.role,
          fromDate: leaveForm.fromDate,
          toDate: leaveForm.toDate,
          reason: leaveForm.reason.trim(),
          status: 'pending',
        }),
        ...leaveRequests,
      ],
    });
    setLeaveForm({
      fromDate: formatDateInputOffset(1),
      toDate: formatDateInputOffset(1),
      reason: '',
    });
  };

  const submitAdminSwapRequest = (event) => {
    event.preventDefault();
    if (!swapForm.targetEmployeeId) {
      return;
    }
    const target = employeeDirectory[swapForm.targetEmployeeId];
    const targetSchedule = findEmployeeSchedule(schedules, target?.id);
    saveAdminState({
      nextShiftSwapRequests: [
        normalizeShiftSwapRequest({
          id: `swap-${Date.now()}`,
          requesterId: currentEmployee.id,
          requesterName: currentEmployee.name,
          requesterRole: currentEmployee.role,
          targetEmployeeId: target.id,
          targetEmployeeName: target.name,
          targetRole: target.role,
          requesterShiftId: findEmployeeSchedule(schedules, currentEmployee.id)?.id ?? '',
          targetShiftId: targetSchedule?.id ?? '',
          note: swapForm.note.trim() || 'Admin swap request',
          status: 'pending',
        }),
        ...shiftSwapRequests,
      ],
    });
    setSwapForm({
      targetEmployeeId: '',
      note: '',
    });
  };

  const updateSchedule = (scheduleId, field, value) => {
    const nextSchedules = schedules.map((entry) =>
      entry.id === scheduleId
        ? normalizeScheduleEntry({
            ...entry,
            [field]: value,
          })
        : entry,
    );
    saveAdminState({ nextSchedules });
  };

  const addScheduleEntry = (entry) => {
    saveAdminState({
      nextSchedules: [
        ...schedules,
        normalizeScheduleEntry({
          ...entry,
          id: `sched-${Date.now()}`,
          orgId: organization.id,
        }),
      ],
    });
  };

  const updateEmployeeAvailability = (employeeId, day, field, value) => {
    const nextEmployees = {
      ...employeeDirectory,
      [employeeId]: {
        ...employeeDirectory[employeeId],
        availability: {
          ...employeeDirectory[employeeId].availability,
          [day]: {
            ...employeeDirectory[employeeId].availability[day],
            [field]: field === 'enabled' ? value : value,
          },
        },
      },
    };
    saveAdminState({ nextEmployees });
  };

  const updateEmployeeHr = (employeeId, nextProfile) => {
    const nextEmployees = {
      ...employeeDirectory,
      [employeeId]: {
        ...employeeDirectory[employeeId],
        ...nextProfile,
      },
    };
    saveAdminState({ nextEmployees });
  };

  const toggleScheduleOverride = (scheduleId) => {
    const nextSchedules = schedules.map((entry) =>
      entry.id === scheduleId
        ? {
            ...entry,
            overrideActive: !entry.overrideActive,
            overrideReason: entry.overrideActive ? '' : `Override granted by ${currentEmployee.name}`,
          }
        : entry,
    );
    saveAdminState({ nextSchedules });
  };

  const handleStaffFormChange = (field, value) => {
    setStaffForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAddStaff = (event) => {
    event.preventDefault();

    if (!staffForm.id.trim() || !staffForm.name.trim()) {
      return;
    }

    const selectedPool = poolState.find((pool) => pool.id === staffForm.assignedPoolId) ?? poolState[0] ?? null;
    const nextEmployeeId = staffForm.id.trim().toUpperCase();
    const nextEmployeeRecord = {
      id: nextEmployeeId,
      name: staffForm.name.trim(),
      role: staffForm.role,
      assignedPoolId: staffForm.role === 'lifeguard' ? selectedPool?.id ?? null : null,
      schedule:
        staffForm.role === 'lifeguard'
          ? `${selectedPool?.name ?? organization.name} 8am-4pm today`
          : staffForm.role === 'manager'
            ? 'All pools visible today'
            : 'Full organization access today',
      phone: '',
      email: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
      startDate: formatDateInputOffset(0),
      certifications: roleLabels[staffForm.role],
      profileNote: '',
      avatarUrl: '',
      payRate: getRolePayRate(staffForm.role),
      overtimeThreshold: 40,
      overtimeMultiplier: 1.5,
      employmentType: staffForm.role === 'lifeguard' ? 'seasonal' : 'full-time',
      certificationRecords: buildDefaultCertificationRecords(staffForm.role),
      hrDocuments: [],
      onboardingChecklist: buildDefaultOnboardingChecklist(),
      performanceNotes: [],
      availability: buildDefaultAvailability(staffForm.role),
    };

    saveAdminState({
      employeeUpdater: (currentOrganization) => ({
        employees: {
          ...currentOrganization.employees,
          [nextEmployeeId]: nextEmployeeRecord,
        },
      }),
      nextSchedules: [
        ...schedules,
        normalizeScheduleEntry({
          id: `sched-${nextEmployeeId}-${Date.now()}`,
          employeeId: nextEmployeeId,
          name: staffForm.name.trim(),
          role: staffForm.role,
          day: weekDays[new Date().getDay()],
          shiftStart: staffForm.role === 'lifeguard' ? '07:00' : '08:00',
          shiftEnd: staffForm.role === 'lifeguard' ? '15:00' : '16:00',
          poolId: selectedPool?.id ?? null,
          poolName: staffForm.role === 'lifeguard' ? selectedPool?.name ?? organization.name : 'All pools',
          overrideActive: false,
          overrideReason: '',
        }),
      ],
    });
    setEmployeeDirectory((current) => ({
      ...current,
      [nextEmployeeId]: nextEmployeeRecord,
    }));

    setStaffForm({
      id: '',
      name: '',
      role: 'lifeguard',
      assignedPoolId: poolState[0]?.id ?? '',
    });
  };

  const updateEmployeePayrollField = (employeeId, field, value) => {
    const parsedValue = Number.parseFloat(value);
    const nextEmployees = {
      ...employeeDirectory,
      [employeeId]: {
        ...employeeDirectory[employeeId],
        [field]: Number.isNaN(parsedValue) ? employeeDirectory[employeeId][field] : parsedValue,
      },
    };
    saveAdminState({
      nextEmployees,
      nextTimesheets: mergeTimesheetsFromAttendance(
        timesheets,
        attendanceRecords,
        nextEmployees,
        organization.id,
        payrollSettings,
      ),
    });
  };

  const updatePayrollSettings = (field, value) => {
    const nextPayrollSettings = {
      ...payrollSettings,
      [field]: value,
    };
    saveAdminState({
      nextPayrollSettings,
      nextTimesheets: mergeTimesheetsFromAttendance(
        timesheets,
        attendanceRecords,
        employeeDirectory,
        organization.id,
        nextPayrollSettings,
      ),
    });
  };

  const updateTimesheetAdjustments = (timesheetId, adjustmentType, amount) => {
    const parsedAmount = Number.parseFloat(amount);
    const nextTimesheets = timesheets.map((timesheet) => {
      if (timesheet.id !== timesheetId) {
        return timesheet;
      }
      const normalizedAmount = Number.isNaN(parsedAmount) ? 0 : parsedAmount;
      const nextBonuses =
        adjustmentType === 'bonus'
          ? normalizedAmount > 0
            ? [{ id: `${timesheetId}-bonus`, label: 'One-off bonus', amount: normalizedAmount }]
            : []
          : timesheet.bonuses;
      const nextDeductions =
        adjustmentType === 'deduction'
          ? normalizedAmount > 0
            ? [{ id: `${timesheetId}-deduction`, label: 'One-off deduction', amount: normalizedAmount }]
            : []
          : timesheet.deductions;
      const paySummary = calculateTimesheetPay({
        totalHours: timesheet.totalHours,
        hourlyRate: timesheet.hourlyRate,
        overtimeThreshold: timesheet.overtimeThreshold,
        overtimeMultiplier: timesheet.overtimeMultiplier,
        bonuses: nextBonuses,
        deductions: nextDeductions,
      });
      return {
        ...timesheet,
        bonuses: nextBonuses,
        deductions: nextDeductions,
        grossTotal: paySummary.grossTotal,
      };
    });
    saveAdminState({ nextTimesheets });
  };

  const finalizePayroll = () => {
    const nextTimesheets = timesheets.map((timesheet) =>
      timesheet.status === 'approved'
        ? {
            ...timesheet,
            status: 'finalized',
            finalizedAt: new Date().toISOString(),
          }
        : timesheet,
    );
    saveAdminState({ nextTimesheets });
  };

  const selectedPool = poolState.find((pool) => pool.id === selectedPoolId) ?? poolState[0] ?? null;
  const handleLogout = () => {
    navigate('/', { replace: true });
  };

  return (
    <main className="dashboard-shell">
      <section className="dashboard-layout">
        <div className="dashboard-hero">
          <div className="dashboard-hero-top">
            <div>
              <span className="hero-label">Admin Dashboard</span>
              <h1>{organization.name}</h1>
              <p>
                Signed in as {employee.name}. Configure tenant-wide settings, staff IDs, pool rules,
                and location policies for your organization.
              </p>
            </div>
            <button className="logout-button" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>

        <div className="manager-tabs">
          <button
            type="button"
            className={activeSection === 'overview' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={activeSection === 'locations' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('locations')}
          >
            Pool setup
          </button>
          <button
            type="button"
            className={activeSection === 'payroll' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('payroll')}
          >
            Payroll
          </button>
          <button
            type="button"
            className={activeSection === 'alerts' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('alerts')}
          >
            Alerts
          </button>
          <button
            type="button"
            className={activeSection === 'incidents' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('incidents')}
          >
            Incidents
          </button>
          <button
            type="button"
            className={activeSection === 'schedule' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('schedule')}
          >
            Scheduling
          </button>
          <button
            type="button"
            className={activeSection === 'staff' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('staff')}
          >
            Staff
          </button>
          <button
            type="button"
            className={activeSection === 'messages' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('messages')}
          >
            Messaging
          </button>
          <button
            type="button"
            className={activeSection === 'hr' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('hr')}
          >
            HR
          </button>
          <button
            type="button"
            className={activeSection === 'profile' ? 'manager-tab active' : 'manager-tab'}
            onClick={() => setActiveSection('profile')}
          >
            Profile
          </button>
        </div>

        {activeSection === 'overview' ? (
          <OperationsCommandCenter
            organization={organization}
            pools={poolState}
            schedules={schedules}
            attendanceRecords={attendanceRecords}
            attendanceNotifications={attendanceNotifications}
            alerts={alerts}
            timesheets={timesheets}
            shiftSwapRequests={shiftSwapRequests}
            employees={organizationEmployees}
            onOpenSection={setActiveSection}
          />
        ) : null}

        {activeSection === 'locations' ? (
          <PoolSetupWorkbench
            poolForm={poolForm}
            onPoolFieldChange={handlePoolFieldChange}
            onAddPool={handleAddPool}
            pools={poolState}
            selectedPool={selectedPool}
            onSelectPool={setSelectedPoolId}
            onToggleGeofence={toggleGeofence}
            onUpdatePoolThreshold={updatePoolThreshold}
            onUpdatePoolChecklistTemplate={updatePoolChecklistTemplate}
          />
        ) : null}

        {activeSection === 'payroll' ? (
          <PayrollPanel
            organizationName={organization.name}
            employeeDirectory={employeeDirectory}
            schedules={schedules}
            attendanceRecords={attendanceRecords}
            timesheets={timesheets}
            payrollSettings={payrollSettings}
            viewerId={currentEmployee.id}
            scope="admin"
            canReviewTimesheets
            canFinalizePayroll
            onPayrollSettingsChange={updatePayrollSettings}
            onEmployeePayrollFieldChange={updateEmployeePayrollField}
            onAdjustTimesheet={updateTimesheetAdjustments}
            onFinalizePayroll={finalizePayroll}
            onReviewTimesheet={(timesheetId, status) =>
              saveAdminState({
                nextTimesheets: timesheets.map((timesheet) =>
                  timesheet.id === timesheetId
                    ? {
                        ...timesheet,
                        status,
                        reviewer: currentEmployee.name,
                        reviewedAt: new Date().toISOString(),
                      }
                    : timesheet,
                ),
              })
            }
          />
        ) : null}

        {activeSection === 'alerts' ? (
          <AlertsWorkbench
            pools={poolState}
            alerts={alerts}
            selectedPool={selectedPool}
            onSelectPool={setSelectedPoolId}
            onUpdatePoolMetric={updatePoolMetric}
            onUpdatePoolThreshold={updatePoolThreshold}
            onAcknowledgeAlert={acknowledgeAlert}
            onResolveAlert={resolveAlert}
            onRunAlertScan={() => saveAdminState({})}
          />
        ) : null}

        {activeSection === 'incidents' ? (
          <IncidentQueueSection incidents={incidents} onUpdateIncidentStatus={updateIncidentStatus} />
        ) : null}

        {activeSection === 'schedule' ? (
          <article className="dashboard-card">
            <SchedulingWorkbench
              viewerRole="admin"
              organizationId={organization.id}
              pools={poolState}
              employeeDirectory={employeeDirectory}
              schedules={schedules}
              onAddScheduleEntry={addScheduleEntry}
              onUpdateSchedule={updateSchedule}
              onToggleScheduleOverride={toggleScheduleOverride}
              onAutoFill={() =>
                saveAdminState({
                  nextSchedules: [
                    ...schedules,
                    ...buildAutoFillSchedules({
                      organizationId: organization.id,
                      pools: poolState,
                      schedules,
                      employeeDirectory,
                      weekStartDate: getWeekStartDate(),
                    }).filter((suggested) => suggested.employeeId),
                  ],
                })
              }
              onUpdateEmployeeAvailability={updateEmployeeAvailability}
            />
            <PeopleOpsPanel
              viewerRole="admin"
              employeeDirectory={employeeDirectory}
              leaveRequests={leaveRequests}
              shiftSwapRequests={shiftSwapRequests}
              currentEmployee={currentEmployee}
              leaveForm={leaveForm}
              swapForm={swapForm}
              onLeaveFormChange={setLeaveForm}
              onSwapFormChange={setSwapForm}
              onSubmitLeaveRequest={submitAdminLeaveRequest}
              onSubmitSwapRequest={submitAdminSwapRequest}
              onReviewLeaveRequest={reviewLeaveRequest}
              onReviewShiftSwap={reviewShiftSwap}
            />
          </article>
        ) : null}

        {activeSection === 'staff' ? (
          <StaffAdminPanel
            staffForm={staffForm}
            onStaffFormChange={handleStaffFormChange}
            onAddStaff={handleAddStaff}
            employees={organizationEmployees}
            pools={poolState}
          />
        ) : null}

        {activeSection === 'messages' ? (
          <MessagingCenter
            variant="dashboard"
            employee={currentEmployee}
            participants={organizationEmployees.map((person) => person.name)}
            communications={communications}
            onCommunicationsChange={saveAdminCommunications}
            canManageAnnouncements
          />
        ) : null}

        {activeSection === 'hr' ? (
          <HRManagementPanel
            employeeDirectory={employeeDirectory}
            viewerName={currentEmployee.name}
            onSaveEmployeeHr={updateEmployeeHr}
          />
        ) : null}

        {activeSection === 'profile' ? (
          <ProfileSection
            variant="dashboard"
            organizationId={organization.id}
            employee={currentEmployee}
            onProfileChange={saveAdminProfile}
          />
        ) : null}
      </section>
    </main>
  );
}

function OperationsCommandCenter({
  organization,
  pools,
  schedules,
  attendanceRecords,
  attendanceNotifications,
  alerts,
  timesheets,
  shiftSwapRequests,
  employees,
  onOpenSection,
}) {
  const today = formatIsoDate(new Date());
  const openAlerts = alerts.filter((alert) => alert.status !== 'resolved');
  const todaySchedules = schedules
    .filter((entry) => entry.role === 'lifeguard' && entry.date === today)
    .sort((first, second) => (first.startMinutes ?? 0) - (second.startMinutes ?? 0));
  const activeAttendance = attendanceRecords.filter((record) => record.status === 'in-progress');
  const attendanceByEmployee = new Map(
    attendanceRecords.map((record) => [record.employeeId, record]),
  );
  const attendanceByPool = pools.map((pool) => ({
    poolId: pool.id,
    poolName: pool.name,
    activeRecords: activeAttendance.filter((record) => record.poolId === pool.id),
    alerts: openAlerts.filter((alert) => alert.poolId === pool.id),
  }));
  const unreadNotifications = attendanceNotifications.filter((notification) => !notification.read);
  const certificationAlerts = getCertificationAlerts(employees);
  const pendingShiftSwaps = shiftSwapRequests.filter((request) => request.status === 'pending');
  const pendingTimesheets = timesheets.filter((timesheet) => timesheet.status === 'pending');
  const payrollRows = buildPayrollRows(
    Object.fromEntries(employees.map((employee) => [employee.id, employee])),
    timesheets,
    'admin',
    '',
  );
  const payrollTotals = payrollRows.reduce(
    (summary, row) => ({
      hours: summary.hours + row.regularHours + row.overtimeHours,
      gross: summary.gross + row.grossTotal,
    }),
    { hours: 0, gross: 0 },
  );
  const certificationAlertByEmployeeId = certificationAlerts.reduce((lookup, alert) => {
    const current = lookup[alert.employeeId];
    if (!current || (current.severity === 'yellow' && alert.severity === 'red')) {
      lookup[alert.employeeId] = alert;
    }
    return lookup;
  }, {});

  const getScheduleStatus = (schedule) => {
    const attendanceRecord = attendanceByEmployee.get(schedule.employeeId);
    if (!attendanceRecord || attendanceRecord.dateLabel !== formatDateShort(new Date())) {
      return { label: 'Not clocked in', tone: 'normal' };
    }
    if (attendanceRecord.status === 'in-progress' || attendanceRecord.status === 'completed') {
      if (attendanceRecord.lateMinutes > 0) {
        return { label: `${attendanceRecord.lateMinutes} min late`, tone: 'yellow' };
      }
      return { label: 'On time', tone: 'normal' };
    }
    return { label: 'Not clocked in', tone: 'normal' };
  };

  return (
    <div className="dashboard-grid">
      <article className="dashboard-card highlight span-two">
        <span className="dashboard-eyebrow">Unified manager dashboard</span>
        <h2>{organization.region}</h2>
        <p>
          {todaySchedules.length} scheduled today · {activeAttendance.length} clocked in · {openAlerts.length} active
          pool alerts · {pendingShiftSwaps.length + pendingTimesheets.length + certificationAlerts.length} pending items
        </p>
      </article>

      <button className="dashboard-card dashboard-link-card span-two" type="button" onClick={() => onOpenSection?.('schedule')}>
        <div className="message-card-header">
          <div>
            <span className="dashboard-eyebrow">Today&apos;s schedule</span>
            <h2>Pool assignments and clock-in status</h2>
          </div>
          <span className="priority-pill normal">{todaySchedules.length} shifts</span>
        </div>
        <div className="manager-table">
          <div className="manager-table-header">
            <span>Lifeguard</span>
            <span>Pool</span>
            <span>Shift</span>
            <span>Status</span>
          </div>
          {todaySchedules.slice(0, 8).map((schedule) => {
            const status = getScheduleStatus(schedule);
            return (
              <div key={schedule.id} className="manager-table-row">
                <strong>{schedule.name}</strong>
                <span>{schedule.poolName}</span>
                <span>{schedule.shiftLabel}</span>
                <span className={`priority-pill ${status.tone}`}>{status.label}</span>
              </div>
            );
          })}
        </div>
      </button>

      <button className="dashboard-card dashboard-link-card" type="button" onClick={() => onOpenSection?.('alerts')}>
        <div className="message-card-header">
          <div>
            <span className="dashboard-eyebrow">Active pool alerts</span>
            <h2>Chemical monitoring</h2>
          </div>
          <span className="priority-pill important">{openAlerts.length}</span>
        </div>
        <div className="list-stack">
          {openAlerts.slice(0, 4).map((alert) => (
            <div key={alert.id} className="summary-row">
              <strong>{alert.poolName}</strong>
              <span className={`priority-pill ${alert.severity}`}>{alert.severity.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </button>

      <button className="dashboard-card dashboard-link-card" type="button" onClick={() => onOpenSection?.('payroll')}>
        <div className="message-card-header">
          <div>
            <span className="dashboard-eyebrow">Weekly payroll preview</span>
            <h2>Hours and estimated gross</h2>
          </div>
          <span className="priority-pill normal">{timesheets[0]?.periodLabel ?? 'Current period'}</span>
        </div>
        <div className="list-stack">
          <div className="summary-row">
            <strong>Total hours</strong>
            <span>{payrollTotals.hours.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <strong>Estimated gross</strong>
            <span>${payrollTotals.gross.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <strong>Pending timesheets</strong>
            <span>{pendingTimesheets.length}</span>
          </div>
        </div>
      </button>

      <button className="dashboard-card dashboard-link-card" type="button" onClick={() => onOpenSection?.('hr')}>
        <div className="message-card-header">
          <div>
            <span className="dashboard-eyebrow">Pending actions</span>
            <h2>Manager approvals</h2>
          </div>
          <span className="priority-pill important">
            {pendingShiftSwaps.length + pendingTimesheets.length + certificationAlerts.length}
          </span>
        </div>
        <div className="list-stack">
          <div className="summary-row">
            <strong>Shift swaps</strong>
            <span>{pendingShiftSwaps.length}</span>
          </div>
          <div className="summary-row">
            <strong>Timesheets</strong>
            <span>{pendingTimesheets.length}</span>
          </div>
          <div className="summary-row">
            <strong>Certification watch</strong>
            <span>{certificationAlerts.length}</span>
          </div>
          <div className="summary-row">
            <strong>Late clock-ins</strong>
            <span>{unreadNotifications.length}</span>
          </div>
        </div>
      </button>

      <article className="dashboard-card span-two">
        <div className="message-card-header">
          <div>
            <span className="dashboard-eyebrow">Pool operations</span>
            <h2>Coverage and alert load by pool</h2>
          </div>
          <button className="ghost-button compact" type="button" onClick={() => onOpenSection?.('alerts')}>
            Open alerts
          </button>
        </div>
        <div className="attendance-live-grid">
          {pools.map((pool) => {
            const completedCount = pool.checklist.filter((item) => item.completed).length;
            const latestEntry = pool.shiftLogs[0];
            const poolAttendance = attendanceByPool.find((entry) => entry.poolId === pool.id);
            const poolAlerts = poolAttendance?.alerts ?? [];

            return (
              <button
                key={pool.id}
                className="dashboard-card manager-pool-card embedded dashboard-link-card"
                type="button"
                onClick={() => onOpenSection?.('alerts')}
              >
                <div className="manager-pool-header">
                  <div>
                    <h2>{pool.name}</h2>
                    <p>
                      {pool.subtitle} · {pool.lastUpdatedLabel}
                    </p>
                  </div>
                  <span className="pool-badge">
                    {completedCount}/{pool.checklist.length} done
                  </span>
                </div>

                <div className="manager-checklist-preview">
                  {pool.checklist.slice(0, 3).map((item) => (
                    <div key={item.id} className={item.completed ? 'preview-item done' : 'preview-item'}>
                      <span>{item.completed ? '✓' : '○'}</span>
                      <div>
                        <strong>{item.label}</strong>
                        <small>{item.completed ? `${item.completedBy} · ${item.completedAt}` : 'Pending'}</small>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="summary-strip">
                  <span>{poolAttendance?.activeRecords.length ?? 0} on site · {poolAlerts.length} open alerts</span>
                  <span>{latestEntry ? `${latestEntry.title} · ${latestEntry.timeLabel}` : 'No recent logs'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </article>

      <article className="dashboard-card span-two">
        <div className="message-card-header">
          <div>
            <span className="dashboard-eyebrow">Staff overview</span>
            <h2>Shift and certification health</h2>
          </div>
          <button className="ghost-button compact" type="button" onClick={() => onOpenSection?.('hr')}>
            Open HR
          </button>
        </div>
        <div className="incident-grid">
          {employees.map((employee) => {
            const schedule = todaySchedules.find((entry) => entry.employeeId === employee.id);
            const status = schedule ? getScheduleStatus(schedule) : { label: 'No shift today', tone: 'normal' };
            const certificationAlert = certificationAlertByEmployeeId[employee.id];
            return (
              <button
                key={employee.id}
                className="incident-card dashboard-link-card"
                type="button"
                onClick={() => onOpenSection?.(certificationAlert ? 'hr' : 'schedule')}
              >
                <div className="message-card-header">
                  <strong>{employee.name}</strong>
                  <span className={`priority-pill ${employee.role === 'admin' ? 'important' : 'normal'}`}>
                    {roleLabels[employee.role]}
                  </span>
                </div>
                <p>{schedule ? `${schedule.poolName} · ${schedule.shiftLabel}` : 'No assignment today'}</p>
                <div className="summary-row">
                  <strong>Shift status</strong>
                  <span className={`priority-pill ${status.tone}`}>{status.label}</span>
                </div>
                <div className="summary-row">
                  <strong>Certification health</strong>
                  <span className={`priority-pill ${certificationAlert?.severity ?? 'normal'}`}>
                    {certificationAlert ? certificationAlert.title : 'Healthy'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </article>
    </div>
  );
}

function AlertsWorkbench({
  pools,
  alerts,
  selectedPool,
  onSelectPool,
  onUpdatePoolMetric,
  onUpdatePoolThreshold,
  onAcknowledgeAlert,
  onResolveAlert,
  onRunAlertScan,
}) {
  return (
    <div className="settings-layout">
      <article className="dashboard-card">
        <span className="dashboard-eyebrow">Alert engine</span>
        <h2>Thresholds and live readings</h2>
        <p>Adjust pool limits, update live chemistry values, and rerun AquaGuard&apos;s alert scan.</p>

        <div className="settings-form">
          <select className="text-input" value={selectedPool?.id ?? ''} onChange={(event) => onSelectPool(event.target.value)}>
            {pools.map((pool) => (
              <option key={pool.id} value={pool.id}>
                {pool.name}
              </option>
            ))}
          </select>

          {selectedPool ? (
            <>
              <div className="settings-grid">
                {selectedPool.statusCards.map((card) => (
                  <label key={card.label} className="settings-field">
                    <span>{card.label}</span>
                    <input
                      className="text-input"
                      type="text"
                      value={card.value}
                      onChange={(event) => onUpdatePoolMetric(selectedPool.id, card.label, event.target.value)}
                    />
                  </label>
                ))}
              </div>

              <div className="settings-grid">
                {Object.entries(selectedPool.thresholds ?? buildDefaultThresholds()).map(([key, value]) => (
                  <label key={key} className="settings-field">
                    <span>{key}</span>
                    <input
                      className="text-input"
                      type="number"
                      step="0.1"
                      value={value}
                      onChange={(event) => onUpdatePoolThreshold(selectedPool.id, key, event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </>
          ) : null}

          <button className="primary-button" type="button" onClick={onRunAlertScan}>
            Run alert scan
          </button>
        </div>
      </article>

      <article className="dashboard-card">
        <span className="dashboard-eyebrow">Open alerts</span>
        <h2>Tiered alert queue</h2>
        <div className="alert-workbench-list">
          {alerts
            .filter((alert) => alert.status !== 'resolved')
            .map((alert) => (
              <article key={alert.id} className={`alert-workbench-card ${alert.severity}`}>
                <div className="message-card-header">
                  <strong>{alert.title}</strong>
                  <span className={`priority-pill ${alert.severity}`}>{alert.severity}</span>
                </div>
                <p>{alert.poolName}</p>
                <p>{alert.message}</p>
                <small>
                  {alert.createdAt} · escalate in {alert.escalateAfterMinutes} min · {alert.status}
                </small>
                <div className="button-row">
                  <button className="secondary-button compact" type="button" onClick={() => onAcknowledgeAlert(alert.id)}>
                    Acknowledge
                  </button>
                  <button className="primary-button compact" type="button" onClick={() => onResolveAlert(alert.id)}>
                    Resolve
                  </button>
                </div>
              </article>
            ))}
        </div>
      </article>
    </div>
  );
}

function IncidentQueueSection({ incidents, onUpdateIncidentStatus }) {
  return (
    <article className="dashboard-card">
      <span className="dashboard-eyebrow">Incident reporting</span>
      <h2>Manager review queue</h2>
      <div className="incident-grid">
        {incidents.map((incident) => (
          <article key={incident.id} className="incident-card">
            <div className="message-card-header">
              <strong>{incident.title}</strong>
              <span className={`priority-pill ${incident.severity}`}>{incident.severity}</span>
            </div>
            <p>
              {incident.poolName} · {incident.employeeName}
            </p>
            <p>{incident.details}</p>
            {incident.photo ? <img className="incident-photo-preview" src={incident.photo} alt={incident.title} /> : null}
            <small>
              {incident.reportedAt} · {incident.status}
              {incident.reviewer ? ` · reviewed by ${incident.reviewer}` : ''}
            </small>
            <div className="button-row">
              <button className="secondary-button compact" type="button" onClick={() => onUpdateIncidentStatus(incident.id, 'reviewing')}>
                Mark reviewing
              </button>
              <button className="primary-button compact" type="button" onClick={() => onUpdateIncidentStatus(incident.id, 'resolved')}>
                Resolve
              </button>
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}

function PoolSetupWorkbench({
  poolForm,
  onPoolFieldChange,
  onAddPool,
  pools,
  selectedPool,
  onSelectPool,
  onToggleGeofence,
  onUpdatePoolThreshold,
  onUpdatePoolChecklistTemplate,
}) {
  return (
    <div className="settings-layout">
      <article className="dashboard-card">
        <span className="dashboard-eyebrow">Add Pool Location</span>
        <h2>Geofencing and pool creation</h2>
        <p>Define where staff can clock in and keep each site inside its own configured rule set.</p>

        <form className="settings-form" onSubmit={onAddPool}>
          <input className="text-input" type="text" placeholder="Pool name" value={poolForm.name} onChange={(event) => onPoolFieldChange('name', event.target.value)} />
          <input className="text-input" type="text" placeholder="Area or subtitle" value={poolForm.subtitle} onChange={(event) => onPoolFieldChange('subtitle', event.target.value)} />
          <input className="text-input" type="text" placeholder="Lane or zone label" value={poolForm.zoneLabel} onChange={(event) => onPoolFieldChange('zoneLabel', event.target.value)} />
          <div className="settings-row">
            <input className="text-input" type="number" step="any" placeholder="Latitude" value={poolForm.latitude} onChange={(event) => onPoolFieldChange('latitude', event.target.value)} />
            <input className="text-input" type="number" step="any" placeholder="Longitude" value={poolForm.longitude} onChange={(event) => onPoolFieldChange('longitude', event.target.value)} />
          </div>
          <input className="text-input" type="number" placeholder="Geofence radius in meters" value={poolForm.radiusMeters} onChange={(event) => onPoolFieldChange('radiusMeters', event.target.value)} />
          <button className="primary-button" type="submit">
            Add pool
          </button>
        </form>
      </article>

      <article className="dashboard-card">
        <span className="dashboard-eyebrow">Pool rules</span>
        <h2>Checklist template and thresholds</h2>
        <select className="text-input" value={selectedPool?.id ?? ''} onChange={(event) => onSelectPool(event.target.value)}>
          {pools.map((pool) => (
            <option key={pool.id} value={pool.id}>
              {pool.name}
            </option>
          ))}
        </select>

        {selectedPool ? (
          <>
            <div className="location-list">
              {pools.map((pool) => (
                <div key={pool.id} className="location-item">
                  <div>
                    <strong>{pool.name}</strong>
                    <p>
                      {pool.subtitle}
                      {pool.latitude !== null && pool.longitude !== null
                        ? ` · ${pool.latitude.toFixed(4)}, ${pool.longitude.toFixed(4)}`
                        : ' · coordinates pending'}
                    </p>
                  </div>
                  <button type="button" className={pool.geofenced ? 'toggle-chip active' : 'toggle-chip'} onClick={() => onToggleGeofence(pool.id)}>
                    {pool.geofenced ? `Geofenced ${pool.radiusMeters}m` : 'Geofence off'}
                  </button>
                </div>
              ))}
            </div>

            <div className="settings-grid">
              {Object.entries(selectedPool.thresholds ?? buildDefaultThresholds()).map(([key, value]) => (
                <label key={key} className="settings-field">
                  <span>{key}</span>
                  <input className="text-input" type="number" step="0.1" value={value} onChange={(event) => onUpdatePoolThreshold(selectedPool.id, key, event.target.value)} />
                </label>
              ))}
            </div>

            <label className="settings-field full-width">
              <span>Master checklist template</span>
              <textarea
                className="text-input message-textarea"
                value={(selectedPool.checklistTemplate ?? selectedPool.checklist.map((item) => item.label)).join('\n')}
                onChange={(event) => onUpdatePoolChecklistTemplate(selectedPool.id, event.target.value)}
              />
            </label>
          </>
        ) : null}
      </article>
    </div>
  );
}

function StaffAdminPanel({ staffForm, onStaffFormChange, onAddStaff, employees, pools }) {
  return (
    <div className="settings-layout">
      <article className="dashboard-card">
        <span className="dashboard-eyebrow">Staff setup</span>
        <h2>Add staff IDs and roles</h2>
        <form className="settings-form" onSubmit={onAddStaff}>
          <input className="text-input" type="text" placeholder="Employee ID" value={staffForm.id} onChange={(event) => onStaffFormChange('id', event.target.value)} />
          <input className="text-input" type="text" placeholder="Full name" value={staffForm.name} onChange={(event) => onStaffFormChange('name', event.target.value)} />
          <select className="text-input" value={staffForm.role} onChange={(event) => onStaffFormChange('role', event.target.value)}>
            <option value="lifeguard">Lifeguard</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <select className="text-input" value={staffForm.assignedPoolId} onChange={(event) => onStaffFormChange('assignedPoolId', event.target.value)}>
            {pools.map((pool) => (
              <option key={pool.id} value={pool.id}>
                {pool.name}
              </option>
            ))}
          </select>
          <button className="primary-button" type="submit">
            Add staff member
          </button>
        </form>
      </article>

      <article className="dashboard-card">
        <span className="dashboard-eyebrow">Current directory</span>
        <h2>Organization staff</h2>
        <div className="list-stack">
          {employees.map((person) => (
            <div key={person.id} className="summary-row">
              <strong>
                {person.name} · {person.id}
              </strong>
              <span>
                {roleLabels[person.role]}{person.assignedPoolId ? ` · ${pools.find((pool) => pool.id === person.assignedPoolId)?.name ?? 'Pool pending'}` : ''}
              </span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function AvailabilityEditor({ variant = 'dashboard', employee, onUpdateAvailability }) {
  return (
    <div className={variant === 'mobile' ? 'availability-editor mobile' : 'availability-editor'}>
      {weekDays.map((day) => {
        const availability = employee.availability?.[day] ?? buildDefaultAvailability(employee.role)[day];
        return (
          <div key={day} className="availability-row">
            <label className="availability-day">
              <input
                type="checkbox"
                checked={availability.enabled}
                onChange={(event) => onUpdateAvailability(day, 'enabled', event.target.checked)}
              />
              <span>{day}</span>
            </label>
            <div className="availability-times">
              <input
                className={variant === 'mobile' ? 'dark-input' : 'text-input'}
                type="time"
                value={availability.start}
                disabled={!availability.enabled}
                onChange={(event) => onUpdateAvailability(day, 'start', event.target.value)}
              />
              <input
                className={variant === 'mobile' ? 'dark-input' : 'text-input'}
                type="time"
                value={availability.end}
                disabled={!availability.enabled}
                onChange={(event) => onUpdateAvailability(day, 'end', event.target.value)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SchedulingWorkbench({
  viewerRole,
  organizationId,
  pools,
  employeeDirectory,
  schedules,
  onAddScheduleEntry,
  onUpdateSchedule,
  onToggleScheduleOverride,
  onAutoFill,
  onUpdateEmployeeAvailability,
}) {
  const [assignmentForm, setAssignmentForm] = useState(() => {
    const weekStart = getWeekStartDate();
    return {
      employeeId: Object.values(employeeDirectory).find((employee) => employee.role === 'lifeguard')?.id ?? '',
      poolId: pools[0]?.id ?? '',
      date: formatIsoDate(weekStart),
      shiftStart: '07:00',
      shiftEnd: '15:00',
      status: 'scheduled',
    };
  });
  const [selectedAvailabilityEmployeeId, setSelectedAvailabilityEmployeeId] = useState(
    Object.values(employeeDirectory).find((employee) => employee.role === 'lifeguard')?.id ?? '',
  );

  const weekStart = getWeekStartDate();
  const weekDaysForGrid = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const scheduleConflicts = detectScheduleConflicts(schedules, employeeDirectory);
  const assignableEmployees = Object.values(employeeDirectory).filter((employee) =>
    viewerRole === 'manager' ? employee.role === 'lifeguard' : true,
  );
  const availabilityEmployees = Object.values(employeeDirectory).filter((employee) =>
    viewerRole === 'manager' ? employee.role === 'lifeguard' : employee.role !== 'admin',
  );
  const selectedAvailabilityEmployee =
    employeeDirectory[selectedAvailabilityEmployeeId] ?? availabilityEmployees[0] ?? null;

  const handleAssignmentSubmit = (event) => {
    event.preventDefault();
    const selectedEmployee = employeeDirectory[assignmentForm.employeeId];
    const selectedPool = pools.find((pool) => pool.id === assignmentForm.poolId);
    const date = new Date(`${assignmentForm.date}T00:00:00`);

    if (!selectedEmployee || !selectedPool) {
      return;
    }

    onAddScheduleEntry({
      orgId: organizationId,
      employeeId: selectedEmployee.id,
      name: selectedEmployee.name,
      role: selectedEmployee.role,
      poolId: selectedPool.id,
      poolName: selectedPool.name,
      day: weekDays[date.getDay()],
      date: assignmentForm.date,
      shiftStart: assignmentForm.shiftStart,
      shiftEnd: assignmentForm.shiftEnd,
      status: assignmentForm.status,
    });
  };

  return (
    <div className="schedule-workbench">
      <span className="dashboard-eyebrow">
        {viewerRole === 'admin' ? 'Admin Scheduling Controls' : 'Manager Scheduling Panel'}
      </span>
      <h2>Weekly calendar, availability, and conflict detection</h2>
      <p>Assign staff to pools, review coverage, auto-fill open shifts, and catch availability issues before publishing.</p>

      <div className="settings-layout">
        <article className="dashboard-card embedded-card">
          <span className="dashboard-eyebrow">Assign shift</span>
          <form className="settings-form" onSubmit={handleAssignmentSubmit}>
            <select
              className="text-input"
              value={assignmentForm.employeeId}
              onChange={(event) =>
                setAssignmentForm((current) => ({
                  ...current,
                  employeeId: event.target.value,
                }))
              }
            >
              <option value="">Choose employee</option>
              {assignableEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} · {roleLabels[employee.role]}
                </option>
              ))}
            </select>
            <select
              className="text-input"
              value={assignmentForm.poolId}
              onChange={(event) =>
                setAssignmentForm((current) => ({
                  ...current,
                  poolId: event.target.value,
                }))
              }
            >
              {pools.map((pool) => (
                <option key={pool.id} value={pool.id}>
                  {pool.name}
                </option>
              ))}
            </select>
            <div className="settings-row">
              <input
                className="text-input"
                type="date"
                value={assignmentForm.date}
                onChange={(event) =>
                  setAssignmentForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
              />
              <select
                className="text-input"
                value={assignmentForm.status}
                onChange={(event) =>
                  setAssignmentForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="settings-row">
              <input
                className="text-input"
                type="time"
                value={assignmentForm.shiftStart}
                onChange={(event) =>
                  setAssignmentForm((current) => ({
                    ...current,
                    shiftStart: event.target.value,
                  }))
                }
              />
              <input
                className="text-input"
                type="time"
                value={assignmentForm.shiftEnd}
                onChange={(event) =>
                  setAssignmentForm((current) => ({
                    ...current,
                    shiftEnd: event.target.value,
                  }))
                }
              />
            </div>
            <div className="button-row">
              <button className="primary-button" type="submit">
                Add shift
              </button>
              <button className="secondary-button inline-action" type="button" onClick={onAutoFill}>
                Auto-fill coverage
              </button>
            </div>
          </form>
        </article>

        <article className="dashboard-card embedded-card">
          <span className="dashboard-eyebrow">Availability</span>
          <select
            className="text-input"
            value={selectedAvailabilityEmployeeId}
            onChange={(event) => setSelectedAvailabilityEmployeeId(event.target.value)}
          >
            {availabilityEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
          {selectedAvailabilityEmployee ? (
            <AvailabilityEditor
              employee={selectedAvailabilityEmployee}
              onUpdateAvailability={(day, field, value) =>
                onUpdateEmployeeAvailability(selectedAvailabilityEmployee.id, day, field, value)
              }
            />
          ) : null}
        </article>
      </div>

      {scheduleConflicts.length ? (
        <article className="dashboard-card">
          <span className="dashboard-eyebrow">Conflict detection</span>
          <div className="incident-grid">
            {scheduleConflicts.map((conflict) => (
              <article key={conflict.id} className="incident-card">
                <div className="message-card-header">
                  <strong>{conflict.type === 'double-booked' ? 'Double-booked' : 'Outside availability'}</strong>
                  <span className="priority-pill important">Flagged</span>
                </div>
                <p>{conflict.message}</p>
              </article>
            ))}
          </div>
        </article>
      ) : null}

      <article className="dashboard-card">
        <span className="dashboard-eyebrow">Weekly calendar</span>
        <div className="weekly-calendar">
          <div className="calendar-corner">Pool / Day</div>
          {weekDaysForGrid.map((date) => (
            <div key={formatIsoDate(date)} className="calendar-day-header">
              {formatWeekdayLabel(date)}
            </div>
          ))}

          {pools.map((pool) => (
            <Fragment key={pool.id}>
              <div className="calendar-pool-label">{pool.name}</div>
              {weekDaysForGrid.map((date) => {
                const dailySchedules = schedules.filter(
                  (schedule) => schedule.poolId === pool.id && schedule.date === formatIsoDate(date),
                );

                return (
                  <div key={`${pool.id}-${formatIsoDate(date)}`} className="calendar-cell">
                    {dailySchedules.length ? (
                      dailySchedules.map((schedule) => (
                        <article key={schedule.id} className={`shift-card ${schedule.status}`}>
                          <strong>{schedule.name}</strong>
                          <span>{schedule.shiftLabel}</span>
                          <small>{schedule.status}</small>
                          <div className="shift-card-actions">
                            <select
                              className="text-input compact-select"
                              value={schedule.status}
                              onChange={(event) => onUpdateSchedule(schedule.id, 'status', event.target.value)}
                            >
                              <option value="scheduled">Scheduled</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="swapped">Swapped</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <button
                              className={schedule.overrideActive ? 'toggle-chip active' : 'toggle-chip'}
                              type="button"
                              onClick={() => onToggleScheduleOverride(schedule.id)}
                            >
                              {schedule.overrideActive ? 'Override live' : 'Override'}
                            </button>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="calendar-empty">No shift</div>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </article>
    </div>
  );
}

function PayrollPanel({
  organizationName,
  employeeDirectory,
  schedules,
  attendanceRecords,
  timesheets,
  payrollSettings,
  viewerId,
  scope,
  canReviewTimesheets = false,
  canFinalizePayroll = false,
  onPayrollSettingsChange,
  onEmployeePayrollFieldChange,
  onAdjustTimesheet,
  onFinalizePayroll,
  onReviewTimesheet,
}) {
  const employees = Object.values(employeeDirectory).filter((employee) => {
    if (scope === 'manager') {
      return employee.role === 'lifeguard' || employee.id === viewerId;
    }

    return true;
  });
  const payrollRows = buildPayrollRows(employeeDirectory, timesheets, scope, viewerId);
  const activePeriodLabel = timesheets[0]?.periodLabel ?? 'Current pay period';

  return (
    <article className="dashboard-card">
      <span className="dashboard-eyebrow">Payroll</span>
      <h2>Hours and pay overview</h2>
      <div className="settings-layout compact-top">
        <article className="dashboard-card embedded-card">
          <span className="dashboard-eyebrow">Org payroll settings</span>
          <div className="settings-row">
            <label className="settings-field">
              <span>Pay period</span>
              <select
                className="text-input"
                value={payrollSettings.payPeriod}
                onChange={(event) => onPayrollSettingsChange?.('payPeriod', event.target.value)}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
              </select>
            </label>
            <div className="settings-field">
              <span>Export</span>
              <div className="button-row">
                <button
                  className="secondary-button compact"
                  type="button"
                  onClick={() => exportPayrollRowsToCsv(payrollRows, organizationName, activePeriodLabel)}
                >
                  Export CSV
                </button>
                {canFinalizePayroll ? (
                  <button className="primary-button compact" type="button" onClick={onFinalizePayroll}>
                    Finalize approved
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </article>
      </div>
      <div className="payroll-table-wrap">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Regular Hours</th>
              <th>OT Hours</th>
              <th>Regular Pay</th>
              <th>OT Pay</th>
              <th>Gross Total</th>
            </tr>
          </thead>
          <tbody>
            {payrollRows.map((row) => (
              <tr key={row.employeeId}>
                <td>{row.employeeName}</td>
                <td>{row.regularHours.toFixed(2)}</td>
                <td>{row.overtimeHours.toFixed(2)}</td>
                <td>${row.regularPay.toFixed(2)}</td>
                <td>${row.overtimePay.toFixed(2)}</td>
                <td>${row.grossTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="incident-grid">
        {employees.map((employee) => {
          const summary = calculatePayrollSummary(employee, schedules, attendanceRecords);
          const employeeTimesheets = timesheets.filter((timesheet) => timesheet.employeeId === employee.id);
          const latestTimesheet = employeeTimesheets[0] ?? null;
          return (
            <article key={employee.id} className="incident-card">
              <div className="message-card-header">
                <strong>{employee.name}</strong>
                <span className={`priority-pill ${employee.role === 'admin' ? 'important' : 'normal'}`}>
                  {roleLabels[employee.role]}
                </span>
              </div>
              <p>
                {summary.hours.toFixed(2)} hours · ${summary.payRate}/hr
              </p>
              <small>Gross pay: ${summary.grossPay.toFixed(2)}</small>
              <div className="settings-grid payroll-settings-grid">
                <label className="settings-field">
                  <span>Hourly rate</span>
                  <input
                    className="text-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={employee.payRate ?? 0}
                    onChange={(event) =>
                      onEmployeePayrollFieldChange?.(employee.id, 'payRate', event.target.value)
                    }
                  />
                </label>
                <label className="settings-field">
                  <span>OT threshold</span>
                  <input
                    className="text-input"
                    type="number"
                    min="0"
                    step="1"
                    value={employee.overtimeThreshold ?? 40}
                    onChange={(event) =>
                      onEmployeePayrollFieldChange?.(employee.id, 'overtimeThreshold', event.target.value)
                    }
                  />
                </label>
                <label className="settings-field">
                  <span>OT multiplier</span>
                  <input
                    className="text-input"
                    type="number"
                    min="1"
                    step="0.1"
                    value={employee.overtimeMultiplier ?? 1.5}
                    onChange={(event) =>
                      onEmployeePayrollFieldChange?.(employee.id, 'overtimeMultiplier', event.target.value)
                    }
                  />
                </label>
              </div>
              {latestTimesheet ? (
                <div className="timesheet-summary">
                  <strong>{latestTimesheet.periodLabel}</strong>
                  <p>{latestTimesheet.totalHours.toFixed(2)} hrs across {latestTimesheet.poolBreakdown.length} pool(s)</p>
                  <small>
                    {latestTimesheet.status}
                    {latestTimesheet.reviewer ? ` · ${latestTimesheet.reviewer}` : ''}
                  </small>
                  <div className="settings-row">
                    <label className="settings-field">
                      <span>Bonus</span>
                      <input
                        className="text-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={latestTimesheet.bonuses[0]?.amount ?? ''}
                        onChange={(event) =>
                          onAdjustTimesheet?.(latestTimesheet.id, 'bonus', event.target.value)
                        }
                      />
                    </label>
                    <label className="settings-field">
                      <span>Deduction</span>
                      <input
                        className="text-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={latestTimesheet.deductions[0]?.amount ?? ''}
                        onChange={(event) =>
                          onAdjustTimesheet?.(latestTimesheet.id, 'deduction', event.target.value)
                        }
                      />
                    </label>
                  </div>
                  <div className="summary-row">
                    <strong>
                      Regular {latestTimesheet.regularHours.toFixed(2)}h / OT {latestTimesheet.overtimeHours.toFixed(2)}h
                    </strong>
                    <span>${latestTimesheet.grossTotal.toFixed(2)}</span>
                  </div>
                  <div className="list-stack compact">
                    {latestTimesheet.shiftBreakdown.slice(0, 3).map((shift) => (
                      <div key={shift.id} className="summary-row">
                        <strong>{shift.poolName}</strong>
                        <span>
                          {shift.dateLabel} · {shift.hoursWorked.toFixed(2)} hrs
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="button-row">
                    {canReviewTimesheets && latestTimesheet.status === 'pending' ? (
                      <>
                      <button
                        className="secondary-button compact"
                        type="button"
                        onClick={() => onReviewTimesheet?.(latestTimesheet.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        className="ghost-button compact"
                        type="button"
                        onClick={() => onReviewTimesheet?.(latestTimesheet.id, 'flagged')}
                      >
                        Flag
                      </button>
                      </>
                    ) : null}
                    <button
                      className="secondary-button compact"
                      type="button"
                      onClick={() => exportPayStubPdfLike(latestTimesheet, employee.name, organizationName)}
                    >
                      Pay stub PDF
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </article>
  );
}

function HRManagementPanel({ employeeDirectory, viewerName, onSaveEmployeeHr }) {
  const employees = Object.values(employeeDirectory);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(() => employees[0]?.id ?? '');
  const [draftNote, setDraftNote] = useState('');
  const selectedEmployee = employeeDirectory[selectedEmployeeId] ?? employees[0] ?? null;

  useEffect(() => {
    if (!selectedEmployee && employees[0]) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employees, selectedEmployee]);

  if (!selectedEmployee) {
    return null;
  }

  const certificationAlerts = getCertificationAlerts([selectedEmployee]);

  const updateEmployeeField = (field, value) => {
    onSaveEmployeeHr(selectedEmployee.id, {
      [field]: value,
    });
  };

  const updateEmergencyContact = (field, value) => {
    onSaveEmployeeHr(selectedEmployee.id, {
      emergencyContact: {
        ...selectedEmployee.emergencyContact,
        [field]: value,
      },
    });
  };

  const updateCertification = (key, field, value) => {
    onSaveEmployeeHr(selectedEmployee.id, {
      certificationRecords: {
        ...selectedEmployee.certificationRecords,
        [key]: {
          ...selectedEmployee.certificationRecords[key],
          [field]: field === 'verified' ? value : value,
        },
      },
    });
  };

  const toggleOnboardingItem = (itemId) => {
    onSaveEmployeeHr(selectedEmployee.id, {
      onboardingChecklist: selectedEmployee.onboardingChecklist.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? formatDateShort(new Date()) : '',
            }
          : item,
      ),
    });
  };

  const handleDocumentUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: file.type || 'file',
        uploadedAt: new Date().toISOString(),
        url: typeof reader.result === 'string' ? reader.result : '',
      };
      onSaveEmployeeHr(selectedEmployee.id, {
        hrDocuments: [nextDocument, ...(selectedEmployee.hrDocuments ?? [])],
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddNote = (event) => {
    event.preventDefault();
    if (!draftNote.trim()) {
      return;
    }

    const nextNote = {
      id: `note-${Date.now()}`,
      author: viewerName,
      body: draftNote.trim(),
      createdAt: new Date().toISOString(),
    };
    onSaveEmployeeHr(selectedEmployee.id, {
      performanceNotes: [nextNote, ...(selectedEmployee.performanceNotes ?? [])],
    });
    setDraftNote('');
  };

  return (
    <div className="settings-layout">
      <article className="dashboard-card">
        <span className="dashboard-eyebrow">HR workspace</span>
        <h2>Employee records and compliance</h2>
        <select
          className="text-input"
          value={selectedEmployee.id}
          onChange={(event) => setSelectedEmployeeId(event.target.value)}
        >
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name} · {roleLabels[employee.role]}
            </option>
          ))}
        </select>

        <div className="settings-grid">
          <label className="settings-field">
            <span>Name</span>
            <input
              className="text-input"
              type="text"
              value={selectedEmployee.name}
              onChange={(event) => updateEmployeeField('name', event.target.value)}
            />
          </label>
          <label className="settings-field">
            <span>Phone</span>
            <input
              className="text-input"
              type="text"
              value={selectedEmployee.phone}
              onChange={(event) => updateEmployeeField('phone', event.target.value)}
            />
          </label>
          <label className="settings-field">
            <span>Email</span>
            <input
              className="text-input"
              type="email"
              value={selectedEmployee.email}
              onChange={(event) => updateEmployeeField('email', event.target.value)}
            />
          </label>
          <label className="settings-field">
            <span>Emergency contact</span>
            <input
              className="text-input"
              type="text"
              value={selectedEmployee.emergencyContact?.name ?? ''}
              onChange={(event) => updateEmergencyContact('name', event.target.value)}
            />
          </label>
          <label className="settings-field">
            <span>Emergency phone</span>
            <input
              className="text-input"
              type="text"
              value={selectedEmployee.emergencyContact?.phone ?? ''}
              onChange={(event) => updateEmergencyContact('phone', event.target.value)}
            />
          </label>
          <label className="settings-field">
            <span>Relationship</span>
            <input
              className="text-input"
              type="text"
              value={selectedEmployee.emergencyContact?.relationship ?? ''}
              onChange={(event) => updateEmergencyContact('relationship', event.target.value)}
            />
          </label>
          <label className="settings-field">
            <span>Start date</span>
            <input
              className="text-input"
              type="date"
              value={selectedEmployee.startDate ?? ''}
              onChange={(event) => updateEmployeeField('startDate', event.target.value)}
            />
          </label>
          <label className="settings-field">
            <span>Employment type</span>
            <select
              className="text-input"
              value={selectedEmployee.employmentType ?? 'seasonal'}
              onChange={(event) => updateEmployeeField('employmentType', event.target.value)}
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="seasonal">Seasonal</option>
            </select>
          </label>
        </div>
      </article>

      <article className="dashboard-card">
        <span className="dashboard-eyebrow">Certifications</span>
        <div className="incident-grid">
          {Object.entries(selectedEmployee.certificationRecords ?? {}).map(([key, record]) => (
            <article key={key} className="incident-card">
              <div className="message-card-header">
                <strong>{record.label}</strong>
                <span className={`priority-pill ${record.verified ? 'normal' : 'important'}`}>
                  {record.verified ? 'Verified' : 'Needs review'}
                </span>
              </div>
              <div className="settings-grid">
                <label className="settings-field">
                  <span>Expiry</span>
                  <input
                    className="text-input"
                    type="date"
                    value={record.expiryDate ?? ''}
                    onChange={(event) => updateCertification(key, 'expiryDate', event.target.value)}
                  />
                </label>
                <label className="settings-field">
                  <span>Verified</span>
                  <select
                    className="text-input"
                    value={record.verified ? 'yes' : 'no'}
                    onChange={(event) => updateCertification(key, 'verified', event.target.value === 'yes')}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
            </article>
          ))}
        </div>
        {certificationAlerts.length ? (
          <div className="log-entry-list">
            {certificationAlerts.map((alert) => (
              <article key={alert.id} className={`alert-workbench-card ${alert.severity}`}>
                <div className="message-card-header">
                  <strong>{alert.title}</strong>
                  <span className={`priority-pill ${alert.severity}`}>{alert.severity.toUpperCase()}</span>
                </div>
                <p>{alert.message}</p>
              </article>
            ))}
          </div>
        ) : null}
      </article>

      <article className="dashboard-card">
        <span className="dashboard-eyebrow">Onboarding</span>
        <div className="checklist-card light">
          {selectedEmployee.onboardingChecklist.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.completed ? 'checklist-item done light' : 'checklist-item light'}
              onClick={() => toggleOnboardingItem(item.id)}
            >
              <span className="checkmark">{item.completed ? '✓' : ''}</span>
              <span className="checklist-copy">
                <strong>{item.label}</strong>
                <small>{item.completed ? `Completed ${item.completedAt}` : 'Pending'}</small>
              </span>
            </button>
          ))}
        </div>
      </article>

      <article className="dashboard-card">
        <span className="dashboard-eyebrow">Documents</span>
        <label className="outline-button file-trigger">
          Upload contract or ID
          <input type="file" accept=".pdf,image/*" onChange={handleDocumentUpload} hidden />
        </label>
        <div className="log-entry-list">
          {(selectedEmployee.hrDocuments ?? []).map((document) => (
            <article key={document.id} className="log-entry-card">
              <div className="log-entry-header">
                <strong>{document.name}</strong>
                <span>{formatDateShort(new Date(document.uploadedAt))}</span>
              </div>
              <p>{document.type}</p>
              {document.url ? (
                <a className="message-note" href={document.url} target="_blank" rel="noreferrer">
                  Open document
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </article>

      <article className="dashboard-card span-two">
        <span className="dashboard-eyebrow">Private performance notes</span>
        <form className="settings-form" onSubmit={handleAddNote}>
          <textarea
            className="text-input message-textarea"
            placeholder="Leave a private manager note"
            value={draftNote}
            onChange={(event) => setDraftNote(event.target.value)}
          />
          <button className="primary-button" type="submit">
            Save note
          </button>
        </form>
        <div className="log-entry-list">
          {(selectedEmployee.performanceNotes ?? []).map((note) => (
            <article key={note.id} className="log-entry-card">
              <div className="log-entry-header">
                <strong>{note.author}</strong>
                <span>{formatDateShort(new Date(note.createdAt))}</span>
              </div>
              <p>{note.body}</p>
            </article>
          ))}
        </div>
      </article>
    </div>
  );
}

function PeopleOpsPanel({
  viewerRole,
  employeeDirectory,
  leaveRequests,
  shiftSwapRequests,
  currentEmployee,
  leaveForm,
  swapForm,
  onLeaveFormChange,
  onSwapFormChange,
  onSubmitLeaveRequest,
  onSubmitSwapRequest,
  onReviewLeaveRequest,
  onReviewShiftSwap,
}) {
  const swapTargets = Object.values(employeeDirectory).filter((employee) => {
    if (employee.id === currentEmployee.id) {
      return false;
    }

    if (viewerRole === 'manager') {
      return employee.role === 'lifeguard' || employee.role === 'manager';
    }

    return true;
  });

  const visibleSwapRequests = shiftSwapRequests.filter((request) => {
    if (viewerRole === 'admin') {
      return true;
    }

    return request.requesterRole === 'lifeguard' || request.requesterRole === 'manager';
  });

  return (
    <div className="people-ops-stack">
      <div className="settings-layout">
        <article className="dashboard-card">
          <span className="dashboard-eyebrow">Request leave</span>
          <form className="settings-form" onSubmit={onSubmitLeaveRequest}>
            <div className="settings-row">
              <input
                className="text-input"
                type="date"
                value={leaveForm.fromDate}
                onChange={(event) => onLeaveFormChange((current) => ({ ...current, fromDate: event.target.value }))}
              />
              <input
                className="text-input"
                type="date"
                value={leaveForm.toDate}
                onChange={(event) => onLeaveFormChange((current) => ({ ...current, toDate: event.target.value }))}
              />
            </div>
            <textarea
              className="text-input message-textarea"
              placeholder="Reason for leave"
              value={leaveForm.reason}
              onChange={(event) => onLeaveFormChange((current) => ({ ...current, reason: event.target.value }))}
            />
            <button className="primary-button" type="submit">
              Submit leave request
            </button>
          </form>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-eyebrow">Request shift swap</span>
          <form className="settings-form" onSubmit={onSubmitSwapRequest}>
            <select
              className="text-input"
              value={swapForm.targetEmployeeId}
              onChange={(event) => onSwapFormChange((current) => ({ ...current, targetEmployeeId: event.target.value }))}
            >
              <option value="">Choose employee</option>
              {swapTargets.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} · {roleLabels[employee.role]}
                </option>
              ))}
            </select>
            <textarea
              className="text-input message-textarea"
              placeholder="Reason for swap"
              value={swapForm.note}
              onChange={(event) => onSwapFormChange((current) => ({ ...current, note: event.target.value }))}
            />
            <button className="primary-button" type="submit">
              Submit swap request
            </button>
          </form>
        </article>
      </div>

      <div className="section-row">
        <h2>Leave requests</h2>
      </div>
      <div className="incident-grid">
        {leaveRequests.map((request) => (
          <article key={request.id} className="incident-card">
            <div className="message-card-header">
              <strong>{request.employeeName}</strong>
              <span className={`priority-pill ${request.status === 'approved' ? 'normal' : request.status === 'denied' ? 'urgent' : 'important'}`}>
                {request.status}
              </span>
            </div>
            <p>
              {request.fromDate} to {request.toDate}
            </p>
            <p>{request.reason}</p>
            <div className="button-row">
              <button className="secondary-button compact" type="button" onClick={() => onReviewLeaveRequest(request.id, 'approved')}>
                Approve
              </button>
              <button className="ghost-button compact" type="button" onClick={() => onReviewLeaveRequest(request.id, 'denied')}>
                Deny
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="section-row">
        <h2>Shift swaps</h2>
      </div>
      <div className="incident-grid">
        {visibleSwapRequests.map((request) => {
          const requester = employeeDirectory[request.requesterId];
          const target = employeeDirectory[request.targetEmployeeId];

          return (
            <article key={request.id} className="incident-card">
              <div className="message-card-header">
                <strong>{request.requesterName}</strong>
                <span className={`priority-pill ${request.status === 'approved' ? 'normal' : request.status === 'denied' ? 'urgent' : 'important'}`}>
                  {request.status}
                </span>
              </div>
              <p>
                {requester?.role ?? request.requesterRole} to {target?.name ?? request.targetEmployeeName}
              </p>
              <p>{request.note}</p>
              <div className="button-row">
                <button className="secondary-button compact" type="button" onClick={() => onReviewShiftSwap(request.id, 'approved')}>
                  Approve
                </button>
                <button className="ghost-button compact" type="button" onClick={() => onReviewShiftSwap(request.id, 'denied')}>
                  Deny
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ProfileSection({ variant, organizationId, employee, onProfileChange }) {
  const [profile, setProfile] = useState({
    phone: employee.phone ?? '',
    email: employee.email ?? '',
    certifications: employee.certifications ?? '',
    profileNote: employee.profileNote ?? '',
    avatarUrl: employee.avatarUrl ?? '',
    certificationRecords: normalizeCertificationRecords(employee.certificationRecords, employee.role),
    hrDocuments: normalizeDocuments(employee.hrDocuments),
  });
  const [status, setStatus] = useState('');
  const [cameraState, setCameraState] = useState({
    open: false,
    loading: false,
    error: '',
  });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    setProfile({
      phone: employee.phone ?? '',
      email: employee.email ?? '',
      certifications: employee.certifications ?? '',
      profileNote: employee.profileNote ?? '',
      avatarUrl: employee.avatarUrl ?? '',
      certificationRecords: normalizeCertificationRecords(employee.certificationRecords, employee.role),
      hrDocuments: normalizeDocuments(employee.hrDocuments),
    });
  }, [employee]);

  useEffect(() => {
    return () => {
      stopCameraStream(mediaStreamRef);
    };
  }, []);

  const updateProfileField = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const persistProfile = (nextProfile, message) => {
    setProfile(nextProfile);
    if (onProfileChange) {
      onProfileChange(nextProfile);
    } else {
      updateEmployeeInStorage(organizationId, employee.id, nextProfile);
    }
    setStatus(message);
  };

  const handleSaveProfile = (event) => {
    event.preventDefault();
    persistProfile(profile, 'Profile updated.');
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const avatarUrl = typeof reader.result === 'string' ? reader.result : '';
      const nextProfile = {
        ...profile,
        avatarUrl,
      };
      persistProfile(nextProfile, 'Profile photo updated.');
    };
    reader.readAsDataURL(file);
  };

  const handleCertificationDocumentUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextProfile = {
        ...profile,
        hrDocuments: [
          {
            id: `doc-${Date.now()}`,
            name: file.name,
            type: file.type || 'file',
            uploadedAt: new Date().toISOString(),
            url: typeof reader.result === 'string' ? reader.result : '',
          },
          ...(profile.hrDocuments ?? []),
        ],
      };
      persistProfile(nextProfile, 'Certification document uploaded.');
    };
    reader.readAsDataURL(file);
  };

  const handleStartCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState({
        open: false,
        loading: false,
        error: 'Camera access is not available in this browser.',
      });
      return;
    }

    setCameraState({
      open: true,
      loading: true,
      error: '',
    });

    try {
      stopCameraStream(mediaStreamRef);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
        },
        audio: false,
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState({
        open: true,
        loading: false,
        error: '',
      });
    } catch (error) {
      setCameraState({
        open: false,
        loading: false,
        error:
          error?.name === 'NotAllowedError'
            ? 'Camera permission was denied.'
            : 'Unable to access the camera right now.',
      });
    }
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    const avatarUrl = canvas.toDataURL('image/png');

    persistProfile(
      {
        ...profile,
        avatarUrl,
      },
      'Profile photo updated.',
    );
    stopCameraStream(mediaStreamRef);
    setCameraState({
      open: false,
      loading: false,
      error: '',
    });
  };

  const handleCloseCamera = () => {
    stopCameraStream(mediaStreamRef);
    setCameraState({
      open: false,
      loading: false,
      error: '',
    });
  };

  return (
    <section className={variant === 'mobile' ? 'mobile-screen' : 'dashboard-card profile-panel'}>
      {variant === 'mobile' ? (
        <header className="mobile-subheader">
          <h1>Profile</h1>
          <p>Manage your staff details, certifications, and profile picture.</p>
        </header>
      ) : (
        <>
          <span className="dashboard-eyebrow">Profile</span>
          <h2>Your account</h2>
          <p>Update your profile details and upload a photo for your staff ID.</p>
        </>
      )}

      <div className="profile-editor">
        <div className="profile-photo-card">
          {profile.avatarUrl ? (
            <img className="profile-photo" src={profile.avatarUrl} alt={`${employee.name} profile`} />
          ) : (
            <div className="profile-photo-placeholder">{initialsForName(employee.name)}</div>
          )}
          <div className="photo-actions">
            <label className="photo-button">
              Upload photo
              <input type="file" accept="image/*" onChange={handleImageChange} hidden />
            </label>
            <button className="photo-button secondary" type="button" onClick={handleStartCamera}>
              Take picture
            </button>
          </div>
          {cameraState.error ? <p className="message-note">{cameraState.error}</p> : null}
          {cameraState.open ? (
            <div className="camera-panel">
              <video ref={videoRef} className="camera-preview" autoPlay playsInline muted />
              <canvas ref={canvasRef} hidden />
              {cameraState.loading ? <p className="message-note">Requesting camera access...</p> : null}
              <div className="camera-actions">
                <button className="primary-button compact" type="button" onClick={handleCapturePhoto}>
                  Capture
                </button>
                <button className="ghost-button compact" type="button" onClick={handleCloseCamera}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <form className="profile-form" onSubmit={handleSaveProfile}>
          <div className="profile-static">
            <strong>{employee.name}</strong>
            <span>
              {employee.id} · {roleLabels[employee.role]}
            </span>
          </div>
          <input
            className={variant === 'mobile' ? 'dark-input' : 'text-input'}
            type="text"
            placeholder="Phone number"
            value={profile.phone}
            onChange={(event) => updateProfileField('phone', event.target.value)}
          />
          <input
            className={variant === 'mobile' ? 'dark-input' : 'text-input'}
            type="email"
            placeholder="Email"
            value={profile.email}
            onChange={(event) => updateProfileField('email', event.target.value)}
          />
          <input
            className={variant === 'mobile' ? 'dark-input' : 'text-input'}
            type="text"
            placeholder="Certifications"
            value={profile.certifications}
            onChange={(event) => updateProfileField('certifications', event.target.value)}
          />
          <div className="source-chip-list">
            {Object.entries(profile.certificationRecords ?? {}).map(([key, record]) => (
              <div key={key} className="prompt-card">
                <strong>{record.label}</strong>
                <div className="settings-row">
                  <select
                    className={variant === 'mobile' ? 'dark-input' : 'text-input'}
                    value={record.verified ? 'yes' : 'no'}
                    onChange={(event) =>
                      updateProfileField('certificationRecords', {
                        ...profile.certificationRecords,
                        [key]: {
                          ...record,
                          verified: event.target.value === 'yes',
                        },
                      })
                    }
                  >
                    <option value="yes">Verified</option>
                    <option value="no">Needs review</option>
                  </select>
                  <input
                    className={variant === 'mobile' ? 'dark-input' : 'text-input'}
                    type="date"
                    value={record.expiryDate ?? ''}
                    onChange={(event) =>
                      updateProfileField('certificationRecords', {
                        ...profile.certificationRecords,
                        [key]: {
                          ...record,
                          expiryDate: event.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <label className="outline-button file-trigger">
            Upload certification or ID
            <input type="file" accept=".pdf,image/*" onChange={handleCertificationDocumentUpload} hidden />
          </label>
          {(profile.hrDocuments ?? []).length ? (
            <div className="log-entry-list">
              {profile.hrDocuments.slice(0, 4).map((document) => (
                <article key={document.id} className="log-entry-card">
                  <div className="log-entry-header">
                    <strong>{document.name}</strong>
                    <span>{formatDateShort(new Date(document.uploadedAt))}</span>
                  </div>
                  <p>{document.type}</p>
                </article>
              ))}
            </div>
          ) : null}
          <textarea
            className={variant === 'mobile' ? 'dark-input dark-textarea' : 'text-input message-textarea'}
            placeholder="Profile note"
            value={profile.profileNote}
            onChange={(event) => updateProfileField('profileNote', event.target.value)}
          />
          <button className="primary-button compact" type="submit">
            Save profile
          </button>
          {status ? <p className="message-note">{status}</p> : null}
        </form>
      </div>
    </section>
  );
}

function MessagingCenter({
  variant,
  employee,
  participants,
  communications,
  onCommunicationsChange,
  canManageAnnouncements,
}) {
  const [activeMessageTab, setActiveMessageTab] = useState('announcements');
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    body: '',
    priority: 'normal',
  });
  const [directForm, setDirectForm] = useState({
    recipient: '',
    subject: '',
    body: '',
    priority: 'normal',
  });
  const [groupForm, setGroupForm] = useState({
    name: '',
    members: '',
  });
  const [groupMessageForm, setGroupMessageForm] = useState({});

  const allParticipants = Array.from(
    new Set([
      employee.name,
      ...(participants ?? []),
      ...communications.directMessages.flatMap((message) => [message.sender, message.recipient]),
      ...communications.groups.flatMap((group) => group.members),
      ...communications.announcements.map((announcement) => announcement.author),
    ]),
  ).filter(Boolean);

  const personalMessages = communications.directMessages.filter(
    (message) => message.sender === employee.name || message.recipient === employee.name,
  );

  const sendAnnouncement = (event) => {
    event.preventDefault();

    if (!announcementForm.title.trim() || !announcementForm.body.trim()) {
      return;
    }

    onCommunicationsChange({
      ...communications,
      announcements: [
        {
          id: `announcement-${Date.now()}`,
          title: announcementForm.title.trim(),
          body: announcementForm.body.trim(),
          author: employee.name,
          postedAt: formatTimeShort(new Date()),
          priority: announcementForm.priority,
        },
        ...communications.announcements,
      ],
    });

    setAnnouncementForm({
      title: '',
      body: '',
      priority: 'normal',
    });
  };

  const sendDirectMessage = (event) => {
    event.preventDefault();

    if (!directForm.recipient.trim() || !directForm.subject.trim() || !directForm.body.trim()) {
      return;
    }

    onCommunicationsChange({
      ...communications,
      directMessages: [
        {
          id: `dm-${Date.now()}`,
          sender: employee.name,
          recipient: directForm.recipient.trim(),
          subject: directForm.subject.trim(),
          body: directForm.body.trim(),
          sentAt: formatTimeShort(new Date()),
          priority: directForm.priority,
          type: directForm.priority === 'handoff' ? 'handoff' : 'personal',
        },
        ...communications.directMessages,
      ],
    });

    setDirectForm({
      recipient: '',
      subject: '',
      body: '',
      priority: 'normal',
    });
  };

  const createGroup = (event) => {
    event.preventDefault();

    if (!groupForm.name.trim()) {
      return;
    }

    const members = Array.from(
      new Set(
        groupForm.members
          .split(',')
          .map((member) => member.trim())
          .filter(Boolean)
          .concat(employee.name),
      ),
    );

    onCommunicationsChange({
      ...communications,
      groups: [
        {
          id: `group-${Date.now()}`,
          name: groupForm.name.trim(),
          createdBy: employee.name,
          members,
          messages: [],
        },
        ...communications.groups,
      ],
    });

    setGroupForm({
      name: '',
      members: '',
    });
  };

  const sendGroupMessage = (groupId) => {
    const body = groupMessageForm[groupId]?.trim();

    if (!body) {
      return;
    }

    onCommunicationsChange({
      ...communications,
      groups: communications.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              messages: [
                {
                  id: `group-message-${Date.now()}`,
                  sender: employee.name,
                  body,
                  sentAt: formatTimeShort(new Date()),
                  priority: 'normal',
                },
                ...group.messages,
              ],
            }
          : group,
      ),
    });

    setGroupMessageForm((current) => ({
      ...current,
      [groupId]: '',
    }));
  };

  return (
    <section className={variant === 'mobile' ? 'mobile-screen' : 'dashboard-card messaging-panel'}>
      {variant === 'mobile' ? (
        <header className="mobile-subheader">
          <h1>Messages</h1>
          <p>Announcements, direct messages, group chat, and structured shift handoffs.</p>
        </header>
      ) : (
        <>
          <span className="dashboard-eyebrow">Team Communication</span>
          <h2>Messages and announcements</h2>
          <p>Use urgency flags, direct messages, and groups to replace phone-tag and loose handoffs.</p>
        </>
      )}

      <div className="message-tabs">
        {messageTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeMessageTab === tab.id ? 'message-tab active' : 'message-tab'}
            onClick={() => setActiveMessageTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeMessageTab === 'announcements' ? (
        <div className="message-section">
          {canManageAnnouncements ? (
            <form className="message-composer" onSubmit={sendAnnouncement}>
              <input
                className={variant === 'mobile' ? 'dark-input' : 'text-input'}
                type="text"
                placeholder="Announcement title"
                value={announcementForm.title}
                onChange={(event) =>
                  setAnnouncementForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
              <textarea
                className={variant === 'mobile' ? 'dark-input dark-textarea' : 'text-input message-textarea'}
                placeholder="Post an org-wide announcement"
                value={announcementForm.body}
                onChange={(event) =>
                  setAnnouncementForm((current) => ({
                    ...current,
                    body: event.target.value,
                  }))
                }
              />
              <div className="message-composer-row">
                <select
                  className={variant === 'mobile' ? 'dark-input' : 'text-input'}
                  value={announcementForm.priority}
                  onChange={(event) =>
                    setAnnouncementForm((current) => ({
                      ...current,
                      priority: event.target.value,
                    }))
                  }
                >
                  <option value="normal">Normal priority</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
                <button className="primary-button compact" type="submit">
                  Post announcement
                </button>
              </div>
            </form>
          ) : (
            <p className="message-note">Announcements can only be posted by managers and admins.</p>
          )}

          <div className="message-feed">
            {communications.announcements.map((announcement) => (
              <article key={announcement.id} className="message-card">
                <div className="message-card-header">
                  <strong>{announcement.title}</strong>
                  <span className={`priority-pill ${announcement.priority}`}>{announcement.priority}</span>
                </div>
                <p>{announcement.body}</p>
                <small>
                  {announcement.author} · {announcement.postedAt}
                </small>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activeMessageTab === 'direct' ? (
        <div className="message-section">
          <form className="message-composer" onSubmit={sendDirectMessage}>
            <div className="message-composer-row">
              <select
                className={variant === 'mobile' ? 'dark-input' : 'text-input'}
                value={directForm.recipient}
                onChange={(event) =>
                  setDirectForm((current) => ({
                    ...current,
                    recipient: event.target.value,
                  }))
                }
              >
                <option value="">Choose recipient</option>
                {allParticipants
                  .filter((participant) => participant !== employee.name)
                  .map((participant) => (
                    <option key={participant} value={participant}>
                      {participant}
                    </option>
                  ))}
              </select>
              <select
                className={variant === 'mobile' ? 'dark-input' : 'text-input'}
                value={directForm.priority}
                onChange={(event) =>
                  setDirectForm((current) => ({
                    ...current,
                    priority: event.target.value,
                  }))
                }
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent flag</option>
                <option value="handoff">Shift handoff</option>
              </select>
            </div>
            <input
              className={variant === 'mobile' ? 'dark-input' : 'text-input'}
              type="text"
              placeholder="Subject"
              value={directForm.subject}
              onChange={(event) =>
                setDirectForm((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
            />
            <textarea
              className={variant === 'mobile' ? 'dark-input dark-textarea' : 'text-input message-textarea'}
              placeholder="Write your personal message or handoff note"
              value={directForm.body}
              onChange={(event) =>
                setDirectForm((current) => ({
                  ...current,
                  body: event.target.value,
                }))
              }
            />
            <button className="primary-button compact" type="submit">
              Send message
            </button>
          </form>

          <div className="message-feed">
            {personalMessages.map((message) => (
              <article key={message.id} className="message-card">
                <div className="message-card-header">
                  <strong>{message.subject}</strong>
                  <span className={`priority-pill ${message.priority}`}>{message.priority}</span>
                </div>
                <p>{message.body}</p>
                <small>
                  {message.sender} → {message.recipient} · {message.sentAt}
                </small>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activeMessageTab === 'groups' ? (
        <div className="message-section">
          <form className="message-composer" onSubmit={createGroup}>
            <input
              className={variant === 'mobile' ? 'dark-input' : 'text-input'}
              type="text"
              placeholder="Group name"
              value={groupForm.name}
              onChange={(event) =>
                setGroupForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <input
              className={variant === 'mobile' ? 'dark-input' : 'text-input'}
              type="text"
              placeholder="Members, comma separated"
              value={groupForm.members}
              onChange={(event) =>
                setGroupForm((current) => ({
                  ...current,
                  members: event.target.value,
                }))
              }
            />
            <button className="primary-button compact" type="submit">
              Create group
            </button>
          </form>

          <div className="group-list">
            {communications.groups.map((group) => (
              <article key={group.id} className="group-card">
                <div className="message-card-header">
                  <strong>{group.name}</strong>
                  <span className="priority-pill normal">{group.members.length} members</span>
                </div>
                <p>Created by {group.createdBy}</p>
                <small>{group.members.join(', ')}</small>
                <div className="group-messages">
                  {group.messages.map((message) => (
                    <div key={message.id} className="group-message">
                      <strong>{message.sender}</strong>
                      <p>{message.body}</p>
                      <small>{message.sentAt}</small>
                    </div>
                  ))}
                </div>
                <div className="message-composer-row">
                  <input
                    className={variant === 'mobile' ? 'dark-input' : 'text-input'}
                    type="text"
                    placeholder="Send to group"
                    value={groupMessageForm[group.id] ?? ''}
                    onChange={(event) =>
                      setGroupMessageForm((current) => ({
                        ...current,
                        [group.id]: event.target.value,
                      }))
                    }
                  />
                  <button className="secondary-button compact" type="button" onClick={() => sendGroupMessage(group.id)}>
                    Send
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function loadOrganizations() {
  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return seedOrganizations.map(enrichOrganization);
  }

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return seedOrganizations.map(enrichOrganization);
    }
    return mergeSeedOrganizations(parsed);
  } catch {
    return seedOrganizations.map(enrichOrganization);
  }
}

function mergeSeedOrganizations(storedOrganizations) {
  const normalizedStoredOrganizations = storedOrganizations.map(enrichOrganization);
  const existingIds = new Set(normalizedStoredOrganizations.map((organization) => organization.id));
  const missingSeeds = seedOrganizations
    .map(enrichOrganization)
    .filter((organization) => !existingIds.has(organization.id));
  return [...normalizedStoredOrganizations, ...missingSeeds];
}

function buildDefaultThresholds(capacityLimit = 50) {
  return {
    chlorineMin: 1,
    chlorineMax: 3,
    phMin: 7.2,
    phMax: 7.8,
    capacityLimit,
    tempMin: 77,
    tempMax: 82,
  };
}

function buildDefaultMembers(poolName) {
  return [
    {
      id: `pass-${poolName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-1001`,
      passId: `${poolName.split(' ')[0].slice(0, 3).toUpperCase()}-1001`,
      memberName: 'Naomi Bennett',
      status: 'active',
      homePool: poolName,
      lastScannedAt: '8:12 AM',
    },
    {
      id: `pass-${poolName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-1002`,
      passId: `${poolName.split(' ')[0].slice(0, 3).toUpperCase()}-1002`,
      memberName: 'Theo Campbell',
      status: 'active',
      homePool: poolName,
      lastScannedAt: '8:30 AM',
    },
    {
      id: `pass-${poolName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-1003`,
      passId: `${poolName.split(' ')[0].slice(0, 3).toUpperCase()}-1003`,
      memberName: 'Maya Stewart',
      status: 'paused',
      homePool: poolName,
      lastScannedAt: '',
    },
  ];
}

function getRolePayRate(role) {
  if (role === 'manager') {
    return 28;
  }

  if (role === 'admin') {
    return 34;
  }

  return 18;
}

function buildDefaultAvailability(role) {
  const defaultDays = weekDays.reduce((availability, day) => {
    const isWeekend = day === 'Saturday' || day === 'Sunday';
    let enabled = true;
    let start = '06:00';
    let end = '18:00';

    if (role === 'manager') {
      enabled = !isWeekend || day === 'Saturday';
      start = '07:00';
      end = '17:00';
    }

    if (role === 'admin') {
      enabled = !isWeekend;
      start = '08:00';
      end = '17:00';
    }

    availability[day] = { enabled, start, end };
    return availability;
  }, {});

  return defaultDays;
}

function normalizeAvailability(availability, role) {
  const fallback = buildDefaultAvailability(role);

  return weekDays.reduce((normalized, day) => {
    normalized[day] = {
      enabled: availability?.[day]?.enabled ?? fallback[day].enabled,
      start: availability?.[day]?.start ?? fallback[day].start,
      end: availability?.[day]?.end ?? fallback[day].end,
    };
    return normalized;
  }, {});
}

function normalizeAttendanceRecord(record) {
  return {
    ...record,
    orgId: record.orgId ?? '',
    poolId: record.poolId ?? '',
    poolName: record.poolName ?? '',
    clockInTimestamp: record.clockInTimestamp ?? '',
    clockOutTimestamp: record.clockOutTimestamp ?? '',
    clockOutAt: record.clockOutAt ?? '',
    hoursWorked: record.hoursWorked ?? 0,
    status: record.status ?? 'completed',
    dateLabel: record.dateLabel ?? formatDateShort(new Date()),
    breaks: record.breaks ?? [],
    clockEvents: record.clockEvents ?? [],
    lateMinutes: record.lateMinutes ?? 0,
    managerNotificationSent: Boolean(record.managerNotificationSent),
  };
}

function normalizeTimesheet(timesheet) {
  return {
    ...timesheet,
    orgId: timesheet.orgId ?? '',
    employeeId: timesheet.employeeId ?? '',
    employeeName: timesheet.employeeName ?? '',
    employeeRole: timesheet.employeeRole ?? '',
    periodStart: timesheet.periodStart ?? '',
    periodEnd: timesheet.periodEnd ?? '',
    periodLabel: timesheet.periodLabel ?? 'Current pay period',
    periodType: timesheet.periodType ?? 'biweekly',
    totalHours: Number(timesheet.totalHours ?? 0),
    regularHours: Number(timesheet.regularHours ?? timesheet.totalHours ?? 0),
    overtimeHours: Number(timesheet.overtimeHours ?? 0),
    regularPay: Number(timesheet.regularPay ?? timesheet.grossPay ?? 0),
    overtimePay: Number(timesheet.overtimePay ?? 0),
    grossPay: Number(timesheet.grossPay ?? 0),
    grossTotal: Number(timesheet.grossTotal ?? timesheet.grossPay ?? 0),
    hourlyRate: Number(timesheet.hourlyRate ?? 0),
    overtimeThreshold: Number(timesheet.overtimeThreshold ?? 40),
    overtimeMultiplier: Number(timesheet.overtimeMultiplier ?? 1.5),
    bonuses: timesheet.bonuses ?? [],
    deductions: timesheet.deductions ?? [],
    poolBreakdown: timesheet.poolBreakdown ?? [],
    shiftBreakdown: timesheet.shiftBreakdown ?? [],
    status: timesheet.status ?? 'pending',
    reviewer: timesheet.reviewer ?? '',
    reviewedAt: timesheet.reviewedAt ?? '',
    finalizedAt: timesheet.finalizedAt ?? '',
  };
}

function normalizePayrollSettings(payrollSettings) {
  return {
    payPeriod: payrollSettings?.payPeriod === 'weekly' ? 'weekly' : 'biweekly',
  };
}

function buildDefaultCertificationRecords(role) {
  const defaults = {
    cpr: {
      label: 'CPR',
      verified: true,
      expiryDate: formatDateInputOffset(120),
    },
    firstAid: {
      label: 'First Aid',
      verified: true,
      expiryDate: formatDateInputOffset(150),
    },
    lifeguardLicense: {
      label: 'Lifeguard License',
      verified: role === 'lifeguard',
      expiryDate: role === 'lifeguard' ? formatDateInputOffset(45) : formatDateInputOffset(210),
    },
  };

  if (role !== 'lifeguard') {
    defaults.lifeguardLicense.verified = role === 'manager';
  }

  return defaults;
}

function buildDefaultOnboardingChecklist() {
  return [
    { id: 'id-uploaded', label: 'ID uploaded', completed: false, completedAt: '' },
    { id: 'contract-signed', label: 'Contract signed', completed: false, completedAt: '' },
    { id: 'certifications-verified', label: 'Certifications verified', completed: false, completedAt: '' },
    { id: 'first-shift-assigned', label: 'First shift assigned', completed: false, completedAt: '' },
  ];
}

function normalizeCertificationRecords(records, role) {
  const defaults = buildDefaultCertificationRecords(role);
  return Object.entries(defaults).reduce((normalized, [key, value]) => {
    normalized[key] = {
      ...value,
      ...(records?.[key] ?? {}),
    };
    return normalized;
  }, {});
}

function normalizeOnboardingChecklist(checklist) {
  const defaults = buildDefaultOnboardingChecklist();
  return defaults.map((item) => {
    const existing = checklist?.find((entry) => entry.id === item.id);
    return {
      ...item,
      ...(existing ?? {}),
    };
  });
}

function normalizeDocuments(documents) {
  return (documents ?? []).map((document) => ({
    id: document.id ?? `doc-${Math.random().toString(36).slice(2, 8)}`,
    name: document.name ?? 'Document',
    type: document.type ?? 'file',
    uploadedAt: document.uploadedAt ?? new Date().toISOString(),
    url: document.url ?? '',
  }));
}

function normalizePerformanceNotes(notes) {
  return (notes ?? []).map((note) => ({
    id: note.id ?? `note-${Math.random().toString(36).slice(2, 8)}`,
    author: note.author ?? '',
    body: note.body ?? '',
    createdAt: note.createdAt ?? new Date().toISOString(),
  }));
}

function getCertificationAlerts(employees) {
  const now = new Date();
  const warningWindow = new Date(now);
  warningWindow.setDate(warningWindow.getDate() + 30);

  return employees.flatMap((employee) => {
    if (employee.role !== 'lifeguard') {
      return [];
    }

    return ['cpr', 'lifeguardLicense']
      .map((key) => {
        const record = employee.certificationRecords?.[key];
        if (!record?.expiryDate) {
          return null;
        }

        const expiryDate = new Date(record.expiryDate);
        if (Number.isNaN(expiryDate.getTime())) {
          return null;
        }

        if (expiryDate < now) {
          return {
            id: `${employee.id}-${key}-expired`,
            severity: 'red',
            employeeId: employee.id,
            employeeName: employee.name,
            title: `${record.label} expired`,
            message: `${employee.name}'s ${record.label.toLowerCase()} expired on ${record.expiryDate}.`,
          };
        }

        if (expiryDate <= warningWindow) {
          return {
            id: `${employee.id}-${key}-warning`,
            severity: 'yellow',
            employeeId: employee.id,
            employeeName: employee.name,
            title: `${record.label} expiring soon`,
            message: `${employee.name}'s ${record.label.toLowerCase()} expires on ${record.expiryDate}.`,
          };
        }

        return null;
      })
      .filter(Boolean);
  });
}

function normalizeAttendanceNotification(notification) {
  return {
    ...notification,
    orgId: notification.orgId ?? '',
    employeeId: notification.employeeId ?? '',
    employeeName: notification.employeeName ?? '',
    poolId: notification.poolId ?? '',
    poolName: notification.poolName ?? '',
    title: notification.title ?? 'Attendance alert',
    message: notification.message ?? '',
    read: Boolean(notification.read),
    createdAt: notification.createdAt ?? new Date().toISOString(),
  };
}

function normalizeLeaveRequest(request) {
  return {
    ...request,
    status: request.status ?? 'pending',
    reviewer: request.reviewer ?? '',
    reviewedAt: request.reviewedAt ?? '',
  };
}

function normalizeShiftSwapRequest(request) {
  return {
    ...request,
    status: request.status ?? 'pending',
    reviewer: request.reviewer ?? '',
    reviewedAt: request.reviewedAt ?? '',
  };
}

function buildStarterAttendanceRecords(employees, schedules) {
  return Object.values(employees)
    .filter((employee) => employee.role !== 'admin')
    .map((employee, index) => {
      const schedule = findEmployeeSchedule(schedules, employee.id);
      const hasTimedSchedule =
        schedule && schedule.startMinutes !== null && schedule.endMinutes !== null;
      const shiftHours = hasTimedSchedule
        ? (schedule.endMinutes - schedule.startMinutes) / 60
        : employee.role === 'manager'
          ? 8
          : 7.75;

      return normalizeAttendanceRecord({
        id: `attendance-${employee.id}-${index}`,
        employeeId: employee.id,
        employeeName: employee.name,
        role: employee.role,
        shiftId: schedule?.id ?? '',
        shiftLabel: schedule?.shiftLabel ?? '8:00 AM - 4:00 PM',
        poolId: schedule?.poolId ?? employee.assignedPoolId ?? '',
        poolName: schedule?.poolName ?? '',
        clockInAt: '7:58 AM',
        clockInTimestamp: new Date().toISOString(),
        clockOutAt: '3:00 PM',
        clockOutTimestamp: new Date().toISOString(),
        hoursWorked: shiftHours,
        status: 'completed',
        dateLabel: formatDateShort(new Date()),
        breaks: [],
        clockEvents: [],
      });
    });
}

function buildStarterLeaveRequests(employees) {
  const employeeList = Object.values(employees);
  return employeeList.length
    ? [
        normalizeLeaveRequest({
          id: 'leave-1',
          employeeId: employeeList[0].id,
          employeeName: employeeList[0].name,
          role: employeeList[0].role,
          fromDate: formatDateInputOffset(2),
          toDate: formatDateInputOffset(3),
          reason: 'Personal day request',
          status: 'pending',
        }),
      ]
    : [];
}

function buildStarterShiftSwapRequests(employees, schedules) {
  const lifeguards = Object.values(employees).filter((employee) => employee.role === 'lifeguard');
  if (lifeguards.length < 2) {
    return [];
  }

  const requester = lifeguards[0];
  const target = lifeguards[1];
  const requesterSchedule = findEmployeeSchedule(schedules, requester.id);
  const targetSchedule = findEmployeeSchedule(schedules, target.id);

  return [
    normalizeShiftSwapRequest({
      id: 'swap-1',
      requesterId: requester.id,
      requesterName: requester.name,
      requesterRole: requester.role,
      targetEmployeeId: target.id,
      targetEmployeeName: target.name,
      targetRole: target.role,
      requesterShiftId: requesterSchedule?.id ?? '',
      targetShiftId: targetSchedule?.id ?? '',
      note: 'Swap requested for scheduling conflict.',
      status: 'pending',
    }),
  ];
}

function timeToMinutes(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  if (/^\d{1,2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }

  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hours !== 12) {
    hours += 12;
  }

  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

function formatMinutesAsTime(totalMinutes) {
  if (totalMinutes === null || Number.isNaN(totalMinutes)) {
    return '';
  }

  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  let hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${meridiem}`;
}

function parseShiftLabel(shiftLabel) {
  if (!shiftLabel) {
    return { startMinutes: null, endMinutes: null };
  }

  const parts = shiftLabel.split('-').map((part) => part.trim());
  return {
    startMinutes: timeToMinutes(parts[0] ?? ''),
    endMinutes: timeToMinutes(parts[1] ?? ''),
  };
}

function findEmployeeSchedule(schedules, employeeId) {
  const today = weekDays[new Date().getDay()];
  return (
    schedules.find((entry) => entry.employeeId === employeeId && entry.day === today) ??
    schedules.find((entry) => entry.employeeId === employeeId) ??
    null
  );
}

function getShiftAccessState(scheduleEntry) {
  if (!scheduleEntry) {
    return {
      state: 'unassigned',
      canStart: false,
      message: 'No scheduled shift is assigned for today.',
      nextShiftLabel: 'Ask your manager to assign a shift.',
    };
  }

  if (scheduleEntry.overrideActive) {
    return {
      state: 'override',
      canStart: true,
      message: `Manager override active. ${scheduleEntry.overrideReason || 'You may start outside the normal shift window.'}`,
      nextShiftLabel: `${scheduleEntry.day} · ${scheduleEntry.shiftLabel}`,
    };
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const earlyWindow = (scheduleEntry.startMinutes ?? 0) - 15;
  const lateAlertWindow = (scheduleEntry.startMinutes ?? 0) + 10;

  if (scheduleEntry.startMinutes === null || scheduleEntry.endMinutes === null) {
    return {
      state: 'assigned',
      canStart: true,
      message: 'Shift assigned. Start is allowed because this shift has no enforced time window yet.',
      nextShiftLabel: `${scheduleEntry.day} · ${scheduleEntry.shiftLabel}`,
    };
  }

  if (nowMinutes < earlyWindow) {
    return {
      state: 'early',
      canStart: false,
      message: `Too early to start. Shift access opens at ${formatMinutesAsTime(earlyWindow)}.`,
      nextShiftLabel: `${scheduleEntry.day} · ${scheduleEntry.shiftLabel}`,
    };
  }

  if (nowMinutes > (scheduleEntry.startMinutes ?? 0)) {
    return {
      state: nowMinutes > lateAlertWindow ? 'late-alert' : 'grace',
      canStart: true,
      message:
        nowMinutes > lateAlertWindow
          ? 'You can still clock in, but you are more than 10 minutes late and your manager will be notified.'
          : 'You are inside the approved grace window. Clock in now.',
      nextShiftLabel: `${scheduleEntry.day} · ${scheduleEntry.shiftLabel}`,
    };
  }

  return {
    state: 'on-time',
    canStart: true,
    message: 'You are within the approved shift window.',
    nextShiftLabel: `${scheduleEntry.day} · ${scheduleEntry.shiftLabel}`,
  };
}

function getOpenBreak(attendanceRecord) {
  return attendanceRecord?.breaks?.find((entry) => !entry.endTimestamp) ?? null;
}

function getBreakMinutes(attendanceRecord) {
  return (attendanceRecord.breaks ?? []).reduce((totalMinutes, entry) => {
    if (!entry.startTimestamp || !entry.endTimestamp) {
      return totalMinutes;
    }

    const start = new Date(entry.startTimestamp).getTime();
    const end = new Date(entry.endTimestamp).getTime();
    return totalMinutes + Math.max((end - start) / 60000, 0);
  }, 0);
}

function calculateAttendanceHours(record) {
  if (!record.clockInTimestamp || !record.clockOutTimestamp) {
    return Number(record.hoursWorked ?? 0);
  }

  const start = new Date(record.clockInTimestamp).getTime();
  const end = new Date(record.clockOutTimestamp).getTime();
  const grossMinutes = Math.max((end - start) / 60000, 0);
  const netMinutes = Math.max(grossMinutes - getBreakMinutes(record), 0);
  return Number((netMinutes / 60).toFixed(2));
}

function finalizeAttendanceRecord(record, now, locationState) {
  const nextRecord = {
    ...record,
    clockOutAt: formatTimeShort(now),
    clockOutTimestamp: now.toISOString(),
    status: 'completed',
    clockEvents: [
      ...(record.clockEvents ?? []),
      {
        id: `clock-event-${Date.now()}`,
        type: 'clock-out',
        timestamp: now.toISOString(),
        timeLabel: formatTimeShort(now),
        latitude: locationState.latitude,
        longitude: locationState.longitude,
        employeeId: record.employeeId,
        orgId: record.orgId,
        poolId: record.poolId,
      },
    ],
  };

  return {
    ...nextRecord,
    hoursWorked: calculateAttendanceHours(nextRecord),
  };
}

function getCurrentPayPeriodRange(baseDate = new Date()) {
  const end = new Date(baseDate);
  end.setHours(23, 59, 59, 999);
  const start = new Date(baseDate);
  start.setDate(start.getDate() - 13);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function getPayPeriodRange(payPeriod = 'biweekly', baseDate = new Date()) {
  const end = new Date(baseDate);
  end.setHours(23, 59, 59, 999);
  const start = new Date(baseDate);
  start.setDate(start.getDate() - (payPeriod === 'weekly' ? 6 : 13));
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function calculateTimesheetPay({
  totalHours,
  hourlyRate,
  overtimeThreshold,
  overtimeMultiplier,
  bonuses = [],
  deductions = [],
}) {
  const regularHours = Math.min(totalHours, overtimeThreshold);
  const overtimeHours = Math.max(totalHours - overtimeThreshold, 0);
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * overtimeMultiplier;
  const bonusTotal = bonuses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const deductionTotal = deductions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const grossPay = regularPay + overtimePay;

  return {
    regularHours: Number(regularHours.toFixed(2)),
    overtimeHours: Number(overtimeHours.toFixed(2)),
    regularPay: Number(regularPay.toFixed(2)),
    overtimePay: Number(overtimePay.toFixed(2)),
    grossPay: Number(grossPay.toFixed(2)),
    grossTotal: Number((grossPay + bonusTotal - deductionTotal).toFixed(2)),
  };
}

function buildTimesheetsFromAttendance(
  attendanceRecords,
  employeeDirectory,
  organizationId = '',
  payrollSettings = { payPeriod: 'biweekly' },
) {
  const { start, end } = getPayPeriodRange(payrollSettings?.payPeriod ?? 'biweekly');
  const startIso = formatIsoDate(start);
  const endIso = formatIsoDate(end);
  const periodLabel = `${formatDateShort(start)} - ${formatDateShort(end)}`;
  const recordsInPeriod = attendanceRecords.filter((record) => {
    if (!record.clockInTimestamp) {
      return false;
    }
    const clockIn = new Date(record.clockInTimestamp);
    return clockIn >= start && clockIn <= end;
  });

  return Object.values(employeeDirectory).map((employee) => {
    const employeeRecords = recordsInPeriod.filter((record) => record.employeeId === employee.id);
    const shiftBreakdown = employeeRecords.map((record) => ({
      id: record.id,
      poolId: record.poolId,
      poolName: record.poolName,
      shiftLabel: record.shiftLabel,
      dateLabel: record.dateLabel,
      hoursWorked: calculateAttendanceHours(record),
      status: record.status,
    }));
    const poolBreakdown = shiftBreakdown.reduce((accumulator, shift) => {
      const existing = accumulator.find((entry) => entry.poolId === shift.poolId);
      if (existing) {
        existing.hours += shift.hoursWorked;
        return accumulator;
      }

      accumulator.push({
        poolId: shift.poolId,
        poolName: shift.poolName,
        hours: shift.hoursWorked,
      });
      return accumulator;
    }, []);
    const totalHours = shiftBreakdown.reduce((sum, shift) => sum + shift.hoursWorked, 0);
    const payRate = employee.payRate ?? getRolePayRate(employee.role);
    const overtimeThreshold = Number(employee.overtimeThreshold ?? 40);
    const overtimeMultiplier = Number(employee.overtimeMultiplier ?? 1.5);
    const paySummary = calculateTimesheetPay({
      totalHours,
      hourlyRate: payRate,
      overtimeThreshold,
      overtimeMultiplier,
    });

    return normalizeTimesheet({
      id: `timesheet-${employee.id}-${startIso}-${endIso}`,
      orgId: organizationId || employee.orgId || employeeRecords[0]?.orgId || '',
      employeeId: employee.id,
      employeeName: employee.name,
      employeeRole: employee.role,
      periodStart: startIso,
      periodEnd: endIso,
      periodLabel,
      periodType: payrollSettings?.payPeriod ?? 'biweekly',
      totalHours: Number(totalHours.toFixed(2)),
      hourlyRate: payRate,
      overtimeThreshold,
      overtimeMultiplier,
      regularHours: paySummary.regularHours,
      overtimeHours: paySummary.overtimeHours,
      regularPay: paySummary.regularPay,
      overtimePay: paySummary.overtimePay,
      grossPay: paySummary.grossPay,
      grossTotal: paySummary.grossTotal,
      bonuses: [],
      deductions: [],
      poolBreakdown,
      shiftBreakdown,
      status: 'pending',
    });
  });
}

function mergeTimesheetsFromAttendance(
  existingTimesheets,
  attendanceRecords,
  employeeDirectory,
  organizationId = '',
  payrollSettings = { payPeriod: 'biweekly' },
) {
  const rebuiltTimesheets = buildTimesheetsFromAttendance(
    attendanceRecords,
    employeeDirectory,
    organizationId,
    payrollSettings,
  );
  const existingById = new Map(existingTimesheets.map((timesheet) => [timesheet.id, normalizeTimesheet(timesheet)]));

  return rebuiltTimesheets.map((timesheet) => {
    const existing = existingById.get(timesheet.id);
    if (!existing) {
      return timesheet;
    }

    const paySummary = calculateTimesheetPay({
      totalHours: timesheet.totalHours,
      hourlyRate: timesheet.hourlyRate,
      overtimeThreshold: timesheet.overtimeThreshold,
      overtimeMultiplier: timesheet.overtimeMultiplier,
      bonuses: existing.bonuses,
      deductions: existing.deductions,
    });

    return normalizeTimesheet({
      ...timesheet,
      bonuses: existing.bonuses,
      deductions: existing.deductions,
      status: existing.status,
      reviewer: existing.reviewer,
      reviewedAt: existing.reviewedAt,
      finalizedAt: existing.finalizedAt,
      regularHours: paySummary.regularHours,
      overtimeHours: paySummary.overtimeHours,
      regularPay: paySummary.regularPay,
      overtimePay: paySummary.overtimePay,
      grossPay: paySummary.grossPay,
      grossTotal: paySummary.grossTotal,
    });
  });
}

function buildEmployeeTimesheetHistory(employee, attendanceRecords, payPeriod = 'biweekly', organizationId = '') {
  return Array.from({ length: 4 }, (_, index) => {
    const baseDate = new Date();
    const offsetDays = (payPeriod === 'weekly' ? 7 : 14) * index;
    baseDate.setDate(baseDate.getDate() - offsetDays);
    const { start, end } = getPayPeriodRange(payPeriod, baseDate);
    const startIso = formatIsoDate(start);
    const endIso = formatIsoDate(end);
    const periodLabel = `${formatDateShort(start)} - ${formatDateShort(end)}`;
    const employeeRecords = attendanceRecords
      .filter((record) => record.employeeId === employee.id && record.clockInTimestamp)
      .filter((record) => {
        const clockIn = new Date(record.clockInTimestamp);
        return clockIn >= start && clockIn <= end;
      });
    const shiftBreakdown = employeeRecords.map((record) => ({
      id: record.id,
      poolId: record.poolId,
      poolName: record.poolName,
      shiftLabel: record.shiftLabel,
      dateLabel: record.dateLabel,
      hoursWorked: calculateAttendanceHours(record),
      status: record.status,
    }));
    const poolBreakdown = shiftBreakdown.reduce((accumulator, shift) => {
      const existing = accumulator.find((entry) => entry.poolId === shift.poolId);
      if (existing) {
        existing.hours += shift.hoursWorked;
        return accumulator;
      }
      accumulator.push({
        poolId: shift.poolId,
        poolName: shift.poolName,
        hours: shift.hoursWorked,
      });
      return accumulator;
    }, []);
    const totalHours = shiftBreakdown.reduce((sum, shift) => sum + shift.hoursWorked, 0);
    const paySummary = calculateTimesheetPay({
      totalHours,
      hourlyRate: employee.payRate ?? getRolePayRate(employee.role),
      overtimeThreshold: employee.overtimeThreshold ?? 40,
      overtimeMultiplier: employee.overtimeMultiplier ?? 1.5,
    });

    return {
      include: index === 0 || totalHours > 0,
      timesheet: normalizeTimesheet({
      id: `timesheet-${employee.id}-${startIso}-${endIso}`,
      orgId: organizationId,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeRole: employee.role,
      periodStart: startIso,
      periodEnd: endIso,
      periodLabel,
      periodType: payPeriod,
      totalHours: Number(totalHours.toFixed(2)),
      hourlyRate: employee.payRate ?? getRolePayRate(employee.role),
      overtimeThreshold: employee.overtimeThreshold ?? 40,
      overtimeMultiplier: employee.overtimeMultiplier ?? 1.5,
      regularHours: paySummary.regularHours,
      overtimeHours: paySummary.overtimeHours,
      regularPay: paySummary.regularPay,
      overtimePay: paySummary.overtimePay,
      grossPay: paySummary.grossPay,
      grossTotal: paySummary.grossTotal,
      poolBreakdown,
      shiftBreakdown,
      status: index === 0 ? 'current' : 'archived',
      }),
    };
  })
    .filter((entry) => entry.include)
    .map((entry) => entry.timesheet);
}

function buildPayrollRows(employeeDirectory, timesheets, scope, viewerId) {
  return Object.values(employeeDirectory)
    .filter((employee) => {
      if (scope === 'manager') {
        return employee.role === 'lifeguard' || employee.id === viewerId;
      }

      return true;
    })
    .map((employee) => {
      const employeeTimesheet =
        timesheets.find(
          (timesheet) =>
            timesheet.employeeId === employee.id &&
            (timesheet.status === 'approved' || timesheet.status === 'finalized'),
        ) ??
        timesheets.find((timesheet) => timesheet.employeeId === employee.id) ??
        null;

      if (!employeeTimesheet) {
        return {
          employeeId: employee.id,
          employeeName: employee.name,
          role: employee.role,
          regularHours: 0,
          overtimeHours: 0,
          regularPay: 0,
          overtimePay: 0,
          grossTotal: 0,
          timesheet: null,
        };
      }

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        role: employee.role,
        regularHours: employeeTimesheet.regularHours,
        overtimeHours: employeeTimesheet.overtimeHours,
        regularPay: employeeTimesheet.regularPay,
        overtimePay: employeeTimesheet.overtimePay,
        grossTotal: employeeTimesheet.grossTotal,
        timesheet: employeeTimesheet,
      };
    });
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function exportPayrollRowsToCsv(payrollRows, organizationName, periodLabel) {
  const lines = [
    ['Organization', organizationName],
    ['Pay Period', periodLabel],
    [],
    ['Employee Name', 'Regular Hours', 'Overtime Hours', 'Regular Pay', 'Overtime Pay', 'Gross Total'],
    ...payrollRows.map((row) => [
      row.employeeName,
      row.regularHours.toFixed(2),
      row.overtimeHours.toFixed(2),
      row.regularPay.toFixed(2),
      row.overtimePay.toFixed(2),
      row.grossTotal.toFixed(2),
    ]),
  ];
  const csv = lines
    .map((line) =>
      line
        .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n');

  downloadTextFile(`aquaguard-payroll-${slugify(periodLabel)}.csv`, csv, 'text/csv;charset=utf-8;');
}

function exportPayStubPdfLike(timesheet, employeeName, organizationName) {
  const payStubHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${employeeName} Pay Stub</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; color: #103746; }
      h1, h2 { margin: 0 0 8px; }
      .section { margin-top: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #cfe4ee; padding: 10px; text-align: left; }
      th { background: #eef8fc; }
      .totals { margin-top: 20px; font-size: 16px; }
    </style>
  </head>
  <body>
    <h1>${organizationName}</h1>
    <h2>Payroll Stub</h2>
    <div class="section">
      <strong>Employee:</strong> ${employeeName}<br />
      <strong>Period:</strong> ${timesheet.periodLabel}<br />
      <strong>Status:</strong> ${timesheet.status}
    </div>
    <table>
      <thead>
        <tr>
          <th>Regular Hours</th>
          <th>Overtime Hours</th>
          <th>Regular Pay</th>
          <th>Overtime Pay</th>
          <th>Gross Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${timesheet.regularHours.toFixed(2)}</td>
          <td>${timesheet.overtimeHours.toFixed(2)}</td>
          <td>$${timesheet.regularPay.toFixed(2)}</td>
          <td>$${timesheet.overtimePay.toFixed(2)}</td>
          <td>$${timesheet.grossTotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
    <div class="section">
      <strong>Pool Breakdown</strong>
      <table>
        <thead>
          <tr><th>Pool</th><th>Hours</th></tr>
        </thead>
        <tbody>
          ${timesheet.poolBreakdown
            .map((pool) => `<tr><td>${pool.poolName}</td><td>${Number(pool.hours).toFixed(2)}</td></tr>`)
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="totals">Generated by AquaGuard for payroll export only.</div>
  </body>
</html>`;
  const pdfWindow = window.open('', '_blank', 'width=900,height=700');
  if (!pdfWindow) {
    return;
  }
  pdfWindow.document.write(payStubHtml);
  pdfWindow.document.close();
  pdfWindow.focus();
  pdfWindow.print();
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function extractStatusMetric(pool, label) {
  const card = pool.statusCards.find((entry) => entry.label === label);
  if (!card) {
    return null;
  }

  const raw = String(card.value);
  if (label === 'Capacity') {
    const [current] = raw.split('/');
    return Number.parseFloat(current);
  }

  return Number.parseFloat(raw.replace(/[^0-9.]/g, ''));
}

function buildAlertRecord({ pool, type, title, message, severity, source, escalateAfterMinutes }) {
  return {
    id: `${pool.id}-${type}`,
    poolId: pool.id,
    poolName: pool.name,
    type,
    title,
    message,
    severity,
    source,
    status: 'open',
    createdAt: formatTimeShort(new Date()),
    escalateAfterMinutes,
    acknowledgedAt: '',
    acknowledgedBy: '',
  };
}

function buildPoolAlerts(pool) {
  const thresholds = pool.thresholds ?? buildDefaultThresholds();
  const alerts = [];
  const chlorine = extractStatusMetric(pool, 'Free chlorine');
  const ph = extractStatusMetric(pool, 'pH level');
  const capacity = extractStatusMetric(pool, 'Capacity');
  const temperature = extractStatusMetric(pool, 'Water temp');

  if (chlorine !== null) {
    if (chlorine < thresholds.chlorineMin) {
      alerts.push(
        buildAlertRecord({
          pool,
          type: 'chlorine-low',
          title: 'Free chlorine below range',
          message: `Reading ${chlorine} ppm. Raise sanitizer and retest before heavy patron load.`,
          severity: 'orange',
          source: 'chemistry scan',
          escalateAfterMinutes: 10,
        }),
      );
    } else if (chlorine > thresholds.chlorineMax) {
      alerts.push(
        buildAlertRecord({
          pool,
          type: 'chlorine-high',
          title: 'Free chlorine elevated',
          message: `Reading ${chlorine} ppm. Confirm dosing and monitor swimmer exposure.`,
          severity: 'yellow',
          source: 'chemistry scan',
          escalateAfterMinutes: 15,
        }),
      );
    }
  }

  if (ph !== null) {
    if (ph > thresholds.phMax + 0.2 || ph < thresholds.phMin - 0.2) {
      alerts.push(
        buildAlertRecord({
          pool,
          type: 'ph-critical',
          title: 'pH outside safe band',
          message: `Reading ${ph}. Consider closure if retest confirms the value.`,
          severity: 'red',
          source: 'chemistry scan',
          escalateAfterMinutes: 5,
        }),
      );
    } else if (ph > thresholds.phMax || ph < thresholds.phMin) {
      alerts.push(
        buildAlertRecord({
          pool,
          type: 'ph-warning',
          title: 'pH drifting out of range',
          message: `Reading ${ph}. Correct gradually and log the adjustment.`,
          severity: 'yellow',
          source: 'chemistry scan',
          escalateAfterMinutes: 10,
        }),
      );
    }
  }

  if (capacity !== null && capacity >= thresholds.capacityLimit) {
    alerts.push(
      buildAlertRecord({
        pool,
        type: 'capacity-full',
        title: 'Pool at capacity',
        message: `${Math.round(capacity)}/${thresholds.capacityLimit} guests. Pause check-ins until capacity drops.`,
        severity: 'orange',
        source: 'member verification',
        escalateAfterMinutes: 0,
      }),
    );
  }

  if (temperature !== null && (temperature < thresholds.tempMin || temperature > thresholds.tempMax)) {
    alerts.push(
      buildAlertRecord({
        pool,
        type: 'temperature-out',
        title: 'Water temperature out of target range',
        message: `Current water temperature is ${temperature}°F.`,
        severity: 'yellow',
        source: 'pool systems',
        escalateAfterMinutes: 20,
      }),
    );
  }

  return alerts;
}

function normalizeAlert(existingAlert) {
  return {
    ...existingAlert,
    status: existingAlert.status ?? 'open',
    createdAt: existingAlert.createdAt ?? formatTimeShort(new Date()),
    acknowledgedAt: existingAlert.acknowledgedAt ?? '',
    acknowledgedBy: existingAlert.acknowledgedBy ?? '',
    escalateAfterMinutes: existingAlert.escalateAfterMinutes ?? 10,
  };
}

function mergeDerivedAlerts(pools, alerts) {
  const priorAlerts = (alerts ?? []).map(normalizeAlert);
  const priorById = new Map(priorAlerts.map((alert) => [alert.id, alert]));
  const derivedAlerts = pools.flatMap((pool) => buildPoolAlerts(pool));

  return derivedAlerts.map((alert) => {
    const prior = priorById.get(alert.id);
    return prior
      ? {
          ...alert,
          status: prior.status,
          createdAt: prior.createdAt,
          acknowledgedAt: prior.acknowledgedAt,
          acknowledgedBy: prior.acknowledgedBy,
        }
      : alert;
  });
}

function summarizeAlertForPool(alert) {
  return {
    id: alert.id,
    title: alert.title,
    message: alert.message,
    meta: `${alert.createdAt} · ${alert.source}`,
    kind:
      alert.severity === 'red'
        ? 'danger'
        : alert.severity === 'orange'
          ? 'warning'
          : alert.severity === 'yellow'
            ? 'info'
            : 'success',
    icon:
      alert.severity === 'red'
        ? '!'
        : alert.severity === 'orange'
          ? '!'
          : alert.severity === 'yellow'
            ? 'i'
            : '✓',
  };
}

function normalizeIncident(incident) {
  return {
    ...incident,
    status: incident.status ?? 'open',
    reportedAt: incident.reportedAt ?? formatTimeShort(new Date()),
    photo: incident.photo ?? '',
    reviewer: incident.reviewer ?? '',
    reviewedAt: incident.reviewedAt ?? '',
  };
}

function normalizeMemberPass(pass) {
  return {
    ...pass,
    status: pass.status ?? 'active',
    lastScannedAt: pass.lastScannedAt ?? '',
  };
}

function enrichOrganization(organization) {
  const poolCount = Number.parseInt(organization.poolCount, 10);
  const normalizedPoolCount = Number.isNaN(poolCount) ? organization.pools?.length || 2 : poolCount;
  const pools = (organization.pools?.length
    ? organization.pools
    : buildStarterPools(organization.name, normalizedPoolCount)
  ).map(normalizePool);
  const employeeCount = Object.keys(organization.employees ?? {}).length;
  const employees =
    employeeCount > 0
      ? normalizeEmployees(organization.employees, pools, organization.name)
      : buildStarterEmployees(
          organization.adminName || 'Admin User',
          organization.name || 'AquaGuard Organization',
          normalizedPoolCount,
          pools,
        );
  const schedules = organization.schedules?.length
    ? organization.schedules.map((entry) =>
        normalizeScheduleEntry({
          ...entry,
          orgId: entry.orgId ?? organization.id,
        }),
      )
      : buildStarterSchedules(organization.name, employees, pools).map((entry) => ({
        ...entry,
        orgId: organization.id,
      }));
  const payrollSettings = normalizePayrollSettings(organization.payrollSettings);
  const attendanceRecords = (organization.attendanceRecords?.length
    ? organization.attendanceRecords
    : buildStarterAttendanceRecords(
        employees,
        schedules,
      )).map((record) => normalizeAttendanceRecord({ ...record, orgId: record.orgId ?? organization.id }));
  const timesheets = (organization.timesheets?.length
    ? organization.timesheets
    : buildTimesheetsFromAttendance(attendanceRecords, employees, organization.id, payrollSettings)).map((timesheet) =>
      normalizeTimesheet({ ...timesheet, orgId: timesheet.orgId ?? organization.id }),
    );

  return {
    ...organization,
    poolCount: normalizedPoolCount,
    pools,
    employees,
    schedules,
    payrollSettings,
    communications: normalizeCommunications(
      organization.communications ?? buildStarterCommunications(organization.name),
    ),
    alerts: mergeDerivedAlerts(pools, organization.alerts ?? []),
    incidents: (organization.incidents ?? []).map(normalizeIncident),
    memberPasses: (organization.memberPasses?.length
      ? organization.memberPasses
      : pools.flatMap((pool) => buildDefaultMembers(pool.name))).map(normalizeMemberPass),
    attendanceRecords,
    timesheets,
    attendanceNotifications: (organization.attendanceNotifications ?? []).map((notification) =>
      normalizeAttendanceNotification({ ...notification, orgId: notification.orgId ?? organization.id }),
    ),
    leaveRequests: (organization.leaveRequests ?? buildStarterLeaveRequests(employees))
      .map((request) => normalizeLeaveRequest({ ...request, orgId: request.orgId ?? organization.id })),
    shiftSwapRequests: (
      organization.shiftSwapRequests ??
      buildStarterShiftSwapRequests(
        employees,
        schedules,
      )
    ).map((request) => normalizeShiftSwapRequest({ ...request, orgId: request.orgId ?? organization.id })),
  };
}

function buildOrgCode(name, organizations) {
  const letters = name.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
  let suffix = 100 + organizations.length;
  let nextCode = `${letters}-${suffix}`;

  while (organizations.some((organization) => organization.code === nextCode)) {
    suffix += 1;
    nextCode = `${letters}-${suffix}`;
  }

  return nextCode;
}

function buildStarterPools(organizationName, requestedPoolCount) {
  const normalizedCount = Number.isNaN(requestedPoolCount)
    ? 2
    : Math.max(2, Math.min(requestedPoolCount, 6));
  const prefix = organizationName.split(' ')[0] || 'AquaGuard';
  const extraPools = [
    {
      id: 'operations-annex',
      name: `${prefix} Operations Annex`,
      subtitle: `${prefix} campus west`,
      zoneLabel: 'Support basin',
      type: 'Indoor',
      geofenced: false,
      radiusMeters: 0,
      statusCards: [
        { label: 'Free chlorine', value: '2.3', note: 'ppm · normal', tone: 'ok' },
        { label: 'pH level', value: '7.4', note: 'balanced', tone: 'ok' },
        { label: 'Capacity', value: '21/40', note: 'steady traffic', tone: 'ok' },
        { label: 'Water temp', value: '79°', note: 'F · normal', tone: 'ok' },
      ],
      recentAlerts: [],
      shiftLogs: buildSeedShiftLogs('Operations Lead'),
      checklist: buildChecklist('Operations Lead', true),
      lastLoggedBy: 'Operations Lead',
      lastLogTime: '8:05 AM',
      lastUpdatedLabel: '12 min ago',
      latitude: null,
      longitude: null,
    },
    {
      id: 'riverside-training-pool',
      name: `${prefix} Riverside Pool`,
      subtitle: `${prefix} east service area`,
      zoneLabel: 'Lane 2',
      type: 'Outdoor',
      geofenced: false,
      radiusMeters: 0,
      statusCards: [
        { label: 'Free chlorine', value: '2.6', note: 'ppm · within range', tone: 'ok' },
        { label: 'pH level', value: '7.6', note: 'top of range', tone: 'warn' },
        { label: 'Capacity', value: '17/35', note: '49% full', tone: 'ok' },
        { label: 'Water temp', value: '80°', note: 'F · normal', tone: 'ok' },
      ],
      recentAlerts: [
        {
          id: 'alert-riverside-1',
          title: 'Filter rinse due',
          message: 'Routine rinse recommended during next maintenance block',
          meta: '25 min ago · system reminder',
          kind: 'info',
          icon: 'i',
        },
      ],
      shiftLogs: buildSeedShiftLogs('A. Rivera'),
      checklist: buildChecklist('A. Rivera', false),
      lastLoggedBy: 'A. Rivera',
      lastLogTime: '8:44 AM',
      lastUpdatedLabel: '18 min ago',
      latitude: null,
      longitude: null,
    },
  ];

  const seededRealPools = realPoolLocations.map((pool, index) => ({
    ...pool,
    type: index === 0 ? 'Outdoor' : 'Community',
    statusCards:
      index === 0
        ? [
            { label: 'Free chlorine', value: '2.4', note: 'ppm · within range', tone: 'ok' },
            { label: 'pH level', value: '7.8', note: 'slightly high', tone: 'warn' },
            { label: 'Capacity', value: '34/50', note: '68% full', tone: 'ok' },
            { label: 'Water temp', value: '78°', note: 'F · normal', tone: 'ok' },
          ]
        : [
            { label: 'Free chlorine', value: '2.1', note: 'ppm · stable', tone: 'ok' },
            { label: 'pH level', value: '7.5', note: 'balanced', tone: 'ok' },
            { label: 'Capacity', value: '19/45', note: '42% full', tone: 'ok' },
            { label: 'Water temp', value: '79°', note: 'F · normal', tone: 'ok' },
          ],
    recentAlerts:
      index === 0
        ? [
            {
              id: 'alert-ph',
              title: 'pH level elevated',
              message: 'Add 12oz pH decreaser to main pool',
              meta: '8 min ago · auto-detected',
              kind: 'warning',
              icon: '!',
            },
            {
              id: 'alert-manager',
              title: 'Manager message',
              message: 'Break at 10:30 AM — cover from Lane 2',
              meta: '22 min ago · M. Thompson',
              kind: 'info',
              icon: 'i',
            },
            {
              id: 'alert-handoff',
              title: 'Shift handoff complete',
              message: 'Notes received from A. Rivera',
              meta: '1 hr ago',
              kind: 'success',
              icon: '✓',
            },
          ]
        : [
            {
              id: 'alert-kintyre-1',
              title: 'Community gate checked',
              message: 'Perimeter inspection logged at the Kintyre entrance',
              meta: '14 min ago · staff update',
              kind: 'success',
              icon: '✓',
            },
          ],
    shiftLogs: buildSeedShiftLogs(index === 0 ? 'A. Rivera' : 'K. Smith'),
    checklist: buildChecklist(index === 0 ? 'A. Rivera' : 'K. Smith', index === 1),
    lastLoggedBy: index === 0 ? 'A. Rivera' : 'K. Smith',
    lastLogTime: index === 0 ? '8:52 AM' : '9:02 AM',
    lastUpdatedLabel: index === 0 ? '12 min ago' : '9 min ago',
  }));

  return [...seededRealPools, ...extraPools].slice(0, normalizedCount);
}

function normalizePool(pool) {
  return {
    ...pool,
    checklist: (pool.checklist ?? buildChecklist('A. Rivera', false)).map((item, index) => ({
      id: item.id ?? `check-${index + 1}`,
      label: item.label,
      completed: Boolean(item.completed),
      completedBy: item.completedBy ?? '',
      completedAt: item.completedAt ?? '',
    })),
    shiftLogs: (pool.shiftLogs ?? []).map((entry, index) => ({
      id: entry.id ?? `log-${index + 1}`,
      title: entry.title,
      details: entry.details,
      author: entry.author,
      timeLabel: entry.timeLabel,
    })),
    recentAlerts: pool.recentAlerts ?? [],
    statusCards: pool.statusCards ?? [],
    geofenced: Boolean(pool.geofenced),
    radiusMeters: pool.radiusMeters ?? 0,
    latitude: pool.latitude ?? null,
    longitude: pool.longitude ?? null,
    thresholds: {
      ...buildDefaultThresholds(),
      ...(pool.thresholds ?? {}),
    },
    checklistTemplate:
      pool.checklistTemplate?.length
        ? pool.checklistTemplate
        : (pool.checklist ?? buildChecklist('A. Rivera', false)).map((item) => item.label),
  };
}

function buildChecklist(authorName, mostlyComplete) {
  return masterChecklist.map((label, index) => {
    const completed = mostlyComplete ? index < 8 : index < 7;
    return {
      id: `check-${index + 1}`,
      label,
      completed,
      completedBy: completed ? authorName : '',
      completedAt: completed ? `${8 + Math.floor(index / 2)}:${(index % 2) * 8 + 5} AM` : '',
    };
  });
}

function buildSeedShiftLogs(authorName) {
  return [
    {
      id: 'log-1',
      title: 'pH adjusted',
      details: 'Added 8oz pH decreaser to main drain. Reading was 7.9, now 7.5.',
      author: authorName,
      timeLabel: '9:15 AM',
    },
    {
      id: 'log-2',
      title: 'Patron incident',
      details: 'Minor slip near lane 2 exit. No injury, area dried and coned off.',
      author: authorName,
      timeLabel: '8:44 AM',
    },
    {
      id: 'log-3',
      title: 'Opening check complete',
      details: 'All systems normal. Chlorine 2.4ppm, pH 7.9.',
      author: authorName,
      timeLabel: '8:05 AM',
    },
  ];
}

function buildStarterEmployees(adminName, organizationName, poolCountValue, pools) {
  const normalizedPoolCount = Number.isNaN(poolCountValue) ? pools.length : poolCountValue;
  const primaryPool = pools[0];

  return {
    'LG-6001': {
      id: 'LG-6001',
      name: adminName,
      role: 'lifeguard',
      schedule: `${primaryPool?.name ?? organizationName} 8am-4pm today`,
      assignedPoolId: primaryPool?.id ?? 'rex-nettleford-hall',
      email: 'staff@aquaguardops.com',
      emergencyContact: {
        name: 'Jamie Smith',
        phone: '(876) 555-0121',
        relationship: 'Sibling',
      },
      startDate: formatDateInputOffset(-21),
      payRate: getRolePayRate('lifeguard'),
      overtimeThreshold: 40,
      overtimeMultiplier: 1.5,
      employmentType: 'seasonal',
      certificationRecords: buildDefaultCertificationRecords('lifeguard'),
      hrDocuments: [],
      onboardingChecklist: buildDefaultOnboardingChecklist(),
      performanceNotes: [],
      availability: buildDefaultAvailability('lifeguard'),
    },
    'MG-7001': {
      id: 'MG-7001',
      name: adminName,
      role: 'manager',
      schedule:
        normalizedPoolCount > 0
          ? `Managing ${normalizedPoolCount} pool${normalizedPoolCount === 1 ? '' : 's'} today`
          : 'All pools visible today',
      email: 'manager@aquaguardops.com',
      emergencyContact: {
        name: 'Kelly Smith',
        phone: '(876) 555-0122',
        relationship: 'Partner',
      },
      startDate: formatDateInputOffset(-180),
      payRate: getRolePayRate('manager'),
      overtimeThreshold: 40,
      overtimeMultiplier: 1.5,
      employmentType: 'full-time',
      certificationRecords: buildDefaultCertificationRecords('manager'),
      hrDocuments: [],
      onboardingChecklist: buildDefaultOnboardingChecklist().map((item) => ({
        ...item,
        completed: true,
        completedAt: formatDateShort(new Date()),
      })),
      performanceNotes: [],
      availability: buildDefaultAvailability('manager'),
    },
    'AD-9001': {
      id: 'AD-9001',
      name: adminName,
      role: 'admin',
      schedule: 'Full organization access today',
      email: 'admin@aquaguardops.com',
      emergencyContact: {
        name: 'Jordan Chen',
        phone: '(876) 555-0123',
        relationship: 'Sibling',
      },
      startDate: formatDateInputOffset(-365),
      payRate: getRolePayRate('admin'),
      overtimeThreshold: 40,
      overtimeMultiplier: 1.5,
      employmentType: 'full-time',
      certificationRecords: buildDefaultCertificationRecords('admin'),
      hrDocuments: [],
      onboardingChecklist: buildDefaultOnboardingChecklist().map((item) => ({
        ...item,
        completed: true,
        completedAt: formatDateShort(new Date()),
      })),
      performanceNotes: [],
      availability: buildDefaultAvailability('admin'),
    },
  };
}

function normalizeEmployees(employees, pools, organizationName) {
  const primaryPool = pools[0];
  const secondaryPool = pools[1] ?? primaryPool;
  const normalized = {};

  Object.entries(employees).forEach(([id, employee]) => {
    let assignedPoolId = employee.assignedPoolId ?? null;
    if (!assignedPoolId && employee.role === 'lifeguard') {
      assignedPoolId = id === 'LG-3302' ? secondaryPool?.id : primaryPool?.id;
    }

    normalized[id] = {
      ...employee,
      assignedPoolId,
      phone: employee.phone ?? '',
      email: employee.email ?? '',
      emergencyContact:
        employee.emergencyContact ?? {
          name: '',
          phone: '',
          relationship: '',
        },
      startDate: employee.startDate ?? formatDateInputOffset(-30),
      certifications: employee.certifications ?? roleLabels[employee.role] ?? 'Staff',
      profileNote: employee.profileNote ?? '',
      avatarUrl: employee.avatarUrl ?? '',
      payRate: employee.payRate ?? getRolePayRate(employee.role),
      overtimeThreshold: Number(employee.overtimeThreshold ?? 40),
      overtimeMultiplier: Number(employee.overtimeMultiplier ?? 1.5),
      employmentType: employee.employmentType ?? (employee.role === 'lifeguard' ? 'seasonal' : 'full-time'),
      certificationRecords: normalizeCertificationRecords(employee.certificationRecords, employee.role),
      hrDocuments: normalizeDocuments(employee.hrDocuments),
      onboardingChecklist: normalizeOnboardingChecklist(employee.onboardingChecklist),
      performanceNotes: normalizePerformanceNotes(employee.performanceNotes),
      availability: normalizeAvailability(employee.availability, employee.role),
      schedule:
        employee.schedule ??
        (employee.role === 'lifeguard'
          ? `${primaryPool?.name ?? organizationName} 8am-4pm today`
          : employee.role === 'manager'
            ? 'All pools visible today'
            : 'Full organization access today'),
    };
  });

  return normalized;
}

function syncEmployeesFromSchedules(employees, schedules, pools, organizationName) {
  const nextEmployees = { ...employees };

  Object.values(nextEmployees).forEach((employee) => {
    const scheduleEntry = findEmployeeSchedule(schedules, employee.id);
    if (!scheduleEntry) {
      return;
    }

    const pool =
      pools.find((entry) => entry.id === scheduleEntry.poolId) ??
      pools.find((entry) => entry.name === scheduleEntry.poolName) ??
      null;

    nextEmployees[employee.id] = {
      ...employee,
      assignedPoolId: employee.role === 'lifeguard' ? pool?.id ?? employee.assignedPoolId ?? null : employee.assignedPoolId ?? null,
      schedule:
        employee.role === 'lifeguard'
          ? `${pool?.name ?? scheduleEntry.poolName ?? organizationName} ${scheduleEntry.shiftLabel} today`
          : employee.role === 'manager'
            ? `Managing ${pools.length} pool${pools.length === 1 ? '' : 's'} today`
            : 'Full organization access today',
    };
  });

  return nextEmployees;
}

function applyShiftSwapToSchedules(schedules, request) {
  const requesterSchedule = schedules.find((entry) => entry.id === request.requesterShiftId);
  const targetSchedule = schedules.find((entry) => entry.id === request.targetShiftId);

  if (!requesterSchedule || !targetSchedule) {
    return schedules;
  }

  return schedules.map((entry) => {
    if (entry.id === requesterSchedule.id) {
      return normalizeScheduleEntry({
        ...entry,
        poolId: targetSchedule.poolId,
        poolName: targetSchedule.poolName,
        day: targetSchedule.day,
        shiftStart: targetSchedule.shiftStart,
        shiftEnd: targetSchedule.shiftEnd,
      });
    }

    if (entry.id === targetSchedule.id) {
      return normalizeScheduleEntry({
        ...entry,
        poolId: requesterSchedule.poolId,
        poolName: requesterSchedule.poolName,
        day: requesterSchedule.day,
        shiftStart: requesterSchedule.shiftStart,
        shiftEnd: requesterSchedule.shiftEnd,
      });
    }

    return entry;
  });
}

function normalizeScheduleEntry(entry) {
  const startMinutes = entry.shiftStart ? timeToMinutes(entry.shiftStart) : parseShiftLabel(entry.shift).startMinutes;
  const endMinutes = entry.shiftEnd ? timeToMinutes(entry.shiftEnd) : parseShiftLabel(entry.shift).endMinutes;
  const shiftStart = entry.shiftStart ?? (startMinutes !== null ? `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}` : '07:00');
  const shiftEnd = entry.shiftEnd ?? (endMinutes !== null ? `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}` : '15:00');
  const date = entry.date ?? formatIsoDate(getWeekStartDate());

  return {
    ...entry,
    orgId: entry.orgId ?? '',
    poolId: entry.poolId ?? null,
    date,
    shiftStart,
    shiftEnd,
    startMinutes: timeToMinutes(shiftStart),
    endMinutes: timeToMinutes(shiftEnd),
    shiftLabel: `${formatMinutesAsTime(timeToMinutes(shiftStart))} - ${formatMinutesAsTime(timeToMinutes(shiftEnd))}`,
    overrideActive: Boolean(entry.overrideActive),
    overrideReason: entry.overrideReason ?? '',
    status: entry.status ?? 'scheduled',
  };
}

function buildStarterSchedules(organizationName, employeesMap, pools = []) {
  const employees = employeesMap ? Object.values(employeesMap) : [
    { id: 'LG-6001', name: 'Daniel Smith', role: 'lifeguard' },
    { id: 'MG-7001', name: 'Daniel Smith', role: 'manager' },
    { id: 'AD-9001', name: 'Daniel Smith', role: 'admin' },
  ];

  const weekStart = getWeekStartDate();

  return employees.map((employee, index) => {
    const shiftDate = addDays(weekStart, index % 5);
    return normalizeScheduleEntry({
      id: `sched-${employee.id}-${index}`,
      orgId: '',
      employeeId: employee.id,
      name: employee.name,
      role: employee.role,
      day: weekDays[shiftDate.getDay()],
      date: formatIsoDate(shiftDate),
      shiftStart: employee.role === 'lifeguard' ? '07:00' : '08:00',
      shiftEnd: employee.role === 'lifeguard' ? '15:00' : '16:00',
      poolId: employee.assignedPoolId ?? pools[index]?.id ?? pools[0]?.id ?? null,
      poolName:
        employee.role === 'lifeguard'
          ? employee.schedule?.split(' today')[0] ?? `${organizationName} Pool`
          : 'All pools',
      overrideActive: false,
      overrideReason: '',
      status: 'scheduled',
    });
  });
}

function buildStarterCommunications(organizationName) {
  return {
    announcements: [
      {
        id: 'announcement-1',
        title: 'Deck safety reminder',
        body: `Please complete opening deck checks before admitting patrons at ${organizationName} sites.`,
        author: 'Marcus Thompson',
        postedAt: '7:15 AM',
        priority: 'normal',
      },
      {
        id: 'announcement-2',
        title: 'Weekend staffing update',
        body: 'Saturday rotation has been updated. Review the schedule panel before your shift.',
        author: 'Operations Office',
        postedAt: '6:40 AM',
        priority: 'important',
      },
    ],
    directMessages: [
      {
        id: 'dm-1',
        sender: 'Marcus Thompson',
        recipient: 'Daniel Smith',
        subject: 'Break coverage',
        body: 'Please cover lane 2 from 10:30 to 10:45 while Alex resets the equipment room.',
        sentAt: '9:18 AM',
        priority: 'important',
        type: 'personal',
      },
      {
        id: 'dm-2',
        sender: 'Jordan Doe',
        recipient: 'Marcus Thompson',
        subject: 'Shift handoff',
        body: 'Cloudiness improved after filter backwash. Retest pH at noon.',
        sentAt: '8:56 AM',
        priority: 'handoff',
        type: 'handoff',
      },
    ],
    groups: [
      {
        id: 'group-1',
        name: 'Morning Guards',
        createdBy: 'Marcus Thompson',
        members: ['Daniel Smith', 'Jordan Doe', 'Alex Rivera'],
        messages: [
          {
            id: 'group-msg-1',
            sender: 'Marcus Thompson',
            body: 'Morning team, confirm rescue tube and AED checks in the logbook by 8:15.',
            sentAt: '7:05 AM',
            priority: 'normal',
          },
        ],
      },
    ],
  };
}

function normalizeCommunications(communications) {
  return {
    announcements: communications.announcements ?? [],
    directMessages: communications.directMessages ?? [],
    groups: (communications.groups ?? []).map((group) => ({
      ...group,
      messages: group.messages ?? [],
    })),
  };
}

function saveOrganizations(organizations) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(organizations));
}

function getOrganizationsFromStorage() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return loadOrganizations();
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(enrichOrganization) : loadOrganizations();
  } catch {
    return loadOrganizations();
  }
}

function getOrganizationById(organizationId) {
  if (!organizationId) {
    return null;
  }
  return getOrganizationsFromStorage().find((organization) => organization.id === organizationId) ?? null;
}

function updateOrganizationInStorage(organizationId, updater) {
  const organizations = getOrganizationsFromStorage();
  const nextOrganizations = organizations.map((organization) =>
    organization.id === organizationId ? enrichOrganization(updater(organization)) : organization,
  );
  saveOrganizations(nextOrganizations);
}

function updateEmployeeInStorage(organizationId, employeeId, nextProfile) {
  updateOrganizationInStorage(organizationId, (organization) => ({
    ...organization,
    employees: {
      ...organization.employees,
      [employeeId]: {
        ...organization.employees[employeeId],
        ...nextProfile,
      },
    },
  }));
}

function stopCameraStream(mediaStreamRef) {
  if (!mediaStreamRef.current) {
    return;
  }

  mediaStreamRef.current.getTracks().forEach((track) => track.stop());
  mediaStreamRef.current = null;
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function initialsForName(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function firstName(name) {
  return name.split(' ')[0];
}

function formatTimeShort(date) {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTimeLong(date) {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDateShort(date) {
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function formatDateInputOffset(dayOffset) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

function getWeekStartDate(baseDate = new Date()) {
  const date = new Date(baseDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date, dayOffset) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + dayOffset);
  return nextDate;
}

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatWeekdayLabel(date) {
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function calculatePayrollSummary(employee, schedules, attendanceRecords) {
  const employeeRecords = attendanceRecords.filter((record) => record.employeeId === employee.id);
  const attendanceHours = employeeRecords.reduce((sum, record) => sum + Number(record.hoursWorked || 0), 0);
  const scheduledHours = schedules
    .filter((schedule) => schedule.employeeId === employee.id)
    .reduce((sum, schedule) => {
      if (schedule.startMinutes === null || schedule.endMinutes === null) {
        return sum;
      }
      return sum + (schedule.endMinutes - schedule.startMinutes) / 60;
    }, 0);
  const hours = attendanceHours > 0 ? attendanceHours : scheduledHours;
  const payRate = employee.payRate ?? getRolePayRate(employee.role);

  return {
    hours,
    payRate,
    grossPay: hours * payRate,
  };
}

function isScheduleOutsideAvailability(schedule, employee) {
  const availability = employee?.availability?.[schedule.day];
  if (!availability || !availability.enabled) {
    return true;
  }

  const availableStart = timeToMinutes(availability.start);
  const availableEnd = timeToMinutes(availability.end);

  return (
    schedule.startMinutes === null ||
    schedule.endMinutes === null ||
    schedule.startMinutes < availableStart ||
    schedule.endMinutes > availableEnd
  );
}

function schedulesOverlap(first, second) {
  if (first.date !== second.date) {
    return false;
  }

  if (first.startMinutes === null || first.endMinutes === null || second.startMinutes === null || second.endMinutes === null) {
    return false;
  }

  return first.startMinutes < second.endMinutes && second.startMinutes < first.endMinutes;
}

function detectScheduleConflicts(schedules, employeeDirectory) {
  const conflicts = [];
  const activeSchedules = schedules.filter((schedule) => schedule.status !== 'cancelled');

  activeSchedules.forEach((schedule, index) => {
    const employee = employeeDirectory[schedule.employeeId];
    if (employee && isScheduleOutsideAvailability(schedule, employee)) {
      conflicts.push({
        id: `availability-${schedule.id}`,
        type: 'availability',
        scheduleId: schedule.id,
        employeeId: schedule.employeeId,
        message: `${schedule.name} is scheduled outside availability on ${schedule.day}.`,
      });
    }

    for (let compareIndex = index + 1; compareIndex < activeSchedules.length; compareIndex += 1) {
      const compareSchedule = activeSchedules[compareIndex];
      if (schedule.employeeId !== compareSchedule.employeeId) {
        continue;
      }

      if (schedulesOverlap(schedule, compareSchedule)) {
        conflicts.push({
          id: `double-${schedule.id}-${compareSchedule.id}`,
          type: 'double-booked',
          scheduleId: schedule.id,
          compareScheduleId: compareSchedule.id,
          employeeId: schedule.employeeId,
          message: `${schedule.name} is double-booked on ${schedule.day}.`,
        });
      }
    }
  });

  return conflicts;
}

function buildAutoFillSchedules({ organizationId, pools, schedules, employeeDirectory, weekStartDate }) {
  const activeSchedules = schedules.filter((schedule) => schedule.status !== 'cancelled');
  const lifeguards = Object.values(employeeDirectory).filter((employee) => employee.role === 'lifeguard');
  const suggestedSchedules = [];
  let roundRobinIndex = 0;

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const currentDate = addDays(weekStartDate, dayIndex);
    const currentDay = weekDays[currentDate.getDay()];

    pools.forEach((pool) => {
      const alreadyScheduled = activeSchedules.some(
        (schedule) =>
          schedule.poolId === pool.id &&
          schedule.date === formatIsoDate(currentDate) &&
          schedule.role === 'lifeguard' &&
          schedule.status !== 'cancelled',
      );

      if (alreadyScheduled) {
        return;
      }

      let selectedEmployee = null;

      for (let guardOffset = 0; guardOffset < lifeguards.length; guardOffset += 1) {
        const candidate = lifeguards[(roundRobinIndex + guardOffset) % lifeguards.length];
        const availability = candidate.availability?.[currentDay];
        const candidateShift = normalizeScheduleEntry({
          id: `autofill-${candidate.id}-${pool.id}-${dayIndex}`,
          orgId: organizationId,
          employeeId: candidate.id,
          name: candidate.name,
          role: candidate.role,
          poolId: pool.id,
          poolName: pool.name,
          day: currentDay,
          date: formatIsoDate(currentDate),
          shiftStart: '07:00',
          shiftEnd: '15:00',
          status: 'scheduled',
        });

        const hasConflict = activeSchedules.some(
          (existingSchedule) =>
            existingSchedule.employeeId === candidate.id && schedulesOverlap(existingSchedule, candidateShift),
        );

        if (availability?.enabled && !isScheduleOutsideAvailability(candidateShift, candidate) && !hasConflict) {
          selectedEmployee = candidate;
          roundRobinIndex = (roundRobinIndex + guardOffset + 1) % Math.max(lifeguards.length, 1);
          suggestedSchedules.push(candidateShift);
          activeSchedules.push(candidateShift);
          break;
        }
      }

      if (!selectedEmployee) {
        suggestedSchedules.push(
          normalizeScheduleEntry({
            id: `autofill-open-${pool.id}-${dayIndex}`,
            orgId: organizationId,
            employeeId: '',
            name: 'Open shift',
            role: 'lifeguard',
            poolId: pool.id,
            poolName: pool.name,
            day: currentDay,
            date: formatIsoDate(currentDate),
            shiftStart: '07:00',
            shiftEnd: '15:00',
            status: 'scheduled',
          }),
        );
      }
    });
  }

  return suggestedSchedules;
}

function buildAssistantResponse(query) {
  const normalized = query.toLowerCase();

  if (normalized.includes('close the pool') || normalized.includes('closure') || normalized.includes('close pool')) {
    return {
      title: 'Pool closure decision support',
      domain: 'Escalation and safety shutdowns',
      summary:
        'Close or restrict the pool when water safety, supervision, electrical safety, or rescue readiness cannot be maintained within approved standards.',
      steps: [
        'Pause patron entry immediately if visibility, chemistry, circulation, weather, or staffing conditions create a safety risk.',
        'Retest or recheck the triggering condition so the decision is based on a confirmed observation.',
        'Notify the manager, document the reason for closure, and note what must happen before reopening.',
        'Reopen only after the condition is corrected, verified, and approved by site protocol.',
      ],
      escalation: 'Escalate immediately to a manager for any chemistry-based closure, rescue coverage gap, or unresolved safety hazard.',
    };
  }

  if (normalized.includes('spinal') || normalized.includes('unconscious') || normalized.includes('rescue')) {
    return {
      title: 'Water emergency response guidance',
      domain: 'Emergency care and lifeguard rescue',
      summary:
        'Prioritize scene safety, activate your emergency action plan, stabilize the victim, and bring in trained backup immediately.',
      steps: [
        'Activate the facility emergency response plan and call for backup or EMS right away.',
        'Maintain in-line stabilization if spinal injury is suspected and avoid unnecessary movement.',
        'Remove the victim from the water using trained rescue procedures and continue airway, breathing, and circulation checks.',
        'Use CPR, rescue breathing, AED, or first aid only within your certification and site protocol.',
      ],
      escalation: 'Escalate immediately to EMS and your supervisor for any major water rescue or suspected spinal injury.',
    };
  }

  if (normalized.includes('ph') || normalized.includes('chlorine') || normalized.includes('cloudy') || normalized.includes('chem')) {
    return {
      title: 'Water chemistry troubleshooting',
      domain: 'Pool chemistry and operations',
      summary:
        'Treat water chemistry issues methodically: confirm the reading, compare it to your operating range, correct gradually, and document every adjustment.',
      steps: [
        'Retest the water before adjusting anything so you are acting on a confirmed reading.',
        'Check the related values together: free chlorine, pH, alkalinity, water clarity, and circulation status.',
        'Apply the site-approved chemical correction in measured amounts and avoid over-correcting in one step.',
        'Log the before and after readings, who made the change, and when the next retest is due.',
      ],
      escalation: 'Escalate to the manager if readings stay outside range, water clarity worsens, or closure may be required.',
    };
  }

  if (normalized.includes('open') || normalized.includes('opening') || normalized.includes('start of shift')) {
    return {
      title: 'Opening shift checklist support',
      domain: 'Daily operations and preventive checks',
      summary:
        'A strong opening routine confirms safety, water quality, equipment readiness, and documentation before patrons enter the pool area.',
      steps: [
        'Inspect the deck, drains, rescue gear, first aid kit, and any obvious facility hazards.',
        'Test and record required chemistry readings before opening to swimmers.',
        'Confirm capacity systems, signage, radios, and communication tools are working.',
        'Review the prior shift handoff so recurring issues are addressed early.',
      ],
      escalation: 'Escalate before opening if any safety equipment is missing, chemistry is unsafe, or the facility is not inspection-ready.',
    };
  }

  if (normalized.includes('handoff') || normalized.includes('logbook') || normalized.includes('note')) {
    return {
      title: 'Shift handoff guidance',
      domain: 'Pool logbook and communication',
      summary:
        'The handoff should leave the next guard fully informed about safety, operations, unfinished tasks, and any unusual activity at the pool.',
      steps: [
        'Note what checklist items were completed and what still needs attention.',
        'Record chemistry readings, any chemical adjustments, and the next retest time.',
        'Include incidents, patron concerns, equipment problems, or manager instructions.',
        'Keep the note short, specific, timestamped, and tied to the pool rather than the person.',
      ],
      escalation: 'Escalate verbally and in the logbook if the next shift inherits a safety issue or unresolved alert.',
    };
  }

  if (normalized.includes('maintenance') || normalized.includes('filter') || normalized.includes('pump') || normalized.includes('equipment')) {
    return {
      title: 'Pool maintenance triage',
      domain: 'Maintenance and technical operations',
      summary:
        'Start with symptoms, confirm whether the issue affects water safety or circulation, and document what was observed before making adjustments.',
      steps: [
        'Identify whether the issue is chemical, mechanical, circulation-related, or a visible facility hazard.',
        'Check the simplest causes first: blocked baskets, valves, power status, flow irregularities, and dirty filters.',
        'Follow site-approved maintenance procedures only if they are within your responsibility and training.',
        'Record the issue, what was checked, and whether the manager or maintenance team was notified.',
      ],
      escalation: 'Escalate immediately for circulation failure, unsafe water, electrical concerns, or any issue outside your training.',
    };
  }

  if (normalized.includes('member') || normalized.includes('pass') || normalized.includes('capacity') || normalized.includes('scan')) {
    return {
      title: 'Member verification workflow',
      domain: 'Access control and deck capacity',
      summary:
        'Verify the pass first, confirm the guest is allowed entry, and keep your live capacity count accurate so the pool never drifts past safe operating limits.',
      steps: [
        'Check that the pass is active and belongs to the guest presenting it.',
        'Confirm the pool is not at capacity before admitting the guest.',
        'Log denied entries when a pass is inactive, expired, or flagged for manager review.',
        'Release capacity promptly when patrons leave so the count stays reliable.',
      ],
      escalation: 'Escalate any disputed pass, denied member complaint, or capacity lockout to the manager on duty.',
    };
  }

  return {
    title: 'Operational guidance',
    domain: 'General lifeguard best practice',
    summary:
      'Use the assistant for practical support, but always follow employer protocol, certification standards, and manager direction when safety is involved.',
    steps: [
      'Describe the problem with the pool, patron, equipment, or shift situation as clearly as possible.',
      'Confirm the current reading, condition, or observed behavior before acting.',
      'Take the safest approved action first and document what you did.',
      'When in doubt, escalate early instead of guessing.',
    ],
    escalation: 'Escalate any unclear emergency, unsafe condition, or procedural uncertainty to a manager immediately.',
  };
}

export default App;
