const runTest = async () => {
  try {
    console.log('============================================================');
    console.log('🔮 SMARTSTORE AI SALES SUGGESTION ENGINE INTEGRATION TEST');
    console.log('============================================================');

    console.log('\n🔐 1. Authenticating as Admin User...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@smartstore.com',
        password: 'admin123',
      }),
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed with status code ${loginRes.status}`);
    }

    const { token } = await loginRes.json();
    console.log('✅ Admin authenticated successfully! JWT acquired.');

    console.log('\n🧠 2. Fetching Suggestions with AUTO-COMPILING Database fallback (No Request Body)...');
    const autoRes = await fetch('http://localhost:5000/api/ai/sales-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}), // Empty body triggers dynamic database lookup
    });

    if (!autoRes.ok) {
      throw new Error(`Auto suggestions failed: ${autoRes.status}`);
    }

    const autoData = await autoRes.json();
    console.log('✅ Auto Suggestions fetched successfully!');
    printSuggestions(autoData);

    console.log('\n🎯 3. Fetching Suggestions with CUSTOM Request Body Overrides...');
    const customInput = {
      salesData: [
        { title: 'Super Premium Audio Box', category: 'Electronics', price: 299.99, stock: 45, sales: 18, revenue: 5399.82 },
        { title: 'Vintage Walnut Writing Desk', category: 'Office', price: 450.00, stock: 3, sales: 2, revenue: 900.00 }
      ],
      stock: [
        { title: 'Super Premium Audio Box', stock: 45 },
        { title: 'Vintage Walnut Writing Desk', stock: 3 }
      ],
      category: ['Electronics', 'Office'],
      revenue: {
        'Electronics': 5399.82,
        'Office': 900.00
      }
    };

    const customRes = await fetch('http://localhost:5000/api/ai/sales-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(customInput),
    });

    if (!customRes.ok) {
      throw new Error(`Custom suggestions failed: ${customRes.status}`);
    }

    const customData = await customRes.json();
    console.log('✅ Custom Suggestions fetched successfully!');
    printSuggestions(customData);

    console.log('\n============================================================');
    console.log('🎉 ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
    console.log('============================================================');

  } catch (error) {
    console.error('❌ Integration Test Failed:', error.message);
  }
};

const printSuggestions = (data) => {
  console.log('------------------------------------------------------------');
  console.log('💵 PRICING RECOMMENDATIONS:');
  if (data.pricingRecommendations && data.pricingRecommendations.length > 0) {
    data.pricingRecommendations.forEach((item, idx) => {
      console.log(`  ${idx + 1}. Product:       ${item.productTitle}`);
      console.log(`     Current:       $${item.currentPrice}`);
      console.log(`     Recommended:   $${item.recommendedPrice}`);
      console.log(`     Action:        ${item.action}`);
      console.log(`     Rationale:     ${item.rationale}`);
    });
  } else {
    console.log('  No pricing recommendations available.');
  }

  console.log('\n📈 TRENDING PRODUCT INSIGHTS:');
  if (data.trendingProductInsights && data.trendingProductInsights.length > 0) {
    data.trendingProductInsights.forEach((item, idx) => {
      console.log(`  ${idx + 1}. Category:     ${item.category}`);
      console.log(`     Insight:      ${item.insight}`);
      console.log(`     Next Steps:   ${item.recommendedActions.join(' | ')}`);
    });
  } else {
    console.log('  No trending product insights available.');
  }

  console.log('\n🚨 LOW STOCK REPLENISHMENT ALERTS:');
  if (data.lowStockAlerts && data.lowStockAlerts.length > 0) {
    data.lowStockAlerts.forEach((item, idx) => {
      console.log(`  ${idx + 1}. Product:       ${item.productTitle}`);
      console.log(`     Current Stock: ${item.currentStock} units`);
      console.log(`     Velocity:      ${item.salesVelocity}`);
      console.log(`     Restock Plan:  ${item.restockRecommendation}`);
      console.log(`     Days Left:     ~${item.daysToOutofStock} days`);
    });
  } else {
    console.log('  No low stock replenishment alerts triggered.');
  }
  console.log('------------------------------------------------------------\n');
};

runTest();
