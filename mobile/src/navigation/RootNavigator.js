import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/LoginScreen';
import { ProjectDetailScreen } from '../screens/ProjectDetailScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SessionLoadingScreen, SessionUnverifiedScreen } from '../screens/SessionScreens';
import { TaskFormScreen } from '../screens/TaskFormScreen';
import { colors } from '../theme';
import { AppTabs } from './AppTabs';

const Stack = createNativeStackNavigator();

const stackOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

/**
 * Screens are chosen from the auth state, so signing out or an expired token swaps the whole
 * stack for the login screen without any manual navigation calls.
 */
export function RootNavigator() {
  const { status } = useAuth();

  if (status === 'restoring') return <SessionLoadingScreen />;
  if (status === 'unverified') return <SessionUnverifiedScreen />;

  return (
    <Stack.Navigator screenOptions={stackOptions}>
      {status === 'signedIn' ? (
        <Stack.Group>
          <Stack.Screen name="Home" component={AppTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: 'Project' }} />
          <Stack.Screen name="TaskForm" component={TaskFormScreen} options={{ presentation: 'modal', title: 'Task' }} />
        </Stack.Group>
      ) : (
        <Stack.Group screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
