import { useContext } from 'react';
import { NetworkContext } from '../context/NetworkContext';

export function useNetwork() {
  return useContext(NetworkContext);
}
