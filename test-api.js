// Test the admin API endpoints
const testAPI = async () => {
  try {
    // Test login
    const loginResponse = await fetch('http://localhost:3001/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        // The admin password is no longer hardcoded — it's generated on first
        // server run (see server.js) or set via ADMIN_DEFAULT_PASSWORD. Fill it in here to test.
        password: process.env.ADMIN_PASSWORD || ''
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.success) {
      const token = loginData.token;
      console.log('Login successful! Token:', token);
      
      // Test adding a show
      const showResponse = await fetch('http://localhost:3001/api/shows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: Date.now().toString(),
          date: 'Saturday',
          venue: 'Test Venue',
          location: 'Test Location',
          link: '#'
        })
      });
      
      const showData = await showResponse.json();
      console.log('Add show response:', showData);
      
      // Test getting shows
      const getShowsResponse = await fetch('http://localhost:3001/api/shows');
      const showsData = await getShowsResponse.json();
      console.log('Get shows response:', showsData);
    }
  } catch (error) {
    console.error('API test failed:', error);
  }
};

// Test in browser console or Node.js with fetch
// testAPI();
