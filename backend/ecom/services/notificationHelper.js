import Notification from '../models/Notification.js';

/**
 * Create a notification for a workspace (broadcast) or specific user
 */
export const createNotification = async ({ workspaceId, userId = null, type, title, message, icon = 'info', link = null, metadata = {} }) => {
  try {
    if (!workspaceId || !type || !title || !message) {
      console.error('createNotification: missing required fields');
      return null;
    }

    const notification = await Notification.create({
      workspaceId,
      userId,
      type,
      title,
      message,
      icon,
      link,
      metadata
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
};

/**
 * Notify all workspace members about a new order
 */
export const notifyNewOrder = async (workspaceId, order) => {
  return createNotification({
    workspaceId,
    type: 'order_new',
    title: 'Nouvelle commande',
    message: `${order.clientName || 'Client'} — ${order.product || 'Produit'} (${order.quantity || 1}x)`,
    icon: 'order',
    link: `/ecom/orders/${order._id}`,
    metadata: { orderId: order._id }
  });
};

/**
 * Notify about order status change
 */
export const notifyOrderStatus = async (workspaceId, order, newStatus) => {
  const statusLabels = {
    confirmed: 'confirmée',
    shipped: 'expédiée',
    delivered: 'livrée',
    cancelled: 'annulée',
    returned: 'retournée'
  };

  const typeMap = {
    confirmed: 'order_confirmed',
    shipped: 'order_shipped',
    delivered: 'order_delivered',
    cancelled: 'order_cancelled',
    returned: 'order_returned'
  };

  return createNotification({
    workspaceId,
    type: typeMap[newStatus] || 'order_status',
    title: `Commande ${statusLabels[newStatus] || newStatus}`,
    message: `${order.clientName || 'Client'} — ${order.product || 'Produit'}`,
    icon: 'order',
    link: `/ecom/orders/${order._id}`,
    metadata: { orderId: order._id, status: newStatus }
  });
};

/**
 * Notify about low stock
 */
export const notifyLowStock = async (workspaceId, product) => {
  return createNotification({
    workspaceId,
    type: 'stock_low',
    title: 'Stock bas',
    message: `${product.name} — ${product.stock} unités restantes (seuil: ${product.reorderThreshold})`,
    icon: 'alert',
    link: `/ecom/stock`,
    metadata: { productId: product._id, stock: product.stock }
  });
};

/**
 * Notify about out of stock
 */
export const notifyOutOfStock = async (workspaceId, product) => {
  return createNotification({
    workspaceId,
    type: 'stock_out',
    title: 'Rupture de stock',
    message: `${product.name} est en rupture de stock !`,
    icon: 'alert',
    link: `/ecom/stock`,
    metadata: { productId: product._id }
  });
};

/**
 * Notify about stock received
 */
export const notifyStockReceived = async (workspaceId, stockOrder) => {
  return createNotification({
    workspaceId,
    type: 'stock_received',
    title: 'Stock reçu',
    message: `${stockOrder.quantity} unités de ${stockOrder.productName || 'produit'} reçues`,
    icon: 'stock',
    link: `/ecom/stock`,
    metadata: { stockOrderId: stockOrder._id }
  });
};

/**
 * Notify about new user joining
 */
export const notifyUserJoined = async (workspaceId, user) => {
  return createNotification({
    workspaceId,
    type: 'user_joined',
    title: 'Nouveau membre',
    message: `${user.name || user.email} a rejoint l'équipe`,
    icon: 'user',
    metadata: { userId: user._id }
  });
};

/**
 * Notify about report creation
 */
export const notifyReportCreated = async (workspaceId, report, userName) => {
  return createNotification({
    workspaceId,
    type: 'report_created',
    title: 'Nouveau rapport',
    message: `${userName || 'Utilisateur'} a soumis un rapport quotidien`,
    icon: 'report',
    link: `/ecom/reports/${report._id}`,
    metadata: { reportId: report._id }
  });
};

/**
 * Notify about import completion
 */
export const notifyImportCompleted = async (workspaceId, result) => {
  return createNotification({
    workspaceId,
    type: 'import_completed',
    title: 'Import terminé',
    message: `${result.imported || 0} commandes importées, ${result.errors || 0} erreurs`,
    icon: 'import',
    link: `/ecom/orders`,
    metadata: result
  });
};

/**
 * Generic system notification
 */
export const notifySystem = async (workspaceId, title, message, link = null) => {
  return createNotification({
    workspaceId,
    type: 'system',
    title,
    message,
    icon: 'system',
    link
  });
};
