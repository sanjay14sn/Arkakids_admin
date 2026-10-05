fetch('http://localhost:3000/api/students', {
  headers: {
    'Cookie': 'auth_token=' + process.env.TOKEN
  }
}).then(r => r.json()).then(console.log)
