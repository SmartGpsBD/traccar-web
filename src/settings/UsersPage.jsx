import { useCallback, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  TableSortLabel,
  Switch,
  TableFooter,
  FormControlLabel,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LinkIcon from '@mui/icons-material/Link';
import { useCatch, useAsyncTask } from '../reactHelper';
import { formatBoolean, formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import { useManager } from '../common/util/permissions';
import SearchHeader from './components/SearchHeader';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import UserDevicesValue from './components/UserDevicesValue';

const UsersPage = () => {
  const { classes } = useSettingsStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const manager = useManager();

  const [reloadKey, reload] = useReducer((k) => k + 1, 0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [temporary, setTemporary] = useState(false);

  // Sorting state
  const [orderBy, setOrderBy] = useState('id');
  const [order, setOrder] = useState('asc');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleLogin = useCatch(async (userId) => {
    await fetchOrThrow(`/api/session/${userId}`);
    window.location.replace('/');
  });

  const actionLogin = {
    key: 'login',
    title: t('loginLogin'),
    icon: <LoginIcon fontSize="small" />,
    handler: handleLogin,
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (userId) => navigate(`/settings/user/${userId}/connections`),
  };

  const loadItems = useCallback(async (signal) => {
    setLoading(true);
    const query = new URLSearchParams({ excludeAttributes: true });
    const response = await fetchOrThrow(`/api/users?${query.toString()}`, { signal });
    const data = await response.json();
    setItems(data);
    setLoading(false);
  }, []);

  useAsyncTask(
    async ({ signal }) => {
      void reloadKey;
      setItems([]);
      await loadItems(signal);
    },
    [reloadKey, loadItems],
  );

  // Instant local filtering (search + temporary toggle)
  const filteredItems = items
    .filter((u) => temporary || !u.temporary)
    .filter((item) => {
      if (!searchKeyword.trim()) return true;
      const query = searchKeyword.toLowerCase();
      return (
        item.name?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.phone?.toLowerCase().includes(query) ||
        item.login?.toLowerCase().includes(query) ||
        String(item.id).includes(query)
      );
    });

  // Instant local sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue = a[orderBy];
    let bValue = b[orderBy];

    aValue = aValue ?? '';
    bValue = bValue ?? '';

    if (typeof aValue === 'boolean') {
      return order === 'asc' ? (aValue === bValue ? 0 : aValue ? -1 : 1) : (aValue === bValue ? 0 : aValue ? 1 : -1);
    }

    if (typeof aValue === 'string') {
      return order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return order === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
  });

  const totalColumns = 11;

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'settingsUsers']}>
      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell sortDirection={orderBy === 'id' ? order : false}>
              <TableSortLabel
                active={orderBy === 'id'}
                direction={orderBy === 'id' ? order : 'asc'}
                onClick={() => handleRequestSort('id')}
              >
                ID
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'email' ? order : false}>
              <TableSortLabel
                active={orderBy === 'email'}
                direction={orderBy === 'email' ? order : 'asc'}
                onClick={() => handleRequestSort('email')}
              >
                {t('userEmail')}
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'phone' ? order : false}>
              <TableSortLabel
                active={orderBy === 'phone'}
                direction={orderBy === 'phone' ? order : 'asc'}
                onClick={() => handleRequestSort('phone')}
              >
                {t('sharedPhone')}
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'administrator' ? order : false}>
              <TableSortLabel
                active={orderBy === 'administrator'}
                direction={orderBy === 'administrator' ? order : 'asc'}
                onClick={() => handleRequestSort('administrator')}
              >
                {t('userAdmin')}
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'deviceReadonly' ? order : false}>
              <TableSortLabel
                active={orderBy === 'deviceReadonly'}
                direction={orderBy === 'deviceReadonly' ? order : 'asc'}
                onClick={() => handleRequestSort('deviceReadonly')}
              >
                {t('userDeviceReadonly')}
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'disabled' ? order : false}>
              <TableSortLabel
                active={orderBy === 'disabled'}
                direction={orderBy === 'disabled' ? order : 'asc'}
                onClick={() => handleRequestSort('disabled')}
              >
                {t('sharedDisabled')}
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'deviceLimit' ? order : false}>
              <TableSortLabel
                active={orderBy === 'deviceLimit'}
                direction={orderBy === 'deviceLimit' ? order : 'asc'}
                onClick={() => handleRequestSort('deviceLimit')}
              >
                {t('userDeviceLimit')}
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'userLimit' ? order : false}>
              <TableSortLabel
                active={orderBy === 'userLimit'}
                direction={orderBy === 'userLimit' ? order : 'asc'}
                onClick={() => handleRequestSort('userLimit')}
              >
                {t('userUserLimit')}
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'expirationTime' ? order : false}>
              <TableSortLabel
                active={orderBy === 'expirationTime'}
                direction={orderBy === 'expirationTime' ? order : 'asc'}
                onClick={() => handleRequestSort('expirationTime')}
              >
                {t('userExpirationTime')}
              </TableSortLabel>
            </TableCell>

            <TableCell>{t('deviceTitle')}</TableCell>
            <TableCell className={classes.columnAction} />
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableShimmer columns={totalColumns} endAction />
          ) : (
            sortedItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.phone}</TableCell>
                <TableCell>{formatBoolean(item.administrator, t)}</TableCell>
                <TableCell>{formatBoolean(item.deviceReadonly, t)}</TableCell>
                <TableCell>{formatBoolean(item.disabled, t)}</TableCell>
                <TableCell>{item.deviceLimit}</TableCell>
                <TableCell>{item.userLimit}</TableCell>
                <TableCell>{formatTime(item.expirationTime, 'date')}</TableCell>
                <TableCell>
                  <UserDevicesValue userId={item.id} />
                </TableCell>
                <TableCell className={classes.columnAction} padding="none">
                  <CollectionActions
                    itemId={item.id}
                    editPath="/settings/user"
                    endpoint="users"
                    onReload={reload}
                    customActions={manager ? [actionLogin, actionConnections] : [actionConnections]}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={totalColumns} align="right">
              <FormControlLabel
                control={
                  <Switch
                    checked={temporary}
                    onChange={(e) => setTemporary(e.target.checked)}
                    size="small"
                  />
                }
                label={t('userTemporary')}
                labelPlacement="start"
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <CollectionFab editPath="/settings/user" />
    </PageLayout>
  );
};

export default UsersPage;
