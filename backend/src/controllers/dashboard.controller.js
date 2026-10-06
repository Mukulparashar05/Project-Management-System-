import { getDashboard } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function getDashboardSummary(req, res) {
  const dashboard = await getDashboard(req.user.id);
  sendSuccess(res, dashboard, 'Dashboard retrieved');
}
