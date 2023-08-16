import './App.css';
import { bitable, FieldType } from '@base-open/web-api';
import { Select, Banner, Button, Toast, Spin } from '@douyinfe/semi-ui';
import { IconWrench, IconExport, IconImport, IconCoinMoneyStroked } from '@douyinfe/semi-icons';
import React, { useState, useEffect } from 'react';
import { getExchangeRate } from './exchange-api';
import { IFieldType } from './type';
import { CURRENCY } from './const';
import { useTranslation } from 'react-i18next';

export default function App() {
  const [fieldsInfo, setFieldsInfo] = useState<IFieldType[]>([]);
  const [loading, setLoading] = useState(false);
  const [transformLoading, setTransformLoading] = useState(false);
  const [fieldId, setFieldId] = useState<string | undefined>();
  const [targetFieldId, setTargetFieldId] = useState<string | undefined>();
  const [targetCurrency, setTargetCurrency] = useState<string | undefined>();
  const [rate, setRate] = useState<number | undefined>();
  const [currentCurrency, setCurrentCurrency] = useState<string | undefined>();
  const [rateLoding, setRateLoading] = useState(false);
  const { t } = useTranslation();

  const getTableMeta = async () => {
    setLoading(true);
    const selection = await bitable.base.getSelection();
    const table = await bitable.base.getTableById(selection?.tableId!);
    const fieldMetaList = await table.getFieldMetaList();
    setLoading(false);
    if (!fieldMetaList) return;
    setFieldsInfo(fieldMetaList.filter(val => val.type === FieldType.Currency));
  };

  const getFieldInfo = async (id: string) => {
    const selection = await bitable.base.getSelection();
    const table = await bitable.base.getTableById(selection?.tableId!);
    const fieldMetaList = await table.getFieldMetaList();
    for (const field of fieldMetaList) {
      if (field.id === id) return field;
    }
    return;
  }

  const onClickTransform = async () => {
    if (!fieldId) return;
    const fieldInfo = await getFieldInfo(fieldId);
    if (!fieldInfo) return;
    setTransformLoading(true);
    const selection = await bitable.base.getSelection();
    const table = await bitable.base.getTableById(selection?.tableId!);
    const recordIds = await table.getRecordIdList();
    let transformNum = 0;
    const transformRate = await getExchangeRate(currentCurrency!, targetCurrency!);
    if (!transformRate) {
      Toast.error(t('get_rate_fail'));
      setTransformLoading(false);
      return;
    }
    const targetFieldInfo = await getFieldInfo(targetFieldId);

    // @ts-ignore
    await table.setField(targetFieldId, {
      property: {
        currencyCode: targetCurrency!,
         // @ts-ignore
        decimalDigits: targetFieldInfo.property?.decimalDigits,
      }
    });

    for (const recordId of recordIds) {
      const currentVal = await table.getCellValue(fieldId, recordId!);
      if (typeof currentVal !== 'number' || !currentVal) continue;
      const res = await table.setCellValue(targetFieldId!, recordId!, currentVal * transformRate);
      if (!res) {
        Toast.error(t('transform_fail', { 'transformNum': transformNum }));
        setTransformLoading(false);
        return;
      }
      transformNum++;
    }
    if (transformNum) {
      Toast.success(t('transform_success', { 'transformNum': transformNum }));
    } else {
      Toast.warning(t('transform_warning', { 'transformNum': transformNum }));
    }
    setTransformLoading(false);
  };

  useEffect(() => {
    getTableMeta();
  }, []);

  useEffect(() => {
    const fn = async () => {
      if (!fieldId || !targetCurrency || !targetFieldId) return;
      setRateLoading(true);
      const fieldInfo = await getFieldInfo(fieldId);
      // @ts-ignore
      const transformRate = await getExchangeRate(fieldInfo.property.currencyCode, targetCurrency!);
      setRate(transformRate);
      // @ts-ignore
      setCurrentCurrency(fieldInfo?.property.currencyCode);
      setRateLoading(false);
    };
    fn();
  }, [fieldId, targetCurrency, targetFieldId]);

  const getCurrencyRate = () => {
    if (!fieldId || !targetCurrency || !targetFieldId) return <></>;
    if (!rate || !targetCurrency || !currentCurrency || rateLoding) {
      return <Spin style={{ marginLeft: 12 }} />
    }
    return <Banner
      style={{ marginLeft: 12 }}
      icon={<IconCoinMoneyStroked />}
      fullMode={false}
      type="warning"
      description={t('transform_rate', {
        currency: currentCurrency,
        target: targetCurrency,
        rate,
      })}
      closeIcon={null}
    />
  }

  return (
    <div className={'container'}>
      <div className="title">
        <Banner
          fullMode={false}
          type="info"
          description={t('script_des')}
          closeIcon={null}
        />
      </div>
      <div className="item">
        <Banner
          icon={<IconImport />}
          fullMode={false}
          type="success"
          description={t('select_field')}
          closeIcon={null}
        />
      </div>
      <Select
        filter
        style={{ width: '100% ' }}
        loading={loading}
        onDropdownVisibleChange={getTableMeta}
        onSearch={getTableMeta}
        onSelect={val => setFieldId(val as any)}
      >
        {
          fieldsInfo.map(val => {
            return <Select.Option value={val.id}>{val.name}</Select.Option>
          })
        }
      </Select>
      <div className="item">
        <Banner
          icon={<IconExport />}
          fullMode={false}
          type="success"
          description={t('select_target')}
          closeIcon={null}
        />
      </div>
      <Select
        filter
        style={{ width: '100% ' }}
        loading={loading}
        onDropdownVisibleChange={getTableMeta}
        onSearch={getTableMeta}
        onSelect={val => setTargetFieldId(val as any)}
      >
        {
          fieldsInfo.map(val => {
            return <Select.Option value={val.id}>{val.name}</Select.Option>
          })
        }
      </Select>
      <div className="item">
        <Banner
          icon={<IconWrench />}
          fullMode={false}
          type="success"
          description={t('select_currency_type')}
          closeIcon={null}
        />
      </div>
      <Select style={{ width: '100%' }} onSelect={val => setTargetCurrency(val as any)} filter>
        {
          CURRENCY.map(val => {
            return <Select.Option value={val.value}>{t(val.name)}</Select.Option>
          })
        }
      </Select>
      <div className={'footer'}>
        <Button
          loading={transformLoading}
          disabled={!(fieldId && targetCurrency && targetFieldId) && rateLoding}
          theme="solid"
          type="primary"
          onClick={onClickTransform}
        >{t('transform')}</Button>
        {getCurrencyRate()}
      </div>

    </div>
  )
}