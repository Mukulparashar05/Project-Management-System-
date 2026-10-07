import NetInfo from '@react-native-community/netinfo';
import { createContext, useEffect, useState } from 'react';

export const NetworkContext = createContext({ isOffline: false });

export function NetworkProvider({ children }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        // isInternetReachable starts as null while unknown; only an explicit false counts as offline.
        setIsOffline(state.isConnected === false || state.isInternetReachable === false);
      }),
    [],
  );

  return <NetworkContext value={{ isOffline }}>{children}</NetworkContext>;
}
