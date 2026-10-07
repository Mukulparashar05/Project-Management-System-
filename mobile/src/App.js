import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { RootNavigator } from './navigation/RootNavigator';
import { navigationTheme } from './theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <NetworkProvider>
          <AuthProvider>
            <NavigationContainer theme={navigationTheme}>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </NetworkProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
