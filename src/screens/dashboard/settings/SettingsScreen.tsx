import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Switch, ScrollView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { styles } from './settings_style';
import CustomAlert from '../../../components/alert/CustomAlert';
import useTranslations from '../../../hooks/useTranslations';

interface SettingItem {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    type: 'toggle' | 'navigate' | 'action';
    value?: boolean;
    action?: string;
}

interface LanguageOption {
    code: string;
    name: string;
}

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { t, changeLanguage, getAvailableLanguages, getCurrentLanguage } = useTranslations();
  const [alertVisible, setAlertVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [languages, setLanguages] = useState<LanguageOption[]>(getAvailableLanguages());
  
  const [alertConfig, setAlertConfig] = useState({
      title: '',
      message: '',
      type: 'info' as 'error' | 'success' | 'info',
  });
  const [settings, setSettings] = useState<SettingItem[]>([]);

  useEffect(() => {
    // Initialize settings with translations
    setSettings([
        { id: '1', title: t('settings.pushNotifications'), subtitle: t('settings.receiveAlerts'), icon: '🔔', type: 'toggle', value: true },
        { id: '2', title: t('settings.emailNotifications'), subtitle: t('settings.getEmailUpdates'), icon: '📧', type: 'toggle', value: false },
        { id: '3', title: t('settings.darkMode'), subtitle: t('settings.switchDarkTheme'), icon: '🌙', type: 'toggle', value: false },
        { id: '4', title: t('settings.biometricAuth'), subtitle: t('settings.useBiometric'), icon: '👆', type: 'toggle', value: true },
        { id: '5', title: t('settings.twoFactorAuth'), subtitle: t('settings.extraSecurityLayer'), icon: '🔐', type: 'navigate', action: '2FA' },
        { id: '6', title: t('settings.changePassword'), subtitle: t('settings.updatePassword'), icon: '🔑', type: 'navigate', action: 'ChangePassword' },
        { id: '7', title: t('settings.privacySettings'), subtitle: t('settings.managePrivacy'), icon: '🛡️', type: 'navigate', action: 'Privacy' },
        { id: '8', title: t('settings.dataStorage'), subtitle: t('settings.manageDataUsage'), icon: '💾', type: 'navigate', action: 'Storage' },
        { id: '9', title: t('settings.language'), subtitle: getCurrentLanguage(), icon: '🌐', type: 'navigate', action: 'Language' },
        { id: '10', title: t('settings.aboutApp'), subtitle: `${t('common.version')} 1.0.0`, icon: 'ℹ️', type: 'navigate', action: 'About' },
        { id: '11', title: t('settings.helpSupport'), subtitle: t('settings.getHelp'), icon: '❓', type: 'navigate', action: 'Support' },
        { id: '12', title: t('settings.logout'), subtitle: t('settings.signOut'), icon: '🚪', type: 'action', action: 'Logout' },
    ]);
  }, [t, currentLanguage]);

  const handleToggle = (id: string) => {
      setSettings(prevSettings =>
          prevSettings.map(setting =>
              setting.id === id
                  ? { ...setting, value: !setting.value }
                  : setting
          )
      );
  };

  const handleAction = (item: SettingItem) => {
      switch (item.type) {
          case 'navigate':
              if (item.action === 'Language') {
                  setLanguageModalVisible(true);
              } else if (item.action) {
                  setAlertConfig({
                      title: t('common.navigate'),
                      message: `${t('common.navigate')} to ${item.action} functionality would go here`,
                      type: 'info',
                  });
                  setAlertVisible(true);
              }
              break;
          case 'action':
              if (item.action === 'Logout') {
                  setAlertConfig({
                      title: t('settings.logout'),
                      message: t('settings.logoutConfirm'),
                      type: 'error',
                  });
                  setAlertVisible(true);
              } else if (item.action) {
                  setAlertConfig({
                      title: t('common.action'),
                      message: `${item.action} functionality would go here`,
                      type: 'info',
                  });
                  setAlertVisible(true);
              }
              break;
      }
  };

  const handleLanguageChange = async (languageCode: string) => {
    await changeLanguage(languageCode);
    setCurrentLanguage(languageCode);
    setLanguageModalVisible(false);
    
    // Show confirmation alert
    setAlertConfig({
      title: t('language.languageChanged'),
      message: t('language.languageChangedMessage'),
      type: 'success',
    });
    setAlertVisible(true);
  };

  const renderSettingItem = ({ item }: { item: SettingItem }) => (
      <TouchableOpacity
          style={styles.settingCard}
          onPress={() => handleAction(item)}
          disabled={item.type === 'toggle'}
      >
          <View style={styles.settingHeader}>
              <View style={styles.settingIcon}>
                  <Text style={styles.iconText}>{item.icon}</Text>
              </View>
              <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              </View>
              {item.type === 'toggle' ? (
                  <Switch
                      value={item.value}
                      onValueChange={() => handleToggle(item.id)}
                      trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
                      thumbColor={item.value ? '#fff' : '#f4f3f4'}
                  />
              ) : (
                  <Text style={styles.arrowIcon}>›</Text>
              )}
          </View>
      </TouchableOpacity>
  );

  const renderLanguageOption = ({ item }: { item: LanguageOption }) => (
    <TouchableOpacity 
      style={[languageStyles.languageOption, currentLanguage === item.code && languageStyles.selectedLanguage]}
      onPress={() => handleLanguageChange(item.code)}
    >
      <Text style={[languageStyles.languageName, currentLanguage === item.code && languageStyles.selectedLanguageText]}>
        {item.name}
      </Text>
      {currentLanguage === item.code && (
        <Text style={languageStyles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
      <View style={styles.container}>
            
          {/* Scrollable Content */}
          <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
          >

              {/* Settings Sections */}
              <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
                  <FlatList
                      data={settings.filter(item => 
                          item.id === '1' || item.id === '2' // Push and Email notifications
                      )}
                      renderItem={renderSettingItem}
                      keyExtractor={item => item.id}
                      scrollEnabled={false}
                  />
              </View>

              <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
                  <FlatList
                      data={settings.filter(item => item.id === '3')} // Dark Mode
                      renderItem={renderSettingItem}
                      keyExtractor={item => item.id}
                      scrollEnabled={false}
                  />
              </View>

              <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>{t('settings.security')}</Text>
                  <FlatList
                      data={settings.filter(item =>
                          item.id === '4' || // Biometric Authentication
                          item.id === '5' || // Two-Factor Authentication
                          item.id === '6' || // Change Password
                          item.id === '7'    // Privacy Settings
                      )}
                      renderItem={renderSettingItem}
                      keyExtractor={item => item.id}
                      scrollEnabled={false}
                  />
              </View>

              <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>{t('settings.general')}</Text>
                  <FlatList
                      data={settings.filter(item =>
                          item.id === '8' || // Data & Storage
                          item.id === '9' || // Language
                          item.id === '10' || // About App
                          item.id === '11'    // Help & Support
                      )}
                      renderItem={renderSettingItem}
                      keyExtractor={item => item.id}
                      scrollEnabled={false}
                  />
              </View>

              <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
                  <FlatList
                      data={settings.filter(item => item.id === '12')} // Logout
                      renderItem={renderSettingItem}
                      keyExtractor={item => item.id}
                      scrollEnabled={false}
                  />
              </View>

              {/* Bottom spacing for better scroll experience */}
              <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Language Selection Modal */}
          <Modal
            visible={languageModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setLanguageModalVisible(false)}
          >
            <View style={languageStyles.modalOverlay}>
              <View style={languageStyles.modalContent}>
                <View style={languageStyles.modalHeader}>
                  <Text style={languageStyles.modalTitle}>{t('language.selectLanguage')}</Text>
                  <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                    <Text style={languageStyles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={languages}
                  renderItem={renderLanguageOption}
                  keyExtractor={item => item.code}
                  style={languageStyles.languageList}
                />
              </View>
            </View>
          </Modal>

          <CustomAlert
              visible={alertVisible}
              title={alertConfig.title}
              message={alertConfig.message}
              type={alertConfig.type}
              onClose={() => setAlertVisible(false)}
          />
      </View>
  );
};

const languageStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 200,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  closeButton: {
    fontSize: 20,
    color: '#999',
  },
  languageList: {
    maxHeight: 300,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedLanguage: {
    backgroundColor: '#f5f5f5',
  },
  languageName: {
    fontSize: 16,
    color: '#333',
  },
  selectedLanguageText: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  checkmark: {
    fontSize: 18,
    color: '#2196F3',
  },
});

export default SettingsScreen;