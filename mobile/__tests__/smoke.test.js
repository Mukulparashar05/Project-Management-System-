import { render, screen } from '@testing-library/react-native';
import App from '../src/App';

test('renders the login screen when no session is stored', async () => {
  await render(<App />);
  expect(await screen.findByText('Manage projects.')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeOnTheScreen();
});
