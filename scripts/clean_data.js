const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'frontend', 'src');

// 1. App.tsx: Remove auto-login with fake Sunil Mehta
const appPath = path.join(root, 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = appContent.replace(
  /\/\/ Protected Route wrapper with fallback to demo mode if not yet logged in[\s\S]*?return <>{children}<\/>;[\s\S]*?};/,
  `// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};`
);
fs.writeFileSync(appPath, appContent, 'utf8');
console.log('App.tsx cleaned');

// 2. Login.tsx: Remove fake defaults
const loginPath = path.join(root, 'pages', 'auth', 'Login.tsx');
let loginContent = fs.readFileSync(loginPath, 'utf8');
loginContent = loginContent.replace(
  /defaultValues:\s*\{\s*email:\s*['"][^'"]*['"],\s*password:\s*['"][^'"]*['"],?\s*\}/,
  `defaultValues: { email: '', password: '' }`
);
loginContent = loginContent.replace(
  /const \[regCompany, setRegCompany\] = useState\([^)]*\);/,
  `const [regCompany, setRegCompany] = useState('');`
);
loginContent = loginContent.replace(
  /const \[regName, setRegName\] = useState\([^)]*\);/,
  `const [regName, setRegName] = useState('');`
);
loginContent = loginContent.replace(
  /const \[regPhone, setRegPhone\] = useState\([^)]*\);/,
  `const [regPhone, setRegPhone] = useState('');`
);
loginContent = loginContent.replace(
  /const \[regCity, setRegCity\] = useState\([^)]*\);/,
  `const [regCity, setRegCity] = useState('');`
);
loginContent = loginContent.replace(
  /const \[regGstin, setRegGstin\] = useState\([^)]*\);/,
  `const [regGstin, setRegGstin] = useState('');`
);
fs.writeFileSync(loginPath, loginContent, 'utf8');
console.log('Login.tsx cleaned');

// 3. Dashboard index.tsx: remove fake 42, 845000, and recentLoads
const dashPath = path.join(root, 'pages', 'dashboard', 'index.tsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');
dashContent = dashContent.replace(
  /\/\/ Fallback demo metrics if API is connecting\/mocking[\s\S]*?const recentLoads = \[[\s\S]*?\];\s*/,
  `const localLoads = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('techofay_registered_loads') || '[]');
    } catch {
      return [];
    }
  }, []);

  const totalRegisteredFreight = localLoads.reduce((sum: number, l: any) => sum + (Number(l.total_freight) || 0), 0);

  const stats = {
    activeLoads: metrics?.today_loads ?? localLoads.length,
    availableVehicles: metrics?.vehicles_available ?? 0,
    driversOnTrip: metrics?.drivers_on_trip ?? 0,
    pendingLrs: metrics?.pending_lrs ?? 0,
    pendingBilties: metrics?.pending_bilties ?? localLoads.length,
    freightToday: metrics?.total_freight_today ?? totalRegisteredFreight,
    pendingPods: metrics?.pending_pods ?? 0,
    expiringDocs: metrics?.expiring_documents ?? 0,
  };

  const recentLoads = localLoads.slice(0, 5).map((l: any) => ({
    id: l.load_number || l.id,
    from: l.origin_location?.name || 'Origin',
    to: l.destination_location?.name || 'Destination',
    consignor: l.consignor?.name || 'Consignor',
    vehicle: l.vehicle?.plate_number || 'TBD',
    driver: l.driver?.name || 'Driver',
    status: l.status || 'pending',
    eta: 'Active Load',
    freight: Number(l.total_freight) || 0,
  }));
`
);
dashContent = dashContent.replace(
  /\{recentLoads\.map\(\(row\) => \(/,
  `{recentLoads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No active consignments registered yet. Click "+ Quick Intake / Admission" above to book your first load.
                    </td>
                  </tr>
                ) : recentLoads.map((row) => (`
);
fs.writeFileSync(dashPath, dashContent, 'utf8');
console.log('Dashboard cleaned');

// Helper to empty array definitions: const demoXxx: Type[] = [ ... ]; -> const demoXxx: Type[] = [];
function emptyArrayInFile(relPath, varPattern) {
  const filePath = path.join(root, relPath);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    new RegExp(`(const\\s+${varPattern}\\s*:\\s*[^=]+=\\s*)\\[[\\s\\S]*?\\];`),
    `$1[];`
  );
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Cleaned ' + relPath);
}

// 4. Clean all mock lists
emptyArrayInFile('pages/loads/index.tsx', '(?:defaultDemoLoads|_unusedMockLoads)');
emptyArrayInFile('pages/bilties/index.tsx', 'demoBilties');
emptyArrayInFile('pages/lr-numbers/index.tsx', 'demoLrNumbers');
emptyArrayInFile('pages/vehicles/index.tsx', 'demoVehicles');
emptyArrayInFile('pages/drivers/index.tsx', 'demoDrivers');
emptyArrayInFile('pages/customers/index.tsx', 'demoCustomers');
emptyArrayInFile('pages/freight/index.tsx', 'demoFreightCharges');
emptyArrayInFile('pages/delivery-challans/index.tsx', 'demoChallans');
emptyArrayInFile('pages/gate-passes/index.tsx', 'demoGatePasses');

console.log('All fake data successfully removed!');
