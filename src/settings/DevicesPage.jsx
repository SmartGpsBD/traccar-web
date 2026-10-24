import { useCallback, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  TableSortLabel,
  Button,
  TableFooter,
  FormControlLabel,
  Switch,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { useTheme } from '@mui/material/styles';
import { useAsyncTask } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader from './components/SearchHeader';
import { formatTime } from '../common/util/formatter';
import { useDeviceReadonly, useManager } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';
import DeviceUsersValue from './components/DeviceUsersValue';
import usePersistedState from '../common/util/usePersistedState';
import fetchOrThrow from '../common/util/fetchOrThrow';
import exportExcel from '../common/util/exportExcel';

const DevicesPage = () => {
  const { classes } = useSettingsStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const t = useTranslation();

  const manager = useManager();
  const deviceReadonly = useDeviceReadonly();

  const [reloadKey, reload] = useReducer((k) => k + 1, 0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAll, setShowAll] = usePersistedState('showAllDevices', false);

  // Sorting state
  const [orderBy, setOrderBy] = useState('id');
  const [order, setOrder] = useState('asc');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const loadItems = useCallback(
    async (signal) => {
      setLoading(true);
      const query = new URLSearchParams({ all: showAll });
      const response = await fetchOrThrow(`/api/devices?${query.toString()}`, { signal });
      const data = await response.json();
      setItems(data);
      setLoading(false);
    },
    [showAll],
  );

  useAsyncTask(
    async ({ signal }) => {
      void reloadKey;
      setItems([]);
      await loadItems(signal);
    },
    [reloadKey, loadItems],
  );

  // 1. Instant local search filtering
  const filteredItems = items.filter((item) => {
    if (!searchKeyword.trim()) return true;
    const query = searchKeyword.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.uniqueId?.toLowerCase().includes(query) ||
      item.phone?.toLowerCase().includes(query) ||
      item.imei?.toLowerCase().includes(query) ||
      item.model?.toLowerCase().includes(query) ||
      item.activation?.toLowerCase().includes(query) ||
      item.contact?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      String(item.id).includes(query)
    );
  });

  // 2. Instant local sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue = a[orderBy];
    let bValue = b[orderBy];

    aValue = aValue ?? '';
    bValue = bValue ?? '';

    if (typeof aValue === 'string') {
      return order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return order === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
  });

  const handleExport = async () => {
    const data = sortedItems.map((item) => ({
      ID: item.id,
      [t('sharedName')]: item.name,
      [t('deviceIdentifier')]: item.uniqueId,
      [t('sharedPhone')]: item.phone,
      IMEI: item.imei,
      [t('deviceModel')]: item.model,
      Activation: item.activation,
      Payment: formatTime(item.payment, 'date'),
      [t('deviceContact')]: item.contact,
      Category: item.category,
      [t('userExpirationTime')]: formatTime(item.expirationTime, 'date'),
    }));
    const sheets = new Map();
    sheets.set(t('deviceTitle'), data);
    await exportExcel(t('deviceTitle'), 'devices.xlsx', sheets, theme);
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (deviceId) => navigate(`/settings/device/${deviceId}/connections`),
  };

  const totalColumns = manager ? 13 : 12;

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'deviceTitle']}>
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

            <TableCell sortDirection={orderBy === 'name' ? order : false}>
              <TableSortLabel
                active={orderBy === 'name'}
                direction={orderBy === 'name' ? order : 'asc'}
                onClick={() => handleRequestSort('name')}
              >
                {t('sharedName')}
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'uniqueId' ? order : false}>
              <TableSortLabel
                active={orderBy === 'uniqueId'}
                direction={orderBy === 'uniqueId' ? order : 'asc'}
                onClick={() => handleRequestSort('uniqueId')}
              >
                {t('deviceIdentifier')}
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

            <TableCell sortDirection={orderBy === 'imei' ? order : false}>
              <TableSortLabel
                active={orderBy === 'imei'}
                direction={orderBy === 'imei' ? order : 'asc'}
                onClick={() => handleRequestSort('imei')}
              >
                IMEI
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'model' ? order : false}>
              <TableSortLabel
                active={orderBy === 'model'}
                direction={orderBy === 'model' ? order : 'asc'}
                onClick={() => handleRequestSort('model')}
              >
                {t('deviceModel')}
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'activation' ? order : false}>
              <TableSortLabel
                active={orderBy === 'activation'}
                direction={orderBy === 'activation' ? order : 'asc'}
                onClick={() => handleRequestSort('activation')}
              >
                Activation
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'payment' ? order : false}>
              <TableSortLabel
                active={orderBy === 'payment'}
                direction={orderBy === 'payment' ? order : 'asc'}
                onClick={() => handleRequestSort('payment')}
              >
                Payment
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'contact' ? order : false}>
              <TableSortLabel
                active={orderBy === 'contact'}
                direction={orderBy === 'contact' ? order : 'asc'}
                onClick={() => handleRequestSort('contact')}
              >
                {t('deviceContact')}
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'category' ? order : false}>
              <TableSortLabel
                active={orderBy === 'category'}
                direction={orderBy === 'category' ? order : 'asc'}
                onClick={() => handleRequestSort('category')}
              >
                Category
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
            {manager && <TableCell>{t('settingsUsers')}</TableCell>}
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
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.uniqueId}</TableCell>
                <TableCell>{item.phone}</TableCell>
                <TableCell>{item.imei}</TableCell>
                <TableCell>{item.model}</TableCell>
                <TableCell>{item.activation}</TableCell>
                <TableCell>{formatTime(item.payment, 'date')}</TableCell>
                <TableCell>{item.contact}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{formatTime(item.expirationTime, 'date')}</TableCell>
                {manager && (
                  <TableCell>
                    <DeviceUsersValue deviceId={item.id} />
                  </TableCell>
                )}
                <TableCell className={classes.columnAction} padding="none">
                  <CollectionActions
                    itemId={item.id}
                    editPath="/settings/device"
                    endpoint="devices"
                    onReload={reload}
                    customActions={[actionConnections]}
                    readonly={deviceReadonly}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>
              <Button onClick={handleExport} variant="text">
                {t('reportExport')}
              </Button>
            </TableCell>
            <TableCell colSpan={totalColumns - 1} align="right">
              <FormControlLabel
                control={
                  <Switch
                    checked={showAll}
                    onChange={(e) => setShowAll(e.target.checked)}
                    size="small"
                  />
                }
                label={t('notificationAlways')}
                labelPlacement="start"
                disabled={!manager}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <CollectionFab editPath="/settings/device" />
    </PageLayout>
  );
};

export default DevicesPage;
