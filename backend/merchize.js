const axios = require('axios');

function isConfigured() {
  return Boolean(process.env.MERCHIZE_BASE_URL && process.env.MERCHIZE_ACCESS_TOKEN);
}

function client() {
  return axios.create({
    baseURL: process.env.MERCHIZE_BASE_URL,
    headers: { Authorization: `Bearer ${process.env.MERCHIZE_ACCESS_TOKEN}` },
  });
}

// https://seller.merchize.com/a/api-documents -> Orders -> Import external orders
async function importOrder(order) {
  const res = await client().post('/order/external/orders', order);
  return res.data;
}

// https://seller.merchize.com/a/api-documents -> Orders -> Get order tracking
async function getOrderTracking({ code, externalNumber, identifier } = {}) {
  const params = {};
  if (code) params.code = code;
  if (externalNumber) params.external_number = externalNumber;
  if (identifier) params.identifier = identifier;
  const res = await client().get('/order/external/orders/tracking', { params });
  return res.data;
}

module.exports = { isConfigured, importOrder, getOrderTracking };
