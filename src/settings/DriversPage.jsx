import { useCallback, useReducer, useState } from 'react';
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  TableSortLabel,
} from '@mui/material';
import { useAsyncTask } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import { useManager } from '../common/util/permissions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader from './components/SearchHeader';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

const DriversPage = () => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();
  const manager = useManager();

  const [reloadKey, reload] = useReducer((k) => k + 1, 0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Sorting state
  const [orderBy, setOrderBy] = useState('id');
  const [order, setOrder] = useState('desc');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Fetch all items at once without keyword dependency
  const loadItems = useCallback(async (signal) => {
    setLoading(true);
    const response = await fetchOrThrow('/api/drivers', { signal });
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

  // 1. Instant local search filtering
  const filteredItems = items.filter((item) => {
    if (!searchKeyword.trim()) return true;
    const query = searchKeyword.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.uniqueId?.toLowerCase().includes(query) ||
      String(item.amount ?? '').toLowerCase().includes(query) ||
      String(item.validity ?? '').toLowerCase().includes(query) ||
      String(item.time ?? '').toLowerCase().includes(query) ||
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

  const totalColumns = 7; // 6 data columns + 1 action column

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedDrivers']}>
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

            <TableCell sortDirection={orderBy === 'amount' ? order : false}>
              <TableSortLabel
                active={orderBy === 'amount'}
                direction={orderBy === 'amount' ? order : 'asc'}
                onClick={() => handleRequestSort('amount')}
              >
                Amount
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'uniqueId' ? order : false}>
              <TableSortLabel
                active={orderBy === 'uniqueId'}
                direction={orderBy === 'uniqueId' ? order : 'asc'}
                onClick={() => handleRequestSort('uniqueId')}
              >
                {t('paymentTrx')}
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'validity' ? order : false}>
              <TableSortLabel
                active={orderBy === 'validity'}
                direction={orderBy === 'validity' ? order : 'asc'}
                onClick={() => handleRequestSort('validity')}
              >
                {t('paymentValidity')}
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={orderBy === 'time' ? order : false}>
              <TableSortLabel
                active={orderBy === 'time'}
                direction={orderBy === 'time' ? order : 'asc'}
                onClick={() => handleRequestSort('time')}
              >
                {t('paymentTime')}
              </TableSortLabel>
            </TableCell>

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
                <TableCell>{item.amount}</TableCell>
                <TableCell>{item.uniqueId}</TableCell>
                <TableCell>{item.validity}</TableCell>
                <TableCell>{item.time}</TableCell>
                {manager && (
                  <TableCell className={classes.columnAction} padding="none">
                  <CollectionActions
                    itemId={item.id}
                    editPath="/settings/driver"
                    endpoint="drivers"
                    onReload={reload}
                  />
                </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {manager && (
        <CollectionFab editPath="/settings/driver" />
      )}
    </PageLayout>
  );
};

export default DriversPage;
