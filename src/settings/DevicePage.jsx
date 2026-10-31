import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileInput from '../common/components/FileInput';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import SelectField from '../common/components/SelectField';
import deviceCategories from '../common/util/deviceCategories';
import { useTranslation } from '../common/components/LocalizationProvider';
import useDeviceAttributes from '../common/attributes/useDeviceAttributes';
import { useManager } from '../common/util/permissions';
import SettingsMenu from './components/SettingsMenu';
import useCommonDeviceAttributes from '../common/attributes/useCommonDeviceAttributes';
import { useCatch } from '../reactHelper';
import useSettingsStyles from './common/useSettingsStyles';
import QrCodeDialog from '../common/components/QrCodeDialog';
import fetchOrThrow from '../common/util/fetchOrThrow';

const DevicePage = () => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();

  const manager = useManager();

  const commonDeviceAttributes = useCommonDeviceAttributes(t);
  const deviceAttributes = useDeviceAttributes(t);

  const [searchParams] = useSearchParams();
  const uniqueId = searchParams.get('uniqueId');

  const [item, setItem] = useState(uniqueId ? { uniqueId } : null);
  const [showQr, setShowQr] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const handleFileInput = useCatch(async (newFile) => {
    setImageFile(newFile);
    if (newFile && item?.id) {
      const response = await fetchOrThrow(`/api/devices/${item.id}/image`, {
        method: 'POST',
        body: newFile,
      });
      setItem({ ...item, attributes: { ...item.attributes, deviceImage: await response.text() } });
    } else if (!newFile) {
      // eslint-disable-next-line no-unused-vars
      const { deviceImage, ...remainingAttributes } = item.attributes || {};
      setItem({ ...item, attributes: remainingAttributes });
    }
  });

  const validate = () => item && item.name && item.uniqueId;

  return (
    <EditItemView
      endpoint="devices"
      item={item}
      setItem={setItem}
      validate={validate}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedDevice']}
    >
      {item && (
        <>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{t('sharedRequired')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <TextField
                value={item.name || ''}
                onChange={(event) => setItem({ ...item, name: event.target.value })}
                label={t('sharedName')}
              />
              <TextField
                value={item.uniqueId || ''}
                onChange={(event) => setItem({ ...item, uniqueId: event.target.value })}
                label={t('deviceIdentifier')}
                helperText={t('deviceIdentifierHelp')}
                disabled={Boolean(uniqueId)}
              />
            </AccordionDetails>
          </Accordion>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{t('sharedExtra')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <SelectField
                value={item.groupId}
                onChange={(event) => setItem({ ...item, groupId: Number(event.target.value) })}
                endpoint="/api/groups"
                label={t('groupParent')}
              />
              <TextField
                value={item.phone || setItem({ ...item, phone: '0' })}
                onChange={(event) => setItem({ ...item, phone: event.target.value })}
                label={t('sharedPhone')}
              />
              <TextField
                value={item.imei || setItem({ ...item, imei: '0' })}
                onChange={(event) => setItem({ ...item, imei: event.target.value })}
                label={t('deviceImei')}
              />
              <TextField
                value={item.model || setItem({ ...item, model: '4G S6 Postpaid' })}
                onChange={(event) => setItem({ ...item, model: event.target.value })}
                label={t('deviceModel')}
              />
              <TextField
                value={item.activation || setItem({ ...item, activation: dayjs().add(1, 'day').endOf('day').format('YYYY-MM-DD') })}
                onChange={(event) => setItem({ ...item, activation: event.target.value })}
                label={t('deviceActivation')}
              />
              <TextField
                value={item.simValidity || setItem({ ...item, simValidity: dayjs().add(1, 'day').endOf('day').format('YYYY-MM-DDTHH:mm:ssZ') })}
                onChange={(event) => setItem({ ...item, simValidity: event.target.value })}
                label={t('simValidity')}
              />
              <TextField
                value={item.payment || setItem({ ...item, payment: dayjs().add(1, 'day').endOf('day').format('YYYY-MM-DDTHH:mm:ssZ') })}
                onChange={(event) => setItem({ ...item, payment: event.target.value })}
                label={t('devicePayment')}
              />
              <TextField
                value={item.contact || setItem({ ...item, contact: '0' })}
                onChange={(event) => setItem({ ...item, contact: event.target.value })}
                label={t('deviceContact')}
              />
              <SelectField
                value={item.category || setItem({ ...item, category: 'default' })}
                onChange={(event) => {
                  const selectedCategory = event.target.value;
                  setItem((prevItem) => ({
                    ...prevItem,
                    category: selectedCategory,
                    payment: selectedCategory === 'Special'
                      ? dayjs().add(364, 'days').endOf('day').format('YYYY-MM-DDTHH:mm:ssZ')
                      : prevItem.payment,
                  }));
                }}
                data={deviceCategories.map((category) => ({
                  id: category,
                  name: t(`category${category.replace(/^\w/, (c) => c.toUpperCase())}`),
                }))}
                label={t('deviceCategory')}
              />
              <SelectField
                value={item.calendarId}
                onChange={(event) => setItem({ ...item, calendarId: Number(event.target.value) })}
                endpoint="/api/calendars"
                label={t('sharedCalendar')}
              />
              <TextField
                label={t('userExpirationTime')}
                type="date"
                value={item.expirationTime ? item.expirationTime.split('T')[0] : setItem({ ...item, expirationTime: dayjs().add(1, 'day').endOf('day').format() })}
                onChange={(e) => {
                  if (e.target.value) {
                    setItem({ ...item, expirationTime: new Date(e.target.value).endOf('day').toISOString() });
                  }
                }}
                disabled={!manager}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={item.disabled}
                    onChange={(event) => setItem({ ...item, disabled: event.target.checked })}
                  />
                }
                label={t('sharedDisabled')}
                disabled={!manager}
              />
              <Button variant="outlined" color="primary" onClick={() => setShowQr(true)}>
                {t('sharedQrCode')}
              </Button>
            </AccordionDetails>
          </Accordion>
          {item.id && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{t('attributeDeviceImage')}</Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <FileInput
                  placeholder={t('attributeDeviceImage')}
                  value={imageFile}
                  onChange={handleFileInput}
                  slotProps={{ htmlInput: { accept: 'image/*' } }}
                />
              </AccordionDetails>
            </Accordion>
          )}
          <EditAttributesAccordion
            attributes={item.attributes}
            setAttributes={(attributes) => setItem({ ...item, attributes })}
            definitions={{ ...commonDeviceAttributes, ...deviceAttributes }}
          />
        </>
      )}
      <QrCodeDialog open={showQr} onClose={() => setShowQr(false)} />
    </EditItemView>
  );
};

export default DevicePage;
