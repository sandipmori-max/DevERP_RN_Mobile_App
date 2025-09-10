/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  ScrollView,
  Dimensions,
  Keyboard,
  Platform,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { getERPPageThunk } from '../../../store/slices/auth/thunk';
import { savePageThunk } from '../../../store/slices/page/thunk';
import FullViewLoader from '../../../components/loader/FullViewLoader';
import NoData from '../../../components/no_data/NoData';
import ErrorMessage from '../../../components/error/Error';
import ERPIcon from '../../../components/icon/ERPIcon';
import ErrorModal from './components/ErrorModal';
import CustomPicker from './components/CustomPicker';
import Media from './components/Media';
import Disabled from './components/Disabled';
import Input from './components/Input';
import CustomAlert from '../../../components/alert/CustomAlert';
import AjaxPicker from './components/AjaxPicker';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { parseCustomDatePage } from '../../../utils/helpers';
import DateRow from './components/Date';
import BoolInput from './components/BoolInput';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PageRouteParams = { PageScreen: { item: any } };

const PageScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { pageError } = useAppSelector(state => state.auth);
  console.log('🚀 ~ PageScreen ~ -----------------------------pageError:', pageError);
const flatListRef = useRef<FlatList>(null);

  const [loadingPageId, setLoadingPageId] = useState<string | null>(null);
  const [controls, setControls] = useState<any[]>([]);
  console.log('🚀 ~ PageScreen ~ controls:-------', controls);
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [baseLink, setBaseLink] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<any>({});
  console.log('🚀 ~ PageScreen ~ formValues:--------', formValues);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [activeDateField, setActiveDateField] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alertVisible, setAlertVisible] = useState(false);
  const [goBack, setGoBack] = useState(false);
  const [loader, setLoader] = useState(false);
  const [actionLoader, setActionLoader] = useState(false);
  const [actionSaveLoader, setActionSaveLoader] = useState(false);

  const [infoData, setInfoData] = useState<any>({});

  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'error' | 'success' | 'info',
  });

  const route = useRoute<RouteProp<PageRouteParams, 'PageScreen'>>();
  const { item, title, id, isFromNew, url }: any = route.params;
  console.log('🚀 ~ -----------------------------------------PageScreen ~ url:', url);

  const validateForm = useCallback(() => {
    const validationErrors: Record<string, string> = {};
    const errorMessages: string[] = [];

    controls.forEach(ctrl => {
      if (ctrl.mandatory === '1' && !formValues[ctrl.field]) {
        validationErrors[ctrl.field] = `${ctrl.fieldtitle || ctrl.field} is required`;
        errorMessages.push(`${ctrl.fieldtitle || ctrl.field} is required`);
      }
    });

    setErrors(validationErrors);
    setErrorsList(errorMessages);
    if (errorMessages.length > 0) setShowErrorModal(true);

    return errorMessages.length === 0;
  }, [controls, formValues]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text
          numberOfLines={1}
          style={{ maxWidth: 180, fontSize: 18, fontWeight: '700', color: '#fff' }}
        >
          {isFromNew ? 'New Data ( New ) ' : title + ' ( Edit )' || 'Details'}
        </Text>
      ),
      headerRight: () => (
        <>
          {controls.length > 0 && (
            <ERPIcon
              name="save-as"
              isLoading={actionSaveLoader}
              onPress={async () => {
                setActionSaveLoader(true);
                if (validateForm()) {
                  const submitValues: Record<string, any> = {};
                  controls.forEach(f => {
                    if (f.refcol !== '1') submitValues[f.field] = formValues[f.field];
                  });
                  try {
                    setLoader(true);
                    await dispatch(
                      savePageThunk({ page: url, id, data: { ...submitValues } }),
                    ).unwrap();
                    setLoader(false);
                    fetchPageData();
                    setAlertConfig({
                      title: 'Record saved',
                      message: `Record saved successfully!`,
                      type: 'success',
                    });
                    setAlertVisible(true);
                    setGoBack(true);
                  } catch (err: any) {
                    setLoader(false);

                    setAlertConfig({
                      title: 'Record saved',
                      message: err,
                      type: 'error',
                    });
                    setAlertVisible(true);
                    setGoBack(false);
                  }
                }
                setActionSaveLoader(false);
              }}
            />
          )}
          <ERPIcon
            name="refresh"
            isLoading={actionLoader}
            onPress={() => {
              setActionLoader(true);
              fetchPageData();
              setErrors({});
              setErrorsList([]);
            }}
          />
        </>
      ),
    });
  }, [
    navigation,
    item?.name,
    id,
    controls,
    formValues,
    validateForm,
    goBack,
    alertVisible,
    loader,
    actionLoader,
    actionSaveLoader,
  ]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [storedLink] = await Promise.all([AsyncStorage.getItem('erp_link')]);

        if (isMounted) {
          let normalizedBase = (storedLink || '').replace(/\/+$/, '') + '';
          normalizedBase = normalizedBase.replace(/\/devws\/?/, '/');
          normalizedBase = normalizedBase.replace(/^https:\/\//i, 'http://');
          setBaseLink(normalizedBase || '');
        }
      } catch (e) {
        console.error('Error loading stored data:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchPageData = useCallback(async () => {
    try {
      setError(null);
      setLoadingPageId(id);

      const parsed = await dispatch(
        getERPPageThunk({ page: url, id: isFromNew ? 0 : id }),
      ).unwrap();

      if (!isFromNew) {
        setInfoData({
          id: id.toString(),
          tableName: parsed?.table,
          title: parsed?.title,
        });
      }

      const pageControls = Array.isArray(parsed?.pagectl) ? parsed.pagectl : [];

      const normalizedControls = pageControls.map(c => ({
        ...c,
        disabled: String(c.disabled ?? '0'),
        visible: String(c.visible ?? '1'),
        mandatory: String(c.mandatory ?? '0'),
      }));

      setControls(normalizedControls);

      setFormValues(prev => {
        const merged: any = { ...prev };
        normalizedControls.forEach(c => {
          if (merged[c.field] === undefined) {
            merged[c.field] = c.text ?? '';
          }
        });
        return merged;
      });
    } catch (e: any) {
      console.log('🚀 ~ e:', e);
      setError(e || 'Failed to load page');
    } finally {
      setLoadingPageId(null);
      setTimeout(() => {
        setActionLoader(false);
      }, 10);
    }
  }, [dispatch, id, url]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleAttachment = (base64: string, val: any) => {
    setFormValues(prev => {
      if (typeof val === 'object' && val !== null && val.field) {
        return { ...prev, [val.field]: base64 };
      }
      return { ...prev, image: base64 };
    });
  };

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const setValue = (val: any) => {
        if (typeof val === 'object' && val !== null) {
          setFormValues(prev => ({ ...prev, ...val }));
        } else {
          setFormValues(prev => ({ ...prev, [item.field]: val }));
        }
        setErrors(prev => ({ ...prev, [item?.field]: '' }));
      };

      const value = formValues[item?.field] || formValues[item?.text] || '';

      if (item?.visible === '1') return null;

      let content = null;
      if (item?.ctltype === 'BOOL') {
        const rawVal = formValues[item?.field] ?? item?.text;
        const boolVal = String(rawVal).toLowerCase() === 'true';
        content = (
          <BoolInput
            label={item?.fieldtitle}
            value={boolVal}
            onChange={val => setValue({ [item.field]: val })}
          />
        );
      } else if (item?.ctltype === 'IMAGE' || item?.ctltype === 'PHOTO') {
        content = (
          <Media
            baseLink={baseLink}
            infoData={infoData}
            item={item}
            isFromNew={isFromNew}
            handleAttachment={handleAttachment}
          />
        );
      } else if (item?.disabled === '1' && item?.ajax !== 1) {
        content = <Disabled item={item} value={value} type={item?.ctltype} />;
      } else if (item?.ddl && item?.ddl !== '' && item?.ajax === 0) {
        content = (
          <CustomPicker
            label={item?.fieldtitle}
            selectedValue={value}
            dtext={item?.dtext || item?.text || ''}
            onValueChange={setValue}
            options={item?.options || []}
            item={item}
            errors={errors}
          />
        );
      } else if (item?.ddl && item?.ddl !== '' && item?.ajax === 1) {
        content = (
          <AjaxPicker
            label={item?.fieldtitle}
            selectedValue={value}
            dtext={item?.dtext || item?.text || ''}
            onValueChange={setValue}
            options={item?.options || []}
            item={item}
            errors={errors}
            formValues={formValues}
          />
        );
      } else if (item?.ctltype === 'DATE') {
        content = (
          <DateRow item={item} errors={errors} value={value} showDatePicker={showDatePicker} />
        );
      } else {
        content = <Input
         onFocus={() => flatListRef.current?.scrollToIndex({ index, animated: true })}
        item={item} errors={errors} value={value} setValue={setValue} />;
      }

      return (
        <Animated.View
          entering={FadeInUp.delay(index * 70).springify()}
          layout={Layout.springify()}
        >
          {content}
        </Animated.View>
      );
    },
    [formValues, errors, controls],
  );

  const showDatePicker = (field: string, date: any) => {
    setActiveDateField(field);
    setActiveDate(date);
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
    setActiveDateField(null);
  };

  const handleConfirm = (date: Date) => {
    if (activeDateField) {
      setFormValues(prev => ({ ...prev, [activeDateField]: date.toISOString() }));
    }
    hideDatePicker();
  };

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#f9f9f9' }}>
      {loadingPageId ? (
        <FullViewLoader />
      ) : !!error ? (
        <ErrorMessage message={error} />
      ) : controls.length > 0 ? (
        <>
          <View
            style={{
              flex: 1,
              height: Dimensions.get('screen').height,
            }}
          >
            <FlatList
              showsVerticalScrollIndicator={false}
              data={controls}
                ref={flatListRef}
              keyExtractor={(it, idx) => it?.dtlid || idx?.toString()}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: keyboardHeight }}
              keyboardShouldPersistTaps="handled"
            />
          </View>
          {loader && (
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(0,0,0,0.3)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 999,
              }}
            >
              <FullViewLoader />
            </View>
          )}
        </>
      ) : (
        <View style={{ flex: 1 }}>
          <NoData />
        </View>
      )}

      <ErrorModal
        visible={showErrorModal}
        errors={errorsList}
        onClose={() => setShowErrorModal(false)}
      />
      <DateTimePicker
        isVisible={datePickerVisible}
        mode="date"
        date={activeDate ? parseCustomDatePage(activeDate) : new Date()}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          setAlertVisible(false);
          if (goBack) {
            navigation.goBack();
          }
        }}
        actionLoader={undefined}
      />
    </View>
  );
};

export default PageScreen;
